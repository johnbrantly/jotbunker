import type {
  SyncWireMessage,
  ListItem,
  FileResponse,
  JotRefreshResponse,
  JotClearAck,
  JotManifest,
  JotMetaResponse,
  DesktopSyncPlatform,
  MergeStores,
} from '@jotbunker/shared'
import {
  JOT_COUNT,
  mergeStateSync,
  computeSyncReport,
  formatSyncReport,
  syncLog,
} from '@jotbunker/shared'
import { useListsStore } from '../stores/listsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useJotsStore } from '../stores/jotsStore'
import { useScratchpadStore } from '../stores/scratchpadStore'
import { useConsoleStore } from '../stores/consoleStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSyncConfirmStore } from '../stores/syncConfirmStore'
import { useSyncHistoryStore } from '../stores/syncHistoryStore'
import { processJotMetadata, processSingleJotFiles } from '../hooks/sync/jotMetadata'
import type { DownloadResult } from '../hooks/sync/jotMetadata'
import type { BinaryQueue } from '../hooks/sync/binaryQueue'
import { summarizeItems } from './syncUtils'

export type SyncStatus = 'disconnected' | 'connected'

export interface DesktopPlatformDeps {
  binaryQueue: BinaryQueue
  lockedListsReady: Promise<void>
  setSyncStatus: (status: SyncStatus) => void
  setJotRefreshed: (v: boolean) => void
  setLastSyncTimestamp: (ts: number) => void
}

export interface DesktopPlatformHandle {
  platform: DesktopSyncPlatform
  setSkipConfirmation: (v: boolean) => void
}

export function buildDesktopPlatform(deps: DesktopPlatformDeps): DesktopPlatformHandle {
  const { binaryQueue, lockedListsReady, setSyncStatus, setJotRefreshed, setLastSyncTimestamp } = deps
  const api = window.electronAPI
  let hasBeenDocked = false
  let skipConfirmation = false

  const platform: DesktopSyncPlatform = {
    deviceId: 'desktop',

    getLastSyncTimestamp() {
      const raw = localStorage.getItem('lastSyncTimestamp')
      return raw ? parseInt(raw, 10) : 0
    },

    setLastSyncTimestamp(ts: number) {
      localStorage.setItem('lastSyncTimestamp', String(ts))
      setLastSyncTimestamp(ts)
    },

    async handleHandshake(msg, send) {
      await lockedListsReady
      const hs = msg as { autoSync?: boolean }
      if (hs.autoSync !== false) {
        this.sendStateSync(send)
      }
    },

    sendStateSync(send) {
      const listsState = useListsStore.getState()
      const lockedListsState = useLockedListsStore.getState()
      const spState = useScratchpadStore.getState()
      const stateSync = {
        type: 'state_sync' as const,
        lists: listsState.items,
        lockedLists: lockedListsState.items,
        listsCategories: listsState.categories,
        lockedListsCategories: lockedListsState.categories,
        since: this.getLastSyncTimestamp(),
        scratchpad: spState.contents,
        scratchpadCategories: spState.categories,
      }
      syncLog('STATE', `sending to phone: lists=${summarizeItems(listsState.items)}`)
      send(stateSync)
    },

    async handleStateSync(ss, send) {
      await lockedListsReady
      syncLog('STATE', `phone sent (pre-merge): lists=${summarizeItems(ss.lists)} lockedLists=${summarizeItems(ss.lockedLists)}`)

      // 1. Snapshot desktop local state
      const localSnapshot: MergeStores = {
        lists: {
          items: useListsStore.getState().items,
          categories: useListsStore.getState().categories,
        },
        lockedLists: {
          items: useLockedListsStore.getState().items,
          categories: useLockedListsStore.getState().categories,
        },
        scratchpad: {
          contents: useScratchpadStore.getState().contents,
          categories: useScratchpadStore.getState().categories,
        },
      }

      // 2. Compute what the merge WOULD produce (both sides are pre-merge now)
      const merged = mergeStateSync(localSnapshot, ss, this.getLastSyncTimestamp())

      // 3. Generate sync report from both pre-merge states
      const report = computeSyncReport(localSnapshot, ss, merged)

      // 4. ALWAYS save report to sync history + console
      if (!report.isEmpty) {
        const summary = formatSyncReport(report)
        useSyncHistoryStore.getState().addEntry(summary, report)
      }

      // 5. Determine user choice
      type SyncChoice = 'confirm' | 'cancel' | 'desktop-wins' | 'phone-wins'
      let choice: SyncChoice = 'confirm'

      if (useSettingsStore.getState().syncConfirmation && !skipConfirmation) {
        choice = await useSyncConfirmStore.getState().requestConfirmation(report)
      }
      skipConfirmation = false

      // 6. Handle choice — apply state + send sync_confirm to phone
      const phonePreState: MergeStores = {
        lists: { items: ss.lists, categories: ss.listsCategories },
        lockedLists: { items: ss.lockedLists, categories: ss.lockedListsCategories },
        scratchpad: {
          contents: ss.scratchpad || localSnapshot.scratchpad.contents,
          categories: ss.scratchpadCategories || localSnapshot.scratchpad.categories,
        },
      }

      if (choice === 'cancel') {
        syncLog('STATE', 'User cancelled sync')
        send({ type: 'sync_cancel' })
        return
      }

      if (choice === 'desktop-wins') {
        syncLog('STATE', 'User chose desktop wins')
        // Desktop keeps its state (no change), tell phone to take desktop's data
        send({ type: 'sync_confirm', mode: 'desktop-wins' })
      } else if (choice === 'phone-wins') {
        syncLog('STATE', 'User chose phone wins')
        // Desktop takes phone's pre-merge state
        useListsStore.setState({ items: phonePreState.lists.items, categories: phonePreState.lists.categories })
        useLockedListsStore.setState({ items: phonePreState.lockedLists.items, categories: phonePreState.lockedLists.categories })
        useScratchpadStore.setState({ contents: phonePreState.scratchpad.contents, categories: phonePreState.scratchpad.categories })
        send({ type: 'sync_confirm', mode: 'phone-wins' })
      } else {
        // 'confirm' — normal merge
        useListsStore.setState({ items: merged.lists.items, categories: merged.lists.categories })
        useLockedListsStore.setState({ items: merged.lockedLists.items, categories: merged.lockedLists.categories })
        useScratchpadStore.setState({ contents: merged.scratchpad.contents, categories: merged.scratchpad.categories })
        const spState = useScratchpadStore.getState()
        send({
          type: 'sync_confirm',
          mode: 'merge',
          mergedState: {
            type: 'state_sync',
            lists: merged.lists.items,
            lockedLists: merged.lockedLists.items,
            listsCategories: merged.lists.categories,
            lockedListsCategories: merged.lockedLists.categories,
            since: 0,
            scratchpad: spState.contents,
            scratchpadCategories: spState.categories,
          },
        })
      }

      syncLog('STATE', `State sync complete (${choice})`)
      this.setLastSyncTimestamp(Date.now())
    },

    async handleJotRefreshResponse(data) {
      const resp = data as JotRefreshResponse
      if (resp.jots) {
        await processJotMetadata(resp.jots, binaryQueue)
        for (const jot of resp.jots) {
          useJotsStore.getState().setJotMetaFetched(jot.id, true)
          useJotsStore.getState().setJotMetaLoading(jot.id, false)
        }
      }
      setJotRefreshed(true)
    },

    async handleFileResponse(data) {
      const r = data as FileResponse
      syncLog('FILE', `file_response ${r.fileType} ${r.fileId}: ${r.error ? 'ERROR ' + r.error : 'OK'}`)
      if (!r.error) {
        const store = useJotsStore.getState()
        if (r.fileType === 'image') {
          store.setImageData(r.jotId, r.fileId, r.data, r.format)
        } else if (r.fileType === 'audio') {
          store.setAudioData(r.jotId, r.fileId, r.data)
        } else {
          const jot = store.jots[r.jotId]
          const fileMeta = jot?.files?.find((f) => f.id === r.fileId)
          store.setFileData(r.jotId, r.fileId, r.data, r.format, fileMeta?.fileName || 'file', fileMeta?.size || 0)
        }
      } else {
        const store = useJotsStore.getState()
        if (r.fileType === 'image') store.setImageLoading(r.jotId, r.fileId, false)
        else if (r.fileType === 'audio') store.setAudioLoading(r.jotId, r.fileId, false)
        else store.setFileLoading(r.jotId, r.fileId, false)
      }
      binaryQueue.completeTransfer()
    },

    handleClearComplete(data) {
      const r = data as JotClearAck
      syncLog('CLEAR', `Cleared jots [${r.cleared.join(', ')}]`)
      for (const jotId of r.cleared) {
        useJotsStore.getState().clearJot(jotId)
        binaryQueue.purgeJot(jotId)
      }
      useConsoleStore.getState().log(r.cleared.map((id) => `Cleared Jot ${id} from phone`).join('\n'))
    },

    handleJotManifest(data) {
      const manifest = data as JotManifest
      const store = useJotsStore.getState()

      store.setManifest(manifest.jots)
      syncLog('MANIFEST', `Received manifest: ${manifest.jots.length} jots`)

      // Invalidate jots where IDs changed (not just counts)
      for (const remote of manifest.jots) {
        if (!store.jotMetaFetched[remote.id]) continue
        const local = store.jots[remote.id]
        if (!local) { store.invalidateJotMeta(remote.id); continue }

        const localHasText = local.text.trim().length > 0
        const localHasDrawing = local.drawing !== null && local.drawing !== undefined
        const localImageIds = local.images.map((img) => img.id).sort().join(',')
        const remoteImageIds = [...remote.imageIds].sort().join(',')
        const localAudioIds = local.recordings.map((r) => r.id).sort().join(',')
        const remoteAudioIds = [...remote.audioIds].sort().join(',')
        const localFileIds = (local.files || []).map((f) => f.id).sort().join(',')
        const remoteFileIds = [...(remote.fileIds || [])].sort().join(',')

        if (
          remote.hasText !== localHasText ||
          remote.hasDrawing !== localHasDrawing ||
          localImageIds !== remoteImageIds ||
          localAudioIds !== remoteAudioIds ||
          localFileIds !== remoteFileIds
        ) {
          syncLog('MANIFEST', `jot ${remote.id} changed on phone, invalidating`)
          store.invalidateJotMeta(remote.id)
        }
      }
    },

    async handleJotMetaResponse(data) {
      const resp = data as JotMetaResponse
      const store = useJotsStore.getState()

      // Always trust phone — jots are phone→desktop only
      store.setJotMetadata(resp.jot.id, resp.jot)
      store.setJotMetaLoading(resp.jot.id, false)
      store.setJotMetaFetched(resp.jot.id, true)
      syncLog('META', `Received jot ${resp.jot.id} meta: ${resp.jot.images.length} images, ${resp.jot.recordings.length} recordings`)

      await processSingleJotFiles(resp.jot, binaryQueue)
    },

    handleDownloadComplete(data) {
      const r = data as DownloadResult
      if (r.success) {
        const jotLabel = r.jotCount === 1 ? 'JOT' : `${r.jotCount} JOTS`
        useConsoleStore.getState().log(`${jotLabel} \u2192 ${r.path}`)
      } else {
        useConsoleStore.getState().log(`Download failed: ${r.error}`)
      }
    },

    onConnectionStatusChange(status) {
      if (status === 'connected') {
        setSyncStatus('connected')
        binaryQueue.connected = true
        hasBeenDocked = true
      } else {
        setSyncStatus('disconnected')
        binaryQueue.connected = false
        binaryQueue.reset()
        setJotRefreshed(false)
        // Clear all jot data — base64 data URIs can be large, don't hold stale data
        const emptyJots: Record<number, any> = {}
        for (let i = 1; i <= 6; i++) emptyJots[i] = { text: '', textUpdatedAt: 0, drawing: null, drawingUpdatedAt: 0, images: [], recordings: [], files: [] }
        useJotsStore.setState({ jots: emptyJots, jotMetaFetched: {}, jotMetaLoading: {} })
        if (hasBeenDocked) {
          hasBeenDocked = false
        }
      }
    },

    onLive() {
      // Desktop doesn't need additional work on live/docked
    },
  }

  return {
    platform,
    setSkipConfirmation: (v: boolean) => { skipConfirmation = v },
  }
}
