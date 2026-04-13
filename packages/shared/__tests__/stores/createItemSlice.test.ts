import { describe, it, expect, beforeEach } from 'vitest'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState } from '../../src/stores/createItemSlice'
import { CATEGORY_COUNT, MAX_ITEMS_PER_CATEGORY } from '../../src/constants'
import type { Category } from '../../src/types'

// ── Minimal store harness (no zustand dependency in shared) ──
//
// createItemSlice returns a (set, get) => state initializer.
// The `set` callback merges partials into `box.state`, and `get` returns the
// current snapshot. Tests read state via `s()` helper so they always see the
// latest mutations — plain `store = slice(set, get)` would capture a stale ref.

let counter = 0

function makeStore() {
  counter = 0
  const defaultCategories: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
    label: `Cat ${i}`,
    section: 'lists' as const,
    updatedAt: 0,
  }))

  const box: { state: ItemSliceState } = {} as any

  const set = (partial: Partial<ItemSliceState> | ((s: ItemSliceState) => Partial<ItemSliceState> | ItemSliceState)) => {
    if (typeof partial === 'function') {
      const result = partial(box.state)
      box.state = { ...box.state, ...result }
    } else {
      box.state = { ...box.state, ...partial }
    }
  }

  const get = () => box.state

  const slice = createItemSlice({
    defaultCategories,
    generateUUID: () => `uuid-${++counter}`,
  })

  box.state = slice(set, get)

  /** Always returns current state */
  const s = () => box.state
  return s
}

// ── Tests ──

describe('createItemSlice', () => {
  let s: () => ItemSliceState

  beforeEach(() => {
    s = makeStore()
  })

  it('initial state has CATEGORY_COUNT empty slots', () => {
    expect(s().items).toHaveLength(CATEGORY_COUNT)
    for (const slot of s().items) {
      expect(slot).toEqual([])
    }
  })

  it('initial state has default categories', () => {
    expect(s().categories).toHaveLength(CATEGORY_COUNT)
    expect(s().categories[0].label).toBe('Cat 0')
  })

  it('initial activeSlot is 0', () => {
    expect(s().activeSlot).toBe(0)
  })

  it('setActiveSlot changes active slot', () => {
    s().setActiveSlot(3)
    expect(s().activeSlot).toBe(3)
  })

  it('addItem prepends to active slot with position recompute', () => {
    s().addItem('first')
    s().addItem('second')
    expect(s().items[0]).toHaveLength(2)
    expect(s().items[0][0].text).toBe('second')
    expect(s().items[0][1].text).toBe('first')
    expect(s().items[0][0].position).toBe(0)
    expect(s().items[0][1].position).toBe(1)
  })

  it('addItem respects MAX_ITEMS_PER_CATEGORY cap', () => {
    for (let i = 0; i < MAX_ITEMS_PER_CATEGORY; i++) {
      s().addItem(`item ${i}`)
    }
    expect(s().items[0]).toHaveLength(MAX_ITEMS_PER_CATEGORY)
    s().addItem('overflow')
    expect(s().items[0]).toHaveLength(MAX_ITEMS_PER_CATEGORY)
  })

  it('addItem generates unique IDs', () => {
    s().addItem('a')
    s().addItem('b')
    const ids = s().items[0].map((i) => i.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('toggleItem flips done and updates timestamp', () => {
    s().addItem('task')
    const item = s().items[0][0]
    expect(item.done).toBe(false)

    s().toggleItem(item.id)
    expect(s().items[0][0].done).toBe(true)
    expect(s().items[0][0].updatedAt).toBeGreaterThanOrEqual(item.updatedAt)
  })

  it('deleteItem removes item and recomputes positions', () => {
    s().addItem('a')
    s().addItem('b')
    s().addItem('c')
    const idToDelete = s().items[0][1].id // middle item

    s().deleteItem(idToDelete)
    expect(s().items[0]).toHaveLength(2)
    expect(s().items[0].find((i) => i.id === idToDelete)).toBeUndefined()
    expect(s().items[0][0].position).toBe(0)
    expect(s().items[0][1].position).toBe(1)
  })

  it('updateItemText changes text and timestamp', () => {
    s().addItem('original')
    const item = s().items[0][0]

    s().updateItemText(item.id, 'updated')
    expect(s().items[0][0].text).toBe('updated')
    expect(s().items[0][0].updatedAt).toBeGreaterThanOrEqual(item.updatedAt)
  })

  it('reorderItems sets new order with correct positions', () => {
    s().addItem('a')
    s().addItem('b')
    s().addItem('c')
    // Current order: c, b, a — reverse it
    const reversed = [...s().items[0]].reverse()

    s().reorderItems(0, reversed)
    expect(s().items[0][0].text).toBe('a')
    expect(s().items[0][1].text).toBe('b')
    expect(s().items[0][2].text).toBe('c')
    expect(s().items[0].every((item, i) => item.position === i)).toBe(true)
  })

  it('moveItemToCategory transfers item from source to target slot', () => {
    s().addItem('moveable')
    const item = s().items[0][0]

    s().moveItemToCategory(item.id, 0, 3)
    expect(s().items[0]).toHaveLength(0)
    expect(s().items[3]).toHaveLength(1)
    expect(s().items[3][0].text).toBe('moveable')
    expect(s().items[3][0].position).toBe(0)
  })

  it('moveItemToCategory with nonexistent itemId is a no-op', () => {
    s().addItem('stay')
    const before = s().items[0].length

    s().moveItemToCategory('nonexistent', 0, 3)
    expect(s().items[0]).toHaveLength(before)
    expect(s().items[3]).toHaveLength(0)
  })

  it('updateCategories replaces the category array', () => {
    const newCats: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `New ${i}`,
      section: 'lists' as const,
      updatedAt: Date.now(),
    }))
    s().updateCategories(newCats)
    expect(s().categories[0].label).toBe('New 0')
  })

  it('getUncheckedCount returns correct count', () => {
    s().addItem('done task')
    s().addItem('open task')
    s().toggleItem(s().items[0][0].id) // mark first as done

    expect(s().getUncheckedCount(0)).toBe(1)
  })
})
