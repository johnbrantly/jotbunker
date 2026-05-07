import { describe, it, expect, beforeEach } from 'vitest'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useListsStore } from '../../stores/listsStore'
import { useLockedListsStore } from '../../stores/lockedListsStore'
import {
  CATEGORY_COUNT,
  DEFAULT_LISTS_CATEGORIES,
  DEFAULT_LOCKED_LISTS_CATEGORIES,
} from '@jotbunker/shared'
import { resetAsyncStorage } from '../setup'

const emptySlots = () => Array.from({ length: CATEGORY_COUNT }, () => [])

// zustand persist writes to storage asynchronously after each setState. One
// macrotask is enough to let the in-memory AsyncStorage mock settle.
const flush = () => new Promise<void>((r) => setTimeout(r, 0))

describe('listsStore persistence round-trip', () => {
  beforeEach(async () => {
    resetAsyncStorage()
    useListsStore.setState({
      items: emptySlots(),
      categories: DEFAULT_LISTS_CATEGORIES,
      activeSlot: 0,
    })
    await flush()
  })

  it('persists item ids to AsyncStorage after addItem', async () => {
    useListsStore.getState().addItem('first')
    useListsStore.getState().addItem('second')
    await flush()

    const inMemoryIds = useListsStore.getState().items[0].map((i) => i.id)
    expect(inMemoryIds).toHaveLength(2)
    inMemoryIds.forEach((id) => expect(id.length).toBeGreaterThan(0))

    const raw = await AsyncStorage.getItem('jotbunker-lists')
    expect(raw).not.toBeNull()
    const persisted = JSON.parse(raw!)
    const persistedIds = persisted.state.items[0].map((i: { id: string }) => i.id)
    expect(persistedIds).toEqual(inMemoryIds)
  })

  it('rehydrates item ids from a stored fixture', async () => {
    const fixtureItems = [
      { id: 'fixed-id-a', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
      { id: 'fixed-id-b', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2 },
    ]
    const fixture = {
      state: {
        items: [fixtureItems, [], [], [], [], []],
        categories: DEFAULT_LISTS_CATEGORIES,
        activeSlot: 0,
      },
      version: 0,
    }
    await AsyncStorage.setItem('jotbunker-lists', JSON.stringify(fixture))

    await useListsStore.persist.rehydrate()

    const ids = useListsStore.getState().items[0].map((i) => i.id)
    expect(ids).toEqual(['fixed-id-a', 'fixed-id-b'])
  })

  it('preserves ids through a mutation cycle persisted to disk', async () => {
    useListsStore.getState().addItem('a')
    useListsStore.getState().addItem('b')
    useListsStore.getState().addItem('c')
    await flush()

    // addItem prepends; in-memory order is c, b, a.
    const idsBefore = useListsStore.getState().items[0].map((i) => i.id)

    useListsStore.getState().toggleItem(idsBefore[0])
    useListsStore.getState().updateItemText(idsBefore[1], 'b-new')
    useListsStore.getState().reorderItems(0, [...useListsStore.getState().items[0]].reverse())
    await flush()

    const raw = await AsyncStorage.getItem('jotbunker-lists')
    const persisted = JSON.parse(raw!)
    const persistedIds = persisted.state.items[0].map((i: { id: string }) => i.id)
    expect(persistedIds).toEqual([...idsBefore].reverse())
  })

  it('tombstones persist and rehydrate intact', async () => {
    useListsStore.getState().addItem('a')
    useListsStore.getState().addItem('b')
    useListsStore.getState().addItem('c')
    await flush()
    const middleId = useListsStore.getState().items[0][1].id

    useListsStore.getState().deleteItem(middleId)
    const tombstoneInMemory = useListsStore.getState().items[0].find((i) => i.id === middleId)!
    await flush()

    // AsyncStorage carries the tombstone with deleted: true and a deletedAt.
    const raw = await AsyncStorage.getItem('jotbunker-lists')
    const persisted = JSON.parse(raw!)
    const persistedSlot = persisted.state.items[0]
    expect(persistedSlot).toHaveLength(3)
    const persistedTombstone = persistedSlot.find((i: any) => i.id === middleId)
    expect(persistedTombstone).toBeDefined()
    expect(persistedTombstone.deleted).toBe(true)
    expect(persistedTombstone.deletedAt).toBe(tombstoneInMemory.deletedAt)

    // Rehydrate into a cleared store. setState's persist write would clobber
    // AsyncStorage with empty state, so re-pin the captured raw after the
    // setState write settles, then rehydrate from it.
    useListsStore.setState({
      items: emptySlots(),
      categories: DEFAULT_LISTS_CATEGORIES,
      activeSlot: 0,
    })
    await flush()
    await AsyncStorage.setItem('jotbunker-lists', raw!)
    await useListsStore.persist.rehydrate()

    const rehydratedSlot = useListsStore.getState().items[0]
    expect(rehydratedSlot).toHaveLength(3)
    const rehydratedTombstone = rehydratedSlot.find((i) => i.id === middleId)!
    expect(rehydratedTombstone.deleted).toBe(true)
    expect(rehydratedTombstone.deletedAt).toBe(tombstoneInMemory.deletedAt)
    expect(useListsStore.getState().getLiveItems(0)).toHaveLength(2)
  })

  it('legacy items missing the deleted field rehydrate as live', async () => {
    const fixture = {
      state: {
        items: [
          [
            { id: 'legacy-1', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
            { id: 'legacy-2', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2 },
          ],
          [], [], [], [], [],
        ],
        categories: DEFAULT_LISTS_CATEGORIES,
        activeSlot: 0,
      },
      version: 0,
    }
    await AsyncStorage.setItem('jotbunker-lists', JSON.stringify(fixture))
    await useListsStore.persist.rehydrate()

    const live = useListsStore.getState().getLiveItems(0)
    expect(live.map((i) => i.id)).toEqual(['legacy-1', 'legacy-2'])
  })

  it('Phase 4: fractional positions persist and rehydrate intact', async () => {
    const fixture = {
      state: {
        items: [
          [
            { id: 'a', text: 'a', done: false, position: -0.5, createdAt: 1, updatedAt: 1 },
            { id: 'b', text: 'b', done: false, position: 1.25, createdAt: 1, updatedAt: 1 },
            { id: 'c', text: 'c', done: false, position: 0.75, createdAt: 1, updatedAt: 1 },
          ],
          [], [], [], [], [],
        ],
        categories: DEFAULT_LISTS_CATEGORIES,
        activeSlot: 0,
      },
      version: 0,
    }
    await AsyncStorage.setItem('jotbunker-lists', JSON.stringify(fixture))
    await useListsStore.persist.rehydrate()

    // Raw positions preserved bitwise across the JSON round-trip.
    const raw = useListsStore.getState().items[0]
    expect(raw.find((i) => i.id === 'a')!.position).toBe(-0.5)
    expect(raw.find((i) => i.id === 'b')!.position).toBe(1.25)
    expect(raw.find((i) => i.id === 'c')!.position).toBe(0.75)
    // getLiveItems sorts by position ascending: a (-0.5), c (0.75), b (1.25).
    expect(useListsStore.getState().getLiveItems(0).map((i) => i.id)).toEqual(['a', 'c', 'b'])
  })

  it('Phase 4: DraggableFlatList drag flow takes the minimal-change path (only moved item repositions)', async () => {
    // Mirrors mobile components/lists/ListView.tsx:188 where DraggableFlatList
    // fires onDragEnd({ data }) with the new full live array; the prop hands
    // it straight to reorderItems. Asserts the slice's LCS-based detection
    // identifies the dragged item as the single mover and leaves other items'
    // positions byte-for-byte unchanged.
    useListsStore.getState().addItem('a')
    useListsStore.getState().addItem('b')
    useListsStore.getState().addItem('c')
    useListsStore.getState().addItem('d')
    await flush()

    const live = useListsStore.getState().getLiveItems(0)
    const originalPositions = new Map(live.map((it) => [it.id, it.position]))

    // Mobile DraggableFlatList delivers the new full ordered array directly.
    // Drag d from index 0 to index 3 → [c, b, a, d].
    const reordered = [...live]
    const [moved] = reordered.splice(0, 1) // remove d
    reordered.splice(3, 0, moved) // insert at end
    expect(reordered.map((it) => it.text)).toEqual(['c', 'b', 'a', 'd'])

    useListsStore.getState().reorderItems(0, reordered)

    const post = useListsStore.getState().getLiveItems(0)
    expect(post.map((it) => it.text)).toEqual(['c', 'b', 'a', 'd'])

    for (const it of post) {
      if (it.text === 'd') {
        expect(it.position).not.toBe(originalPositions.get(it.id))
      } else {
        expect(it.position).toBe(originalPositions.get(it.id))
      }
    }
  })

  it('Phase 4: drag-reorder cycle preserves order through persist and rehydrate', async () => {
    useListsStore.getState().addItem('A')
    useListsStore.getState().addItem('B')
    useListsStore.getState().addItem('C')
    useListsStore.getState().addItem('D')
    await flush()

    // Live order (sorted by position) after 4 prepends: D, C, B, A.
    const liveBefore = useListsStore.getState().getLiveItems(0)
    expect(liveBefore.map((i) => i.text)).toEqual(['D', 'C', 'B', 'A'])

    // Drag D to the end: new order [C, B, A, D].
    const newOrder = [
      liveBefore.find((i) => i.text === 'C')!,
      liveBefore.find((i) => i.text === 'B')!,
      liveBefore.find((i) => i.text === 'A')!,
      liveBefore.find((i) => i.text === 'D')!,
    ]
    useListsStore.getState().reorderItems(0, newOrder)
    await flush()

    const raw = await AsyncStorage.getItem('jotbunker-lists')

    // Clear in-memory; re-pin raw; rehydrate.
    useListsStore.setState({
      items: emptySlots(),
      categories: DEFAULT_LISTS_CATEGORIES,
      activeSlot: 0,
    })
    await flush()
    await AsyncStorage.setItem('jotbunker-lists', raw!)
    await useListsStore.persist.rehydrate()

    const liveAfter = useListsStore.getState().getLiveItems(0)
    expect(liveAfter.map((i) => i.text)).toEqual(['C', 'B', 'A', 'D'])
  })
})

describe('lockedListsStore persistence round-trip', () => {
  beforeEach(async () => {
    resetAsyncStorage()
    useLockedListsStore.setState({
      items: emptySlots(),
      categories: DEFAULT_LOCKED_LISTS_CATEGORIES,
      activeSlot: 0,
      isUnlocked: false,
    })
    await flush()
  })

  it('persists item ids to AsyncStorage after addItem', async () => {
    useLockedListsStore.getState().addItem('secret-1')
    useLockedListsStore.getState().addItem('secret-2')
    await flush()

    const inMemoryIds = useLockedListsStore.getState().items[0].map((i) => i.id)
    expect(inMemoryIds).toHaveLength(2)

    const raw = await AsyncStorage.getItem('jotbunker-lockedLists')
    expect(raw).not.toBeNull()
    const persisted = JSON.parse(raw!)
    const persistedIds = persisted.state.items[0].map((i: { id: string }) => i.id)
    expect(persistedIds).toEqual(inMemoryIds)
  })

  it('rehydrates item ids from a stored fixture', async () => {
    const fixtureItems = [
      { id: 'locked-id-a', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
      { id: 'locked-id-b', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2 },
    ]
    const fixture = {
      state: {
        items: [fixtureItems, [], [], [], [], []],
        categories: DEFAULT_LOCKED_LISTS_CATEGORIES,
        activeSlot: 0,
      },
      version: 0,
    }
    await AsyncStorage.setItem('jotbunker-lockedLists', JSON.stringify(fixture))

    await useLockedListsStore.persist.rehydrate()

    const ids = useLockedListsStore.getState().items[0].map((i) => i.id)
    expect(ids).toEqual(['locked-id-a', 'locked-id-b'])
  })
})
