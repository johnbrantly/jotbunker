import React, { useMemo } from 'react'
import { useLockedListsStore } from '../../stores/lockedListsStore'
import { useTheme } from '../../hooks/useTheme'
import ListView from '../lists/ListView'

export default function LockedListsTab() {
  const { colors } = useTheme()
  const items = useLockedListsStore((s) => s.items)
  const categories = useLockedListsStore((s) => s.categories)
  const activeSlot = useLockedListsStore((s) => s.activeSlot)
  const setActiveSlot = useLockedListsStore((s) => s.setActiveSlot)
  const addItem = useLockedListsStore((s) => s.addItem)
  const toggleItem = useLockedListsStore((s) => s.toggleItem)
  const deleteItem = useLockedListsStore((s) => s.deleteItem)
  const updateItemText = useLockedListsStore((s) => s.updateItemText)
  const reorderItems = useLockedListsStore((s) => s.reorderItems)
  const moveItemToCategory = useLockedListsStore((s) => s.moveItemToCategory)
  const getUncheckedCount = useLockedListsStore((s) => s.getUncheckedCount)

  const currentItems = items[activeSlot] || []

  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.background,
    },
  }), [colors])

  return (
    <div style={styles.container}>
      <ListView
        sectionLabel="LOCKED LISTS"
        categories={categories}
        activeSlot={activeSlot}
        items={currentItems}
        onSelectCategory={setActiveSlot}
        onAddItem={addItem}
        onToggleItem={toggleItem}
        onDeleteItem={deleteItem}
        onUpdateItemText={updateItemText}
        onReorder={(reordered) => reorderItems(activeSlot, reordered)}
        onMoveItemToCategory={moveItemToCategory}
        getUncheckedCount={getUncheckedCount}
        onRenameCategory={(slot, newLabel) => {
          const cats = [...useLockedListsStore.getState().categories]
          cats[slot] = { ...cats[slot], label: newLabel, updatedAt: Date.now() }
          useLockedListsStore.getState().updateCategories(cats)
        }}
      />
    </div>
  )
}
