import { useState, useEffect, useRef, useCallback } from 'react'
import {
  SyncEngine,
  setSyncLogEnabled,
  setSyncLogSink,
} from '@jotbunker/shared'
import { DesktopTransport } from './DesktopTransport'
import { buildDesktopPlatform } from './desktopPlatform'
import type { SyncStatus } from './desktopPlatform'
import { useSettingsStore } from '../stores/settingsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useJotsStore } from '../stores/jotsStore'

import { BinaryQueue } from '../hooks/sync/binaryQueue'
import { requestDownload } from '../hooks/sync/jotMetadata'

export type { SyncStatus } from './desktopPlatform'

export type DivergenceCounts = { case2: number; case3: number; ancestorLive: number }
export type DivergenceChoice = 'computer' | 'phone' | 'cancel'

export interface DesktopSyncState {
  syncStatus: SyncStatus
  phoneDeviceId: string | null
  downloadStatus: string | null
  binarySyncStatus: string | null
  /** True while the phone is streaming jot metadata or binary files to us.
   *  UI uses this to lock sync-initiating controls (SYNC NOW, DOWNLOAD ALL,
   *  big Quicksave header button) so we don't stack duplicate requests. */
  isTransferring: boolean
  jotRefreshed: boolean
  lastSyncTimestamp: number
  /** When set, App.tsx renders the "LARGE CHANGE DETECTED" dialog. Cleared
   *  when the user picks computer/phone/cancel via `respondDivergence`. */
  pendingDivergence: DivergenceCounts | null
  respondDivergence: (choice: DivergenceChoice) => void
  requestDownload: (jotIds: number[]) => void
  requestClear: (jotIds: number[]) => void
  requestRefresh: () => void
}

export function useDesktopSync(): DesktopSyncState {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected')
  const [phoneDeviceId, setPhoneDeviceId] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
  const [binarySyncStatus, setBinarySyncStatus] = useState<string | null>(null)
  const [jotRefreshed, setJotRefreshed] = useState(false)
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0)

  // Pending large-divergence dialog. Set when the gate in
  // desktopPlatform.handleStateSync trips its 80% ratio. Cleared on user pick.
  const [pendingDivergence, setPendingDivergence] = useState<{
    counts: DivergenceCounts
    resolve: (c: DivergenceChoice) => void
  } | null>(null)

  const requestDivergenceChoice = useCallback(
    (counts: DivergenceCounts) =>
      new Promise<DivergenceChoice>((resolve) => {
        setPendingDivergence({ counts, resolve })
      }),
    [],
  )

  const respondDivergence = useCallback((choice: DivergenceChoice) => {
    setPendingDivergence((cur) => {
      cur?.resolve(choice)
      return null
    })
  }, [])

  const debugLog = useSettingsStore((s) => s.debugLog)
  setSyncLogEnabled(debugLog)

  // Derived "transfer in flight" flag. True whenever:
  //   - Binary queue has active transfers (binarySyncStatus becomes non-null)
  //   - OR any jot's metadata fetch is still pending
  // Consumers use this to disable SYNC NOW / DOWNLOAD ALL / big Quicksave button
  // so simultaneous user actions don't race the queue.
  const metaLoading = useJotsStore((s) => Object.values(s.jotMetaLoading).some(Boolean))
  const isTransferring = binarySyncStatus !== null || metaLoading

  useEffect(() => {
    window.electronAPI.setSyncDebugLog(debugLog)
    if (debugLog) {
      setSyncLogSink((line) => window.electronAPI.sendDebugLog(line))
    } else {
      setSyncLogSink(null)
    }
    return () => { setSyncLogSink(null) }
  }, [debugLog])

  const binaryQueueRef = useRef<BinaryQueue | null>(null)
  if (!binaryQueueRef.current) {
    binaryQueueRef.current = new BinaryQueue(setBinarySyncStatus)
  }
  const binaryQueue = binaryQueueRef.current

  const engineRef = useRef<SyncEngine | null>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    const api = window.electronAPI

    const transport = new DesktopTransport()

    // Hydrate lockedLists store (plaintext — no key needed)
    const lockedListsReady = useLockedListsStore.persist.rehydrate().then(() => {})

    const handle = buildDesktopPlatform({
      binaryQueue,
      lockedListsReady,
      setSyncStatus,
      setJotRefreshed,
      setLastSyncTimestamp,
      requestDivergenceChoice,
    })

    const engine = new SyncEngine(transport, handle.platform, { serverMode: true })

    engineRef.current = engine

    // Listen for download complete (this bypasses the engine since it's not a sync protocol message)
    api.onDownloadComplete((result) => {
      handle.platform.handleDownloadComplete(result)
    })

    // Start listening
    transport.connect()

    return () => {
      engine.dispose()
      api.removeAllSyncListeners()
    }
  }, [binaryQueue])

  const handleRequestDownload = useCallback(async (jotIds: number[]) => {
    await requestDownload(jotIds, setDownloadStatus)
  }, [])

  const handleRequestClear = useCallback((jotIds: number[]) => {
    window.electronAPI.requestJotClear(jotIds)
  }, [])

  const handleRequestRefresh = useCallback(() => {
    syncingRef.current = true
    engineRef.current?.requestRefresh()
    setTimeout(() => { syncingRef.current = false }, 500)
  }, [])

  return {
    syncStatus,
    phoneDeviceId,
    downloadStatus,
    binarySyncStatus,
    isTransferring,
    jotRefreshed,
    lastSyncTimestamp,
    pendingDivergence: pendingDivergence?.counts ?? null,
    respondDivergence,
    requestDownload: handleRequestDownload,
    requestClear: handleRequestClear,
    requestRefresh: handleRequestRefresh,
  }
}
