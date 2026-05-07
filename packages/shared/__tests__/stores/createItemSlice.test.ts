import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState } from '../../src/stores/createItemSlice'
import type { AncestorSnapshot } from '../../src/stores/createAncestorSlice'
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

  it('deleteItem tombstones item and recomputes live positions', () => {
    s().addItem('a')
    s().addItem('b')
    s().addItem('c')
    const idToDelete = s().items[0][1].id // middle item

    s().deleteItem(idToDelete)

    // Raw array still holds 3 items; the middle one is tombstoned.
    expect(s().items[0]).toHaveLength(3)
    const tombstone = s().items[0].find((i) => i.id === idToDelete)!
    expect(tombstone.deleted).toBe(true)
    expect(typeof tombstone.deletedAt).toBe('number')
    expect(tombstone.deletedAt).toBeGreaterThan(0)

    // Live view excludes the tombstone; positions remain strictly ascending.
    const live = s().getLiveItems(0)
    expect(live).toHaveLength(2)
    expect(live.find((i) => i.id === idToDelete)).toBeUndefined()
    expect(live[0].position).toBeLessThan(live[1].position)
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
    // Live items are in strictly-ascending position order.
    const positions = s().items[0].map((it) => it.position)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1])
    }
  })

  it('moveItemToCategory transfers item from source to target slot', () => {
    s().addItem('moveable')
    const item = s().items[0][0]

    s().moveItemToCategory(item.id, 0, 3)
    expect(s().items[0]).toHaveLength(0)
    expect(s().items[3]).toHaveLength(1)
    expect(s().items[3][0].text).toBe('moveable')
    expect(typeof s().items[3][0].position).toBe('number')
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

  // ── ID stability invariants ──
  // Phase 2 (tombstones) will rely on item.id being load-bearing across every
  // mutation. These lock the invariant in: nothing should ever regenerate an
  // id, and addItem must always assign one.

  it('addItem assigns a non-empty string id', () => {
    s().addItem('a')
    expect(typeof s().items[0][0].id).toBe('string')
    expect(s().items[0][0].id.length).toBeGreaterThan(0)
  })

  it('id survives toggleItem', () => {
    s().addItem('task')
    const id = s().items[0][0].id
    s().toggleItem(id)
    expect(s().items[0][0].id).toBe(id)
  })

  it('id survives updateItemText', () => {
    s().addItem('original')
    const id = s().items[0][0].id
    s().updateItemText(id, 'updated')
    expect(s().items[0][0].id).toBe(id)
  })

  it('id survives reorderItems', () => {
    s().addItem('a')
    s().addItem('b')
    s().addItem('c')
    const idsBefore = s().items[0].map((i) => i.id)
    s().reorderItems(0, [...s().items[0]].reverse())
    const idsAfter = s().items[0].map((i) => i.id)
    expect(idsAfter).toEqual([...idsBefore].reverse())
  })

  it('id survives moveItemToCategory', () => {
    s().addItem('moveable')
    const id = s().items[0][0].id
    s().moveItemToCategory(id, 0, 3)
    expect(s().items[3][0].id).toBe(id)
  })

  // ── Tombstone behavior ──
  // deleteItem marks tombstones (idempotent). Other mutations refuse to
  // operate on tombstoned items and warn loudly. Live selectors hide them.
  // reorderItems receives the live subset and preserves tombstones in slot.

  describe('tombstones', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>
    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
      logSpy.mockRestore()
    })

    it('deleteItem emits an INFO log with id, slot, deletedAt and no text', () => {
      s().addItem('a sensitive value')
      const id = s().items[0][0].id
      s().deleteItem(id)
      expect(logSpy).toHaveBeenCalledWith(
        '[tombstone]',
        expect.objectContaining({ id, slot: 0, deletedAt: expect.any(Number) }),
      )
      // Privacy: the payload must never carry the item text. Locked Lists
      // share this logger and item text holds secrets there.
      for (const call of logSpy.mock.calls) {
        const payload = call[1] as Record<string, unknown> | undefined
        if (payload) expect(payload).not.toHaveProperty('text')
      }
    })

    it('idempotent deleteItem does not re-emit INFO log', () => {
      s().addItem('a')
      const id = s().items[0][0].id
      s().deleteItem(id)
      const callsAfterFirst = logSpy.mock.calls.length
      s().deleteItem(id) // already tombstoned
      expect(logSpy.mock.calls.length).toBe(callsAfterFirst)
    })

    it('deleteItem twice on same id is idempotent', () => {
      s().addItem('a')
      const id = s().items[0][0].id
      s().deleteItem(id)
      const firstDeletedAt = s().items[0][0].deletedAt!
      // Sleep would be flaky; just rely on no-op check.
      s().deleteItem(id)
      expect(s().items[0][0].deletedAt).toBe(firstDeletedAt)
      expect(s().items[0]).toHaveLength(1)
    })

    it('getLiveItems hides tombstones', () => {
      s().addItem('a')
      s().addItem('b')
      s().addItem('c')
      const middleId = s().items[0][1].id
      s().deleteItem(middleId)
      const live = s().getLiveItems(0)
      expect(live).toHaveLength(2)
      expect(live.map((i) => i.id)).not.toContain(middleId)
    })

    it('toggleItem on tombstoned item is a no-op and warns', () => {
      s().addItem('a')
      const id = s().items[0][0].id
      s().deleteItem(id)
      const before = s().items[0][0]
      s().toggleItem(id)
      expect(s().items[0][0]).toEqual(before)
      expect(warnSpy).toHaveBeenCalledWith(
        '[tombstone]',
        expect.objectContaining({ op: 'toggleItem', id, slot: 0 }),
      )
    })

    it('updateItemText on tombstoned item is a no-op and warns', () => {
      s().addItem('a')
      const id = s().items[0][0].id
      s().deleteItem(id)
      const before = s().items[0][0]
      s().updateItemText(id, 'new text')
      expect(s().items[0][0]).toEqual(before)
      expect(warnSpy).toHaveBeenCalledWith(
        '[tombstone]',
        expect.objectContaining({ op: 'updateItemText', id, slot: 0 }),
      )
    })

    it('moveItemToCategory on tombstoned item is a no-op and warns', () => {
      s().addItem('a')
      const id = s().items[0][0].id
      s().deleteItem(id)
      s().moveItemToCategory(id, 0, 3)
      expect(s().items[0]).toHaveLength(1)
      expect(s().items[0][0].deleted).toBe(true)
      expect(s().items[3]).toHaveLength(0)
      expect(warnSpy).toHaveBeenCalledWith(
        '[tombstone]',
        expect.objectContaining({ op: 'moveItemToCategory', id, slot: 0 }),
      )
    })

    it('reorderItems on live subset preserves tombstones in slot', () => {
      s().addItem('a')
      s().addItem('b')
      s().addItem('c')
      // Order: c, b, a. Tombstone the middle (b).
      const middleId = s().items[0][1].id
      s().deleteItem(middleId)

      // UI sees only live; pass live in reverse.
      const liveReversed = [...s().getLiveItems(0)].reverse()
      s().reorderItems(0, liveReversed)

      // Raw array: live items in new order followed by the tombstone.
      const raw = s().items[0]
      expect(raw).toHaveLength(3)
      const tombstone = raw.find((i) => i.id === middleId)!
      expect(tombstone.deleted).toBe(true)
      const live = s().getLiveItems(0)
      expect(live.map((i) => i.text)).toEqual(['a', 'c'])
      // Live positions strictly ascending.
      expect(live[0].position).toBeLessThan(live[1].position)
    })

    it('getUncheckedCount excludes tombstones', () => {
      s().addItem('a') // live, not done
      s().addItem('b') // will tombstone
      s().addItem('c') // will mark done
      // Order: c, b, a.
      const cId = s().items[0][0].id
      const bId = s().items[0][1].id
      s().deleteItem(bId)
      s().toggleItem(cId)
      // Live unchecked: only "a".
      expect(s().getUncheckedCount(0)).toBe(1)
    })

    it('addItem cap counts live items only, not tombstones', () => {
      // Fill the slot, tombstone one, and confirm a new add succeeds.
      for (let i = 0; i < MAX_ITEMS_PER_CATEGORY; i++) s().addItem(`x${i}`)
      expect(s().items[0]).toHaveLength(MAX_ITEMS_PER_CATEGORY)
      const victimId = s().items[0][50].id
      s().deleteItem(victimId)
      s().addItem('replacement')
      // Raw: 100 live + 1 tombstone = 101. Live: still at the cap.
      expect(s().items[0]).toHaveLength(MAX_ITEMS_PER_CATEGORY + 1)
      expect(s().getLiveItems(0)).toHaveLength(MAX_ITEMS_PER_CATEGORY)
    })
  })

  // ── Fractional positions (Phase 4) ──
  // Locks in the new contract: position is the source of truth for ordering;
  // mutations produce minimal position changes; getLiveItems sorts by position
  // so array order is no longer authoritative.

  describe('fractional positions', () => {
    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      logSpy.mockRestore()
    })

    it('getLiveItems returns items sorted ascending by position regardless of array order', () => {
      const state = s()
      // Inject items with array order disagreeing with position-sort order.
      state.items[0] = [
        { id: 'high', text: 'h', done: false, position: 5, createdAt: 1, updatedAt: 1 },
        { id: 'low', text: 'l', done: false, position: 1, createdAt: 1, updatedAt: 1 },
        { id: 'mid', text: 'm', done: false, position: 3, createdAt: 1, updatedAt: 1 },
      ]
      const live = s().getLiveItems(0)
      expect(live.map((i) => i.id)).toEqual(['low', 'mid', 'high'])
    })

    it('getLiveItems sort handles fractional positions', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 1.0, createdAt: 1, updatedAt: 1 },
        { id: 'c', text: 'c', done: false, position: 2.0, createdAt: 1, updatedAt: 1 },
        { id: 'b', text: 'b', done: false, position: 1.5, createdAt: 1, updatedAt: 1 },
      ]
      const live = s().getLiveItems(0)
      expect(live.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    })

    it('addItem does not change other items\' positions', () => {
      const state = s()
      state.items[0] = [
        { id: 'old1', text: 'old1', done: false, position: 5, createdAt: 1, updatedAt: 1 },
        { id: 'old2', text: 'old2', done: false, position: 7, createdAt: 1, updatedAt: 1 },
      ]
      s().addItem('new')
      const slot = s().items[0]
      const old1 = slot.find((i) => i.id === 'old1')!
      const old2 = slot.find((i) => i.id === 'old2')!
      expect(old1.position).toBe(5)
      expect(old2.position).toBe(7)
    })

    it('addItem assigns a position strictly less than the smallest existing live position', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 5, createdAt: 1, updatedAt: 1 },
        { id: 'b', text: 'b', done: false, position: 7, createdAt: 1, updatedAt: 1 },
      ]
      s().addItem('new')
      const newItem = s().items[0].find((i) => i.text === 'new')!
      expect(newItem.position).toBeLessThan(5)
    })

    it('deleteItem does not change other items\' positions', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 5, createdAt: 1, updatedAt: 1 },
        { id: 'b', text: 'b', done: false, position: 7, createdAt: 1, updatedAt: 1 },
        { id: 'c', text: 'c', done: false, position: 9, createdAt: 1, updatedAt: 1 },
      ]
      // activeSlot is 0; deleteItem operates on activeSlot.
      s().deleteItem('b')
      const slot = s().items[0]
      const a = slot.find((i) => i.id === 'a')!
      const c = slot.find((i) => i.id === 'c')!
      expect(a.position).toBe(5)
      expect(c.position).toBe(9)
    })

    it('moveItemToCategory does not change other items\' positions in source or target', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 5, createdAt: 1, updatedAt: 1 },
        { id: 'b', text: 'b', done: false, position: 7, createdAt: 1, updatedAt: 1 },
      ]
      state.items[3] = [
        { id: 'x', text: 'x', done: false, position: 10, createdAt: 1, updatedAt: 1 },
      ]
      s().moveItemToCategory('a', 0, 3)
      const sourceSlot = s().items[0]
      const targetSlot = s().items[3]
      const b = sourceSlot.find((i) => i.id === 'b')!
      const x = targetSlot.find((i) => i.id === 'x')!
      expect(b.position).toBe(7)
      expect(x.position).toBe(10)
    })

    it('moveItemToCategory: moved item gets a position less than target slot\'s smallest live position', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 5, createdAt: 1, updatedAt: 1 },
      ]
      state.items[3] = [
        { id: 'x', text: 'x', done: false, position: 10, createdAt: 1, updatedAt: 1 },
        { id: 'y', text: 'y', done: false, position: 12, createdAt: 1, updatedAt: 1 },
      ]
      s().moveItemToCategory('a', 0, 3)
      const moved = s().items[3].find((i) => i.id === 'a')!
      expect(moved.position).toBeLessThan(10)
    })

    it('Phase 5: getLiveItems tiebreaks by id lexicographic compare when positions are equal', () => {
      const state = s()
      // Concurrent-insert scenario: phone added BBB at position 1.5, desktop
      // added AAA at position 1.5. Phase 5 merge keeps both; the comparator
      // here is what produces a deterministic visual order.
      state.items[0] = [
        { id: 'BBB', text: 'b', done: false, position: 1.5, createdAt: 1, updatedAt: 1 },
        { id: 'AAA', text: 'a', done: false, position: 1.5, createdAt: 1, updatedAt: 1 },
        { id: 'CCC', text: 'c', done: false, position: 0.5, createdAt: 1, updatedAt: 1 },
      ]
      const live = s().getLiveItems(0)
      // CCC has smallest position; AAA before BBB by id tiebreak.
      expect(live.map((i) => i.id)).toEqual(['CCC', 'AAA', 'BBB'])
    })

    it('reorderItems minimal-change: moving a single item assigns it a midpoint between new neighbors', () => {
      const state = s()
      state.items[0] = [
        { id: 'a', text: 'a', done: false, position: 1, createdAt: 1, updatedAt: 1 },
        { id: 'b', text: 'b', done: false, position: 2, createdAt: 1, updatedAt: 1 },
        { id: 'c', text: 'c', done: false, position: 3, createdAt: 1, updatedAt: 1 },
        { id: 'd', text: 'd', done: false, position: 4, createdAt: 1, updatedAt: 1 },
      ]
      // User drags 'd' to between 'a' and 'b'. New live order: [a, d, b, c].
      const newOrder = [
        s().items[0].find((i) => i.id === 'a')!,
        s().items[0].find((i) => i.id === 'd')!,
        s().items[0].find((i) => i.id === 'b')!,
        s().items[0].find((i) => i.id === 'c')!,
      ]
      s().reorderItems(0, newOrder)

      const slot = s().items[0]
      const a = slot.find((i) => i.id === 'a')!
      const b = slot.find((i) => i.id === 'b')!
      const c = slot.find((i) => i.id === 'c')!
      const d = slot.find((i) => i.id === 'd')!
      // a, b, c keep their original positions (single-item move).
      expect(a.position).toBe(1)
      expect(b.position).toBe(2)
      expect(c.position).toBe(3)
      // d gets a midpoint between a and b.
      expect(d.position).toBeGreaterThan(1)
      expect(d.position).toBeLessThan(2)
    })
  })

  // ── Phase 5 tombstone GC ──
  // Drops a tombstone when it appears in BOTH the current state AND the local
  // ancestor (meaning it has propagated through ≥1 successful sync; both
  // devices have committed the deletion). RED until Phase 5 Commit 4 ships
  // gcTombstonesAgainst on the slice.

  describe('tombstone GC', () => {
    function emptyAncestor(): AncestorSnapshot {
      return {
        lists: Array.from({ length: CATEGORY_COUNT }, () => []),
        lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
        listsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
          label: `L${i}`, section: 'lists' as const, updatedAt: 0,
        })),
        lockedListsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
          label: `LL${i}`, section: 'lockedLists' as const, updatedAt: 0,
        })),
        scratchpad: Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
        scratchpadCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
          label: `S${i}`, section: 'scratchpad' as const, updatedAt: 0,
        })),
      }
    }

    let logSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      logSpy.mockRestore()
    })

    it('drops tombstone present in both current state and local ancestor', () => {
      s().addItem('a')
      s().addItem('b')
      const aId = s().items[0].find((i) => i.text === 'a')!.id
      s().deleteItem(aId)

      // Local ancestor mirrors the post-sync state: a is tombstoned in it too.
      const ancestor = emptyAncestor()
      ancestor.lists[0] = s().items[0].map((it) => ({ ...it }))

      ;(s() as any).gcTombstonesAgainst(ancestor.lists)

      // After GC: tombstone physically removed from the slot.
      expect(s().items[0]).toHaveLength(1)
      expect(s().items[0].find((i) => i.id === aId)).toBeUndefined()
      expect(s().items[0][0].text).toBe('b')
    })

    it('keeps tombstone present in current state but NOT yet in ancestor', () => {
      s().addItem('a')
      s().addItem('b')
      const aId = s().items[0].find((i) => i.text === 'a')!.id
      s().deleteItem(aId)

      // Ancestor predates the tombstone: a is still live in it.
      const ancestor = emptyAncestor()
      ancestor.lists[0] = [
        { ...s().items[0].find((i) => i.id === aId)!, deleted: false, deletedAt: null },
        { ...s().items[0].find((i) => i.text === 'b')! },
      ]

      ;(s() as any).gcTombstonesAgainst(ancestor.lists)

      // Tombstone preserved - it hasn't been propagated to the other side yet.
      expect(s().items[0]).toHaveLength(2)
      const tomb = s().items[0].find((i) => i.id === aId)!
      expect(tomb.deleted).toBe(true)
    })

    it('keeps tombstone if the ancestor has the item but as live (inconsistent state, do not GC)', () => {
      s().addItem('a')
      const aId = s().items[0][0].id
      s().deleteItem(aId)

      // Ancestor has 'a' as live (impossible in practice but tests the guard).
      const ancestor = emptyAncestor()
      ancestor.lists[0] = [
        { ...s().items[0][0], deleted: false, deletedAt: null },
      ]

      ;(s() as any).gcTombstonesAgainst(ancestor.lists)

      // Don't GC - ancestor disagrees about deleted state.
      expect(s().items[0]).toHaveLength(1)
      expect(s().items[0][0].deleted).toBe(true)
    })
  })
})
