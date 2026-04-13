import React, { useMemo, useState, useEffect, useRef } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'
import { useSyncConfirmStore } from '../stores/syncConfirmStore'
import type { SyncReport, SyncSideReport } from '@jotbunker/shared'

const SECTION_LABELS: Record<string, string> = {
  lists: 'LISTS',
  lockedLists: 'LOCKED LISTS',
  scratchpad: 'SCRATCHPAD',
}

function truncate(text: string, max = 50): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function SideReport({ side, label }: { side: SyncSideReport; label: string }) {
  const { colors } = useTheme()
  const sections = ['lists', 'lockedLists', 'scratchpad'] as const

  const addColor = '#22c55e'
  const delColor = '#ef4444'
  const modColor = '#f59e0b'

  const sideHeadStyle: React.CSSProperties = {
    ...cssFont('DMSans-Black'),
    fontSize: 11,
    letterSpacing: 1,
    color: colors.primary,
    marginTop: 8,
    marginBottom: 2,
  }
  const sectionHeadStyle: React.CSSProperties = {
    ...cssFont('DMSans-Bold'),
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textPrimary,
    paddingLeft: 8,
    marginTop: 6,
    marginBottom: 2,
  }
  const catHeadStyle: React.CSSProperties = {
    ...cssFont('DMSans-Bold'),
    fontSize: 11,
    color: colors.textSecondary,
    paddingLeft: 16,
    marginTop: 3,
  }
  const lineStyle: React.CSSProperties = {
    ...cssFont('DMMono-Regular'),
    fontSize: 11,
    lineHeight: '17px',
    paddingLeft: 24,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
  const renameStyle: React.CSSProperties = {
    ...cssFont('DMSans-Regular'),
    fontSize: 11,
    color: modColor,
    paddingLeft: 16,
    lineHeight: '17px',
  }

  if (side.isEmpty) return null

  return (
    <div>
      <div style={sideHeadStyle}>{label}</div>
      {/* Summary */}
      <div style={{ ...cssFont('DMSans-Regular'), fontSize: 10, color: colors.textSecondary, paddingLeft: 8, marginBottom: 2 }}>
        {side.totalAdded > 0 && <span style={{ color: addColor }}>+{side.totalAdded} </span>}
        {side.totalDeleted > 0 && <span style={{ color: delColor }}>-{side.totalDeleted} </span>}
        {side.totalModified > 0 && <span style={{ color: modColor }}>{side.totalModified} modified </span>}
        {side.totalChecked > 0 && <span>{side.totalChecked} toggled </span>}
        {side.totalReordered > 0 && <span>{side.totalReordered} reordered </span>}
      </div>

      {sections.map((section) => {
        const catChanges = side.categoryChanges.filter((c) => c.section === section)
        const slots = side.slotChanges.filter((c) => c.section === section)
        const spChanges = section === 'scratchpad' ? side.scratchpadChanges : []
        if (catChanges.length === 0 && slots.length === 0 && spChanges.length === 0) return null

        return (
          <div key={section}>
            <div style={sectionHeadStyle}>{SECTION_LABELS[section]}</div>

            {catChanges.map((c, i) => (
              <div key={`cat-${i}`} style={renameStyle}>{c.oldLabel} → {c.newLabel}</div>
            ))}

            {slots.map((ch, si) => (
              <div key={`slot-${si}`}>
                <div style={catHeadStyle}>{ch.categoryLabel}</div>
                {ch.added.map((item, i) => (
                  <div key={`a-${i}`} style={{ ...lineStyle, color: addColor }}>
                    + {truncate(item.text)}{item.done ? ' (done)' : ''}
                  </div>
                ))}
                {ch.deleted.map((item, i) => (
                  <div key={`d-${i}`} style={{ ...lineStyle, color: delColor }}>
                    - {truncate(item.text)}
                  </div>
                ))}
                {ch.modified.map((item, i) => (
                  <div key={`m-${i}`} style={{ ...lineStyle, color: modColor }}>
                    ~ {truncate(item.oldText)} → {truncate(item.newText)}
                  </div>
                ))}
                {ch.checked.map((item, i) => (
                  <div key={`c-${i}`} style={{ ...lineStyle, color: colors.textSecondary }}>
                    {item.nowDone ? '☑' : '☐'} {truncate(item.text)}
                  </div>
                ))}
                {ch.reordered.map((item, i) => (
                  <div key={`r-${i}`} style={{ ...lineStyle, color: '#8b5cf6' }}>
                    ↕ {truncate(item.text)}
                  </div>
                ))}
              </div>
            ))}

            {spChanges.map((c, i) => (
              <div key={`sp-${i}`} style={catHeadStyle}>{c.categoryLabel}: content changed</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

const TIMEOUT_SECONDS = 60

export default function SyncReportDialog() {
  const pending = useSyncConfirmStore((s) => s.pending)
  const respond = useSyncConfirmStore((s) => s.respond)
  const { colors, confirmDialog: d } = useTheme()
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pending) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    setSecondsLeft(TIMEOUT_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          respond('cancel')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [pending])

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
      paddingTop: d.boxPaddingV,
      paddingBottom: d.boxPaddingV,
      paddingLeft: d.boxPaddingH,
      paddingRight: d.boxPaddingH,
      width: 440,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: d.boxGap,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
    },
    warning: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      color: '#f59e0b',
      letterSpacing: 0.3,
      textAlign: 'center' as const,
      marginTop: -4,
    },
    body: {
      width: '100%',
      maxHeight: 400,
      overflowY: 'auto' as const,
      textAlign: 'left' as const,
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: d.btnGap,
      width: '100%',
      flexWrap: 'wrap' as const,
    },
    cancelBtn: {
      flex: 1,
      minWidth: 80,
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
      cursor: 'pointer' as const,
    },
    cancelText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    confirmBtn: {
      flex: 1,
      minWidth: 80,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.successConfirmBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.successConfirmBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer' as const,
    },
    confirmText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.success,
    },
    winsBtn: {
      flex: 1,
      minWidth: 80,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: '#f59e0b40',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer' as const,
    },
    winsText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: '#f59e0b',
    },
  }), [colors, d])

  if (!pending) return null

  const { report } = pending
  const big = report.isBigDivergence

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <span style={styles.title}>SYNC PREVIEW</span>
        <span style={{ ...cssFont('DMSans-Regular'), fontSize: 10, color: colors.textSecondary }}>
          Auto-cancel in {secondsLeft}s
        </span>
        {big && (
          <span style={styles.warning}>LARGE DIVERGENCE DETECTED</span>
        )}
        <div style={styles.body}>
          {report.isEmpty && (
            <div style={{ ...cssFont('DMSans-Regular'), fontSize: 12, color: colors.textSecondary, textAlign: 'center', padding: '12px 0' }}>
              Nothing to sync — Phone and Desktop identical
            </div>
          )}
          <SideReport side={report.phoneOnly} label="PHONE HAS (desktop does not)" />
          <SideReport side={report.desktopOnly} label="DESKTOP HAS (phone does not)" />
          <SideReport side={report.desktopResult} label="DESKTOP AFTER MERGE" />
        </div>
        <div style={styles.btnRow}>
          {report.isEmpty ? (
            <button style={styles.confirmBtn} onClick={() => respond('confirm')}>
              <span style={styles.confirmText}>OK</span>
            </button>
          ) : (
            <>
              <button style={styles.cancelBtn} onClick={() => respond('cancel')}>
                <span style={styles.cancelText}>CANCEL</span>
              </button>
              {big && (
                <>
                  <button style={styles.winsBtn} onClick={() => respond('desktop-wins')}>
                    <span style={styles.winsText}>DESKTOP WINS</span>
                  </button>
                  <button style={styles.winsBtn} onClick={() => respond('phone-wins')}>
                    <span style={styles.winsText}>PHONE WINS</span>
                  </button>
                </>
              )}
              <button style={styles.confirmBtn} onClick={() => respond('confirm')}>
                <span style={styles.confirmText}>{big ? 'MERGE' : 'SYNC'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
