import React, { useMemo, useState, useCallback } from 'react'
import { header, cssFont } from '../../styles/tokens'
import { JOT_COUNT } from '@jotbunker/shared'
import { useJotsStore } from '../../stores/jotsStore'
import type { ManifestEntry } from '../../stores/jotsStore'
import { useTheme } from '../../hooks/useTheme'
import JotCard from './JotCard'
import HeaderTray from '../HeaderTray'
import DotMenu from '../DotMenu'
import navJotsIcon from '../../assets/nav/nav-jots.png'
import { useSaveStatusStore } from '../../stores/saveStatusStore'

interface JotsTabProps {
  connected: boolean
  isTransferring: boolean
  requestDownload: (jotIds: number[]) => void
  requestClear: (jotIds: number[]) => void
}

export default function JotsTab({ connected, isTransferring, requestDownload, requestClear }: JotsTabProps) {
  const { colors } = useTheme()
  const jots = useJotsStore((s) => s.jots)
  const manifest = useJotsStore((s) => s.manifest)
  const [expandedJotId, setExpandedJotId] = useState<number | null>(null)
  const [downloadAllStatus, setDownloadAllStatus] = useState<string | null>(null)
  const isSaving = useSaveStatusStore((s) => s.isSaving)

  // Determine which jots have content — use manifest when available, fall back to jot data
  const jotHasContent = (id: number): boolean => {
    const m = manifest[id]
    if (m) return m.hasText || m.hasDrawing || m.imageIds.length > 0 || m.audioIds.length > 0
    const jot = jots[id]
    return jot.text.length > 0 || !!jot.drawing || jot.images.length > 0 || jot.recordings.length > 0
  }

  const jotsWithContent = Array.from({ length: JOT_COUNT }, (_, i) => i + 1).filter(jotHasContent)

  const handleDownloadAll = useCallback(() => {
    if (downloadAllStatus || isTransferring || isSaving) return
    // Global save mutex — desktopPlatform.handleDownloadComplete clears it when
    // files finish writing, and the disconnect handler clears it if the response
    // never arrives. Blocks the big ↓ Quicksave button on every JotCard too.
    useSaveStatusStore.getState().setSaving(true)
    requestDownload(jotsWithContent)
  }, [jotsWithContent, downloadAllStatus, isTransferring, isSaving, requestDownload])


  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.background,
    },
    headerArea: {
      paddingTop: header.padding.top,
      paddingBottom: header.padding.top,
      paddingLeft: header.padding.horizontal,
      paddingRight: header.padding.horizontal,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: 6,
    },
    headerIcon: {
      width: 40,
      height: 40,
      opacity: 0.5,
    },
    headerTitle: {
      ...cssFont('DMSans-Black'),
      fontSize: 18,
      letterSpacing: 18 * 0.12,
      color: colors.primary,
    },
    scrollArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '0 16px 16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
    },
    downloadAllBtn: {
      margin: '4px 0 8px',
      padding: '8px 0',
      border: `1px solid ${colors.primary}`,
      borderRadius: 6,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      letterSpacing: 10 * 0.1,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    disconnectedMsg: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      letterSpacing: 11 * 0.08,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      padding: '32px 16px',
      opacity: 0.5,
    },
  }), [colors, connected])

  return (
    <div style={styles.container}>
      <HeaderTray>
        <div style={styles.headerArea}>
          <div style={styles.headerLeft}>
            <img src={navJotsIcon} style={styles.headerIcon} />
            <span style={styles.headerTitle}>JOTS</span>
          </div>
          {connected && (
            <DotMenu items={[
              { label: 'REFRESH', onClick: () => window.electronAPI.requestJotRefresh() },
            ]} />
          )}
        </div>
      </HeaderTray>

      {/* Jot cards */}
      <div style={styles.scrollArea}>
        {!connected ? (
          <div style={styles.disconnectedMsg}>
            CONNECT PHONE TO VIEW JOTS
          </div>
        ) : (
          <>
            {Array.from({ length: JOT_COUNT }, (_, i) => i + 1).map((id) => (
              <JotCard
                key={id}
                jotId={id}
                jot={jots[id]}
                connected={connected}
                isTransferring={isTransferring}
                isExpanded={expandedJotId === id}
                onToggleExpand={() => setExpandedJotId(expandedJotId === id ? null : id)}
                manifestEntry={manifest[id] || null}
                requestDownload={requestDownload}
                requestClear={requestClear}
              />
            ))}

            {jotsWithContent.length >= 1 && (
              <button
                style={{
                  ...styles.downloadAllBtn,
                  opacity: (downloadAllStatus || isTransferring || isSaving) ? 0.4 : 1,
                  cursor: (downloadAllStatus || isTransferring || isSaving) ? 'default' : 'pointer',
                }}
                onClick={handleDownloadAll}
                disabled={!!downloadAllStatus || isTransferring || isSaving}
              >
                {downloadAllStatus || 'DOWNLOAD ALL'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
