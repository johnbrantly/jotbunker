import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cssFont } from '../styles/tokens'
import { useTheme } from '../hooks/useTheme'

interface SaveToTagDialogProps {
  visible: boolean
  tagLabel: string
  sourceLabel: string
  showMediaToggle: boolean
  defaultFilename: string
  onSave: (filename: string, includeMedia: boolean) => void
  onCancel: () => void
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim()
}

export default function SaveToTagDialog({
  visible,
  tagLabel,
  sourceLabel,
  showMediaToggle,
  defaultFilename,
  onSave,
  onCancel,
}: SaveToTagDialogProps) {
  const { colors, confirmDialog: dialog, settingsPanel: sp } = useTheme()
  const [filename, setFilename] = useState(defaultFilename)
  const [includeMedia, setIncludeMedia] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      setFilename(defaultFilename)
      setIncludeMedia(true)
      const timer = setTimeout(() => inputRef.current?.select(), 50)
      return () => clearTimeout(timer)
    }
  }, [visible, defaultFilename])

  const sanitized = sanitizeFilename(filename)
  const isValid = sanitized.length > 0

  const handleSave = () => {
    if (isValid) {
      onSave(sanitized, showMediaToggle ? includeMedia : false)
    }
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
    fieldValue: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      color: colors.primary,
      display: 'block',
      marginBottom: 12,
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
    checkRow: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    },
    checkbox: {
      width: 16,
      height: 16,
      accentColor: colors.primary,
    },
    checkLabel: {
      ...cssFont('DMSans-Bold'),
      fontSize: 11,
      color: colors.textPrimary,
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
    saveBtn: {
      flex: 1,
      paddingTop: dialog.btnPaddingV,
      paddingBottom: dialog.btnPaddingV,
      borderRadius: dialog.btnRadius,
      backgroundColor: sp.saveBg,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: sp.saveBorder,
      cursor: isValid ? 'pointer' : 'not-allowed',
      opacity: isValid ? 1 : 0.4,
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
  }), [colors, dialog, sp, isValid])

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <span style={styles.title}>SAVE TO TAG</span>

        <div>
          <span style={styles.fieldLabel}>TAG</span>
          <span style={styles.fieldValue}>{tagLabel.toUpperCase()}</span>

          <span style={styles.fieldLabel}>SOURCE</span>
          <span style={styles.fieldValue}>{sourceLabel}</span>

          <span style={styles.fieldLabel}>FILENAME</span>
          <input
            ref={inputRef}
            style={styles.input}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onCancel()
            }}
            placeholder="filename"
          />
        </div>

        {showMediaToggle && (
          <div style={styles.checkRow} onClick={() => setIncludeMedia(!includeMedia)}>
            <input
              type="checkbox"
              checked={includeMedia}
              onChange={() => setIncludeMedia(!includeMedia)}
              style={styles.checkbox}
            />
            <span style={styles.checkLabel}>Include media files</span>
          </div>
        )}

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            <span style={styles.btnText}>CANCEL</span>
          </button>
          <button style={styles.saveBtn} onClick={handleSave} disabled={!isValid}>
            <span style={styles.btnText}>SAVE</span>
          </button>
        </div>
      </div>
    </div>
  )
}
