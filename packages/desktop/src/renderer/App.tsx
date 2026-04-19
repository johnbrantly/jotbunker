import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react'
import SidePanel from './components/SidePanel'
import TopChrome from './components/TopChrome'
import BottomNav from './components/BottomNav'
import SettingsModal from './components/SettingsModal'
import AboutModal from './components/AboutModal'
import SyncReportDialog from './components/SyncReportDialog'
import SyncLogDialog from './components/SyncLogDialog'

import JotsTab from './components/jots/JotsTab'
import ListsTab from './components/lists/ListsTab'
import LockedListsTab from './components/lockedLists/LockedListsTab'
import ScratchpadTab from './components/scratchpad/ScratchpadTab'
import SetupWizard from './components/SetupWizard'
import UpdateModal from './components/UpdateModal'
import { useDesktopSync } from './sync/useSyncSetup'
import { useSettingsStore } from './stores/settingsStore'
import { useTheme } from './hooks/useTheme'
import { useConsoleStore } from './stores/consoleStore'

export type TabKey = 'scratchpad' | 'jots' | 'lists' | 'lockedLists'

const subscribeHydration = (cb: () => void) => {
  const unsub = useSettingsStore.persist.onFinishHydration(cb)
  return unsub
}
const getHydrated = () => useSettingsStore.persist.hasHydrated()

export default function App() {
  const { colors } = useTheme()
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated)
  const setupComplete = useSettingsStore((s) => s.setupComplete)
  const setSetupComplete = useSettingsStore((s) => s.setSetupComplete)
  const [activeTab, setActiveTab] = useState<TabKey>('jots')
  const [showSettings, setShowSettings] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showSyncLog, setShowSyncLog] = useState(false)
  const [updateState, setUpdateState] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error'>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [updateProgress, setUpdateProgress] = useState<{ percent: number; bytesPerSecond: number; transferred: number; total: number } | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Set --accent-focus CSS variable for focus outlines
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-focus', colors.accentFocus)
  }, [colors.accentFocus])

  // Log app started
  useEffect(() => {
    useConsoleStore.getState().log('JotBunker started')
  }, [])

  // Listen for menu IPC events + send stored sync port on startup
  useEffect(() => {
    window.electronAPI.onMenuOpenSettings(() => setShowSettings(true))
    window.electronAPI.onMenuOpenAbout(() => setShowAbout(true))
    const { syncPort, pairingSecret } = useSettingsStore.getState()
    window.electronAPI.setSyncPort(syncPort)
    if (pairingSecret) {
      window.electronAPI.setPairingSecret(pairingSecret)
    }
  }, [])

  // After hydration: ensure tagRootPath is a concrete absolute path.
  // Empty means the user hasn't picked one — default to Documents/Jotbunker Tags
  // so every save operation has a deterministic destination (no main-process fallbacks).
  useEffect(() => {
    if (!hydrated) return
    const { tagRootPath, setTagRootPath } = useSettingsStore.getState()
    if (tagRootPath) return
    window.electronAPI.getDocumentsPath().then((docs) => {
      if (!docs) return
      const sep = docs.includes('\\') ? '\\' : '/'
      setTagRootPath(`${docs}${sep}Jotbunker Tags`)
    })
  }, [hydrated])

  // Auto-update listeners
  useEffect(() => {
    window.electronAPI.onUpdateChecking(() => {
      setUpdateState('checking')
    })
    window.electronAPI.onUpdateAvailable((version) => {
      setUpdateVersion(version)
      setUpdateState('available')
    })
    window.electronAPI.onUpdateProgress((progress) => {
      setUpdateProgress(progress)
      setUpdateState('downloading')
    })
    window.electronAPI.onUpdateDownloaded(() => {
      setUpdateState('downloaded')
    })
    window.electronAPI.onUpdateUpToDate((info) => {
      setUpdateVersion(info.version)
      setUpdateState('up-to-date')
    })
    window.electronAPI.onUpdateError((info) => {
      setUpdateError(info.message)
      setUpdateState('error')
    })
  }, [])

  // Sync
  const sync = useDesktopSync()

  const styles = useMemo(() => ({
    container: {
      display: 'flex' as const,
      flexDirection: 'row' as const,
      height: '100%',
      backgroundColor: colors.background,
    },
    rightColumn: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      background: `linear-gradient(180deg, ${colors.trayGradientBottom} 0%, ${colors.trayGradientTop} 100%)`,
    },
    content: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
  }), [colors])

  // Wait for hydration before deciding
  if (!hydrated) {
    return <div style={{ width: '100%', height: '100%', backgroundColor: colors.background }} />
  }

  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />
  }

  return (
    <div style={styles.container}>
      <SidePanel sync={sync} activeTab={activeTab} />
      <div style={styles.rightColumn}>
        <TopChrome sync={sync} onOpenSettings={() => setShowSettings(true)} />
        <div style={styles.content}>
          {activeTab === 'scratchpad' && <ScratchpadTab />}
          {activeTab === 'jots' && (
            <JotsTab
              connected={sync.syncStatus === 'connected'}
              isTransferring={sync.isTransferring}
              requestDownload={sync.requestDownload}
              requestClear={sync.requestClear}
            />
          )}
          {activeTab === 'lists' && <ListsTab />}
          {activeTab === 'lockedLists' && <LockedListsTab />}
        </div>
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          phoneConnected={sync.syncStatus === 'connected'}
        />
      </div>
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} onOpenSyncLog={() => setShowSyncLog(true)} />
      )}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
      <SyncReportDialog />
      {showSyncLog && (
        <SyncLogDialog onClose={() => setShowSyncLog(false)} />
      )}
      {updateState !== 'idle' && (
        <UpdateModal
          state={updateState}
          version={updateVersion}
          progress={updateProgress}
          errorMessage={updateError}
          onDismiss={() => { setUpdateState('idle'); setUpdateProgress(null); setUpdateError(null) }}
          onDownload={() => { setUpdateState('downloading'); setUpdateProgress({ percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 }); window.electronAPI.startUpdateDownload() }}
          onInstall={() => window.electronAPI.installUpdate()}
        />
      )}
    </div>
  )
}
