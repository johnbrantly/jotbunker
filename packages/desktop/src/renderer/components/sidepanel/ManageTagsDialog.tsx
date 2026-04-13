import React, { useState, useMemo } from 'react'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'
import { useSettingsStore } from '../../stores/settingsStore'
import { QUICKSAVE_TAG_ID, type Tag } from '../../stores/tagStore'

interface ManageTagsDialogProps {
  visible: boolean
  tags: Tag[]
  onApply: (changes: { favorites: string[]; deletes: string[] }) => void
  onCancel: () => void
}

export default function ManageTagsDialog({
  visible,
  tags,
  onApply,
  onCancel,
}: ManageTagsDialogProps) {
  const { colors, confirmDialog: d } = useTheme()
  const tagFontSize = useSettingsStore((s) => s.tagFontSize)

  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set())
  const [deleteSet, setDeleteSet] = useState<Set<string>>(new Set())

  // Reset internal state whenever dialog opens
  const [prevVisible, setPrevVisible] = useState(false)
  if (visible && !prevVisible) {
    setFavoriteSet(new Set(tags.filter((t) => t.isFavorite).map((t) => t.id)))
    setDeleteSet(new Set())
  }
  if (visible !== prevVisible) setPrevVisible(visible)

  const sorted = useMemo(
    () => [...tags].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
    [tags],
  )

  const toggleFav = (id: string) => {
    setFavoriteSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDel = (id: string) => {
    setDeleteSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleApply = () => {
    // Compute which tags had their favorite status toggled
    const favToggled: string[] = []
    for (const tag of tags) {
      const wasFav = tag.isFavorite
      const nowFav = favoriteSet.has(tag.id)
      if (wasFav !== nowFav) favToggled.push(tag.id)
    }
    onApply({ favorites: favToggled, deletes: Array.from(deleteSet) })
  }

  const deleteCount = deleteSet.size

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
      width: 260,
      maxHeight: '70vh',
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
    list: {
      flex: 1,
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 6,
      paddingRight: 6,
      borderRadius: 4,
    },
    label: {
      ...cssFont('DMSans-Bold'),
      fontSize: tagFontSize,
      letterSpacing: tagFontSize * 0.06,
      flex: 1,
      minWidth: 0,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
    },
    heartBtn: {
      width: 20,
      height: 20,
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      fontSize: 13,
      flexShrink: 0,
    },
    delBtn: {
      width: 20,
      height: 20,
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      fontSize: 13,
      flexShrink: 0,
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
      cursor: 'pointer',
    },
    cancelText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
      color: colors.primary,
    },
    applyBtn: {
      flex: 1,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      borderRadius: d.btnRadius,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    applyText: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.btnFontSize,
      letterSpacing: d.btnFontSize * d.btnLetterSpacing,
    },
  }), [colors, d])

  if (!visible) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <span style={styles.title}>MANAGE TAGS</span>

        <div className="list-scroll" style={styles.list}>
          {sorted.map((tag) => {
            const isQuicksave = tag.id === QUICKSAVE_TAG_ID
            const isFav = favoriteSet.has(tag.id)
            const isDel = deleteSet.has(tag.id)
            return (
              <div
                key={tag.id}
                style={{
                  ...styles.row,
                  backgroundColor: isDel ? 'rgba(255,59,48,0.08)' : 'transparent',
                }}
              >
                <button
                  style={{ ...styles.heartBtn, cursor: isQuicksave ? 'default' : 'pointer' }}
                  onClick={() => !isQuicksave && toggleFav(tag.id)}
                  title={isQuicksave ? 'Always favorited' : isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span style={{ color: isFav ? colors.primary : colors.textSecondary, opacity: isFav ? 1 : 0.4 }}>
                    {isFav ? '\u2665' : '\u2661'}
                  </span>
                </button>

                <span
                  style={{
                    ...styles.label,
                    color: isDel ? colors.destructive : colors.textPrimary,
                    textDecoration: isDel ? 'line-through' : 'none',
                  }}
                >
                  {tag.label}
                </span>

                {!isQuicksave && (
                  <button
                    style={styles.delBtn}
                    onClick={() => toggleDel(tag.id)}
                    title={isDel ? 'Unmark for deletion' : 'Mark for deletion'}
                  >
                    <span style={{ color: colors.destructive, opacity: isDel ? 1 : 0.3 }}>
                      {'\u2715'}
                    </span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={styles.btnRow}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            <span style={styles.cancelText}>CANCEL</span>
          </button>
          <button
            style={{
              ...styles.applyBtn,
              backgroundColor: deleteCount > 0 ? d.confirmBg : d.cancelBg,
              borderColor: deleteCount > 0 ? d.confirmBorder : d.cancelBorder,
            }}
            onClick={handleApply}
          >
            <span
              style={{
                ...styles.applyText,
                color: deleteCount > 0 ? colors.destructive : colors.primary,
              }}
            >
              {deleteCount > 0 ? `APPLY (${deleteCount} deletion${deleteCount > 1 ? 's' : ''})` : 'APPLY'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
