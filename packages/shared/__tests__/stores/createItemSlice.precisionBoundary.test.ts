import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState } from '../../src/stores/createItemSlice'
import { CATEGORY_COUNT } from '../../src/constants'
import type { Category } from '../../src/types'

// Phase 4 critical scenario test. Drives 80 sequential "insert between A and
// the leftmost existing insert" operations. Validates two things at once:
//
// 1. The "between" property holds for every new item - its position lies
//    strictly between its neighbors at the time of insertion.
// 2. The slice produces fractional (non-integer) positions when needed
//    instead of always reassigning to integers. Phase 2's reorderItems
//    reassigned [0..N-1] every call; Phase 4's minimal-change path produces
//    midpoints, which are non-integer for typical gaps.
//
// Iteration count: 80, not 200 as initially scoped. MAX_ITEMS_PER_CATEGORY is
// 100; the slot starts with A + B, so 98 is the hard ceiling. 80 is well past
// the ~52-iteration double-precision midpoint boundary while leaving headroom
// to verify the rebalance kicks in cleanly. Phase 4 Commit 3 ships the
// per-slot rebalance that catches the precision wall and re-spaces; under
// today's slice all positions are integers from recomputeLivePositions, so
// the "non-integer present" assertion below is the structural RED.

let counter = 0

function makeStore() {
  counter = 0
  const defaultCategories: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
    label: `Cat ${i}`,
    section: 'lists' as const,
    updatedAt: 0,
  }))

  const box: { state: ItemSliceState } = {} as any
  const set = (partial: any) => {
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

  return () => box.state
}

describe('precision boundary: 80 inserts at the same gap', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('drives 80 inserts between A and B and preserves correct sort order throughout', () => {
    const s = makeStore()

    // Seed two anchor items with explicit positions. Inject directly so the
    // test doesn't depend on addItem's seeding behavior (which Phase 4 will
    // change). 'A' at position 1, 'B' at position 2.
    s().items[0] = [
      { id: 'A', text: 'A', done: false, position: 1, createdAt: 1, updatedAt: 1 },
      { id: 'B', text: 'B', done: false, position: 2, createdAt: 1, updatedAt: 1 },
    ]

    for (let i = 0; i < 80; i++) {
      // Add a fresh item; addItem prepends it to the slot.
      s().addItem(`x${i}`)
      const live = s().getLiveItems(0)
      const newItem = live.find((it) => it.text === `x${i}`)!
      const A = live.find((it) => it.id === 'A')!
      const B = live.find((it) => it.id === 'B')!
      // Existing inserts (sorted by position) sit between A and B.
      const existingInserts = live.filter(
        (it) => it.id !== 'A' && it.id !== 'B' && it.id !== newItem.id,
      )
      // Build new order: A, newItem, then existing inserts, then B. This
      // places newItem in the same gap (between A and the leftmost existing
      // insert, or between A and B if this is the first iteration).
      const newOrder = [A, newItem, ...existingInserts, B]
      s().reorderItems(0, newOrder)

      // Re-read post-reorder.
      const post = s().getLiveItems(0)
      const postNew = post.find((it) => it.id === newItem.id)!
      const postA = post.find((it) => it.id === 'A')!
      const rightNeighbor = existingInserts.length > 0
        ? post.find((it) => it.id === existingInserts[0].id)!
        : post.find((it) => it.id === 'B')!

      expect(postNew.position).toBeGreaterThan(postA.position)
      expect(postNew.position).toBeLessThan(rightNeighbor.position)
    }

    // After 80 iterations: A, B, plus 80 inserts = 82 live items.
    const final = s().getLiveItems(0)
    expect(final).toHaveLength(82)
    expect(final[0].id).toBe('A')
    expect(final[final.length - 1].id).toBe('B')

    // Phase 4 specifically: at least some positions must be non-integer,
    // proving the midpoint logic kicked in rather than always reassigning
    // to integers. Today's slice always reassigns to integers, so this is
    // RED until Phase 4 Commit 2.
    const hasFractional = final.some((it) => !Number.isInteger(it.position))
    expect(hasFractional).toBe(true)

    logSpy.mockRestore()
  })
})
