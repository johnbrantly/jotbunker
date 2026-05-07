import React, { useMemo, useState, useEffect, useRef } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'
import { useSyncConfirmStore } from '../stores/syncConfirmStore'
import type { AncestorSnapshot, MergeTie } from '@jotbunker/shared'

// Phase 5.5 cutover: replaces the old "PHONE HAS / DESKTOP HAS" SyncReportDialog
// with a per-tie picker. Fires only when mergeThreeWay produced ties (case 9
// same-field same-`updatedAt`). Vanishingly rare in practice.
//
// Dialog UX: one row per tie. Each row shows section + slot + item context,
// phone vs desktop values, and two buttons. Apply requires every row to be
// picked. Cancel aborts the whole sync.

const SECTION_LABELS: Record<string, string> = {
  lists: 'LISTS',
  lockedLists: 'LOCKED LISTS',
  scratchpad: 'SCRATCHPAD',
  listsCategories: 'LISTS / category',
  lockedListsCategories: 'LOCKED LISTS / category',
  scratchpadCategories: 'SCRATCHPAD / category',
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '(empty)'
  if (typeof v === 'string') return v.length > 60 ? v.slice(0, 60) + '...' : v
  return String(v)
}

function tieKey(t: MergeTie): string {
  return `${t.section}:${t.slot}:${t.itemId ?? ''}:${t.field}`
}

/**
 * Build the final snapshot by applying per-tie picks to the merged snapshot.
 * The merged snapshot already has phone's value as the deterministic
 * placeholder (per `mergeItemFields`), so 'phone' picks are pass-through and
 * 'desktop' picks overwrite at the tie's location.
 */
function applyPicks(
  merged: AncestorSnapshot,
  ties: MergeTie[],
  picks: Record<string, 'phone' | 'desktop'>,
): AncestorSnapshot {
  const result: AncestorSnapshot = JSON.parse(JSON.stringify(merged))
  for (const tie of ties) {
    const key = tieKey(tie)
    const pick = picks[key]
    if (!pick || pick === 'phone') continue // phone is already in merged
    const value = tie.desktopValue
    if (tie.section === 'lists' || tie.section === 'lockedLists') {
      const slot = result[tie.section][tie.slot]
      const idx = slot.findIndex((it) => it.id === tie.itemId)
      if (idx >= 0) {
        ;(slot[idx] as Record<string, unknown>)[tie.field] = value
      }
    } else if (tie.section === 'scratchpad') {
      result.scratchpad[tie.slot] = {
        ...result.scratchpad[tie.slot],
        [tie.field]: value,
      } as { content: string; updatedAt: number }
    } else if (
      tie.section === 'listsCategories'
      || tie.section === 'lockedListsCategories'
      || tie.section === 'scratchpadCategories'
    ) {
      const cats = result[tie.section]
      cats[tie.slot] = { ...cats[tie.slot], [tie.field]: value }
    }
  }
  return result
}

const TIMEOUT_SECONDS = 60

export default function SyncReportDialog() {
  const pending = useSyncConfirmStore((s) => s.pending)
  const respondApply = useSyncConfirmStore((s) => s.respondApply)
  const respondCancel = useSyncConfirmStore((s) => s.respondCancel)
  const { colors, confirmDialog: d } = useTheme()
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)
  const [picks, setPicks] = useState<Record<string, 'phone' | 'desktop'>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pending) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setPicks({})
      return
    }
    setSecondsLeft(TIMEOUT_SECONDS)
    setPicks({})
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          respondCancel()
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
      width: 520,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'stretch',
      gap: d.boxGap,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...cssFont('DMSans-Regular'),
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    body: {
      maxHeight: 400,
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 12,
    },
    tieRow: {
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: colors.dialogBorder,
      borderRadius: 6,
      padding: 10,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 6,
    },
    tieHead: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
    tieField: {
      ...cssFont('DMMono-Regular'),
      fontSize: 11,
      color: colors.textPrimary,
    },
    sideBtn: {
      flex: 1,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 8,
      paddingRight: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      cursor: 'pointer' as const,
      ...cssFont('DMMono-Regular'),
      fontSize: 11,
      textAlign: 'left' as const,
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: d.btnGap,
      width: '100%',
    },
    applyBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: colors.primary,
      borderWidth: 0,
      cursor: 'pointer' as const,
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      color: colors.dialogBg,
    },
    applyBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' as const },
    cancelBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: d.cancelBorder,
      cursor: 'pointer' as const,
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      color: colors.textPrimary,
    },
    timer: {
      ...cssFont('DMMono-Regular'),
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
  }), [colors, d])

  if (!pending) return null

  const ties = pending.ties
  const allPicked = ties.every((t) => picks[tieKey(t)] !== undefined)

  const onApply = () => {
    if (!allPicked) return
    const finalSnapshot = applyPicks(pending.mergedSnapshot, ties, picks)
    respondApply(finalSnapshot)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <div style={styles.title}>SYNC CONFLICT</div>
        <div style={styles.subtitle}>
          {ties.length} tie{ties.length === 1 ? '' : 's'} - same field edited at the same instant on both sides. Pick one per row.
        </div>
        <div style={styles.body}>
          {ties.map((tie) => {
            const key = tieKey(tie)
            const picked = picks[key]
            const phoneSelected = picked === 'phone'
            const desktopSelected = picked === 'desktop'
            return (
              <div key={key} style={styles.tieRow}>
                <div style={styles.tieHead}>
                  {SECTION_LABELS[tie.section] ?? tie.section} / slot {tie.slot}
                  {tie.itemContext ? ` / "${formatValue(tie.itemContext)}"` : ''}
                  {' '}- {tie.field}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{
                      ...styles.sideBtn,
                      borderColor: phoneSelected ? colors.primary : colors.dialogBorder,
                      backgroundColor: phoneSelected ? colors.primary : 'transparent',
                      color: phoneSelected ? colors.dialogBg : colors.textPrimary,
                    }}
                    onClick={() => setPicks((p) => ({ ...p, [key]: 'phone' }))}
                  >
                    PHONE: {formatValue(tie.phoneValue)}
                  </button>
                  <button
                    style={{
                      ...styles.sideBtn,
                      borderColor: desktopSelected ? colors.primary : colors.dialogBorder,
                      backgroundColor: desktopSelected ? colors.primary : 'transparent',
                      color: desktopSelected ? colors.dialogBg : colors.textPrimary,
                    }}
                    onClick={() => setPicks((p) => ({ ...p, [key]: 'desktop' }))}
                  >
                    DESKTOP: {formatValue(tie.desktopValue)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div style={styles.timer}>auto-cancel in {secondsLeft}s</div>
        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={respondCancel}>
            CANCEL SYNC
          </button>
          <button
            style={{ ...styles.applyBtn, ...(allPicked ? {} : styles.applyBtnDisabled) }}
            onClick={onApply}
            disabled={!allPicked}
          >
            APPLY PICKS
          </button>
        </div>
      </div>
    </div>
  )
}
