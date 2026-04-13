import React, { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { Category } from '@jotbunker/shared'
import { MAX_CATEGORY_LABEL_LENGTH } from '@jotbunker/shared'
import { cssFont } from '../../styles/tokens'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  categories: Category[]
  activeSlot: number
  onSelect: (slot: number) => void
  getUncheckedCount: (slot: number) => number
  getHasContent?: (slot: number) => boolean
  highlightedSlot?: number | null
  disableDropForSlot?: number
  onRename?: (slot: number, newLabel: string) => void
}

function labelFontSize(base: number, len: number): number {
  if (len <= 6) return base
  return Math.round(base * 0.9)
}

function DroppablePill({
  cat,
  slot,
  isActive,
  isHighlighted,
  disableDrop,
  hasContent,
  styles,
  onSelect,
  isEditing,
  onSetEditing,
  onRename,
}: {
  cat: Category
  slot: number
  isActive: boolean
  isHighlighted: boolean
  disableDrop: boolean
  hasContent?: boolean
  styles: any
  onSelect: (slot: number) => void
  isEditing: boolean
  onSetEditing: (slot: number | null) => void
  onRename?: (slot: number, newLabel: string) => void
}) {
  const { setNodeRef } = useDroppable({
    id: 'pill-' + slot,
    disabled: disableDrop,
  })

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onRename) return
    e.preventDefault()
    onSetEditing(slot)
  }

  const commitEdit = (value: string) => {
    const trimmed = value.toUpperCase().trim()
    if (trimmed && trimmed !== cat.label) {
      onRename?.(slot, trimmed)
    }
    onSetEditing(null)
  }

  return (
    <button ref={setNodeRef} style={styles.btn} onClick={() => onSelect(slot)} onContextMenu={handleContextMenu}>
      <div
        style={{
          ...styles.pill,
          ...(isActive ? styles.pillActive : {}),
          ...(!isActive && isHighlighted ? styles.pillHighlighted : {}),
        }}
      >
        <div style={styles.pillInner}>
          {isEditing ? (
            <input
              ref={(el) => {
                if (el) {
                  el.focus()
                  el.select()
                }
              }}
              defaultValue={cat.label}
              maxLength={MAX_CATEGORY_LABEL_LENGTH}
              style={{
                ...styles.label,
                ...(isActive ? styles.labelActive : {}),
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center' as const,
                width: '100%',
                padding: 0,
                margin: 0,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                } else if (e.key === 'Escape') {
                  e.currentTarget.value = cat.label
                  e.currentTarget.blur()
                }
              }}
              onBlur={(e) => commitEdit(e.currentTarget.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              style={{
                ...styles.label,
                fontSize: labelFontSize(styles.label.fontSize, cat.label.length),
                ...(isActive ? styles.labelActive : {}),
              }}
            >
              {cat.label}
            </span>
          )}
          {hasContent && (
            <span style={{ ...styles.checkmark, color: isActive ? styles.labelActive.color : styles.label.color }}>✓</span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function CategoryStrip({
  categories,
  activeSlot,
  onSelect,
  getUncheckedCount,
  getHasContent,
  highlightedSlot,
  disableDropForSlot,
  onRename,
}: Props) {
  const { colors, categoryStrip: d } = useTheme()
  const [editingSlot, setEditingSlot] = useState<number | null>(null)

  const styles = useMemo(() => ({
    container: {
      paddingTop: d.paddingVertical + 8,
      paddingBottom: d.paddingVertical + 8,
      flexShrink: 0,
    },
    inner: {
      display: 'flex',
      flexDirection: 'row' as const,
      paddingLeft: d.innerPaddingHorizontal,
      paddingRight: d.innerPaddingHorizontal,
    },
    btn: {
      flex: '1 1 0',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'stretch' as const,
      gap: d.btnGap,
      paddingTop: d.btnPaddingV,
      paddingBottom: d.btnPaddingV,
      paddingLeft: d.btnPaddingH,
      paddingRight: d.btnPaddingH,
      margin: 0,
      border: 'none',
      background: 'none',
      cursor: 'pointer',
    },
    pill: {
      minWidth: 0,
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingTop: d.pillPaddingV,
      paddingBottom: d.pillPaddingV,
      paddingLeft: d.pillPaddingH,
      paddingRight: d.pillPaddingH,
      borderRadius: d.pillRadius,
      borderWidth: d.pillBorderWidth,
      borderStyle: 'solid' as const,
      borderColor: d.pillBorderColor,
      overflow: 'hidden' as const,
    },
    pillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pillHighlighted: {
      borderColor: colors.primary,
    },
    pillInner: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 3,
      minWidth: 0,
    },
    checkmark: {
      ...cssFont('DMSans-Bold'),
      fontSize: 8,
    },
    label: {
      ...cssFont('DMSans-Bold'),
      fontSize: d.labelFontSize,
      lineHeight: `${d.labelFontSize}px`,
      letterSpacing: d.labelFontSize * d.labelLetterSpacing,
      color: d.labelInactiveColor,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
    },
    labelActive: {
      color: colors.navActiveText,
    },
    count: {
      ...cssFont('DMMono-Regular'),
      fontSize: d.countFontSize,
      color: d.countColor,
      marginTop: d.countMarginTop,
    },
  }), [colors, d])

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        {categories.map((cat, slot) => {
          const isActive = slot === activeSlot
          return (
            <DroppablePill
              key={slot}
              cat={cat}
              slot={slot}
              isActive={isActive}
              isHighlighted={highlightedSlot === slot}
              disableDrop={slot === disableDropForSlot}
              hasContent={getHasContent ? getHasContent(slot) : undefined}
              styles={styles}
              onSelect={onSelect}
              isEditing={editingSlot === slot}
              onSetEditing={setEditingSlot}
              onRename={onRename}
            />
          )
        })}
      </div>
    </div>
  )
}
