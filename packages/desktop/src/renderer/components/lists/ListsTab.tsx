import React, { useMemo } from 'react'
import { useListsStore } from '../../stores/listsStore'
import { useTheme } from '../../hooks/useTheme'
import ListView from './ListView'

export default function ListsTab() {
  const { colors } = useTheme()
  const items = useListsStore((s) => s.items)
  const categories = useListsStore((s) => s.categories)
  const activeSlot = useListsStore((s) => s.activeSlot)
  const setActiveSlot = useListsStore((s) => s.setActiveSlot)
  const addItem = useListsStore((s) => s.addItem)
  const toggleItem = useListsStore((s) => s.toggleItem)
  const deleteItem = useListsStore((s) => s.deleteItem)
  const updateItemText = useListsStore((s) => s.updateItemText)
  const reorderItems = useListsStore((s) => s.reorderItems)
  const moveItemToCategory = useListsStore((s) => s.moveItemToCategory)
  const getUncheckedCount = useListsStore((s) => s.getUncheckedCount)

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
        sectionLabel="LISTS"
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
          const cats = [...useListsStore.getState().categories]
          cats[slot] = { ...cats[slot], label: newLabel, updatedAt: Date.now() }
          useListsStore.getState().updateCategories(cats)
        }}
      />
    </div>
  )
}
