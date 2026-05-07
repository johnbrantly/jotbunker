import { describe, it, expect } from 'vitest'
import { parseMessage } from '../../src/sync/protocol'
import type { StateSync } from '../../src/sync/protocol'
import { createItemSlice } from '../../src/stores/createItemSlice'
import type { ItemSliceState } from '../../src/stores/createItemSlice'
import { CATEGORY_COUNT } from '../../src/constants'
import type { Category } from '../../src/types'

// Pins down that a tombstoned item travels intact across the wholesale-replace
// state_sync wire and that both sides agree on which items the UI should show.
// RED until Phase 2 lands: deleteItem must mark a tombstone (not splice), and
// the slice must expose getLiveItems(slot) for UI consumers.

function makeStore(seed: string) {
  let counter = 0
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
    generateUUID: () => `${seed}-${++counter}`,
  })
  box.state = slice(set, get)

  return {
    state: () => box.state,
    setItems: (items: any[][]) => set({ items }),
  }
}

describe('StateSync wire-format tombstone durability', () => {
  it('tombstoned item survives JSON round-trip and lands on the receiver as a tombstone', () => {
    const phone = makeStore('phone')
    phone.state().addItem('a')
    phone.state().addItem('b')
    phone.state().addItem('c')

    // addItem prepends; raw order is c, b, a. The middle one is b.
    const middleId = phone.state().items[0][1].id
    phone.state().deleteItem(middleId)

    // Tombstone must remain in the raw array, not be spliced out.
    expect(phone.state().items[0]).toHaveLength(3)
    const tombstone = phone.state().items[0].find((i: any) => i.id === middleId) as any
    expect(tombstone).toBeDefined()
    expect(tombstone.deleted).toBe(true)
    expect(typeof tombstone.deletedAt).toBe('number')
    expect(tombstone.deletedAt).toBeGreaterThan(0)

    // Phone's UI selector hides the tombstone.
    const phoneLive = phone.state().getLiveItems(0)
    expect(phoneLive).toHaveLength(2)
    expect(phoneLive.map((i: any) => i.id)).not.toContain(middleId)

    // Build a state_sync payload from the phone's raw items and ship it.
    const payload: StateSync = {
      type: 'state_sync',
      lists: phone.state().items as any,
      lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
      listsCategories: phone.state().categories,
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()

    // Apply to a fresh desktop-side store, mirroring the wholesale-replace
    // path in mobile/sync/useSyncSetup.ts:115 and desktopPlatform.ts:153.
    const desktop = makeStore('desktop')
    desktop.setItems(parsed!.lists as any)

    // Raw store contains all 3 items, including the tombstone.
    expect(desktop.state().items[0]).toHaveLength(3)
    const desktopTombstone = desktop.state().items[0].find((i: any) => i.id === middleId) as any
    expect(desktopTombstone).toBeDefined()
    expect(desktopTombstone.deleted).toBe(true)
    expect(desktopTombstone.deletedAt).toBe(tombstone.deletedAt)

    // Desktop's UI selector hides the same tombstone.
    const desktopLive = desktop.state().getLiveItems(0)
    expect(desktopLive).toHaveLength(2)
    expect(desktopLive.map((i: any) => i.id)).toEqual(phoneLive.map((i: any) => i.id))
  })

  it('legacy item missing the deleted field round-trips through state_sync as live', () => {
    // Simulates a record that predates Phase 2. zustand persist's shallow
    // merge does not synthesise missing fields; the wire payload reflects
    // what the sender held in memory.
    const legacyItems = [
      [
        { id: 'legacy-1', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
        { id: 'legacy-2', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2 },
      ],
      [], [], [], [], [],
    ]

    const payload: StateSync = {
      type: 'state_sync',
      lists: legacyItems as any,
      lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()

    const desktop = makeStore('desktop')
    desktop.setItems(parsed!.lists as any)

    const live = desktop.state().getLiveItems(0)
    expect(live).toHaveLength(2)
    expect(live.map((i: any) => i.id)).toEqual(['legacy-1', 'legacy-2'])
  })

  it('Phase 4: fractional positions interleaved with tombstones round-trip intact', () => {
    // Wire payload mixes live items at non-integer positions with a tombstone
    // sitting at an integer position. Phase 4 contract: live items keep their
    // positions across the wire; tombstones keep their positions; the
    // receiver's getLiveItems sorts by position ascending.
    const senderItems = [
      [
        { id: 'live-a', text: 'a', done: false, position: -0.5, createdAt: 1, updatedAt: 1 },
        { id: 'tomb-x', text: 'x', done: false, position: 1, createdAt: 2, updatedAt: 99, deleted: true, deletedAt: 99 },
        { id: 'live-c', text: 'c', done: false, position: 0.75, createdAt: 3, updatedAt: 3 },
        { id: 'live-b', text: 'b', done: false, position: 1.25, createdAt: 4, updatedAt: 4 },
      ],
      [], [], [], [], [],
    ]

    const payload: StateSync = {
      type: 'state_sync',
      lists: senderItems as any,
      lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()

    const desktop = makeStore('desktop')
    desktop.setItems(parsed!.lists as any)

    // Raw items: 4 entries, positions byte-preserved.
    const raw = desktop.state().items[0]
    expect(raw).toHaveLength(4)
    expect(raw.find((i: any) => i.id === 'live-a')!.position).toBe(-0.5)
    expect(raw.find((i: any) => i.id === 'live-c')!.position).toBe(0.75)
    expect(raw.find((i: any) => i.id === 'live-b')!.position).toBe(1.25)

    // Tombstone preserved with deleted/deletedAt.
    const tomb = raw.find((i: any) => i.id === 'tomb-x')!
    expect(tomb.deleted).toBe(true)
    expect(tomb.deletedAt).toBe(99)

    // getLiveItems on the receiver: tombstone filtered out, live items sorted
    // ascending by their fractional positions: a (-0.5), c (0.75), b (1.25).
    const live = desktop.state().getLiveItems(0)
    expect(live.map((i: any) => i.id)).toEqual(['live-a', 'live-c', 'live-b'])
  })
})
