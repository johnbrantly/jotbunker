import React, { useState } from 'react'
import { cssFont } from '../../styles/tokens'
import InfoIcon from './InfoIcon'
import ManageTagsDialog from './ManageTagsDialog'
import { useTagStore } from '../../stores/tagStore'
import { useScratchpadStore } from '../../stores/scratchpadStore'
import { useListsStore } from '../../stores/listsStore'
import { useLockedListsStore } from '../../stores/lockedListsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { TabKey } from '../../App'
import navTag from '../../assets/nav/nav-tag.png'

interface TagSectionProps {
  activeTab: TabKey
  styles: {
    sectionHeader: React.CSSProperties
    divider: React.CSSProperties
  }
  colors: {
    primary: string
    textPrimary: string
    textSecondary: string
    border: string
    destructive: string
    stripBg: string
  }
  settingsPanel: {
    pillBg: string
    pillBorder: string
    pillActiveBg: string
    pillActiveBorder: string
    pillPaddingV: number
    pillPaddingH: number
    pillRadius: number
    inputBg: string
    inputBorder: string
    inputRadius: number
    inputPaddingV: number
    inputPaddingH: number
    inputFontSize: number
  }
  onSaveToTag: () => void
}

export default function TagSection({
  activeTab,
  styles,
  colors,
  settingsPanel: sp,
  onSaveToTag,
}: TagSectionProps) {
  const tags = useTagStore((s) => s.tags)
  const selectedTagId = useTagStore((s) => s.selectedTagId)
  const addTag = useTagStore((s) => s.addTag)
  const removeTags = useTagStore((s) => s.removeTags)
  const toggleFavorite = useTagStore((s) => s.toggleFavorite)
  const selectTag = useTagStore((s) => s.selectTag)
  const selectedTag = useTagStore((s) => s.tags.find((t) => t.id === s.selectedTagId))
  const tagFontSize = useSettingsStore((s) => s.tagFontSize)

  const scratchpadCatLabel = useScratchpadStore((s) =>
    s.categories[s.activeSlot]?.label || '',
  )
  const listsCatLabel = useListsStore((s) =>
    s.categories[s.activeSlot]?.label || '',
  )
  const lockedListsCatLabel = useLockedListsStore((s) =>
    s.categories[s.activeSlot]?.label || '',
  )
  const [addValue, setAddValue] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [manageOpen, setManageOpen] = useState(false)

  const filteredTags = (searchValue
    ? tags.filter((t) => t.label.toLowerCase().includes(searchValue.toLowerCase()))
    : [...tags]
  ).sort((a, b) => {
    const aFav = a.isFavorite ?? false
    const bFav = b.isFavorite ?? false
    if (aFav !== bFav) return aFav ? -1 : 1
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
  })

  const canSave =
    activeTab === 'scratchpad' || activeTab === 'lists' || activeTab === 'lockedLists'

  const sourceLabel =
    activeTab === 'scratchpad'
      ? 'SCRATCHPAD'
      : activeTab === 'lists'
        ? 'LIST'
        : activeTab === 'lockedLists'
          ? 'LOCKED LIST'
          : ''

  const categoryLabel =
    activeTab === 'scratchpad'
      ? scratchpadCatLabel.toUpperCase()
      : activeTab === 'lists'
        ? listsCatLabel.toUpperCase()
        : activeTab === 'lockedLists'
          ? lockedListsCatLabel.toUpperCase()
          : ''

  const handleAdd = () => {
    const label = addValue.trim()
    if (label) {
      addTag(label)
      setAddValue('')
    }
  }

  const inputRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  }

  const inputField: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    backgroundColor: sp.inputBg,
    border: `1px solid ${sp.inputBorder}`,
    borderRadius: sp.inputRadius,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    color: colors.textPrimary,
    ...cssFont('DMSans-Bold'),
    fontSize: 10,
    letterSpacing: 10 * 0.08,
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  const btnBase: React.CSSProperties = {
    flexShrink: 0,
    width: 46,
    padding: '4px 0',
    borderRadius: sp.inputRadius,
    textAlign: 'center',
    ...cssFont('DMSans-Bold'),
    fontSize: 9,
    letterSpacing: 9 * 0.08,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Pinned top */}
      <div style={{ flexShrink: 0 }}>
        {/* Header row — centered */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <img src={navTag} alt="Tag" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.7 }} />
          <span style={styles.sectionHeader}>TAGS</span>
          <InfoIcon
            tooltip="Each tag specifies a subfolder where your JotBunker data can be permanently saved to your computer. Base folder can be changed in Settings."
            popover="below"
            colors={colors}
          />
        </div>
        <div style={styles.divider} />

        {/* Add tag input + button */}
        <div style={{ ...inputRow, marginTop: 4 }}>
          <input
            style={inputField}
            placeholder="New tag..."
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setAddValue('')
            }}
          />
          <button
            style={{
              ...btnBase,
              border: `1px solid ${addValue.trim() ? colors.primary : colors.border}`,
              backgroundColor: addValue.trim() ? sp.pillActiveBg : 'transparent',
              color: addValue.trim() ? colors.primary : colors.textSecondary,
              cursor: addValue.trim() ? 'pointer' : 'default',
              opacity: addValue.trim() ? 1 : 0.4,
            } as React.CSSProperties}
            onClick={handleAdd}
          >
            ADD
          </button>
        </div>

        {/* Search input */}
        {tags.length > 0 && (
          <div style={inputRow}>
            <input
              style={inputField}
              placeholder="Search tags..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button
              style={{
                ...btnBase,
                border: `1px solid ${searchValue ? colors.primary : colors.border}`,
                backgroundColor: searchValue ? sp.pillActiveBg : 'transparent',
                color: searchValue ? colors.primary : colors.textSecondary,
                cursor: searchValue ? 'pointer' : 'default',
                opacity: searchValue ? 1 : 0.4,
              } as React.CSSProperties}
              onClick={() => searchValue && setSearchValue('')}
            >
              {searchValue ? 'CLEAR' : 'SEARCH'}
            </button>
          </div>
        )}

        {/* Filter count */}
        {searchValue && (
          <span
            style={{
              ...cssFont('DMSans-Bold'),
              fontSize: 9,
              letterSpacing: 9 * 0.08,
              color: colors.textSecondary,
              marginTop: 2,
              display: 'block',
            }}
          >
            {filteredTags.length} of {tags.length} tags
          </span>
        )}

        {/* Manage button */}
        {tags.length > 0 && (
          <button
            style={{
              ...btnBase,
              width: '100%',
              marginTop: 4,
              marginBottom: 2,
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              cursor: 'pointer',
            } as React.CSSProperties}
            onClick={() => setManageOpen(true)}
          >
            MANAGE
          </button>
        )}
      </div>

      {/* Scrollable middle — click whitespace to deselect */}
      <div
        className="list-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          marginTop: 4,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTags.map((tag) => {
            const isSelected = tag.id === selectedTagId
            const isFav = tag.isFavorite ?? false
            return (
              <div
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  paddingTop: 3,
                  paddingBottom: 3,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  backgroundColor: isSelected ? sp.pillActiveBg : 'transparent',
                  border: isSelected
                    ? `1px solid ${sp.pillActiveBorder}`
                    : '1px solid transparent',
                  cursor: 'pointer',
                }}
                onClick={() => { if (!isSelected) selectTag(tag.id) }}
              >
                {isFav && (
                  <span style={{ color: colors.primary, fontSize: 10, flexShrink: 0 }}>
                    {'\u2665'}
                  </span>
                )}
                <span
                  style={{
                    ...cssFont('DMSans-Bold'),
                    fontSize: tagFontSize,
                    color: isSelected ? colors.primary : colors.textPrimary,
                    letterSpacing: tagFontSize * 0.06,
                  }}
                >
                  {tag.label}
                </span>
              </div>
            )
          })}
        </div>

        {tags.length === 0 && (
          <span
            style={{
              ...cssFont('DMSans-Regular'),
              fontSize: 10,
              color: colors.textSecondary,
            }}
          >
            Type a name above to add a tag
          </span>
        )}
      </div>

      {/* Pinned bottom */}
      {activeTab !== 'jots' && (
        <div style={{ flexShrink: 0 }}>
          <button
            style={{
              marginTop: 4,
              padding: '6px 0',
              border: `1px solid ${canSave ? colors.primary : colors.border}`,
              borderRadius: 4,
              backgroundColor: canSave ? sp.pillActiveBg : 'transparent',
              color: canSave ? colors.primary : colors.textSecondary,
              cursor: canSave ? 'pointer' : 'not-allowed',
              textAlign: 'center' as const,
              opacity: canSave ? 1 : 0.4,
              width: '100%',
            } as React.CSSProperties}
            disabled={!canSave}
            onClick={() => canSave && onSaveToTag()}
          >
            {canSave ? (
              <>
                <div
                  style={{
                    ...cssFont('DMSans-Bold'),
                    fontSize: 9,
                    letterSpacing: 9 * 0.1,
                  }}
                >
                  {`SAVE ${sourceLabel}`}
                </div>
                <div
                  style={{
                    ...cssFont('DMSans-Bold'),
                    fontSize: 9,
                    letterSpacing: 9 * 0.1,
                  }}
                >
                  {categoryLabel}
                </div>
                <div
                  style={{
                    ...cssFont('DMMono-Regular'),
                    fontSize: 8,
                    opacity: 0.7,
                  }}
                >
                  → {selectedTag?.label}
                </div>
              </>
            ) : (
              <span
                style={{
                  ...cssFont('DMSans-Bold'),
                  fontSize: 9,
                  letterSpacing: 9 * 0.1,
                }}
              >
                SELECT A TAG TO SAVE
              </span>
            )}
          </button>
        </div>
      )}

      <ManageTagsDialog
        visible={manageOpen}
        tags={tags}
        onApply={({ favorites, deletes }) => {
          if (deletes.length > 0) removeTags(deletes)
          for (const id of favorites) toggleFavorite(id)
          setManageOpen(false)
        }}
        onCancel={() => setManageOpen(false)}
      />
    </div>
  )
}
