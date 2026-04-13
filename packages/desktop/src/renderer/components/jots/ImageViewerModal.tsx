import React, { useMemo } from 'react'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'

interface ImageViewerModalProps {
  visible: boolean
  src: string
  title: string
  onClose: () => void
}

export default function ImageViewerModal({ visible, src, title, onClose }: ImageViewerModalProps) {
  const { colors, confirmDialog: d } = useTheme()

  const styles = useMemo(() => ({
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: d.overlayBg,
      backdropFilter: `blur(${d.blurAmount}px)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      flexDirection: 'column' as const,
      gap: 12,
    },
    title: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      letterSpacing: 11 * 0.1,
      color: colors.textSecondary,
    },
    image: {
      maxWidth: '90vw',
      maxHeight: '80vh',
      objectFit: 'contain' as const,
      borderRadius: 6,
      border: `1px solid ${colors.border}`,
    },
    closeBtn: {
      padding: '8px 24px',
      borderRadius: 6,
      backgroundColor: colors.dialogBg,
      border: `1px solid ${colors.border}`,
      cursor: 'pointer',
      ...cssFont('DMSans-Bold'),
      fontSize: 10,
      letterSpacing: 10 * 0.1,
      color: colors.primary,
    } as React.CSSProperties,
  }), [colors, d])

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <span style={styles.title}>{title}</span>
      <img src={src} style={styles.image} />
      <button style={styles.closeBtn} onClick={onClose}>CLOSE</button>
    </div>
  )
}
