import { describe, it, expect } from 'vitest'
import { mergeThreeWay } from '../../src/sync/threeWayMerge'
import type { AncestorSnapshot } from '../../src/stores/createAncestorSlice'
import type { StoreItem } from '../../src/stores/createItemSlice'
import { CATEGORY_COUNT } from '../../src/constants'

// Phase 5 critical scenario: a multi-mutation real-world case that exercises
// at least 6 of the 9 cases plus field-level merge plus a concurrent-insert
// tiebreaker plus scratchpad LWW. Proves the merge algorithm composes
// correctly across realistic workflows, not just in isolated cases.
//
// RED until Commits 2-3 ship `mergeThreeWay`.

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

function it_(overrides: Partial<StoreItem> & { id: string }): StoreItem {
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

describe('Phase 5 critical scenario: real-world multi-mutation merge', () => {
  it('composes case 4 + 5 + 7 + 7-tombstone + 8 + 9-different-fields + concurrent-insert + scratchpad-LWW', () => {
    // ── Ancestor: state at last sync ──
    // 3 items in lists slot 0, 2 items in lockedLists slot 1, scratchpad slot 0 + 1.
    const ancestor = makeSnapshot({
      lists: [
        [
          it_({ id: 'L1', text: 'list item 1', position: 1, updatedAt: 100 }),
          it_({ id: 'L2', text: 'list item 2', position: 2, updatedAt: 100 }),
          it_({ id: 'L3', text: 'list item 3', position: 3, updatedAt: 100 }),
        ],
        [], [], [], [], [],
      ],
      lockedLists: [
        [],
        [
          it_({ id: 'LL1', text: 'locked 1', position: 1, updatedAt: 100 }),
          it_({ id: 'LL2', text: 'locked 2', position: 2, updatedAt: 100 }),
        ],
        [], [], [], [],
      ],
      scratchpad: [
        { content: 'sp slot 0 ancestor', updatedAt: 100 },
        { content: 'sp slot 1 ancestor', updatedAt: 100 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })

    // ── Phone mutations since last sync ──
    // - addItem AAA at position 1.5 in lists slot 0 (case 4)
    // - edit text on L1 (case 7)
    // - tombstone LL1 (case 7-tombstone)
    // - edit scratchpad slot 0 with updatedAt 200 (LWW - desktop is later, so phone loses)
    const phone = makeSnapshot({
      lists: [
        [
          it_({ id: 'L1', text: 'L1 EDITED on phone', position: 1, updatedAt: 200 }),
          it_({ id: 'AAA', text: 'phone added', position: 1.5, updatedAt: 200, createdAt: 200 }),
          it_({ id: 'L2', text: 'list item 2', position: 2, updatedAt: 100 }),
          it_({ id: 'L3', text: 'list item 3', position: 3, updatedAt: 100 }),
        ],
        [], [], [], [], [],
      ],
      lockedLists: [
        [],
        [
          it_({ id: 'LL1', text: 'locked 1', position: 1, deleted: true, deletedAt: 250, updatedAt: 250 }),
          it_({ id: 'LL2', text: 'locked 2', position: 2, updatedAt: 100 }),
        ],
        [], [], [], [],
      ],
      scratchpad: [
        { content: 'sp slot 0 EDITED on phone', updatedAt: 200 },
        { content: 'sp slot 1 ancestor', updatedAt: 100 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })

    // ── Desktop mutations since last sync ──
    // - addItem BBB at position 1.5 in lists slot 0 (case 5; concurrent insert with AAA)
    // - toggle done on L1 (case 9 different-field with phone's text edit; field-level merge applies BOTH)
    // - edit text on LL2 (case 8)
    // - edit scratchpad slot 0 with updatedAt 300 (LATER than phone; desktop wins LWW)
    const desktop = makeSnapshot({
      lists: [
        [
          it_({ id: 'L1', text: 'list item 1', done: true, position: 1, updatedAt: 250 }),
          it_({ id: 'BBB', text: 'desktop added', position: 1.5, updatedAt: 200, createdAt: 200 }),
          it_({ id: 'L2', text: 'list item 2', position: 2, updatedAt: 100 }),
          it_({ id: 'L3', text: 'list item 3', position: 3, updatedAt: 100 }),
        ],
        [], [], [], [], [],
      ],
      lockedLists: [
        [],
        [
          it_({ id: 'LL1', text: 'locked 1', position: 1, updatedAt: 100 }),
          it_({ id: 'LL2', text: 'locked 2 EDITED on desktop', position: 2, updatedAt: 250 }),
        ],
        [], [], [], [],
      ],
      scratchpad: [
        { content: 'sp slot 0 EDITED on desktop', updatedAt: 300 },
        { content: 'sp slot 1 ancestor', updatedAt: 100 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })

    const result = mergeThreeWay(ancestor, phone, desktop)
    const merged = result.snapshot

    // ── Lists slot 0 ──
    const slot0 = merged.lists[0]

    // L1: case 9 different-field merge - phone's text + desktop's done, max updatedAt.
    const L1 = findById(slot0, 'L1')!
    expect(L1).toBeDefined()
    expect(L1.text).toBe('L1 EDITED on phone')
    expect(L1.done).toBe(true)
    expect(L1.position).toBe(1)
    expect(L1.updatedAt).toBe(250)

    // AAA: case 4 (phone-only add) - kept.
    const AAA = findById(slot0, 'AAA')!
    expect(AAA).toBeDefined()
    expect(AAA.text).toBe('phone added')
    expect(AAA.position).toBe(1.5)

    // BBB: case 5 (desktop-only add) - kept.
    const BBB = findById(slot0, 'BBB')!
    expect(BBB).toBeDefined()
    expect(BBB.text).toBe('desktop added')
    expect(BBB.position).toBe(1.5)

    // L2 / L3: case 6 (identical) - unchanged.
    expect(findById(slot0, 'L2')!.text).toBe('list item 2')
    expect(findById(slot0, 'L3')!.text).toBe('list item 3')

    // Slot 0 has 5 items total (L1, AAA, BBB, L2, L3).
    expect(slot0).toHaveLength(5)

    // ── Lists slot 0: concurrent-insert tiebreak ──
    // AAA and BBB both at position 1.5; lexicographic id compare: AAA < BBB.
    // The merge keeps both items; ordering is enforced by the slice's
    // getLiveItems comparator (Phase 5 Commit 5). Verify both have same
    // position - the comparator-side test lives elsewhere.
    expect(AAA.position).toBe(BBB.position)

    // ── Locked lists slot 1 ──
    const ll1 = findById(merged.lockedLists[1], 'LL1')!
    expect(ll1).toBeDefined()
    expect(ll1.deleted).toBe(true)
    expect(ll1.deletedAt).toBe(250)

    const ll2 = findById(merged.lockedLists[1], 'LL2')!
    expect(ll2).toBeDefined()
    expect(ll2.text).toBe('locked 2 EDITED on desktop')
    expect(ll2.updatedAt).toBe(250)

    // ── Scratchpad slot 0: desktop's content wins (updatedAt 300 > 200) ──
    expect(merged.scratchpad[0].content).toBe('sp slot 0 EDITED on desktop')
    expect(merged.scratchpad[0].updatedAt).toBe(300)

    // ── Scratchpad slot 1: identical on both, unchanged ──
    expect(merged.scratchpad[1].content).toBe('sp slot 1 ancestor')

    // ── No genuine ties ──
    // Same-field equal-updatedAt would surface; this scenario has no such case.
    expect(result.ties).toHaveLength(0)
  })
})
