import { useState, useEffect, useRef, useCallback } from 'react'
import {
  SyncEngine,
  setSyncLogEnabled,
  setSyncLogSink,
} from '@jotbunker/shared'
import { DesktopTransport } from './DesktopTransport'
import { buildDesktopPlatform } from './desktopPlatform'
import type { SyncStatus, DesktopPlatformHandle } from './desktopPlatform'
import { useSettingsStore } from '../stores/settingsStore'
import { useLockedListsStore } from '../stores/lockedListsStore'
import { useListsStore } from '../stores/listsStore'
import { useScratchpadStore } from '../stores/scratchpadStore'

import { BinaryQueue } from '../hooks/sync/binaryQueue'
import { requestDownload } from '../hooks/sync/jotMetadata'

export type { SyncStatus } from './desktopPlatform'

export interface DesktopSyncState {
  syncStatus: SyncStatus
  phoneDeviceId: string | null
  downloadStatus: string | null
  binarySyncStatus: string | null
  jotRefreshed: boolean
  lastSyncTimestamp: number
  lastAutoSyncTimestamp: number
  lastSyncWasAuto: boolean
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
  const [lastAutoSyncTimestamp, setLastAutoSyncTimestamp] = useState(0)
  const [lastSyncWasAuto, setLastSyncWasAuto] = useState(false)

  const debugLog = useSettingsStore((s) => s.debugLog)
  setSyncLogEnabled(debugLog)

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
  const platformHandleRef = useRef<DesktopPlatformHandle | null>(null)
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
    })

    platformHandleRef.current = handle

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
    setLastSyncWasAuto(false)
    syncingRef.current = true
    engineRef.current?.requestRefresh()
    setTimeout(() => { syncingRef.current = false }, 500)
  }, [])

  // ── Auto-sync: debounce store edits → silent sync ──
  const autoSyncEnabled = useSettingsStore((s) => s.autoSyncEnabled)
  const autoSyncDelaySec = useSettingsStore((s) => s.autoSyncDelaySec)

  useEffect(() => {
    if (!autoSyncEnabled) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const delay = autoSyncDelaySec * 1000

    const scheduleSync = () => {
      if (syncingRef.current) return // ignore store changes from an incoming sync
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (engineRef.current?.currentPhase !== 'docked') return
        syncingRef.current = true
        platformHandleRef.current?.setSkipConfirmation(true)
        setLastSyncWasAuto(true)
        engineRef.current?.requestRefresh()
        setLastAutoSyncTimestamp(Date.now())
        setTimeout(() => { syncingRef.current = false }, 500)
      }, delay)
    }

    const unsubs = [
      useListsStore.subscribe(scheduleSync),
      useLockedListsStore.subscribe(scheduleSync),
      useScratchpadStore.subscribe(scheduleSync),
    ]

    return () => {
      if (timer) clearTimeout(timer)
      unsubs.forEach((u) => u())
    }
  }, [autoSyncEnabled, autoSyncDelaySec])

  return {
    syncStatus,
    phoneDeviceId,
    downloadStatus,
    binarySyncStatus,
    jotRefreshed,
    lastSyncTimestamp,
    lastAutoSyncTimestamp,
    lastSyncWasAuto,
    requestDownload: handleRequestDownload,
    requestClear: handleRequestClear,
    requestRefresh: handleRequestRefresh,
  }
}
