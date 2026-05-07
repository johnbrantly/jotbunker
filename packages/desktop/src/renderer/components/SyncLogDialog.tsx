import React, { useMemo, useState, useCallback } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'
import { useSyncHistoryStore } from '../stores/syncHistoryStore'
import type { SyncHistoryEntry } from '../stores/syncHistoryStore'
import ConfirmDialog from './ConfirmDialog'
import type { SyncReport, SyncSideReport, MergeReport } from '@jotbunker/shared'
import { formatMergeSummary } from '@jotbunker/shared'

const SECTION_LABELS: Record<string, string> = {
  lists: 'LISTS',
  lockedLists: 'LOCKED LISTS',
  scratchpad: 'SCRATCHPAD',
}

function truncate(text: string, max = 50): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function SideDetail({ side, label, colors }: { side: SyncSideReport; label: string; colors: any }) {
  const addColor = '#22c55e'
  const delColor = '#ef4444'
  const modColor = '#f59e0b'
  const reorderColor = '#8b5cf6'
  const sections = ['lists', 'lockedLists', 'scratchpad'] as const

  if (side.isEmpty) return null

  return (
    <div>
      <div style={{ ...cssFont('DMSans-Black'), fontSize: 11, letterSpacing: 1, color: colors.primary, marginTop: 8, marginBottom: 2 }}>
        {label}
      </div>
      {sections.map((section) => {
        const catChanges = side.categoryChanges.filter((c) => c.section === section)
        const slots = side.slotChanges.filter((c) => c.section === section)
        const spChanges = section === 'scratchpad' ? side.scratchpadChanges : []
        if (!catChanges.length && !slots.length && !spChanges.length) return null

        return (
          <div key={section}>
            <div style={{ ...cssFont('DMSans-Bold'), fontSize: 11, letterSpacing: 0.5, color: colors.textPrimary, paddingLeft: 8, marginTop: 6 }}>
              {SECTION_LABELS[section]}
            </div>
            {catChanges.map((c, i) => (
              <div key={`cat-${i}`} style={{ ...cssFont('DMSans-Regular'), fontSize: 11, color: modColor, paddingLeft: 16, lineHeight: '17px' }}>
                {c.oldLabel} → {c.newLabel}
              </div>
            ))}
            {slots.map((ch, si) => (
              <div key={`slot-${si}`}>
                <div style={{ ...cssFont('DMSans-Bold'), fontSize: 11, color: colors.textSecondary, paddingLeft: 16, marginTop: 3 }}>
                  {ch.categoryLabel}
                </div>
                {ch.added.map((item, i) => (
                  <div key={`a-${i}`} style={{ ...cssFont('DMMono-Regular'), fontSize: 11, lineHeight: '17px', paddingLeft: 24, color: addColor }}>
                    + {truncate(item.text)}
                  </div>
                ))}
                {ch.deleted.map((item, i) => (
                  <div key={`d-${i}`} style={{ ...cssFont('DMMono-Regular'), fontSize: 11, lineHeight: '17px', paddingLeft: 24, color: delColor }}>
                    - {truncate(item.text)}
                  </div>
                ))}
                {ch.modified.map((item, i) => (
                  <div key={`m-${i}`} style={{ ...cssFont('DMMono-Regular'), fontSize: 11, lineHeight: '17px', paddingLeft: 24, color: modColor }}>
                    ~ {truncate(item.oldText)} → {truncate(item.newText)}
                  </div>
                ))}
                {ch.checked.map((item, i) => (
                  <div key={`c-${i}`} style={{ ...cssFont('DMMono-Regular'), fontSize: 11, lineHeight: '17px', paddingLeft: 24, color: colors.textSecondary }}>
                    {item.nowDone ? '☑' : '☐'} {truncate(item.text)}
                  </div>
                ))}
                {ch.reordered.map((item, i) => (
                  <div key={`r-${i}`} style={{ ...cssFont('DMMono-Regular'), fontSize: 11, lineHeight: '17px', paddingLeft: 24, color: reorderColor }}>
                    ↕ {truncate(item.text)}
                  </div>
                ))}
              </div>
            ))}
            {spChanges.map((c, i) => (
              <div key={`sp-${i}`} style={{ ...cssFont('DMSans-Bold'), fontSize: 11, color: colors.textSecondary, paddingLeft: 16, marginTop: 3 }}>
                {c.categoryLabel}: content changed
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ReportDetail({ report, colors }: { report: SyncReport; colors: any }) {
  if (report.isEmpty) {
    return (
      <div style={{ ...cssFont('DMSans-Regular'), fontSize: 12, color: colors.textSecondary, textAlign: 'center', padding: '12px 0' }}>
        Nothing to sync — Phone and Desktop identical
      </div>
    )
  }
  return (
    <div>
      <SideDetail side={report.phoneOnly} label="PHONE HAS (desktop does not)" colors={colors} />
      <SideDetail side={report.desktopOnly} label="DESKTOP HAS (phone does not)" colors={colors} />
    </div>
  )
}

/**
 * Phase 5.5: detail panel for post-cutover merge entries. Lists each non-zero
 * count as a row. The legacy ReportDetail above renders pre-cutover entries
 * unchanged.
 */
function MergeReportDetail({ report, colors }: { report: MergeReport; colors: any }) {
  const c = report.counts
  const rows: Array<{ label: string; value: number; color: string }> = [
    { label: 'Added from phone', value: c.addedFromPhone, color: '#22c55e' },
    { label: 'Added from desktop', value: c.addedFromDesktop, color: '#22c55e' },
    { label: 'Field edits applied', value: c.editedField, color: '#f59e0b' },
    { label: 'Conflicts resolved by latest-edit', value: c.editedLWW, color: '#f59e0b' },
    { label: 'Items deleted', value: c.tombstoned, color: '#ef4444' },
    { label: 'Ties surfaced', value: c.ties, color: '#8b5cf6' },
  ].filter((r) => r.value > 0)

  if (rows.length === 0) {
    return (
      <div style={{ ...cssFont('DMSans-Regular'), fontSize: 12, color: colors.textSecondary, textAlign: 'center', padding: '12px 0' }}>
        No changes
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8, paddingRight: 8 }}>
          <span style={{ ...cssFont('DMSans-Regular'), fontSize: 12, color: colors.textPrimary }}>
            {row.label}
          </span>
          <span style={{ ...cssFont('DMMono-Regular'), fontSize: 12, color: row.color }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  onClose: () => void
}

export default function SyncLogDialog({ onClose }: Props) {
  const { colors, confirmDialog: d } = useTheme()
  const entries = useSyncHistoryStore((s) => s.entries)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const selectedEntry = selectedId != null ? entries.find((e) => e.id === selectedId) : null

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
      width: 460,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: d.boxGap,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
      textAlign: 'center' as const,
    },
    sectionLabel: {
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      letterSpacing: 0.5,
      color: colors.textSecondary,
      alignSelf: 'flex-start' as const,
    },
    entryList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
      maxHeight: 200,
      overflowY: 'auto' as const,
      width: '100%',
    },
    entryBtn: {
      display: 'flex',
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 10px',
      borderRadius: 6,
      border: `1px solid ${colors.dialogBorder}`,
      background: 'none',
      cursor: 'pointer' as const,
    },
    entryBtnActive: {
      backgroundColor: colors.dialogBorder,
    },
    entryTime: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      color: colors.textPrimary,
    },
    entrySummary: {
      ...cssFont('DMSans-Regular'),
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'right' as const,
    },
    detail: {
      maxHeight: 300,
      overflowY: 'auto' as const,
      paddingTop: 4,
      width: '100%',
    },
    emptyMsg: {
      ...cssFont('DMSans-Regular'),
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      padding: '20px 0',
    },
    closeBtn: {
      alignSelf: 'center' as const,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      paddingLeft: 32,
      paddingRight: 32,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.cancelBorder,
      cursor: 'pointer' as const,
    },
    closeText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    btnRow: {
      display: 'flex' as const,
      flexDirection: 'row' as const,
      gap: d.btnGap,
      width: '100%',
    },
    clearBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: '#c0392b40',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      cursor: 'pointer' as const,
    },
    clearText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: '#c0392b',
    },
    closeBtnFlex: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.cancelBorder,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      cursor: 'pointer' as const,
    },
  }), [colors, d])

  // Build a one-line summary for the list. Branches on entry shape: post-
  // cutover entries use the new MergeReport-driven format; pre-cutover
  // entries continue rendering via the legacy SyncReport aggregation.
  function briefEntrySummary(entry: SyncHistoryEntry): string {
    if (entry.kind === 'merge') {
      return formatMergeSummary(entry.mergeReport)
    }
    const report = entry.report
    if (report.isEmpty) return 'No changes'
    const sides = [report.phoneOnly, report.desktopOnly].filter(Boolean)
    let added = 0, deleted = 0, modified = 0, reordered = 0, checked = 0, scratchpad = 0, renamed = 0
    for (const s of sides) {
      added += s.totalAdded
      deleted += s.totalDeleted
      modified += s.totalModified
      reordered += s.totalReordered
      checked += s.totalChecked
      scratchpad += s.scratchpadChanges.length
      renamed += s.categoryChanges.length
    }
    const parts: string[] = []
    if (added) parts.push(`+${added}`)
    if (deleted) parts.push(`-${deleted}`)
    if (modified) parts.push(`${modified} mod`)
    if (reordered) parts.push(`${reordered} reord`)
    if (checked) parts.push(`${checked} toggled`)
    if (scratchpad) parts.push(`${scratchpad} scratchpad`)
    if (renamed) parts.push(`${renamed} renamed`)
    return parts.join(', ') || 'No changes'
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <span style={styles.title}>SYNC HISTORY</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { symbol: '+', color: '#22c55e', label: 'added' },
            { symbol: '-', color: '#ef4444', label: 'deleted' },
            { symbol: '~', color: '#f59e0b', label: 'modified' },
            { symbol: '↕', color: '#8b5cf6', label: 'reordered' },
            { symbol: '☑', color: colors.textSecondary, label: 'toggled' },
          ].map((item) => (
            <span key={item.symbol} style={{ ...cssFont('DMMono-Regular'), fontSize: 10, color: item.color }}>
              {item.symbol} <span style={{ ...cssFont('DMSans-Regular'), color: colors.textSecondary }}>{item.label}</span>
            </span>
          ))}
        </div>

        {entries.length === 0 ? (
          <div style={styles.emptyMsg}>No sync history yet</div>
        ) : (
          <>
            <span style={styles.sectionLabel}>Sync History</span>
            <div className="list-scroll" style={styles.entryList}>
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  style={{
                    ...styles.entryBtn,
                    ...(selectedId === entry.id ? styles.entryBtnActive : {}),
                  }}
                  onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                >
                  <span style={styles.entryTime}>{formatTime(entry.timestamp)}</span>
                  <span style={styles.entrySummary}>{briefEntrySummary(entry)}</span>
                </button>
              ))}
            </div>

            {selectedEntry && (
              <>
                <span style={styles.sectionLabel}>Sync Details:</span>
                <div className="list-scroll" style={styles.detail}>
                  {selectedEntry.kind === 'merge'
                    ? <MergeReportDetail report={selectedEntry.mergeReport} colors={colors} />
                    : <ReportDetail report={selectedEntry.report} colors={colors} />}
                </div>
              </>
            )}
          </>
        )}

        <div style={styles.btnRow}>
          {entries.length > 0 && (
            <button style={styles.clearBtn} onClick={() => setShowClearConfirm(true)}>
              <span style={styles.clearText}>CLEAR HISTORY</span>
            </button>
          )}
          <button style={styles.closeBtnFlex} onClick={onClose}>
            <span style={styles.closeText}>CLOSE</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        visible={showClearConfirm}
        title="Clear Sync History?"
        message="This will delete all sync history entries. This cannot be undone."
        variant="destructive"
        confirmLabel="CLEAR"
        onConfirm={() => {
          useSyncHistoryStore.getState().clear()
          setSelectedId(null)
          setShowClearConfirm(false)
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}
