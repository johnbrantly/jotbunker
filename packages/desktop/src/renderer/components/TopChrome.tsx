import React, { useMemo, useState, useEffect, useReducer, useCallback, useRef } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'
import type { DesktopSyncState } from '../sync/useSyncSetup'
import { useSaveStatusStore } from '../stores/saveStatusStore'
import settingsGear from '../assets/nav/nav-settings.png'

interface TopChromeProps {
  sync: DesktopSyncState
  onOpenSettings: () => void
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) {
    const secs = Math.max(1, Math.floor(diff / 1000))
    return `${secs}s ago`
  }
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86_400_000)
  return `${days}d ago`
}

export default function TopChrome({ sync, onOpenSettings }: TopChromeProps) {
  const { colors } = useTheme()
  const { syncStatus, lastSyncTimestamp, lastSyncWasAuto, isTransferring } = sync
  const isSaving = useSaveStatusStore((s) => s.isSaving)
  const syncLocked = isTransferring || isSaving
  const docked = syncStatus === 'connected'
  const [gearHover, setGearHover] = useState(false)
  const [refreshHover, setRefreshHover] = useState(false)
  const [refreshFeedback, setRefreshFeedback] = useState(false)
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRefresh = useCallback(() => {
    sync.requestRefresh()
    setRefreshFeedback(true)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setRefreshFeedback(false), 1500)
  }, [sync])

  useEffect(() => {
    if (!lastSyncTimestamp) return
    // Tick every second for the first minute (shows seconds), then every 30s
    const diff = Date.now() - lastSyncTimestamp
    const interval = diff < 60_000 ? 1_000 : 30_000
    const id = setInterval(forceUpdate, interval)
    return () => clearInterval(id)
  }, [lastSyncTimestamp])

  const styles = useMemo(() => ({
    bar: {
      height: 40,
      flexShrink: 0,
      display: 'flex' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      background: `linear-gradient(${colors.trayGradientBottom}, ${colors.trayGradientBottom}), ${colors.background}`,
      paddingLeft: 12,
      paddingRight: 12,
      gap: 10,
    },
    leftGroup: {
      display: 'flex' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
    },
    pill: {
      display: 'flex' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 7,
      backgroundColor: colors.dialogBg,
      border: `1px solid ${colors.dialogBorder}`,
      borderRadius: 20,
      paddingLeft: 12,
      paddingRight: 14,
      paddingTop: 5,
      paddingBottom: 5,
    },
    pillDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: docked ? '#22c55e' : '#888888',
    },
    pillText: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    syncedAgo: {
      ...cssFont('DMSans-Regular'),
      fontSize: 10,
      color: colors.textSecondary,
    },
    refreshBtn: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      cursor: 'pointer' as const,
      height: 28,
      paddingLeft: 14,
      paddingRight: 14,
      borderRadius: 5,
      border: `1px solid ${refreshHover ? colors.dialogBorder : colors.textPrimary + '30'}`,
      background: refreshHover
        ? `radial-gradient(circle, ${colors.primary}60 0%, ${colors.primary}15 70%, transparent 100%)`
        : `radial-gradient(circle, ${colors.textPrimary}45 0%, ${colors.textPrimary}10 60%, transparent 100%)`,
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      letterSpacing: 0.5,
      color: refreshFeedback ? '#22c55e' : colors.textPrimary,
    },
    spacer: {
      flex: 1,
    },
    gearBtn: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      cursor: 'pointer' as const,
      padding: 4,
      borderRadius: 5,
      background: gearHover
        ? `radial-gradient(circle, ${colors.primary}60 0%, ${colors.primary}15 70%, transparent 100%)`
        : `radial-gradient(circle, ${colors.textPrimary}45 0%, ${colors.textPrimary}10 60%, transparent 100%)`,
    },
    gearIcon: {
      width: 28,
      height: 28,
    },
  }), [colors, docked, gearHover, refreshHover, refreshFeedback])

  return (
    <div style={styles.bar}>
      <div style={styles.leftGroup}>
        <div style={styles.pill}>
          <div style={styles.pillDot} />
          <span style={styles.pillText}>
            {docked ? 'PHONE CONNECTED' : 'PHONE DISCONNECTED'}
          </span>
        </div>
        {lastSyncTimestamp > 0 && (
          <span style={styles.syncedAgo}>
            {lastSyncWasAuto ? 'Auto-synced' : 'Synced'} {formatRelativeTime(lastSyncTimestamp)}
          </span>
        )}
      </div>

      <div style={styles.spacer} />

      {docked && (
        <button
          style={{
            ...styles.refreshBtn,
            opacity: syncLocked ? 0.4 : 1,
            cursor: syncLocked ? 'default' : 'pointer',
          }}
          onClick={handleRefresh}
          disabled={syncLocked}
          onMouseEnter={() => setRefreshHover(true)}
          onMouseLeave={() => setRefreshHover(false)}
        >
          {refreshFeedback ? 'SYNCED' : 'SYNC NOW'}
        </button>
      )}
      <div
        style={styles.gearBtn}
        onClick={onOpenSettings}
        onMouseEnter={() => setGearHover(true)}
        onMouseLeave={() => setGearHover(false)}
      >
        <img src={settingsGear} alt="Settings" style={styles.gearIcon} />
      </div>
    </div>
  )
}
