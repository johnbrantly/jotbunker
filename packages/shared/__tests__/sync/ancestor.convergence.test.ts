import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState } from '../../src/stores/createItemSlice'
import { createAncestorSlice } from '../../src/stores/createAncestorSlice'
import type {
  AncestorSnapshot,
  AncestorSliceState,
} from '../../src/stores/createAncestorSlice'
import type { Category } from '../../src/types'
import { CATEGORY_COUNT } from '../../src/constants'

// Pins down Phase 3's convergence guarantee: after a successful sync, both
// phone and desktop ancestors hold the same post-sync snapshot, and each
// side's ancestor matches its own live state at that moment. Also locks in
// the deliberate one-sided commit under Strategy A's documented mid-handshake
// failure mode.
//
// The shared test simulates the post-Commit-3+4 handshake outcomes inline -
// same approach as Phase 1's stateSync.idDurability and Phase 2's
// stateSync.tombstoneDurability. Real platform handler wiring is exercised
// by manual real-device tests per the Phase 3 definition-of-done.

interface ScratchpadEntry { content: string; updatedAt: number }
interface ScratchpadState {
  contents: ScratchpadEntry[]
  categories: Category[]
}

function emptyScratchpad(): ScratchpadState {
  return {
    contents: Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
    categories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `S${i}`,
      section: 'scratchpad' as const,
      updatedAt: 0,
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
    label: `Cat ${i}`,
    section: 'lists' as const,
    updatedAt: 0,
  }))
  const lockedDefaults: Category[] = Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
    label: `LCat ${i}`,
    section: 'lockedLists' as const,
    updatedAt: 0,
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

function buildSnapshot(side: Side): AncestorSnapshot {
  return {
    lists: side.lists.state.items,
    lockedLists: side.lockedLists.state.items,
    listsCategories: side.lists.state.categories,
    lockedListsCategories: side.lockedLists.state.categories,
    scratchpad: side.scratchpad.state.contents,
    scratchpadCategories: side.scratchpad.state.categories,
  }
}

function applyWholesaleReplace(target: Side, source: AncestorSnapshot) {
  // Mirrors mobile/sync/useSyncSetup.ts:115-124 (phone applies desktop-wins)
  // and desktop/.../desktopPlatform.ts:153-156 (desktop applies phone-wins).
  target.lists.state = {
    ...target.lists.state,
    items: source.lists,
    categories: source.listsCategories,
  }
  target.lockedLists.state = {
    ...target.lockedLists.state,
    items: source.lockedLists,
    categories: source.lockedListsCategories,
  }
  target.scratchpad.state = {
    contents: source.scratchpad,
    categories: source.scratchpadCategories,
  }
}

// ── Scenario simulators ──
// Each one captures the post-Commit-3+4 outcome of one handshake branch.

function simulateDesktopWinsSync(phone: Side, desktop: Side) {
  // Desktop kept its state; commits ancestor of its own state.
  desktop.ancestor.state.commit(buildSnapshot(desktop))
  // Phone applies desktop's state via handleSyncConfirm(desktop-wins).
  applyWholesaleReplace(phone, buildSnapshot(desktop))
  phone.ancestor.state.commit(buildSnapshot(phone))
}

function simulatePhoneWinsSync(phone: Side, desktop: Side) {
  // Desktop applies phone's pre-merge state, then commits ancestor.
  applyWholesaleReplace(desktop, buildSnapshot(phone))
  desktop.ancestor.state.commit(buildSnapshot(desktop))
  // Phone keeps its state on phone-wins; just commits ancestor.
  phone.ancestor.state.commit(buildSnapshot(phone))
}

function simulateEmptySync(phone: Side, desktop: Side) {
  // Both sides keep state. After Commit 4's adjacent fix, desktop's empty
  // branch sends sync_confirm{phone-wins}, so phone also commits.
  desktop.ancestor.state.commit(buildSnapshot(desktop))
  phone.ancestor.state.commit(buildSnapshot(phone))
}

function simulateDroppedSyncConfirm(
  phone: Side,
  desktop: Side,
  mode: 'desktop-wins' | 'phone-wins',
) {
  // Desktop completes its side: applies state if phone-wins, commits.
  if (mode === 'phone-wins') applyWholesaleReplace(desktop, buildSnapshot(phone))
  desktop.ancestor.state.commit(buildSnapshot(desktop))
  // sync_confirm never reaches phone; phone makes no commit.
}

describe('Phase 3 ancestor convergence', () => {
  let phone: Side
  let desktop: Side
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    phone = makeSide('phone')
    desktop = makeSide('desktop')
    // Phase 2's deleteItem fallback emits a console.log; silence to keep
    // test output clean.
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('desktop-wins: ancestors converge; each equals its side\'s live state', () => {
    phone.lists.state.addItem('p1')
    phone.lists.state.addItem('p2')
    desktop.lists.state.addItem('d1')
    desktop.lists.state.addItem('d2')

    simulateDesktopWinsSync(phone, desktop)

    expect(phone.ancestor.state.record).not.toBeNull()
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record!.snapshot).toEqual(desktop.ancestor.state.record!.snapshot)
    expect(phone.ancestor.state.record!.snapshot).toEqual(buildSnapshot(phone))
    expect(desktop.ancestor.state.record!.snapshot).toEqual(buildSnapshot(desktop))

    logSpy.mockRestore()
  })

  it('phone-wins: ancestors converge; each equals its side\'s live state', () => {
    phone.lists.state.addItem('p1')
    desktop.lists.state.addItem('d1')

    simulatePhoneWinsSync(phone, desktop)

    expect(phone.ancestor.state.record!.snapshot).toEqual(desktop.ancestor.state.record!.snapshot)
    expect(phone.ancestor.state.record!.snapshot).toEqual(buildSnapshot(phone))
    expect(desktop.ancestor.state.record!.snapshot).toEqual(buildSnapshot(desktop))

    logSpy.mockRestore()
  })

  it('empty-report (post-Commit-4): both sides commit and ancestors match', () => {
    // Both seeded with identical content - no diff would surface in a real sync.
    phone.lists.state.addItem('shared-1')
    desktop.lists.state.items = phone.lists.state.items
    desktop.lists.state.categories = phone.lists.state.categories

    simulateEmptySync(phone, desktop)

    expect(phone.ancestor.state.record).not.toBeNull()
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record!.snapshot).toEqual(desktop.ancestor.state.record!.snapshot)

    logSpy.mockRestore()
  })

  it('cancel: neither side commits an ancestor', () => {
    phone.lists.state.addItem('p1')
    desktop.lists.state.addItem('d1')

    // No simulator call - cancel is a no-op for ancestor commits.

    expect(phone.ancestor.state.record).toBeNull()
    expect(desktop.ancestor.state.record).toBeNull()

    logSpy.mockRestore()
  })

  it('tombstones survive into the ancestor unchanged', () => {
    phone.lists.state.addItem('a')
    phone.lists.state.addItem('b')
    phone.lists.state.addItem('c')
    const middleId = phone.lists.state.items[0][1].id
    phone.lists.state.deleteItem(middleId)

    simulatePhoneWinsSync(phone, desktop)

    const tombFromDesktop = desktop.ancestor.state.record!.snapshot.lists[0]
      .find((i) => i.id === middleId)
    const tombFromPhone = phone.ancestor.state.record!.snapshot.lists[0]
      .find((i) => i.id === middleId)
    expect(tombFromDesktop).toBeDefined()
    expect(tombFromDesktop!.deleted).toBe(true)
    expect(tombFromPhone).toBeDefined()
    expect(tombFromPhone!.deleted).toBe(true)
    // Both sides' tombstone records carry the same deletedAt.
    expect(tombFromDesktop!.deletedAt).toBe(tombFromPhone!.deletedAt)

    logSpy.mockRestore()
  })

  it('Strategy A divergence: dropped sync_confirm leaves desktop committed, phone uncommitted', () => {
    phone.lists.state.addItem('p1')
    desktop.lists.state.addItem('d1')

    simulateDroppedSyncConfirm(phone, desktop, 'desktop-wins')

    // Documented limitation of Strategy A. Phase 5's read-side reconciliation
    // detects this divergence; Phase 3 just commits to making it visible.
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record).toBeNull()

    logSpy.mockRestore()
  })

  it('Strategy A divergence is symmetric across modes: phone-wins variant', () => {
    phone.lists.state.addItem('p1')
    desktop.lists.state.addItem('d1')

    simulateDroppedSyncConfirm(phone, desktop, 'phone-wins')

    // Same documented limitation, regardless of which side "won". Desktop
    // applied the wholesale-replace and committed; phone never received the
    // confirm and didn't commit.
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record).toBeNull()

    logSpy.mockRestore()
  })

  it('Phase 4: fractional positions survive into the ancestor and converge across sides', () => {
    // Inject fractional positions directly so the test doesn't depend on
    // addItem's position scheme (Phase 4 changes that).
    phone.lists.state.items[0] = [
      { id: 'a', text: 'a', done: false, position: 1.5, createdAt: 1, updatedAt: 1 },
      { id: 'b', text: 'b', done: false, position: 1.75, createdAt: 1, updatedAt: 1 },
      { id: 'c', text: 'c', done: false, position: -0.25, createdAt: 1, updatedAt: 1 },
    ]

    simulatePhoneWinsSync(phone, desktop)

    const desktopSlot = desktop.ancestor.state.record!.snapshot.lists[0]
    const phoneSlot = phone.ancestor.state.record!.snapshot.lists[0]
    expect(desktopSlot.map((i) => i.position)).toEqual([1.5, 1.75, -0.25])
    expect(phoneSlot).toEqual(desktopSlot)

    logSpy.mockRestore()
  })

  it('recovery: a subsequent successful sync overwrites both ancestors and converges', () => {
    // First sync: dropped confirm leaves desktop with a stale-from-phone-pov
    // ancestor and phone with no ancestor.
    phone.lists.state.addItem('p1')
    desktop.lists.state.addItem('d1')
    simulateDroppedSyncConfirm(phone, desktop, 'desktop-wins')
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record).toBeNull()

    // Second sync, happy path: user picks desktop-wins again. Both sides
    // commit fresh ancestors of the current post-sync state.
    simulateDesktopWinsSync(phone, desktop)

    expect(phone.ancestor.state.record).not.toBeNull()
    expect(desktop.ancestor.state.record).not.toBeNull()
    expect(phone.ancestor.state.record!.snapshot).toEqual(desktop.ancestor.state.record!.snapshot)

    // The recovered ancestors reflect the post-sync state, not whatever
    // desktop had committed during the failed first sync.
    expect(phone.ancestor.state.record!.snapshot).toEqual(buildSnapshot(phone))

    logSpy.mockRestore()
  })
})
