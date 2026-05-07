import { describe, it, expect, beforeEach } from 'vitest'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAncestorStore } from '../../stores/ancestorStore'
import type { AncestorSnapshot } from '@jotbunker/shared'
import { CATEGORY_COUNT } from '@jotbunker/shared'
import { resetAsyncStorage } from '../setup'

const flush = () => new Promise<void>((r) => setTimeout(r, 0))

function makeSnapshot(overrides?: Partial<AncestorSnapshot>): AncestorSnapshot {
  return {
    lists: Array.from({ length: CATEGORY_COUNT }, () => []),
    lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
    listsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `L${i}`,
      section: 'lists' as const,
      updatedAt: 0,
    })),
    lockedListsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `LL${i}`,
      section: 'lockedLists' as const,
      updatedAt: 0,
    })),
    scratchpad: Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
    scratchpadCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `S${i}`,
      section: 'scratchpad' as const,
      updatedAt: 0,
    })),
    ...overrides,
  }
}

describe('ancestorStore persistence round-trip (mobile)', () => {
  beforeEach(async () => {
    resetAsyncStorage()
    useAncestorStore.setState({ record: null })
    await flush()
  })

  it('commit writes the envelope to AsyncStorage', async () => {
    const snap = makeSnapshot({
      lists: [[{ id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
    })
    useAncestorStore.getState().commit(snap)
    await flush()

    const raw = await AsyncStorage.getItem('jotbunker-ancestor')
    expect(raw).not.toBeNull()
    const persisted = JSON.parse(raw!)
    expect(persisted.state.record).not.toBeNull()
    expect(persisted.state.record.snapshot.lists[0][0].id).toBe('a')
    expect(typeof persisted.state.record.committedAt).toBe('number')
  })

  it('tombstones survive a commit -> persist -> rehydrate cycle', async () => {
    const snap = makeSnapshot({
      lists: [
        [
          { id: 'live', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
          { id: 'dead', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2, deleted: true, deletedAt: 99 },
        ],
        [], [], [], [], [],
      ],
    })
    useAncestorStore.getState().commit(snap)
    await flush()

    const raw = await AsyncStorage.getItem('jotbunker-ancestor')

    // Clear in-memory; the setState write will clobber AsyncStorage with the
    // empty record, so re-pin the captured raw before rehydrating.
    useAncestorStore.setState({ record: null })
    await flush()
    await AsyncStorage.setItem('jotbunker-ancestor', raw!)
    await useAncestorStore.persist.rehydrate()

    const rehydrated = useAncestorStore.getState().record!
    expect(rehydrated.snapshot.lists[0]).toHaveLength(2)
    const tomb = rehydrated.snapshot.lists[0].find((i) => i.id === 'dead')!
    expect(tomb.deleted).toBe(true)
    expect(tomb.deletedAt).toBe(99)
  })

  it('rehydrating into a cleared store restores the full snapshot', async () => {
    const snap = makeSnapshot({
      scratchpad: [
        { content: 'note 1', updatedAt: 100 },
        { content: 'note 2', updatedAt: 200 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
        { content: '', updatedAt: 0 },
      ],
    })
    useAncestorStore.getState().commit(snap)
    await flush()
    const raw = await AsyncStorage.getItem('jotbunker-ancestor')

    useAncestorStore.setState({ record: null })
    await flush()
    await AsyncStorage.setItem('jotbunker-ancestor', raw!)
    await useAncestorStore.persist.rehydrate()

    expect(useAncestorStore.getState().record!.snapshot.scratchpad[0].content).toBe('note 1')
    expect(useAncestorStore.getState().record!.snapshot.scratchpad[1].updatedAt).toBe(200)
  })
})
