import React, { useEffect, useMemo } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'

type UpdateState = 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error'

interface UpdateModalProps {
  state: UpdateState
  version: string | null
  progress: { percent: number; bytesPerSecond: number; transferred: number; total: number } | null
  errorMessage: string | null
  onDismiss: () => void
  onDownload: () => void
  onInstall: () => void
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(s => parseInt(s, 16)).join(',')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UpdateModal({ state, version, progress, errorMessage, onDismiss, onDownload, onInstall }: UpdateModalProps) {
  const { colors, confirmDialog: d } = useTheme()

  // Auto-dismiss "up-to-date" after 4 seconds
  useEffect(() => {
    if (state === 'up-to-date') {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [state, onDismiss])

  const styles = useMemo(() => ({
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: d.overlayBg,
      backdropFilter: `blur(${d.blurAmount}px)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    box: {
      backgroundColor: colors.dialogBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: colors.dialogBorder,
      borderRadius: d.boxRadius,
      paddingTop: 32,
      paddingBottom: 28,
      paddingLeft: 40,
      paddingRight: 40,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 14,
      minWidth: 300,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
      textAlign: 'center' as const,
    },
    msg: {
      ...cssFont('DMSans-Regular'),
      fontSize: d.msgFontSize,
      color: d.msgColor,
      lineHeight: `${d.msgFontSize * d.msgLineHeight}px`,
      textAlign: 'center' as const,
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: d.btnGap,
      width: '100%',
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.cancelBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    cancelText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    accentBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: `rgba(${hexToRgb(colors.primary)},0.15)`,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: `rgba(${hexToRgb(colors.primary)},0.3)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    accentText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    dangerBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.confirmBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.confirmBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    dangerText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.accent,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.accent,
      transition: 'width 0.3s ease',
    },
    progressText: {
      ...cssFont('DMMono-Regular'),
      fontSize: 11,
      color: d.msgColor,
    },
  }), [colors, d])

  const title = (() => {
    switch (state) {
      case 'checking': return 'Checking for Updates\u2026'
      case 'available': return `Update ${version} Available`
      case 'downloading': return `Downloading ${version}`
      case 'downloaded': return 'Update Ready'
      case 'up-to-date': return "You're Up to Date"
      case 'error': return 'Update Error'
    }
  })()

  const message = (() => {
    switch (state) {
      case 'checking': return null
      case 'available': return 'A new version of Jotbunker is available.'
      case 'downloading': return null
      case 'downloaded': return 'Restart Jotbunker to apply the update.'
      case 'up-to-date': return `Jotbunker ${version} is the latest version.`
      case 'error': return errorMessage || 'An error occurred while checking for updates.'
    }
  })()

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <span style={styles.title}>{title}</span>

        {message && <span style={styles.msg}>{message}</span>}

        {state === 'downloading' && progress && (
          <>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${Math.min(progress.percent, 100)}%` }} />
            </div>
            <span style={styles.progressText}>
              {Math.round(progress.percent)}% &mdash; {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
            </span>
          </>
        )}

        {state === 'available' && (
          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={onDismiss}>
              <span style={styles.cancelText}>LATER</span>
            </button>
            <button style={styles.accentBtn} onClick={onDownload}>
              <span style={styles.accentText}>DOWNLOAD</span>
            </button>
          </div>
        )}

        {state === 'downloading' && (
          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={onDismiss}>
              <span style={styles.cancelText}>LATER</span>
            </button>
          </div>
        )}

        {state === 'downloaded' && (
          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={onDismiss}>
              <span style={styles.cancelText}>LATER</span>
            </button>
            <button style={styles.dangerBtn} onClick={onInstall}>
              <span style={styles.dangerText}>RESTART</span>
            </button>
          </div>
        )}

        {(state === 'up-to-date' || state === 'error') && (
          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={onDismiss}>
              <span style={styles.cancelText}>OK</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
