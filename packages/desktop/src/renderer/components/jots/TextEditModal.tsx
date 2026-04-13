import React, { useState, useEffect, useRef, useMemo } from 'react'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'

interface TextEditModalProps {
  visible: boolean
  jotId: number
  text: string
  onSave: (text: string) => void
  onCancel: () => void
}

export default function TextEditModal({ visible, jotId, text, onSave, onCancel }: TextEditModalProps) {
  const { colors, confirmDialog: d } = useTheme()
  const [value, setValue] = useState(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (visible) {
      setValue(text)
      const timer = setTimeout(() => textareaRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [visible, text])

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
    },
    box: {
      backgroundColor: colors.dialogBg,
      border: `1px solid ${colors.dialogBorder}`,
      borderRadius: d.boxRadius,
      padding: 24,
      width: 480,
      maxHeight: '70vh',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 12,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: 14,
      letterSpacing: 14 * 0.1,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    hint: {
      ...cssFont('DMSans-Regular'),
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    textarea: {
      width: '100%',
      boxSizing: 'border-box' as const,
      flex: 1,
      minHeight: 200,
      maxHeight: '50vh',
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 12,
      color: colors.textPrimary,
      ...cssFont('DMMono-Regular'),
      fontSize: 13,
      lineHeight: '1.5',
      resize: 'vertical' as const,
    },
    btnRow: {
      display: 'flex',
      gap: d.btnGap,
    },
    cancelBtn: {
      flex: 1,
      padding: `${d.btnPaddingV}px 0`,
      borderRadius: d.btnRadius,
      backgroundColor: d.cancelBg,
      border: `1px solid ${d.cancelBorder}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtn: {
      flex: 1,
      padding: `${d.btnPaddingV}px 0`,
      borderRadius: d.btnRadius,
      backgroundColor: colors.background,
      border: `1px solid ${colors.primary}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
  }), [colors, d])

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <span style={styles.title}>JOT {jotId} TEXT</span>
        <span style={styles.hint}>You can modify the Jot text before saving. This does not change the Jot text on the phone.</span>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
        />
        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            <span style={styles.btnText}>CANCEL</span>
          </button>
          <button style={styles.saveBtn} onClick={() => onSave(value)}>
            <span style={styles.btnText}>SAVE</span>
          </button>
        </div>
      </div>
    </div>
  )
}
