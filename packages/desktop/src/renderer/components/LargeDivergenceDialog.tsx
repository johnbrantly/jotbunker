import React, { useEffect, useRef, useState } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'
import type { DivergenceCounts, DivergenceChoice } from '../sync/useSyncSetup'

// Fresh-device 80% gate. Shown when desktopPlatform.handleStateSync detects that
// one side is missing ≥80% of the ancestor's live rows (fresh install / wiped
// device). The user must pick a winning side or cancel.
//
// Auto-cancel: matches SyncReportDialog's 60 s countdown. Critical for the
// phone-initiated sync flow — without it, a phone Sync that trips this gate
// would hang forever waiting on a desktop click. On timeout we resolve as
// 'cancel', which makes desktopPlatform send `sync_cancel` to the phone and
// leaves both sides' data untouched.
const TIMEOUT_SECONDS = 60

interface Props {
  counts: DivergenceCounts
  onRespond: (choice: DivergenceChoice) => void
}

export default function LargeDivergenceDialog({ counts, onRespond }: Props) {
  const { colors, confirmDialog: d } = useTheme()
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mounts only while the dialog is open (App renders it conditionally), so a
  // one-shot timer on mount is correct; cleared on unmount / pick.
  useEffect(() => {
    setSecondsLeft(TIMEOUT_SECONDS)
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          onRespond('cancel')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
  }, [])

  const computerWouldLose = counts.case3
  const phoneWouldLose = counts.case2
  const message = computerWouldLose >= phoneWouldLose
    ? `The phone is missing ${computerWouldLose} of ${counts.ancestorLive} items last seen at sync. This usually means a fresh install or wiped phone.`
    : `The computer is missing ${phoneWouldLose} of ${counts.ancestorLive} items last seen at sync. This usually means a fresh install or wiped computer.`

  const primaryBtn: React.CSSProperties = {
    width: '100%', paddingTop: d.btnPaddingV, paddingBottom: d.btnPaddingV, borderRadius: d.btnRadius,
    backgroundColor: colors.primary, borderWidth: 0, cursor: 'pointer', ...cssFont('DMSans-Bold'),
    fontSize: d.btnFontSize, color: colors.dialogBg,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: d.overlayBg, backdropFilter: `blur(${d.blurAmount}px)`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: colors.dialogBg, borderWidth: 1, borderStyle: 'solid', borderColor: colors.dialogBorder, borderRadius: d.boxRadius, paddingTop: d.boxPaddingV, paddingBottom: d.boxPaddingV, paddingLeft: d.boxPaddingH, paddingRight: d.boxPaddingH, width: 440, display: 'flex', flexDirection: 'column', gap: d.boxGap }}>
        <span style={{ ...cssFont('DMSans-Black'), fontSize: d.titleFontSize, color: colors.textPrimary, letterSpacing: d.titleFontSize * d.titleLetterSpacing, textAlign: 'center' }}>LARGE CHANGE DETECTED</span>
        <span style={{ ...cssFont('DMSans-Regular'), fontSize: 13, color: colors.textPrimary, lineHeight: 1.45, textAlign: 'left' }}>{message}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: d.btnGap }}>
          <button style={primaryBtn} onClick={() => onRespond('computer')}>USE COMPUTER DATA</button>
          <button style={primaryBtn} onClick={() => onRespond('phone')}>USE PHONE DATA</button>
          <button style={{ width: '100%', paddingTop: d.btnPaddingV, paddingBottom: d.btnPaddingV, borderRadius: d.btnRadius, backgroundColor: d.cancelBg, borderWidth: 1, borderStyle: 'solid', borderColor: d.cancelBorder, cursor: 'pointer', ...cssFont('DMSans-Bold'), fontSize: d.btnFontSize, color: colors.textPrimary }} onClick={() => onRespond('cancel')}>CANCEL SYNC</button>
        </div>
        <span style={{ ...cssFont('DMMono-Regular'), fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>auto-cancel in {secondsLeft}s</span>
      </div>
    </div>
  )
}
