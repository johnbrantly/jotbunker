import React, { useMemo, useState } from 'react'
import { useScratchpadStore } from '../../stores/scratchpadStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTheme } from '../../hooks/useTheme'
import { header, typeArea as d, cssFont } from '../../styles/tokens'
import CategoryStrip from '../lists/CategoryStrip'
import StripTray from '../StripTray'
import HeaderTray from '../HeaderTray'
import DotMenu from '../DotMenu'
import { useTagStore } from '../../stores/tagStore'
import ConfirmDialog from '../ConfirmDialog'
import navScratchpadIcon from '../../assets/nav/nav-scratchpad.png'

export default function ScratchpadTab() {
  const { colors } = useTheme()
  const scratchpadFontSize = useSettingsStore((s) => s.scratchpadFontSize)
  const [showConfirm, setShowConfirm] = useState(false)
  const selectedTag = useTagStore((s) => s.tags.find((t) => t.id === s.selectedTagId))
  const activeSlot = useScratchpadStore((s) => s.activeSlot)
  const contents = useScratchpadStore((s) => s.contents)
  const categories = useScratchpadStore((s) => s.categories)
  const setContent = useScratchpadStore((s) => s.setContent)
  const setActiveSlot = useScratchpadStore((s) => s.setActiveSlot)

  const content = contents[activeSlot]?.content || ''
  const activeLabel = categories[activeSlot]?.label || ''

  const getLineCount = (slot: number) => {
    const text = contents[slot]?.content || ''
    if (!text.trim()) return 0
    return text.split('\n').filter((line) => line.trim().length > 0).length
  }

  const handleClear = () => {
    setContent('')
    setShowConfirm(false)
  }

  const styles = useMemo(() => ({
    container: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.background,
    },
    headerArea: {
      paddingTop: header.padding.top,
      paddingBottom: header.padding.top,
      paddingLeft: header.padding.horizontal,
      paddingRight: header.padding.horizontal,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIcon: {
      width: 52,
      height: 52,
      marginRight: 6,
      opacity: 0.5,
    },
    headerTitle: {
      ...cssFont('DMSans-Black'),
      fontSize: header.headerLabelSize,
      letterSpacing: header.headerLabelSize * header.headerLabelLetterSpacing,
      color: colors.textSecondary,
    },
    headerLabel: {
      ...cssFont('DMMono-Light'),
      fontSize: header.headerNumberSize,
      color: colors.primary,
      lineHeight: `${header.headerNumberSize * header.headerNumberLineHeight}px`,
    },
    divider: {
      height: header.dividerHeight,
      backgroundColor: colors.border,
      marginTop: header.dividerMarginTop,
      marginLeft: header.padding.horizontal,
      marginRight: header.padding.horizontal,
    },
    textarea: {
      flex: 1,
      width: '100%',
      backgroundColor: 'transparent',
      color: colors.textPrimary,
      ...cssFont('DMSans-Regular'),
      fontSize: scratchpadFontSize,
      lineHeight: `${scratchpadFontSize * d.lineHeight}px`,
      padding: `${d.paddingV}px ${d.paddingH}px`,
      border: 'none',
      outline: 'none',
      resize: 'none' as const,
      boxSizing: 'border-box' as const,
    },
  }), [colors, scratchpadFontSize])

  return (
    <div style={styles.container}>
      {/* Header */}
      <HeaderTray>
        <div style={styles.headerArea}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <img src={navScratchpadIcon} style={styles.headerIcon} />
            <div>
              <span style={styles.headerTitle}>SCRATCHPAD</span>
              <div style={styles.headerLabel}>{activeLabel}</div>
            </div>
          </div>
          <DotMenu items={[
            ...(selectedTag
              ? [{ label: `SAVE → ${selectedTag.label}`, onClick: () => window.dispatchEvent(new Event('save-to-tag')) }]
              : []),
            { label: 'CLEAR THIS SCRATCHPAD', onClick: () => setShowConfirm(true) },
          ]} />
        </div>
      </HeaderTray>

      <textarea
        className="list-scroll"
        style={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="jot something down..."
        spellCheck={false}
      />
      <StripTray>
        <CategoryStrip
          categories={categories}
          activeSlot={activeSlot}
          onSelect={setActiveSlot}
          getUncheckedCount={getLineCount}
          onRename={(slot, newLabel) => {
            const cats = [...useScratchpadStore.getState().categories]
            cats[slot] = { ...cats[slot], label: newLabel, updatedAt: Date.now() }
            useScratchpadStore.getState().updateCategories(cats)
          }}
        />
      </StripTray>

      <ConfirmDialog
        visible={showConfirm}
        title="Clear?"
        message="This will erase all content in this category. This can't be undone."
        confirmLabel="CLEAR"
        onConfirm={handleClear}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
