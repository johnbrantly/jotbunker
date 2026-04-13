import { describe, it, expect } from 'vitest'
import { mergeItems, mergeCategories } from '../../src/sync/merge'
import type { ListItem, Category } from '../../src/types'
import { CATEGORY_COUNT } from '../../src/constants'

function makeItem(overrides: Partial<ListItem> & { id: string }): ListItem {
  return {
    text: 'item',
    done: false,
    position: 0,
    slot: 0,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

/** Helper: create a ListItem[][] with items placed at the given slot */
function itemsAt(slot: number, items: ListItem[]): ListItem[][] {
  const arr: ListItem[][] = Array.from({ length: CATEGORY_COUNT }, () => [])
  arr[slot] = items
  return arr
}

/** Helper: create an empty ListItem[][] */
function emptyItems(): ListItem[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

describe('mergeItems', () => {
  it('remote wins when it has higher updatedAt', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: 100 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 200 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('remote')
  })

  it('local wins when it has higher updatedAt', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: 300 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 200 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('local')
  })

  it('local wins on equal updatedAt (tie goes to local)', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: 100 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 100 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('local')
  })

  it('adds remote-only items', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [makeItem({ id: 'new', text: 'from remote' })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('new')
  })

  it('keeps local-only items created after remoteSince (offline create)', () => {
    const local = itemsAt(0, [makeItem({ id: 'local-only', createdAt: 500, updatedAt: 500 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, 100)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('local-only')
  })

  it('deletes local-only items older than remoteSince (remote deletion)', () => {
    const local = itemsAt(0, [makeItem({ id: 'old-local', createdAt: 50, updatedAt: 50 })])
    const remote = emptyItems()

    // remoteSince must exceed createdAt + CLOCK_SKEW_GRACE (500ms)
    const merged = mergeItems(local, remote, 100000)
    expect(merged[0]).toHaveLength(0)
  })

  it('remote deletion wins over local offline edit', () => {
    const local = itemsAt(0, [makeItem({ id: 'edited', createdAt: 50, updatedAt: 150 })])
    const remote = emptyItems()

    // remoteSince must exceed createdAt + CLOCK_SKEW_GRACE (500ms)
    const merged = mergeItems(local, remote, 100000)
    expect(merged[0]).toHaveLength(0)
  })

  it('item created AND edited offline survives', () => {
    const local = itemsAt(0, [makeItem({ id: 'new-edited', createdAt: 200, updatedAt: 300 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, 100)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('new-edited')
  })

  it('first-ever sync deletes nothing (remoteSince=0)', () => {
    const local = itemsAt(0, [makeItem({ id: 'old', createdAt: 50, updatedAt: 150 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('old')
  })

  it('recomputes positions sequentially after merge', () => {
    const local = itemsAt(0, [
      makeItem({ id: 'a', position: 0, updatedAt: 100 }),
      makeItem({ id: 'b', position: 1, updatedAt: 100 }),
    ])
    const remote = itemsAt(0, [
      makeItem({ id: 'c', position: 0, updatedAt: 200 }),
      makeItem({ id: 'a', position: 1, updatedAt: 200 }),
    ])

    const merged = mergeItems(local, remote, 0)
    const positions = merged[0].map((i) => i.position)
    expect(positions).toEqual([0, 1, 2])
  })

  it('handles multi-slot merge', () => {
    const local = emptyItems()
    local[0] = [makeItem({ id: 'w1', slot: 0, updatedAt: 100 })]
    local[1] = [makeItem({ id: 'f1', slot: 1, updatedAt: 100 })]

    const remote = emptyItems()
    remote[0] = [makeItem({ id: 'w2', slot: 0, updatedAt: 200 })]
    remote[2] = [makeItem({ id: 'p1', slot: 2, updatedAt: 200 })]

    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(2)
    expect(merged[1]).toHaveLength(1)
    expect(merged[2]).toHaveLength(1)
  })

  it('handles empty local and remote', () => {
    const merged = mergeItems(emptyItems(), emptyItems(), 0)
    for (let i = 0; i < CATEGORY_COUNT; i++) {
      expect(merged[i]).toEqual([])
    }
  })

  it('sorts merged items by position before recomputing', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [
      makeItem({ id: 'b', position: 5, updatedAt: 100 }),
      makeItem({ id: 'a', position: 2, updatedAt: 100 }),
      makeItem({ id: 'c', position: 8, updatedAt: 100 }),
    ])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0].map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(merged[0].map((i) => i.position)).toEqual([0, 1, 2])
  })
})

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    label: 'Default',
    section: 'lists',
    updatedAt: 1000,
    ...overrides,
  }
}

/** Helper: create a Category[] with a category at the given slot */
function catsWithSlot(entries: { slot: number; cat: Category }[]): Category[] {
  const arr: Category[] = Array.from({ length: CATEGORY_COUNT }, () => ({
    label: '',
    section: 'lists' as const,
    updatedAt: 0,
  }))
  for (const { slot, cat } of entries) {
    arr[slot] = cat
  }
  return arr
}

describe('mergeCategories', () => {
  it('remote wins when it has higher updatedAt', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'URGENT', updatedAt: 200 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('URGENT')
  })

  it('local wins when it has higher updatedAt', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'LOCAL', updatedAt: 300 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'REMOTE', updatedAt: 200 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('LOCAL')
  })

  it('local wins on equal updatedAt (tie goes to local)', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'LOCAL', updatedAt: 100 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'REMOTE', updatedAt: 100 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('LOCAL')
  })

  it('remote slot data fills in default local slot', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) }])
    const remote = catsWithSlot([
      { slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) },
      { slot: 1, cat: makeCategory({ label: 'WORK', updatedAt: 200 }) },
    ])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('ASAP')
    expect(result[1].label).toBe('WORK')
  })

  it('returns local when remote has all defaults', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) }])
    const remote: Category[] = Array.from({ length: CATEGORY_COUNT }, () => ({
      label: '',
      section: 'lists' as const,
      updatedAt: 0,
    }))

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('ASAP')
  })

  it('returns remote when local has all defaults', () => {
    const local: Category[] = Array.from({ length: CATEGORY_COUNT }, () => ({
      label: '',
      section: 'lists' as const,
      updatedAt: 0,
    }))
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('ASAP')
  })

  it('phone rename survives when disconnected (the bug this fixes)', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'WORK-RENAMED', updatedAt: 200 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'WORK', updatedAt: 100 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('WORK-RENAMED')
  })

  it('both sides rename same category — higher updatedAt wins', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'LOCAL-NAME', updatedAt: 300 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'REMOTE-NAME', updatedAt: 400 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('REMOTE-NAME')
  })

  it('merge preserves categories from different sections', () => {
    const local: Category[] = Array.from({ length: CATEGORY_COUNT }, () => ({
      label: '',
      section: 'lists' as const,
      updatedAt: 0,
    }))
    local[0] = makeCategory({ label: 'ASAP', section: 'lists', updatedAt: 100 })
    local[1] = makeCategory({ label: 'NAMES', section: 'lockedLists', updatedAt: 100 })

    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'URGENT', section: 'lists', updatedAt: 200 }) }])

    const result = mergeCategories(local, remote)
    expect(result).toHaveLength(CATEGORY_COUNT)
    expect(result[0].label).toBe('URGENT')
    expect(result[1].label).toBe('NAMES')
  })

  it('one side renames slot while other has default', () => {
    const local: Category[] = Array.from({ length: CATEGORY_COUNT }, () => ({
      label: '',
      section: 'lists' as const,
      updatedAt: 0,
    }))
    local[0] = makeCategory({ label: 'ASAP-RENAMED', updatedAt: 200 })
    local[1] = makeCategory({ label: 'NEW', updatedAt: 300 })

    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'ASAP', updatedAt: 100 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('ASAP-RENAMED')
    expect(result[1].label).toBe('NEW')
  })
})

describe('mergeItems — CLOCK_SKEW_GRACE boundary', () => {
  // CLOCK_SKEW_GRACE is 500ms in merge.ts (reduced from 5000 in be82886)
  const GRACE = 500

  it('keeps item when remoteSince is exactly at createdAt + grace', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', createdAt: 1000, updatedAt: 1000 })])
    const remote = emptyItems()

    // remoteSince === createdAt + GRACE -> NOT greater, so item is kept
    const merged = mergeItems(local, remote, 1000 + GRACE)
    expect(merged[0]).toHaveLength(1)
  })

  it('deletes item when remoteSince exceeds createdAt + grace by 1ms', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', createdAt: 1000, updatedAt: 1000 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, 1000 + GRACE + 1)
    expect(merged[0]).toHaveLength(0)
  })

  it('keeps item when remoteSince is within grace window', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', createdAt: 1000, updatedAt: 1000 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, 1000 + GRACE - 1)
    expect(merged[0]).toHaveLength(1)
  })
})

describe('mergeItems — localSince symmetric deletion', () => {
  const GRACE = 500

  it('drops remote-only item when localSince > createdAt + grace (local deleted it)', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [makeItem({ id: 'deleted', createdAt: 1000, updatedAt: 1500 })])

    const merged = mergeItems(local, remote, 0, 1000 + GRACE + 1)
    expect(merged[0]).toHaveLength(0)
  })

  it('keeps remote-only item when localSince <= createdAt + grace (new remote item)', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [makeItem({ id: 'new', createdAt: 1000, updatedAt: 1500 })])

    const merged = mergeItems(local, remote, 0, 1000 + GRACE)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('new')
  })

  it('keeps remote-only item when localSince is 0 (first sync)', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [makeItem({ id: 'a', createdAt: 50 })])

    const merged = mergeItems(local, remote, 0, 0)
    expect(merged[0]).toHaveLength(1)
  })

  it('keeps remote-only item when localSince is undefined (backward compat)', () => {
    const local = emptyItems()
    const remote = itemsAt(0, [makeItem({ id: 'a', createdAt: 50 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(1)
  })

  it('both-side deletion: local deleted + remote deleted different items', () => {
    // Local has item B (created offline), remote has item A (local deleted it)
    const local = itemsAt(0, [makeItem({ id: 'b', createdAt: 50000, updatedAt: 50000 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', createdAt: 1000, updatedAt: 1500 })])

    // remoteSince=40000 means remote knew about B (40000 > 50000? No — B is newer, so kept)
    // localSince=40000 means local knew about A (40000 > 1000+5000? Yes — A is deleted)
    const merged = mergeItems(local, remote, 40000, 40000)
    expect(merged[0]).toHaveLength(1)
    expect(merged[0][0].id).toBe('b')
  })
})

describe('mergeItems — adversarial timestamps', () => {
  it('negative updatedAt: item with updatedAt=-1 loses to updatedAt=100', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: -1 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 100 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('remote')
  })

  it('zero updatedAt on both sides: tie goes to local', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: 0 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 0 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('local')
  })

  it('Number.MAX_SAFE_INTEGER updatedAt: remote with max timestamp wins', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: 100 })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: Number.MAX_SAFE_INTEGER })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('remote')
  })

  it('remoteSince of MAX_SAFE_INTEGER deletes all local-only items', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', createdAt: 1000, updatedAt: 1000 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, Number.MAX_SAFE_INTEGER)
    expect(merged[0]).toHaveLength(0)
  })

  it('negative remoteSince: does not delete anything', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', createdAt: 50, updatedAt: 50 })])
    const remote = emptyItems()

    const merged = mergeItems(local, remote, -1)
    expect(merged[0]).toHaveLength(1)
  })

  it('both sides have MAX_SAFE_INTEGER updatedAt: tie goes to local', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: Number.MAX_SAFE_INTEGER })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: Number.MAX_SAFE_INTEGER })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('local')
  })
})

describe('mergeCategories — adversarial timestamps', () => {
  it('negative updatedAt: lower side loses', () => {
    const local = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'LOCAL', updatedAt: -1 }) }])
    const remote = catsWithSlot([{ slot: 0, cat: makeCategory({ label: 'REMOTE', updatedAt: 100 }) }])

    const result = mergeCategories(local, remote)
    expect(result[0].label).toBe('REMOTE')
  })
})

describe('mergeItems — additional adversarial timestamps', () => {
  it('both clocks identical (same since): all items survive, no spurious deletions', () => {
    const since = 5000
    const local = itemsAt(0, [
      makeItem({ id: 'a', createdAt: 1000, updatedAt: 3000 }),
      makeItem({ id: 'b', createdAt: 2000, updatedAt: 4000 }),
    ])
    const remote = itemsAt(0, [
      makeItem({ id: 'a', createdAt: 1000, updatedAt: 3000 }),
      makeItem({ id: 'b', createdAt: 2000, updatedAt: 4000 }),
    ])

    const merged = mergeItems(local, remote, since, since)
    expect(merged[0]).toHaveLength(2)
    expect(merged[0].map(i => i.id).sort()).toEqual(['a', 'b'])
  })

  it('NaN as updatedAt does not crash and does not delete valid items', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: NaN })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 100 })])

    // Should not throw
    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(1)
  })

  it('Infinity as updatedAt: Infinity side wins', () => {
    const local = itemsAt(0, [makeItem({ id: 'a', text: 'local', updatedAt: Infinity })])
    const remote = itemsAt(0, [makeItem({ id: 'a', text: 'remote', updatedAt: 100 })])

    const merged = mergeItems(local, remote, 0)
    expect(merged[0][0].text).toBe('local')
  })

  it('remote clock 1 hour ahead: remote-only items do not delete recent local items', () => {
    const now = Date.now()
    const local = itemsAt(0, [makeItem({ id: 'local-recent', createdAt: now - 1000, updatedAt: now - 500 })])
    const remote = itemsAt(0, [makeItem({ id: 'remote-only', createdAt: now + 3600000, updatedAt: now + 3600000 })])

    // remoteSince is from 1 hour ago — local item was created recently
    const merged = mergeItems(local, remote, now - 3600000)
    expect(merged[0].find(i => i.id === 'local-recent')).toBeDefined()
    expect(merged[0].find(i => i.id === 'remote-only')).toBeDefined()
  })

  it('merge with 0 items on one side, many on the other — no crashes', () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      makeItem({ id: `item-${i}`, createdAt: i * 100, updatedAt: i * 100 }),
    )
    const local = emptyItems()
    const remote = itemsAt(0, items)

    const merged = mergeItems(local, remote, 0)
    expect(merged[0]).toHaveLength(100)

    // Reverse: many local, empty remote, remoteSince=0 (first sync) -> all kept
    const merged2 = mergeItems(itemsAt(0, items), emptyItems(), 0)
    expect(merged2[0]).toHaveLength(100)
  })
})

// Cross-slot deduplication was removed — items reference a fixed slot
// and can't drift between slots during merge.
