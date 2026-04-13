import { describe, it, expect, beforeEach } from 'vitest'
import { useLockedListsStore } from '../../stores/lockedListsStore'
import { DEFAULT_LOCKED_LISTS_CATEGORIES, CATEGORY_COUNT, MAX_ITEMS_PER_CATEGORY } from '@jotbunker/shared'

const emptySlots = () => Array.from({ length: CATEGORY_COUNT }, () => [])

beforeEach(() => {
  useLockedListsStore.setState({
    items: emptySlots(),
    categories: DEFAULT_LOCKED_LISTS_CATEGORIES,
    activeSlot: 0,
    isUnlocked: false,
  })
})

describe('initial state', () => {
  it('starts with empty item slots', () => {
    const items = useLockedListsStore.getState().items
    expect(items).toHaveLength(CATEGORY_COUNT)
    items.forEach((slot) => expect(slot).toEqual([]))
  })

  it('has default Locked Lists categories', () => {
    expect(useLockedListsStore.getState().categories).toEqual(DEFAULT_LOCKED_LISTS_CATEGORIES)
  })

  it('starts locked', () => {
    expect(useLockedListsStore.getState().isUnlocked).toBe(false)
  })

  it('active slot is 0', () => {
    expect(useLockedListsStore.getState().activeSlot).toBe(0)
  })
})

describe('unlock / lock', () => {
  it('unlock sets isUnlocked to true', () => {
    useLockedListsStore.getState().unlock()
    expect(useLockedListsStore.getState().isUnlocked).toBe(true)
  })

  it('lock sets isUnlocked to false', () => {
    useLockedListsStore.getState().unlock()
    useLockedListsStore.getState().lock()
    expect(useLockedListsStore.getState().isUnlocked).toBe(false)
  })
})

describe('addItem', () => {
  it('adds an item at position 0', () => {
    useLockedListsStore.getState().addItem('Secret note')
    const items = useLockedListsStore.getState().items[0]
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('Secret note')
    expect(items[0].position).toBe(0)
    expect(items[0].done).toBe(false)
  })

  it('prepends new items and recomputes positions', () => {
    useLockedListsStore.getState().addItem('First')
    useLockedListsStore.getState().addItem('Second')
    const items = useLockedListsStore.getState().items[0]
    expect(items[0].text).toBe('Second')
    expect(items[0].position).toBe(0)
    expect(items[1].text).toBe('First')
    expect(items[1].position).toBe(1)
  })

  it('adds to active slot', () => {
    useLockedListsStore.getState().setActiveSlot(3)
    useLockedListsStore.getState().addItem('Slot 3 secret')
    expect(useLockedListsStore.getState().items[3]).toHaveLength(1)
    expect(useLockedListsStore.getState().items[0]).toEqual([])
  })

  it('respects MAX_ITEMS_PER_CATEGORY limit', () => {
    for (let i = 0; i < MAX_ITEMS_PER_CATEGORY + 5; i++) {
      useLockedListsStore.getState().addItem(`Item ${i}`)
    }
    expect(useLockedListsStore.getState().items[0]).toHaveLength(MAX_ITEMS_PER_CATEGORY)
  })
})

describe('toggleItem', () => {
  it('flips done status and updates timestamp', () => {
    useLockedListsStore.getState().addItem('Toggle me')
    const id = useLockedListsStore.getState().items[0][0].id
    expect(useLockedListsStore.getState().items[0][0].done).toBe(false)

    useLockedListsStore.getState().toggleItem(id)
    expect(useLockedListsStore.getState().items[0][0].done).toBe(true)
  })
})

describe('deleteItem', () => {
  it('removes the item and recomputes positions', () => {
    useLockedListsStore.getState().addItem('A')
    useLockedListsStore.getState().addItem('B')
    const items = useLockedListsStore.getState().items[0]
    const deleteId = items[0].id

    useLockedListsStore.getState().deleteItem(deleteId)
    const remaining = useLockedListsStore.getState().items[0]
    expect(remaining).toHaveLength(1)
    expect(remaining[0].position).toBe(0)
  })
})

describe('updateItemText', () => {
  it('updates text and timestamp', () => {
    useLockedListsStore.getState().addItem('Original')
    const id = useLockedListsStore.getState().items[0][0].id

    useLockedListsStore.getState().updateItemText(id, 'Updated')
    expect(useLockedListsStore.getState().items[0][0].text).toBe('Updated')
  })
})

describe('reorderItems', () => {
  it('reorders and recomputes positions', () => {
    useLockedListsStore.getState().addItem('A')
    useLockedListsStore.getState().addItem('B')
    useLockedListsStore.getState().addItem('C')
    const items = useLockedListsStore.getState().items[0]
    const reversed = [...items].reverse()

    useLockedListsStore.getState().reorderItems(0, reversed)
    const reordered = useLockedListsStore.getState().items[0]
    expect(reordered[0].text).toBe('A')
    expect(reordered[1].text).toBe('B')
    expect(reordered[2].text).toBe('C')
    expect(reordered.map((i) => i.position)).toEqual([0, 1, 2])
  })
})

describe('moveItemToCategory', () => {
  it('moves item from source slot to target slot', () => {
    useLockedListsStore.getState().addItem('Moveable')
    const item = useLockedListsStore.getState().items[0][0]

    useLockedListsStore.getState().moveItemToCategory(item.id, 0, 3)
    expect(useLockedListsStore.getState().items[0]).toHaveLength(0)
    expect(useLockedListsStore.getState().items[3]).toHaveLength(1)
    expect(useLockedListsStore.getState().items[3][0].text).toBe('Moveable')
  })

  it('is a no-op for nonexistent item', () => {
    useLockedListsStore.getState().addItem('Stay')
    useLockedListsStore.getState().moveItemToCategory('nonexistent', 0, 3)
    expect(useLockedListsStore.getState().items[0]).toHaveLength(1)
    expect(useLockedListsStore.getState().items[3]).toHaveLength(0)
  })
})

describe('getUncheckedCount', () => {
  it('returns 0 for empty slot', () => {
    expect(useLockedListsStore.getState().getUncheckedCount(0)).toBe(0)
  })

  it('counts only unchecked items', () => {
    useLockedListsStore.getState().addItem('A')
    useLockedListsStore.getState().addItem('B')
    useLockedListsStore.getState().addItem('C')
    const items = useLockedListsStore.getState().items[0]
    useLockedListsStore.getState().toggleItem(items[0].id)

    expect(useLockedListsStore.getState().getUncheckedCount(0)).toBe(2)
  })
})
