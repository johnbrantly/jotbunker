import React, { useMemo } from 'react'
import { cssFont } from '../styles/tokens'
import { APP_VERSION } from '@jotbunker/shared'
import { useTheme } from '../hooks/useTheme'
import jotsteadIcon from '../assets/jotbunker-icon.png'

interface Props {
  onClose: () => void
}

export default function AboutModal({ onClose }: Props) {
  const { colors, confirmDialog: dialog } = useTheme()

  const styles = useMemo(() => ({
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: dialog.overlayBg,
      backdropFilter: `blur(${dialog.blurAmount}px)`,
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
      borderRadius: dialog.boxRadius,
      paddingTop: 40,
      paddingBottom: 32,
      paddingLeft: 48,
      paddingRight: 48,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 16,
    },
    icon: {
      width: 72,
      height: 72,
      borderRadius: 14,
    },
    version: {
      ...cssFont('DMSans-Bold'),
      fontSize: 14,
      letterSpacing: 1.5,
      color: colors.textPrimary,
      opacity: 0.6,
    },
    closeBtn: {
      marginTop: 8,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      paddingLeft: 48,
      paddingRight: 48,
      borderRadius: dialog.btnRadius,
      backgroundColor: dialog.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: dialog.cancelBorder,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    closeText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.primary,
    },
  }), [colors, dialog])

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <img src={jotsteadIcon} alt="Jotbunker" style={styles.icon} />
        <span style={styles.version}>Jotbunker {APP_VERSION}</span>
        <button style={styles.closeBtn} onClick={onClose}>
          <span style={styles.closeText}>CLOSE</span>
        </button>
      </div>
    </div>
  )
}
