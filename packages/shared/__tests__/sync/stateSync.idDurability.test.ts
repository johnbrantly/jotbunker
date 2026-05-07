import { describe, it, expect } from 'vitest'
import { parseMessage } from '../../src/sync/protocol'
import type { StateSync } from '../../src/sync/protocol'
import { CATEGORY_COUNT } from '../../src/constants'

// These tests pin down the invariant that StateSync transports item.id
// bitwise-intact across the JSON wire boundary. Phase 2 (tombstones) will
// merge by id; if a future protocol or partialize change drops the field,
// these tests go red before any user data is at risk.

const emptySlots = <T>() => Array.from({ length: CATEGORY_COUNT }, () => [] as T[])

const makeItem = (id: string, text: string, position: number) => ({
  id,
  text,
  done: false,
  position,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
})

describe('StateSync wire-format id durability', () => {
  it('JSON round-trip preserves item ids in lists', () => {
    const lists = emptySlots<ReturnType<typeof makeItem>>()
    lists[0] = [
      makeItem('id-a', 'a', 0),
      makeItem('id-b', 'b', 1),
      makeItem('id-c', 'c', 2),
    ]
    lists[3] = [makeItem('id-d', 'slot-3 item', 0)]

    const payload: StateSync = {
      type: 'state_sync',
      lists,
      lockedLists: emptySlots(),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()
    expect(parsed!.type).toBe('state_sync')

    expect(parsed!.lists[0].map((i) => i.id)).toEqual(['id-a', 'id-b', 'id-c'])
    expect(parsed!.lists[3].map((i) => i.id)).toEqual(['id-d'])
  })

  it('JSON round-trip preserves item ids in lockedLists', () => {
    const lockedLists = emptySlots<ReturnType<typeof makeItem>>()
    lockedLists[1] = [
      makeItem('locked-1', 'gate code', 0),
      makeItem('locked-2', 'safe combo', 1),
    ]

    const payload: StateSync = {
      type: 'state_sync',
      lists: emptySlots(),
      lockedLists,
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()
    expect(parsed!.lockedLists[1].map((i) => i.id)).toEqual(['locked-1', 'locked-2'])
  })

  it('JSON round-trip preserves the full item object, not just id', () => {
    const lists = emptySlots<ReturnType<typeof makeItem>>()
    lists[0] = [
      {
        id: 'id-a',
        text: 'unicode: \u00e9 \u2764 \u{1f680}',
        done: true,
        position: 0,
        createdAt: 1714000000000,
        updatedAt: 1714000000001,
      },
    ]

    const payload: StateSync = {
      type: 'state_sync',
      lists,
      lockedLists: emptySlots(),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed!.lists[0][0]).toEqual(lists[0][0])
  })

  it('receiver setState({ items }) keeps ids one-for-one with the wire payload', () => {
    const lists = emptySlots<ReturnType<typeof makeItem>>()
    lists[0] = [makeItem('wire-1', 'a', 0), makeItem('wire-2', 'b', 1)]
    lists[2] = [makeItem('wire-3', 'c', 0)]

    const payload: StateSync = {
      type: 'state_sync',
      lists,
      lockedLists: emptySlots(),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync

    // Mirrors the receiver path in mobile/sync/useSyncSetup.ts:115 and
    // desktop/.../desktopPlatform.ts:153 where the parsed payload's items
    // are plopped straight into the store via setState({ items }).
    const receiverState: { items: typeof lists } = { items: emptySlots() }
    receiverState.items = parsed.lists

    for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
      expect(receiverState.items[slot].map((i) => i.id))
        .toEqual(payload.lists[slot].map((i) => i.id))
    }
  })

  it('Phase 4: fractional position values survive JSON round-trip', () => {
    const lists = emptySlots<ReturnType<typeof makeItem>>()
    lists[0] = [
      { id: 'a', text: 'a', done: false, position: 1.5, createdAt: 1, updatedAt: 1 },
      { id: 'b', text: 'b', done: false, position: 1.75, createdAt: 1, updatedAt: 1 },
      { id: 'c', text: 'c', done: false, position: -0.5, createdAt: 1, updatedAt: 1 },
    ]
    const payload: StateSync = {
      type: 'state_sync',
      lists,
      lockedLists: emptySlots(),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }
    const parsed = parseMessage(JSON.stringify(payload)) as StateSync | null
    expect(parsed).not.toBeNull()
    expect(parsed!.lists[0][0].position).toBe(1.5)
    expect(parsed!.lists[0][1].position).toBe(1.75)
    expect(parsed!.lists[0][2].position).toBe(-0.5)
  })

  it('empty slots stay empty across the wire', () => {
    const payload: StateSync = {
      type: 'state_sync',
      lists: emptySlots(),
      lockedLists: emptySlots(),
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    }

    const parsed = parseMessage(JSON.stringify(payload)) as StateSync
    expect(parsed.lists).toHaveLength(CATEGORY_COUNT)
    expect(parsed.lockedLists).toHaveLength(CATEGORY_COUNT)
    parsed.lists.forEach((slot) => expect(slot).toEqual([]))
    parsed.lockedLists.forEach((slot) => expect(slot).toEqual([]))
  })
})
