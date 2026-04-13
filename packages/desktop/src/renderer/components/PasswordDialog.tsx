import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'

interface PasswordDialogProps {
  visible: boolean
  mode: 'create' | 'unlock'
  title: string
  onSubmit: (password: string) => void
  onCancel: () => void
}

export default function PasswordDialog({
  visible,
  mode,
  title,
  onSubmit,
  onCancel,
}: PasswordDialogProps) {
  const { colors, confirmDialog: dialog, settingsPanel: sp } = useTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      setPassword('')
      setConfirm('')
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const mismatch = mode === 'create' && confirm.length > 0 && password !== confirm
  const canSubmit = mode === 'unlock'
    ? password.length > 0
    : password.length > 0 && password === confirm

  const handleSubmit = () => {
    if (canSubmit) onSubmit(password)
  }

  const styles = useMemo(() => ({
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      backgroundColor: dialog.overlayBg,
      backdropFilter: `blur(${dialog.blurAmount}px)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
    },
    box: {
      backgroundColor: colors.dialogBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: colors.dialogBorder,
      borderRadius: dialog.boxRadius,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 28,
      paddingRight: 28,
      width: 340,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 16,
    },
    title: {
      ...cssFont('DMSans-Black'),
      fontSize: dialog.titleFontSize,
      color: colors.textPrimary,
      letterSpacing: dialog.titleFontSize * dialog.titleLetterSpacing,
      textAlign: 'center' as const,
    },
    fieldLabel: {
      ...cssFont('DMMono-Bold'),
      fontSize: 9,
      letterSpacing: 9 * 0.08,
      color: colors.textSecondary,
      marginBottom: 4,
      display: 'block',
    },
    input: {
      width: '100%',
      boxSizing: 'border-box' as const,
      backgroundColor: sp.inputBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.inputBorder,
      borderRadius: sp.inputRadius,
      paddingTop: sp.inputPaddingV,
      paddingBottom: sp.inputPaddingV,
      paddingLeft: sp.inputPaddingH,
      paddingRight: sp.inputPaddingH,
      color: colors.textPrimary,
      ...cssFont('DMSans-Bold'),
      fontSize: sp.inputFontSize,
    },
    mismatch: {
      ...cssFont('DMSans-Medium'),
      fontSize: 9,
      color: colors.destructive,
      marginTop: 2,
      display: 'block',
    },
    btnRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: dialog.btnGap,
    },
    cancelBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: dialog.cancelBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: dialog.cancelBorder,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: sp.saveBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.saveBorder,
      cursor: canSubmit ? 'pointer' : 'not-allowed',
      opacity: canSubmit ? 1 : 0.4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      ...cssFont('DMSans-Bold'),
      fontSize: dialog.btnFontSize,
      letterSpacing: dialog.btnFontSize * dialog.btnLetterSpacing,
      color: colors.primary,
    },
  }), [colors, dialog, sp, canSubmit])

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <span style={styles.title}>{title}</span>

        <div>
          <span style={styles.fieldLabel}>PASSWORD</span>
          <input
            ref={inputRef}
            type="password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="Enter password"
          />
        </div>

        {mode === 'create' && (
          <div>
            <span style={styles.fieldLabel}>CONFIRM PASSWORD</span>
            <input
              type="password"
              style={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
                if (e.key === 'Escape') onCancel()
              }}
              placeholder="Confirm password"
            />
            {mismatch && <span style={styles.mismatch}>Passwords do not match</span>}
          </div>
        )}

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            <span style={styles.btnText}>CANCEL</span>
          </button>
          <button style={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
            <span style={styles.btnText}>{mode === 'create' ? 'ENCRYPT' : 'DECRYPT'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
