import type {
  SyncWireMessage,
  ListItem,
  FileResponse,
  JotRefreshResponse,
  JotClearAck,
  JotManifest,
  JotMetaResponse,
  DesktopSyncPlatform,
  AncestorSnapshot,
} from '@jotbunker/shared'
import {
  JOT_COUNT,
  syncLog,
  mergeThreeWay,
  formatAppliedLogLine,
} from '@jotbunker/shared'
import { useListsStore } from '../stores/listsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useJotsStore } from '../stores/jotsStore'
import { useAncestorStore } from '../stores/ancestorStore'
import { useScratchpadStore } from '../stores/scratchpadStore'
import { useConsoleStore } from '../stores/consoleStore'
import { useSyncConfirmStore } from '../stores/syncConfirmStore'
import { useSaveStatusStore } from '../stores/saveStatusStore'
import { processJotMetadata, processSingleJotFiles } from '../hooks/sync/jotMetadata'
import type { DownloadResult } from '../hooks/sync/jotMetadata'
import type { BinaryQueue } from '../hooks/sync/binaryQueue'
import { summarizeItems } from './syncUtils'
import { rasterizeDrawing } from '../utils/rasterizeDrawing'

export type SyncStatus = 'disconnected' | 'connected'

/** Total live (non-tombstoned) item count across lists + lockedLists. */
function countLive(snap: AncestorSnapshot): number {
  let n = 0
  for (const slot of snap.lists) for (const it of slot) if (!it.deleted) n++
  for (const slot of snap.lockedLists) for (const it of slot) if (!it.deleted) n++
  return n
}

/**
 * Phase 3: builds the ancestor snapshot from the current desktop store state
 * at the moment of commit. Reads RAW items including tombstones; Phase 5's
 * three-way merge needs to know which items existed at last sync, including
 * those tombstoned at that point.
 */
function buildAncestorSnapshot(): AncestorSnapshot {
  const lists = useListsStore.getState()
  const lockedLists = useLockedListsStore.getState()
  const scratchpad = useScratchpadStore.getState()
  return {
    lists: lists.items,
    lockedLists: lockedLists.items,
    listsCategories: lists.categories,
    lockedListsCategories: lockedLists.categories,
    scratchpad: scratchpad.contents,
    scratchpadCategories: scratchpad.categories,
  }
}

export interface DesktopPlatformDeps {
  binaryQueue: BinaryQueue
  lockedListsReady: Promise<void>
  setSyncStatus: (status: SyncStatus) => void
  setJotRefreshed: (v: boolean) => void
  setLastSyncTimestamp: (ts: number) => void
  /** Opens the LARGE CHANGE DETECTED dialog. Resolves when the user picks. */
  requestDivergenceChoice: (
    counts: { case2: number; case3: number; ancestorLive: number },
  ) => Promise<'computer' | 'phone' | 'cancel'>
}

export interface DesktopPlatformHandle {
  platform: DesktopSyncPlatform
}

export function buildDesktopPlatform(deps: DesktopPlatformDeps): DesktopPlatformHandle {
  const { binaryQueue, lockedListsReady, setSyncStatus, setJotRefreshed, setLastSyncTimestamp, requestDivergenceChoice } = deps
  const api = window.electronAPI
  let hasBeenDocked = false

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
      // No auto state-sync on handshake. The user explicitly initiates sync via
      // SYNC NOW; connecting alone does not exchange list/scratchpad state.
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

    // Phone asked us to run a sync (it just connected with syncOnConnect on).
    // Honor it exactly like the user clicking SYNC NOW: drive the authoritative
    // merge by sending our state. Await lockedLists hydration first — the phone's
    // request can arrive immediately on connect, before the store has rehydrated.
    async handleSyncRequest(send) {
      await lockedListsReady
      syncLog('SYNC', 'phone requested sync on connect')
      this.sendStateSync(send)
    },

    async handleStateSync(ss, send) {
      await lockedListsReady
      const syncStartTime = Date.now()
      syncLog('STATE', `phone sent: lists=${summarizeItems(ss.lists)} lockedLists=${summarizeItems(ss.lockedLists)}`)

      // Build the three merge inputs: local desktop state, phone's wire
      // payload, and the local ancestor. Read directly from stores - the
      // pre-cutover MergeStores plumbing is gone (Commit 8 dead-code drop).
      const listsState = useListsStore.getState()
      const lockedListsState = useLockedListsStore.getState()
      const scratchpadState = useScratchpadStore.getState()

      const localAsSnapshot: AncestorSnapshot = {
        lists: listsState.items,
        lockedLists: lockedListsState.items,
        listsCategories: listsState.categories,
        lockedListsCategories: lockedListsState.categories,
        scratchpad: scratchpadState.contents,
        scratchpadCategories: scratchpadState.categories,
      }
      const phoneAsSnapshot: AncestorSnapshot = {
        lists: ss.lists,
        lockedLists: ss.lockedLists,
        listsCategories: ss.listsCategories,
        lockedListsCategories: ss.lockedListsCategories,
        scratchpad: ss.scratchpad ?? scratchpadState.contents,
        scratchpadCategories: ss.scratchpadCategories ?? scratchpadState.categories,
      }
      const localAncestor = useAncestorStore.getState().record?.snapshot ?? null

      // Large-divergence gate. When 80%+ of ancestor-tracked live rows are
      // missing from one side without tombstones, that side is almost certainly
      // a fresh install or wiped device. mergeThreeWay would silently delete
      // the surviving side's data via case 2/3 (items), and stomp categories +
      // scratchpad via LWW because the fresh device's defaults / empty values
      // appear as "changes" relative to the ancestor. Gate trip bypasses the
      // merge entirely and applies the user-picked side's snapshot wholesale,
      // which covers all three merge surfaces by construction.
      if (localAncestor) {
        let case2 = 0
        let case3 = 0
        let ancestorLive = 0
        for (const section of ['lists', 'lockedLists'] as const) {
          for (let slot = 0; slot < localAncestor[section].length; slot++) {
            const aSlot = localAncestor[section][slot] ?? []
            const pSlot = phoneAsSnapshot[section][slot] ?? []
            const dSlot = localAsSnapshot[section][slot] ?? []
            const pMap = new Map(pSlot.map((i) => [i.id, i]))
            const dMap = new Map(dSlot.map((i) => [i.id, i]))
            for (const a of aSlot) {
              if (a.deleted) continue
              ancestorLive++
              const p = pMap.get(a.id)
              const d = dMap.get(a.id)
              if (!p && d && !d.deleted) case3++
              else if (p && !p.deleted && !d) case2++
            }
          }
        }
        const r3 = ancestorLive > 0 ? case3 / ancestorLive : 0
        const r2 = ancestorLive > 0 ? case2 / ancestorLive : 0
        if (r3 >= 0.80 || r2 >= 0.80) {
          const choice = await requestDivergenceChoice({ case2, case3, ancestorLive })
          syncLog('DIVERGENCE', `case2=${case2}(${Math.round(r2 * 100)}%) case3=${case3}(${Math.round(r3 * 100)}%) ancestorLive=${ancestorLive} threshold=0.80 trip; user picked ${choice}`)
          if (choice === 'cancel') {
            send({ type: 'sync_cancel' })
            syncLog('SYNC', `outcome=cancel duration=${Date.now() - syncStartTime}ms changed=0`)
            return
          }
          const preLive = countLive(localAsSnapshot)
          const winner = choice === 'computer' ? localAsSnapshot : phoneAsSnapshot
          const mode = choice === 'computer' ? 'desktop-wins' : 'phone-wins'
          useListsStore.setState({ items: winner.lists, categories: winner.listsCategories })
          useLockedListsStore.setState({ items: winner.lockedLists, categories: winner.lockedListsCategories })
          useScratchpadStore.setState({ contents: winner.scratchpad, categories: winner.scratchpadCategories })
          send({ type: 'sync_confirm', mode, snapshot: winner, appliedAt: Date.now() })
          this.setLastSyncTimestamp(Date.now())
          const ancestorSnap = buildAncestorSnapshot()
          useAncestorStore.getState().commit(ancestorSnap)
          useListsStore.getState().gcTombstonesAgainst(ancestorSnap.lists)
          useLockedListsStore.getState().gcTombstonesAgainst(ancestorSnap.lockedLists)
          syncLog('SYNC', `outcome=divergence-${choice} duration=${Date.now() - syncStartTime}ms changed=${Math.abs(countLive(winner) - preLive)}`)
          return
        }
      }

      const mergedResult = mergeThreeWay(localAncestor, phoneAsSnapshot, localAsSnapshot)

      // Tie-only dialog. The merge auto-resolves all non-tie cases (case 4/5
      // adds, case 7/8 one-sided edits, case 9 different-fields, same-field
      // LWW). Only genuine same-field same-`updatedAt` ties surface.
      const preLive = countLive(localAsSnapshot)
      let finalSnapshot = mergedResult.snapshot
      if (mergedResult.ties.length > 0) {
        const resolution = await useSyncConfirmStore
          .getState()
          .requestTieResolution(mergedResult.ties, mergedResult.snapshot)
        if (resolution.kind === 'cancelled') {
          syncLog('STATE', 'User cancelled tie resolution; aborting sync')
          send({ type: 'sync_cancel' })
          syncLog('SYNC', `outcome=cancel duration=${Date.now() - syncStartTime}ms changed=0`)
          return
        }
        finalSnapshot = resolution.snapshot
      }

      // Apply the merged snapshot to all three desktop stores.
      useListsStore.setState({ items: finalSnapshot.lists, categories: finalSnapshot.listsCategories })
      useLockedListsStore.setState({ items: finalSnapshot.lockedLists, categories: finalSnapshot.lockedListsCategories })
      useScratchpadStore.setState({ contents: finalSnapshot.scratchpad, categories: finalSnapshot.scratchpadCategories })

      send({
        type: 'sync_confirm',
        mode: 'phone-wins',
        snapshot: finalSnapshot,
        appliedAt: Date.now(),
      })

      this.setLastSyncTimestamp(Date.now())

      // Phase 3 ancestor commit. Phase 5 tombstone GC after.
      const ancestorSnapshot = buildAncestorSnapshot()
      useAncestorStore.getState().commit(ancestorSnapshot)
      useListsStore.getState().gcTombstonesAgainst(ancestorSnapshot.lists)
      useLockedListsStore.getState().gcTombstonesAgainst(ancestorSnapshot.lockedLists)

      // Applied-result log line. Routes through syncLog, gated by DEBUG
      // LOGGING. Privacy: counts only, no item text.
      syncLog('MERGE', formatAppliedLogLine(finalSnapshot, mergedResult.summary).replace(/^\[merge\] /, ''))
      syncLog('SYNC', `outcome=merge duration=${Date.now() - syncStartTime}ms changed=${Math.abs(countLive(finalSnapshot) - preLive)}`)
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
      // Always release the save mutex — success or failure, this is the
      // terminal signal for the DOWNLOAD ALL write flow.
      useSaveStatusStore.getState().setSaving(false)
      if (!r.success) {
        useConsoleStore.getState().log(`Download failed: ${r.error}`)
        return
      }
      const jotLabel = r.jotCount === 1 ? 'JOT' : `${r.jotCount} JOTS`
      useConsoleStore.getState().log(`${jotLabel} \u2192 ${r.path}`)

      // Drawings aren't transferred via jot_download_response (jot.drawing on
      // the phone is a JSON string, not a file). Pull each from our local
      // jotsStore (kept fresh via metadata sync) and write them client-side
      // with the same rasterize flow that Save-to-Tag uses.
      const jotIds = r.jotIds ?? []
      const jots = useJotsStore.getState().jots
      for (const jotId of jotIds) {
        const jot = jots[jotId]
        if (!jot?.drawing) continue
        const drawingPngBase64 = rasterizeDrawing(jot.drawing)
        if (!drawingPngBase64) continue
        window.electronAPI.saveDownloadedDrawing({ baseDir: r.path, jotId, drawingPngBase64 })
          .catch((e: unknown) => console.warn('[download] saveDrawing failed', jotId, e))
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
        for (let i = 1; i <= JOT_COUNT; i++) emptyJots[i] = { text: '', textUpdatedAt: 0, drawing: null, drawingUpdatedAt: 0, images: [], recordings: [], files: [] }
        useJotsStore.setState({ jots: emptyJots, jotMetaFetched: {}, jotMetaLoading: {} })
        // Release the save mutex — any DOWNLOAD ALL in flight is dead now.
        useSaveStatusStore.getState().setSaving(false)
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
  }
}
