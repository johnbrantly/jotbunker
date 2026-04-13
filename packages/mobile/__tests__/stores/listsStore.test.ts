import { describe, it, expect, beforeEach } from 'vitest'
import { useListsStore } from '../../stores/listsStore'
import { DEFAULT_LISTS_CATEGORIES, CATEGORY_COUNT, MAX_ITEMS_PER_CATEGORY } from '@jotbunker/shared'

const emptySlots = () => Array.from({ length: CATEGORY_COUNT }, () => [])

beforeEach(() => {
  useListsStore.setState({
    items: emptySlots(),
    categories: DEFAULT_LISTS_CATEGORIES,
    activeSlot: 0,
  })
})

describe('initial state', () => {
  it('starts with empty item slots', () => {
    const items = useListsStore.getState().items
    expect(items).toHaveLength(CATEGORY_COUNT)
    items.forEach((slot) => expect(slot).toEqual([]))
  })

  it('has default categories', () => {
    expect(useListsStore.getState().categories).toEqual(DEFAULT_LISTS_CATEGORIES)
  })

  it('active slot is 0', () => {
    expect(useListsStore.getState().activeSlot).toBe(0)
  })
})

describe('addItem', () => {
  it('adds an item at position 0', () => {
    useListsStore.getState().addItem('Buy milk')
    const items = useListsStore.getState().items[0]
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('Buy milk')
    expect(items[0].position).toBe(0)
    expect(items[0].done).toBe(false)
  })

  it('prepends new items and recomputes positions', () => {
    const store = useListsStore.getState()
    store.addItem('First')
    store.addItem('Second')
    const items = useListsStore.getState().items[0]
    expect(items).toHaveLength(2)
    expect(items[0].text).toBe('Second')
    expect(items[0].position).toBe(0)
    expect(items[1].text).toBe('First')
    expect(items[1].position).toBe(1)
  })

  it('adds to active slot', () => {
    useListsStore.getState().setActiveSlot(2)
    useListsStore.getState().addItem('Work task')
    expect(useListsStore.getState().items[2]).toHaveLength(1)
    expect(useListsStore.getState().items[0]).toEqual([])
  })

  it('respects MAX_ITEMS_PER_CATEGORY limit', () => {
    for (let i = 0; i < MAX_ITEMS_PER_CATEGORY + 5; i++) {
      useListsStore.getState().addItem(`Item ${i}`)
    }
    const items = useListsStore.getState().items[0]
    expect(items).toHaveLength(MAX_ITEMS_PER_CATEGORY)
  })

  it('assigns unique IDs', () => {
    useListsStore.getState().addItem('A')
    useListsStore.getState().addItem('B')
    const items = useListsStore.getState().items[0]
    expect(items[0].id).not.toBe(items[1].id)
  })
})

describe('toggleItem', () => {
  it('flips done status', () => {
    useListsStore.getState().addItem('Toggle me')
    const id = useListsStore.getState().items[0][0].id
    expect(useListsStore.getState().items[0][0].done).toBe(false)

    useListsStore.getState().toggleItem(id)
    expect(useListsStore.getState().items[0][0].done).toBe(true)

    useListsStore.getState().toggleItem(id)
    expect(useListsStore.getState().items[0][0].done).toBe(false)
  })

  it('updates the timestamp', () => {
    useListsStore.getState().addItem('Toggle me')
    const id = useListsStore.getState().items[0][0].id
    const before = useListsStore.getState().items[0][0].updatedAt

    useListsStore.getState().toggleItem(id)
    const after = useListsStore.getState().items[0][0].updatedAt
    expect(after).toBeGreaterThanOrEqual(before)
  })
})

describe('deleteItem', () => {
  it('removes the item', () => {
    useListsStore.getState().addItem('Delete me')
    useListsStore.getState().addItem('Keep me')
    const items = useListsStore.getState().items[0]
    const deleteId = items.find((i) => i.text === 'Delete me')!.id

    useListsStore.getState().deleteItem(deleteId)
    const remaining = useListsStore.getState().items[0]
    expect(remaining).toHaveLength(1)
    expect(remaining[0].text).toBe('Keep me')
  })

  it('recomputes positions after deletion', () => {
    useListsStore.getState().addItem('A')
    useListsStore.getState().addItem('B')
    useListsStore.getState().addItem('C')
    const items = useListsStore.getState().items[0]
    const middleId = items[1].id

    useListsStore.getState().deleteItem(middleId)
    const remaining = useListsStore.getState().items[0]
    expect(remaining.map((i) => i.position)).toEqual([0, 1])
  })
})

describe('updateItemText', () => {
  it('updates the text', () => {
    useListsStore.getState().addItem('Original')
    const id = useListsStore.getState().items[0][0].id

    useListsStore.getState().updateItemText(id, 'Updated')
    expect(useListsStore.getState().items[0][0].text).toBe('Updated')
  })

  it('updates the timestamp', () => {
    useListsStore.getState().addItem('Original')
    const id = useListsStore.getState().items[0][0].id
    const before = useListsStore.getState().items[0][0].updatedAt

    useListsStore.getState().updateItemText(id, 'Changed')
    expect(useListsStore.getState().items[0][0].updatedAt).toBeGreaterThanOrEqual(before)
  })
})

describe('reorderItems', () => {
  it('reorders items and recomputes positions', () => {
    useListsStore.getState().addItem('A')
    useListsStore.getState().addItem('B')
    useListsStore.getState().addItem('C')
    const items = useListsStore.getState().items[0]
    const reversed = [...items].reverse()

    useListsStore.getState().reorderItems(0, reversed)
    const reordered = useListsStore.getState().items[0]
    expect(reordered[0].text).toBe('A')
    expect(reordered[1].text).toBe('B')
    expect(reordered[2].text).toBe('C')
    expect(reordered.map((i) => i.position)).toEqual([0, 1, 2])
  })
})

describe('getUncheckedCount', () => {
  it('returns 0 for empty slot', () => {
    expect(useListsStore.getState().getUncheckedCount(0)).toBe(0)
  })

  it('counts only unchecked items', () => {
    useListsStore.getState().addItem('A')
    useListsStore.getState().addItem('B')
    useListsStore.getState().addItem('C')
    const items = useListsStore.getState().items[0]
    useListsStore.getState().toggleItem(items[0].id)

    expect(useListsStore.getState().getUncheckedCount(0)).toBe(2)
  })
})

describe('setActiveSlot', () => {
  it('changes the active slot', () => {
    useListsStore.getState().setActiveSlot(3)
    expect(useListsStore.getState().activeSlot).toBe(3)
  })
})

describe('moveItemToCategory', () => {
  it('moves item from source slot to target slot', () => {
    useListsStore.getState().addItem('Moveable')
    const item = useListsStore.getState().items[0][0]

    useListsStore.getState().moveItemToCategory(item.id, 0, 3)
    expect(useListsStore.getState().items[0]).toHaveLength(0)
    expect(useListsStore.getState().items[3]).toHaveLength(1)
    expect(useListsStore.getState().items[3][0].text).toBe('Moveable')
    expect(useListsStore.getState().items[3][0].position).toBe(0)
  })

  it('is a no-op for nonexistent item', () => {
    useListsStore.getState().addItem('Stay')
    useListsStore.getState().moveItemToCategory('nonexistent', 0, 3)
    expect(useListsStore.getState().items[0]).toHaveLength(1)
    expect(useListsStore.getState().items[3]).toHaveLength(0)
  })
})

describe('updateCategories', () => {
  it('replaces categories', () => {
    const newCats = [{ label: 'X', section: 'lists' as const, updatedAt: 0 }]
    useListsStore.getState().updateCategories(newCats)
    expect(useListsStore.getState().categories).toEqual(newCats)
  })
})
