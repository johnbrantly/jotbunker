import React, { useState, useRef, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Category } from '@jotbunker/shared'
import { useTheme } from '../../hooks/useTheme'
import { useSettingsStore } from '../../stores/settingsStore'
import CategoryStrip from './CategoryStrip'
import StripTray from '../StripTray'
import HeaderTray from '../HeaderTray'
import DotMenu from '../DotMenu'
import { useTagStore } from '../../stores/tagStore'
import ConfirmDialog from '../ConfirmDialog'
import { createStyles } from './listViewStyles'
import { SortableRow } from './SortableRow'
import navListsIcon from '../../assets/nav/nav-lists.png'
import navLockedListsIcon from '../../assets/nav/nav-lockedLists.png'

export interface ListItemData {
  id: string
  text: string
  done: boolean
  position: number
  createdAt: number
  updatedAt: number
}

interface Props {
  sectionLabel: string
  categories: Category[]
  activeSlot: number
  items: ListItemData[]
  onSelectCategory: (slot: number) => void
  onAddItem: (text: string) => void
  onToggleItem: (id: string) => void
  onDeleteItem: (id: string) => void
  onUpdateItemText?: (id: string, text: string) => void
  onReorder: (items: ListItemData[]) => void
  onMoveItemToCategory?: (itemId: string, fromSlot: number, toSlot: number) => void
  getUncheckedCount: (slot: number) => number
  onRenameCategory?: (slot: number, newLabel: string) => void
}

export default function ListView({
  sectionLabel,
  categories,
  activeSlot,
  items,
  onSelectCategory,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItemText,
  onReorder,
  onMoveItemToCategory,
  getUncheckedCount,
  onRenameCategory,
}: Props) {
  const { colors, listView: lv } = useTheme()
  const listFontSize = useSettingsStore((s) => s.listFontSize)
  const selectedTag = useTagStore((s) => s.tags.find((t) => t.id === s.selectedTagId))
  const [inputText, setInputText] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const styles = useMemo(() => createStyles(colors, lv, listFontSize), [colors, lv, listFontSize])

  const activeLabel = categories[activeSlot]?.label || ''

  const handleSubmit = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    onAddItem(text)
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [inputText, onAddItem])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id?.toString()
    if (overId?.startsWith('pill-')) {
      setHighlightedSlot(Number(overId.replace('pill-', '')))
    } else {
      setHighlightedSlot(null)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setHighlightedSlot(null)
      const { active, over } = event
      if (!over) return
      const overId = over.id.toString()
      if (overId.startsWith('pill-') && onMoveItemToCategory) {
        const targetSlot = Number(overId.replace('pill-', ''))
        onMoveItemToCategory(active.id.toString(), activeSlot, targetSlot)
      } else if (active.id !== over.id) {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        onReorder(reordered)
      }
    },
    [items, activeSlot, onReorder, onMoveItemToCategory],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Header */}
      <HeaderTray>
        <div style={{ ...styles.headerContainer, cursor: 'pointer' }} onClick={() => inputRef.current?.focus()}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <img src={sectionLabel === 'LOCKED LISTS' ? navLockedListsIcon : navListsIcon} style={styles.headerIcon} />
            <div>
              <div style={styles.headerTitleRow}>
                <span style={styles.headerTitle}>{sectionLabel}</span>
              </div>
              <div style={styles.headerLabel}>{activeLabel}</div>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DotMenu items={[
              ...(selectedTag
                ? [{ label: `SAVE → ${selectedTag.label}`, onClick: () => window.dispatchEvent(new Event('save-to-tag')) }]
                : []),
              ...(items.length > 0
                ? [{ label: `DELETE ALL ${activeLabel} ITEMS`, onClick: () => setShowClearConfirm(true) }]
                : []),
            ]} />
          </div>
        </div>
      </HeaderTray>

      {/* List */}
      <div style={styles.listContainer}>
        {/* Input row */}
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lv.inputPlaceholder}
          />
        </div>

        <div className="list-scroll" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  onDelete={onDeleteItem}
                  onUpdateText={onUpdateItemText}
                  styles={styles}
                />
              ))}
            </SortableContext>
            <div
              style={{ cursor: 'pointer', flex: 1, minHeight: lv.emptyRowHeight }}
              onClick={() => inputRef.current?.focus()}
            />
          </div>
        </div>
      </div>

      {/* Category Strip */}
      <StripTray>
        <CategoryStrip
          categories={categories}
          activeSlot={activeSlot}
          onSelect={onSelectCategory}
          getUncheckedCount={getUncheckedCount}
          highlightedSlot={highlightedSlot}
          disableDropForSlot={activeSlot}
          onRename={onRenameCategory}
        />
      </StripTray>

      <ConfirmDialog
        visible={showClearConfirm}
        title="Delete all items?"
        message={`This will delete all items in ${activeLabel}. This can't be undone.`}
        confirmLabel="DELETE ALL"
        onConfirm={() => { items.forEach((item) => onDeleteItem(item.id)); setShowClearConfirm(false) }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </DndContext>
  )
}
