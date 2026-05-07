import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mergeThreeWay } from '../../src/sync/threeWayMerge'
import type { MergedResult, MergeTie } from '../../src/sync/threeWayMerge'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState, StoreItem } from '../../src/stores/createItemSlice'
import { createAncestorSlice } from '../../src/stores/createAncestorSlice'
import type {
  AncestorSliceState,
  AncestorSnapshot,
} from '../../src/stores/createAncestorSlice'
import type { Category } from '../../src/types'
import { CATEGORY_COUNT } from '../../src/constants'

// Phase 5.5 critical scenario: full end-to-end cutover behavior. Drives a
// simulated post-cutover sync where the merged snapshot is applied on both
// sides (replacing the old "pick a side" wholesale-replace), ancestors
// commit, tombstones GC, ties surface to a (simulated) dialog.
//
// RED until:
// - Commit 2 ships `MergedResult.summary` (this test asserts on result.summary.counts)
// - Commit 4 ships the apply-snapshot wiring on both platforms (proven indirectly here)

interface ScratchpadEntry { content: string; updatedAt: number }
interface ScratchpadState { contents: ScratchpadEntry[]; categories: Category[] }

function emptyScratchpad(): ScratchpadState {
  return {
    contents: Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
    categories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `S${i}`, section: 'scratchpad' as const, updatedAt: 0,
    })),
  }
}

function makeBox<S>(initialiser: (set: any, get: any) => S): { state: S } {
  const box: { state: S } = {} as any
  const set = (partial: any) => {
    if (typeof partial === 'function') {
      const result = partial(box.state)
      box.state = { ...(box.state as any), ...result }
    } else {
      box.state = { ...(box.state as any), ...partial }
    }
  }
  const get = () => box.state
  box.state = initialiser(set, get)
  return box
}

function makeSide(seed: string) {
  let counter = 0
  const listsDefaults: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
    label: `Cat ${i}`, section: 'lists' as const, updatedAt: 0,
  }))
  const lockedDefaults: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
    label: `LCat ${i}`, section: 'lockedLists' as const, updatedAt: 0,
  }))

  const lists = makeBox<ItemSliceState>(createItemSlice({
    defaultCategories: listsDefaults,
    generateUUID: () => `${seed}-l-${++counter}`,
  }))
  const lockedLists = makeBox<ItemSliceState>(createItemSlice({
    defaultCategories: lockedDefaults,
    generateUUID: () => `${seed}-ll-${++counter}`,
  }))
  const scratchpad: { state: ScratchpadState } = { state: emptyScratchpad() }
  const ancestor = makeBox<AncestorSliceState>(createAncestorSlice({}))

  return { lists, lockedLists, scratchpad, ancestor, seed }
}

type Side = ReturnType<typeof makeSide>

function snapshotOf(side: Side): AncestorSnapshot {
  return {
    lists: side.lists.state.items,
    lockedLists: side.lockedLists.state.items,
    listsCategories: side.lists.state.categories,
    lockedListsCategories: side.lockedLists.state.categories,
    scratchpad: side.scratchpad.state.contents,
    scratchpadCategories: side.scratchpad.state.categories,
  }
}

function applySnapshot(side: Side, snapshot: AncestorSnapshot): void {
  // Mirrors the post-cutover apply path: a single setState per store from the
  // merged snapshot. Replaces the Phase 3-era wholesale-replace setState
  // calls in handleSyncConfirm / handleStateSync.
  side.lists.state = {
    ...side.lists.state,
    items: snapshot.lists,
    categories: snapshot.listsCategories,
  }
  side.lockedLists.state = {
    ...side.lockedLists.state,
    items: snapshot.lockedLists,
    categories: snapshot.lockedListsCategories,
  }
  side.scratchpad.state = {
    contents: snapshot.scratchpad,
    categories: snapshot.scratchpadCategories,
  }
}

/**
 * Simulator for the post-cutover sync flow: compute mergeThreeWay, resolve
 * ties via the supplied tiePicks (or fail the test if there are unresolved
 * ties), apply the snapshot on both sides, commit ancestors, GC tombstones.
 */
function simulateCutoverSync(
  phone: Side,
  desktop: Side,
  ancestor: AncestorSnapshot | null,
  tiePicks: Map<string, 'phone' | 'desktop'> = new Map(),
): MergedResult {
  const result = mergeThreeWay(ancestor, snapshotOf(phone), snapshotOf(desktop))

  let finalSnapshot = result.snapshot

  if (result.ties.length > 0) {
    // Apply user picks. For tied items, replace the merged-default value with
    // the chosen side's value. Test must supply picks for every tie.
    const phoneSnap = snapshotOf(phone)
    const desktopSnap = snapshotOf(desktop)
    finalSnapshot = applyTiePicks(finalSnapshot, result.ties, tiePicks, phoneSnap, desktopSnap)
  }

  applySnapshot(phone, finalSnapshot)
  applySnapshot(desktop, finalSnapshot)

  phone.ancestor.state.commit(finalSnapshot)
  desktop.ancestor.state.commit(finalSnapshot)

  phone.lists.state.gcTombstonesAgainst(finalSnapshot.lists)
  phone.lockedLists.state.gcTombstonesAgainst(finalSnapshot.lockedLists)
  desktop.lists.state.gcTombstonesAgainst(finalSnapshot.lists)
  desktop.lockedLists.state.gcTombstonesAgainst(finalSnapshot.lockedLists)

  return { ...result, snapshot: finalSnapshot }
}

function applyTiePicks(
  snapshot: AncestorSnapshot,
  ties: MergeTie[],
  picks: Map<string, 'phone' | 'desktop'>,
  phone: AncestorSnapshot,
  desktop: AncestorSnapshot,
): AncestorSnapshot {
  // Test-side helper: for each tie, look up the user's pick and replace the
  // merged-default value with phone's or desktop's value at that field.
  // The production dialog will do the equivalent at the renderer.
  const result: AncestorSnapshot = JSON.parse(JSON.stringify(snapshot))
  for (const tie of ties) {
    const tieKey = `${tie.section}:${tie.slot}:${tie.itemId ?? ''}:${tie.field}`
    const pick = picks.get(tieKey)
    if (!pick) throw new Error(`Test did not supply pick for tie ${tieKey}`)
    const winningSnap = pick === 'phone' ? phone : desktop
    if (tie.section === 'lists' || tie.section === 'lockedLists') {
      const slot = result[tie.section][tie.slot]
      const winnerSlot = winningSnap[tie.section][tie.slot]
      const winnerItem = winnerSlot.find((it) => it.id === tie.itemId)!
      const idx = slot.findIndex((it) => it.id === tie.itemId)
      ;(slot[idx] as Record<string, unknown>)[tie.field] = (winnerItem as Record<string, unknown>)[tie.field]
    } else if (tie.section === 'scratchpad') {
      const winnerEntry = winningSnap.scratchpad[tie.slot]
      result.scratchpad[tie.slot] = {
        ...result.scratchpad[tie.slot],
        [tie.field]: (winnerEntry as Record<string, unknown>)[tie.field],
      }
    }
  }
  return result
}

const findById = (slot: StoreItem[], id: string) => slot.find((it) => it.id === id)

describe('Phase 5.5 critical scenario: post-cutover end-to-end', () => {
  let phone: Side
  let desktop: Side
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    phone = makeSide('phone')
    desktop = makeSide('desktop')
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('composes case 4 + 5 + 7 + 8 + 9-different-fields + concurrent-insert + scratchpad-LWW + tombstone + tie', () => {
    // ── Ancestor: established post-last-sync state ──
    const ancestor: AncestorSnapshot = {
      lists: [
        [
          { id: 'L1', text: 'list 1', done: false, position: 1, createdAt: 1, updatedAt: 100, deleted: false, deletedAt: null },
          { id: 'L2', text: 'list 2', done: false, position: 2, createdAt: 1, updatedAt: 100, deleted: false, deletedAt: null },
        ],
        [], [], [], [], [],
      ],
      lockedLists: [
        [
          { id: 'LL1', text: 'locked 1', done: false, position: 1, createdAt: 1, updatedAt: 100, deleted: false, deletedAt: null },
        ],
        [], [], [], [], [],
      ],
      listsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
        label: `Cat ${i}`, section: 'lists' as const, updatedAt: 0,
      })),
      lockedListsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
        label: `LCat ${i}`, section: 'lockedLists' as const, updatedAt: 0,
      })),
      scratchpad: [
        { content: 'sp slot 0 ancestor', updatedAt: 100 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
      scratchpadCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
        label: `S${i}`, section: 'scratchpad' as const, updatedAt: 0,
      })),
    }

    // ── Phone state since last sync ──
    // - Case 4: added AAA at position 1.5
    // - Case 7: edited L1 text
    // - Case 9 different-fields: edited L1 text (already counted above)
    // - Tombstone: deleted LL1
    // - Concurrent insert: AAA at 1.5 (collides with desktop's BBB below)
    // - Tie: scratchpad slot 0 edited at updatedAt 200 (desktop also edits at 200 -> tie)
    phone.lists.state.items = [
      [
        { id: 'L1', text: 'L1 phone-edited', done: false, position: 1, createdAt: 1, updatedAt: 200, deleted: false, deletedAt: null },
        { id: 'AAA', text: 'phone added', done: false, position: 1.5, createdAt: 200, updatedAt: 200, deleted: false, deletedAt: null },
        { id: 'L2', text: 'list 2', done: false, position: 2, createdAt: 1, updatedAt: 100, deleted: false, deletedAt: null },
      ],
      [], [], [], [], [],
    ]
    phone.lockedLists.state.items = [
      [
        { id: 'LL1', text: 'locked 1', done: false, position: 1, createdAt: 1, updatedAt: 250, deleted: true, deletedAt: 250 },
      ],
      [], [], [], [], [],
    ]
    phone.scratchpad.state.contents = [
      { content: 'sp slot 0 phone-edit', updatedAt: 200 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
    ]

    // ── Desktop state since last sync ──
    // - Case 5: added BBB at position 1.5 (collides with phone's AAA)
    // - Case 9 different-fields: toggled L1 done (paired with phone's L1 text edit)
    // - Case 8: edited L2 text
    // - Tie: scratchpad slot 0 edited at updatedAt 200 (matches phone's updatedAt)
    desktop.lists.state.items = [
      [
        { id: 'L1', text: 'list 1', done: true, position: 1, createdAt: 1, updatedAt: 250, deleted: false, deletedAt: null },
        { id: 'BBB', text: 'desktop added', done: false, position: 1.5, createdAt: 200, updatedAt: 200, deleted: false, deletedAt: null },
        { id: 'L2', text: 'L2 desktop-edited', done: false, position: 2, createdAt: 1, updatedAt: 250, deleted: false, deletedAt: null },
      ],
      [], [], [], [], [],
    ]
    desktop.lockedLists.state.items = [
      [
        { id: 'LL1', text: 'locked 1', done: false, position: 1, createdAt: 1, updatedAt: 100, deleted: false, deletedAt: null },
      ],
      [], [], [], [], [],
    ]
    desktop.scratchpad.state.contents = [
      { content: 'sp slot 0 desktop-edit', updatedAt: 200 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
      { content: '', updatedAt: 0 },
    ]

    // User resolves the scratchpad slot 0 tie: pick desktop.
    const tiePicks = new Map<string, 'phone' | 'desktop'>([
      ['scratchpad:0::content', 'desktop'],
    ])

    const result = simulateCutoverSync(phone, desktop, ancestor, tiePicks)

    // ── Convergence: both sides hold the same merged state ──
    expect(snapshotOf(phone)).toEqual(snapshotOf(desktop))

    // ── Both ancestors committed and equal ──
    expect(phone.ancestor.state.record).not.toBeNull()
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record!.snapshot).toEqual(desktop.ancestor.state.record!.snapshot)

    // ── Lists slot 0: case-resolved correctly ──
    const phoneSlot0 = phone.lists.state.items[0]
    const L1 = findById(phoneSlot0, 'L1')!
    expect(L1).toBeDefined()
    expect(L1.text).toBe('L1 phone-edited')   // phone's text (case 7)
    expect(L1.done).toBe(true)                  // desktop's done (case 9 different-fields)
    expect(findById(phoneSlot0, 'AAA')).toBeDefined()  // case 4
    expect(findById(phoneSlot0, 'BBB')).toBeDefined()  // case 5
    expect(findById(phoneSlot0, 'L2')!.text).toBe('L2 desktop-edited')  // case 8

    // ── Locked lists: tombstone propagated AND GC'd (it's in the ancestor now) ──
    // After GC, the tombstoned LL1 is physically removed from raw storage.
    expect(phone.lockedLists.state.items[0]).toHaveLength(0)
    expect(desktop.lockedLists.state.items[0]).toHaveLength(0)

    // ── Scratchpad: desktop's value wins via tie pick ──
    expect(phone.scratchpad.state.contents[0].content).toBe('sp slot 0 desktop-edit')

    // ── Result has a summary field with counts (Commit 2 add) ──
    expect(result.summary).toBeDefined()
    expect(result.summary.counts).toBeDefined()
    expect(result.summary.counts.addedFromPhone).toBe(1)    // AAA
    expect(result.summary.counts.addedFromDesktop).toBe(1)  // BBB
    // Case 9 different-fields on L1 (phone text + desktop done) and case 8
    // on L2 (desktop edited text) both classify as editedField.
    expect(result.summary.counts.editedField).toBe(2)
    // LL1 ended up tombstoned via case 7 (phone deleted, desktop unchanged).
    expect(result.summary.counts.tombstoned).toBe(1)
    // Scratchpad slot 0 same-content-different-side at equal updatedAt - tie.
    expect(result.summary.counts.ties).toBe(1)

    logSpy.mockRestore()
  })
})
