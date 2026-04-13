import React, { useMemo } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'

type Variant = 'destructive' | 'success'

interface Props {
  visible: boolean
  title: string
  message: string
  variant?: Variant
  confirmLabel?: string
  showCancel?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  variant = 'destructive',
  confirmLabel = 'CLEAR',
  showCancel = true,
  onConfirm,
  onCancel,
}: Props) {
  const { colors, confirmDialog: d } = useTheme()

  const isSuccess = variant === 'success'

  const iconColor = isSuccess ? colors.success : colors.destructive
  const iconBg = isSuccess ? d.successIconBg : d.iconBg
  const iconBorderColor = isSuccess ? d.successIconBorderColor : d.iconBorderColor
  const btnBg = isSuccess ? d.successConfirmBg : d.confirmBg
  const btnBorder = isSuccess ? d.successConfirmBorder : d.confirmBorder

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
      width: d.boxWidth,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: d.boxGap,
    },
    icon: {
      width: d.iconSize,
      height: d.iconSize,
      borderRadius: d.iconSize / 2,
      backgroundColor: iconBg,
      borderWidth: d.iconBorderWidth,
      borderStyle: 'solid' as const,
      borderColor: iconBorderColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: d.iconFontSize,
      color: iconColor,
    },
    textContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: d.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: d.titleFontSize * d.titleLetterSpacing,
    },
    msg: {
      fontSize: d.msgFontSize,
      color: d.msgColor,
      marginTop: d.msgMarginTop,
      lineHeight: `${d.msgFontSize * d.msgLineHeight}px`,
      textAlign: 'center' as const,
      wordBreak: 'break-word' as const,
      maxWidth: '100%',
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: d.btnGap,
      width: '100%',
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
    },
    cancelText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    confirmBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      backgroundColor: btnBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: btnBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: iconColor,
    },
  }), [colors, d, iconColor, iconBg, iconBorderColor, btnBg, btnBorder])

  if (!visible) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <div style={styles.icon}>
          <span style={styles.iconText}>{isSuccess ? '\u2713' : '\u2715'}</span>
        </div>
        <div style={styles.textContainer}>
          <span style={styles.title}>{title}</span>
          <span style={styles.msg}>{message.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}</span>
        </div>
        <div style={styles.btnRow}>
          {showCancel && (
            <button style={styles.cancelBtn} onClick={onCancel}>
              <span style={styles.cancelText}>CANCEL</span>
            </button>
          )}
          <button style={styles.confirmBtn} onClick={onConfirm}>
            <span style={styles.confirmText}>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
