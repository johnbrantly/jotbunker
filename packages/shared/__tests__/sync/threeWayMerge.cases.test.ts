import { describe, it, expect } from 'vitest'
import { mergeThreeWay } from '../../src/sync/threeWayMerge'
import type { AncestorSnapshot } from '../../src/stores/createAncestorSlice'
import type { StoreItem } from '../../src/stores/createItemSlice'
import { CATEGORY_COUNT } from '../../src/constants'

// Phase 5 case-table coverage for the pure-function three-way merge.
//
// 9 cases keyed on (ancestor, phone, desktop) presence/equality, plus
// tombstone-flavored variants, plus concurrent-insert tiebreaker, plus
// same-field LWW conflict resolution.
//
// RED until Commit 2-3 ship `mergeThreeWay`. Tests reference the not-yet-
// existing module so vitest fails to load this file - that's the structural
// RED signal.

function emptyScratchpad() {
  return Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 }))
}

function makeSnapshot(overrides?: Partial<AncestorSnapshot>): AncestorSnapshot {
  return {
    lists: Array.from({ length: CATEGORY_COUNT }, () => []),
    lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
    listsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `L${i}`, section: 'lists' as const, updatedAt: 0,
    })),
    lockedListsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `LL${i}`, section: 'lockedLists' as const, updatedAt: 0,
    })),
    scratchpad: emptyScratchpad(),
    scratchpadCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `S${i}`, section: 'scratchpad' as const, updatedAt: 0,
    })),
    ...overrides,
  }
}

function item(overrides: Partial<StoreItem> & { id: string }): StoreItem {
  return {
    id: overrides.id,
    text: 'default',
    done: false,
    position: 1,
    createdAt: 1,
    updatedAt: 1,
    deleted: false,
    deletedAt: null,
    ...overrides,
  }
}

const findById = (slot: StoreItem[], id: string) => slot.find((it) => it.id === id)

// ── Cases 1-3: presence-based dropping ──

describe('mergeThreeWay case 1: present in ancestor only', () => {
  it('item absent on both phone and desktop is dropped from result', () => {
    const ancestor = makeSnapshot({ lists: [[item({ id: 'X' })], [], [], [], [], []] })
    const phone = makeSnapshot()
    const desktop = makeSnapshot()
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')).toBeUndefined()
  })
})

describe('mergeThreeWay case 2: ancestor + phone, desktop absent', () => {
  it('desktop spliced the item; merge drops it', () => {
    const ancestor = makeSnapshot({ lists: [[item({ id: 'X' })], [], [], [], [], []] })
    const phone = makeSnapshot({ lists: [[item({ id: 'X' })], [], [], [], [], []] })
    const desktop = makeSnapshot()
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')).toBeUndefined()
  })
})

describe('mergeThreeWay case 3: ancestor + desktop, phone absent', () => {
  it('phone spliced the item; merge drops it', () => {
    const ancestor = makeSnapshot({ lists: [[item({ id: 'X' })], [], [], [], [], []] })
    const phone = makeSnapshot()
    const desktop = makeSnapshot({ lists: [[item({ id: 'X' })], [], [], [], [], []] })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')).toBeUndefined()
  })
})

// ── Cases 4-5: additions ──

describe('mergeThreeWay case 4: phone added', () => {
  it('phone-only item is kept in result', () => {
    const ancestor = makeSnapshot()
    const phone = makeSnapshot({ lists: [[item({ id: 'P', text: 'phone added' })], [], [], [], [], []] })
    const desktop = makeSnapshot()
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    const x = findById(merged.lists[0], 'P')
    expect(x).toBeDefined()
    expect(x!.text).toBe('phone added')
  })
})

describe('mergeThreeWay case 5: desktop added', () => {
  it('desktop-only item is kept in result', () => {
    const ancestor = makeSnapshot()
    const phone = makeSnapshot()
    const desktop = makeSnapshot({ lists: [[item({ id: 'D', text: 'desktop added' })], [], [], [], [], []] })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    const x = findById(merged.lists[0], 'D')
    expect(x).toBeDefined()
    expect(x!.text).toBe('desktop added')
  })
})

// ── Case 6: identical ──

describe('mergeThreeWay case 6: identical in all three', () => {
  it('passes the item through unchanged', () => {
    const x = item({ id: 'X', text: 'unchanged', position: 5 })
    const ancestor = makeSnapshot({ lists: [[x], [], [], [], [], []] })
    const phone = makeSnapshot({ lists: [[x], [], [], [], [], []] })
    const desktop = makeSnapshot({ lists: [[x], [], [], [], [], []] })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')).toEqual(x)
  })
})

// ── Cases 7-8: one-sided changes ──

describe('mergeThreeWay case 7: phone changed only', () => {
  it('takes phone\'s version', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'new', updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')!.text).toBe('new')
  })
})

describe('mergeThreeWay case 8: desktop changed only', () => {
  it('takes desktop\'s version', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'new', updatedAt: 200 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')!.text).toBe('new')
  })
})

// ── Case 9: both changed ──

describe('mergeThreeWay case 9a: both changed, different fields', () => {
  it('field-level merge applies both changes', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', done: false, updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'phone-text', done: false, updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', done: true, updatedAt: 250 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    const x = findById(merged.lists[0], 'X')!
    expect(x.text).toBe('phone-text')
    expect(x.done).toBe(true)
  })
})

describe('mergeThreeWay case 9b: same field, phone updatedAt newer', () => {
  it('phone wins LWW', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'phone-version', updatedAt: 300 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'desktop-version', updatedAt: 200 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')!.text).toBe('phone-version')
  })
})

describe('mergeThreeWay case 9c: same field, desktop updatedAt newer', () => {
  it('desktop wins LWW', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'phone-version', updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'desktop-version', updatedAt: 300 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')!.text).toBe('desktop-version')
  })
})

describe('mergeThreeWay case 9d: same field, equal updatedAt - genuine tie', () => {
  it('records a tie entry for dialog surfacing; result has one of the two values (deterministic)', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'phone-version', updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'desktop-version', updatedAt: 200 })], [], [], [], [], []],
    })
    const result = mergeThreeWay(ancestor, phone, desktop)
    expect(result.ties.length).toBeGreaterThan(0)
    const tie = result.ties.find((t) => t.itemId === 'X' && t.field === 'text')
    expect(tie).toBeDefined()
  })
})

// ── Tombstone-flavored variants ──

describe('mergeThreeWay tombstone: phone tombstones, desktop unchanged', () => {
  it('takes phone\'s tombstone via case 7', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', deleted: true, deletedAt: 200, updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    const x = findById(merged.lists[0], 'X')!
    expect(x.deleted).toBe(true)
    expect(x.deletedAt).toBe(200)
  })
})

describe('mergeThreeWay tombstone: phone tombstones, desktop edits text', () => {
  it('field-level merge: tombstone with the desktop edit\'s text (delete wins net effect)', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', deleted: true, deletedAt: 200, updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'desktop-edited', updatedAt: 250 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    const x = findById(merged.lists[0], 'X')!
    expect(x.text).toBe('desktop-edited')
    expect(x.deleted).toBe(true)
    expect(x.deletedAt).toBe(200)
  })
})

describe('mergeThreeWay tombstone: both sides tombstone the same item', () => {
  it('takes the tombstone (identical change on both sides)', () => {
    const ancestor = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', updatedAt: 100 })], [], [], [], [], []],
    })
    const phone = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', deleted: true, deletedAt: 200, updatedAt: 200 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'X', text: 'old', deleted: true, deletedAt: 210, updatedAt: 210 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'X')!.deleted).toBe(true)
  })
})

// ── Concurrent-insert tiebreaker (Section 4) ──

describe('mergeThreeWay concurrent insert: phone X@1.5, desktop Y@1.5', () => {
  it('keeps both items; renderer order via id lexicographic compare is the tiebreak', () => {
    // Use ids 'AAA' and 'BBB' so lexicographic compare is stable.
    const ancestor = makeSnapshot()
    const phone = makeSnapshot({
      lists: [[item({ id: 'AAA', text: 'phone-add', position: 1.5 })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'BBB', text: 'desktop-add', position: 1.5 })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'AAA')).toBeDefined()
    expect(findById(merged.lists[0], 'BBB')).toBeDefined()
    expect(merged.lists[0]).toHaveLength(2)
    // Both items survived merge with same position; the slice's getLiveItems
    // (Phase 5 Commit 5 update) is what enforces the lexicographic order at
    // render time. Merge itself just keeps both.
    expect(findById(merged.lists[0], 'AAA')!.position).toBe(1.5)
    expect(findById(merged.lists[0], 'BBB')!.position).toBe(1.5)
  })
})

// ── Categories ──

describe('mergeThreeWay categories: same-slot label change LWW', () => {
  it('takes the side with newer updatedAt', () => {
    const ancestor = makeSnapshot({
      listsCategories: [
        { label: 'OLD', section: 'lists', updatedAt: 100 },
        { label: 'L1', section: 'lists', updatedAt: 0 },
        { label: 'L2', section: 'lists', updatedAt: 0 },
        { label: 'L3', section: 'lists', updatedAt: 0 },
        { label: 'L4', section: 'lists', updatedAt: 0 },
        { label: 'L5', section: 'lists', updatedAt: 0 },
      ],
    })
    const phone = makeSnapshot({
      listsCategories: [
        { label: 'PHONE', section: 'lists', updatedAt: 200 },
        { label: 'L1', section: 'lists', updatedAt: 0 },
        { label: 'L2', section: 'lists', updatedAt: 0 },
        { label: 'L3', section: 'lists', updatedAt: 0 },
        { label: 'L4', section: 'lists', updatedAt: 0 },
        { label: 'L5', section: 'lists', updatedAt: 0 },
      ],
    })
    const desktop = makeSnapshot({
      listsCategories: [
        { label: 'DESKTOP', section: 'lists', updatedAt: 300 },
        { label: 'L1', section: 'lists', updatedAt: 0 },
        { label: 'L2', section: 'lists', updatedAt: 0 },
        { label: 'L3', section: 'lists', updatedAt: 0 },
        { label: 'L4', section: 'lists', updatedAt: 0 },
        { label: 'L5', section: 'lists', updatedAt: 0 },
      ],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(merged.listsCategories[0].label).toBe('DESKTOP')
  })
})

// ── Scratchpad ──

describe('mergeThreeWay scratchpad: same-slot content change LWW', () => {
  it('takes the side with newer updatedAt', () => {
    const ancestor = makeSnapshot({
      scratchpad: [
        { content: 'old', updatedAt: 100 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })
    const phone = makeSnapshot({
      scratchpad: [
        { content: 'phone', updatedAt: 200 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })
    const desktop = makeSnapshot({
      scratchpad: [
        { content: 'desktop', updatedAt: 300 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })
    const merged = mergeThreeWay(ancestor, phone, desktop).snapshot
    expect(merged.scratchpad[0].content).toBe('desktop')
  })
})

// ── Null ancestor (first sync ever) ──

describe('mergeThreeWay null ancestor: first sync', () => {
  it('treats all items as case-4 / case-5 additions', () => {
    const phone = makeSnapshot({
      lists: [[item({ id: 'P', text: 'phone-only' })], [], [], [], [], []],
    })
    const desktop = makeSnapshot({
      lists: [[item({ id: 'D', text: 'desktop-only' })], [], [], [], [], []],
    })
    const merged = mergeThreeWay(null, phone, desktop).snapshot
    expect(findById(merged.lists[0], 'P')).toBeDefined()
    expect(findById(merged.lists[0], 'D')).toBeDefined()
  })

  it('null ancestor with identical phone/desktop items merges to one copy', () => {
    const x = item({ id: 'X', text: 'shared' })
    const phone = makeSnapshot({ lists: [[x], [], [], [], [], []] })
    const desktop = makeSnapshot({ lists: [[x], [], [], [], [], []] })
    const merged = mergeThreeWay(null, phone, desktop).snapshot
    expect(merged.lists[0]).toHaveLength(1)
    expect(findById(merged.lists[0], 'X')).toBeDefined()
  })
})
