import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createAncestorSlice } from '../../src/stores/createAncestorSlice'
import type {
  AncestorSliceState,
  AncestorSnapshot,
} from '../../src/stores/createAncestorSlice'
import { CATEGORY_COUNT } from '../../src/constants'

// Same tiny-store harness as createItemSlice.test.ts: capture state in a box,
// inject set/get, read state via a getter so closures see the latest.
function makeStore(config: Parameters<typeof createAncestorSlice>[0] = {}) {
  const box: { state: AncestorSliceState } = {} as any
  const set = (partial: any) => {
    if (typeof partial === 'function') {
      const result = partial(box.state)
      box.state = { ...box.state, ...result }
    } else {
      box.state = { ...box.state, ...partial }
    }
  }
  const get = () => box.state
  box.state = createAncestorSlice(config)(set, get)
  return () => box.state
}

function emptySlots<T>(): T[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

function makeSnapshot(overrides?: Partial<AncestorSnapshot>): AncestorSnapshot {
  return {
    lists: emptySlots(),
    lockedLists: emptySlots(),
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

describe('createAncestorSlice', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('record is null on initialisation', () => {
    const s = makeStore()
    expect(s().record).toBeNull()
  })

  it('commit writes a record with committedAt and snapshot', () => {
    const s = makeStore()
    const snap = makeSnapshot()
    const before = Date.now()
    s().commit(snap)
    const after = Date.now()
    expect(s().record).not.toBeNull()
    expect(s().record!.snapshot).toEqual(snap)
    expect(s().record!.committedAt).toBeGreaterThanOrEqual(before)
    expect(s().record!.committedAt).toBeLessThanOrEqual(after)
  })

  it('commit deep-clones; mutating the source after commit does not bleed in', () => {
    const s = makeStore()
    const snap = makeSnapshot({
      lists: [
        [{ id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }],
        [], [], [], [], [],
      ],
    })
    s().commit(snap)
    // Mutate source.
    snap.lists[0][0].text = 'tampered'
    snap.lists[0].push({ id: 'b', text: 'late', done: false, position: 1, createdAt: 2, updatedAt: 2 })
    expect(s().record!.snapshot.lists[0][0].text).toBe('x')
    expect(s().record!.snapshot.lists[0]).toHaveLength(1)
  })

  it('commit twice overwrites with the latest', () => {
    const s = makeStore()
    s().commit(makeSnapshot())
    const firstCommittedAt = s().record!.committedAt
    s().commit(makeSnapshot({
      lists: [[{ id: 'b', text: 'second', done: false, position: 0, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
    }))
    expect(s().record!.committedAt).toBeGreaterThanOrEqual(firstCommittedAt)
    expect(s().record!.snapshot.lists[0]).toHaveLength(1)
    expect(s().record!.snapshot.lists[0][0].text).toBe('second')
  })

  it('tombstones in the snapshot survive into the record', () => {
    const s = makeStore()
    const snap = makeSnapshot({
      lists: [
        [
          { id: 'live', text: 'a', done: false, position: 0, createdAt: 1, updatedAt: 1 },
          { id: 'dead', text: 'b', done: false, position: 1, createdAt: 2, updatedAt: 2, deleted: true, deletedAt: 99 },
        ],
        [], [], [], [], [],
      ],
    })
    s().commit(snap)
    const tomb = s().record!.snapshot.lists[0].find((i) => i.id === 'dead')!
    expect(tomb.deleted).toBe(true)
    expect(tomb.deletedAt).toBe(99)
  })

  it('onAncestorWritten fires with counts and a contentHash', () => {
    const writes: Array<{ committedAt: number; counts: { lists: number; lockedLists: number; scratchpad: number }; contentHash: string }> = []
    const s = makeStore({ onAncestorWritten: (info) => { writes.push(info) } })

    const snap = makeSnapshot({
      lists: [
        [{ id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }],
        [], [], [], [], [],
      ],
      lockedLists: [
        [{ id: 'b', text: 'y', done: false, position: 0, createdAt: 1, updatedAt: 1 }],
        [{ id: 'c', text: 'z', done: false, position: 0, createdAt: 1, updatedAt: 1 }],
        [], [], [], [],
      ],
    })
    s().commit(snap)

    expect(writes).toHaveLength(1)
    expect(writes[0].counts).toEqual({ lists: 1, lockedLists: 2, scratchpad: CATEGORY_COUNT })
    expect(writes[0].contentHash).toMatch(/^[0-9a-f]{8}$/)
    // Privacy: payload must never carry item text.
    expect(JSON.stringify(writes[0])).not.toContain('"text"')
  })

  it('contentHash is stable for identical snapshot content across commits', () => {
    const writes: string[] = []
    const s = makeStore({ onAncestorWritten: (info) => { writes.push(info.contentHash) } })

    const snap = makeSnapshot({
      lists: [[{ id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
    })
    s().commit(snap)
    s().commit(snap)
    expect(writes[0]).toBe(writes[1])
  })

  it('contentHash is stable when keys are permuted at every nesting level', () => {
    // Catches a future regression where canonicalisation sorts top-level
    // keys but forgets recursive descent. Permutes keys at three nesting
    // levels: top of the snapshot, inside item objects in lists/lockedLists,
    // and inside the scratchpad-entry objects.
    const writes: string[] = []
    const s = makeStore({ onAncestorWritten: (info) => { writes.push(info.contentHash) } })

    const itemA = { id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }
    const itemAPermuted = { updatedAt: 1, done: false, createdAt: 1, position: 0, text: 'x', id: 'a' }
    const itemB = { id: 'b', text: 'y', done: true, position: 0, createdAt: 2, updatedAt: 2, deleted: true, deletedAt: 99 }
    const itemBPermuted = { deletedAt: 99, deleted: true, updatedAt: 2, createdAt: 2, position: 0, done: true, text: 'y', id: 'b' }
    const spA = { content: 'note', updatedAt: 100 }
    const spAPermuted = { updatedAt: 100, content: 'note' }

    // Build two snapshots with identical content but reordered keys at every
    // nesting depth. Cast through unknown so the permuted shapes assign cleanly.
    const canonical = makeSnapshot({
      lists: [[itemA, itemB], [], [], [], [], []],
      scratchpad: [spA, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }],
    }) as unknown as Record<string, unknown>

    const permuted = {
      // Top-level keys reordered:
      scratchpadCategories: canonical.scratchpadCategories,
      lockedListsCategories: canonical.lockedListsCategories,
      listsCategories: canonical.listsCategories,
      scratchpad: [spAPermuted, ...((canonical.scratchpad as unknown[]).slice(1))],
      lockedLists: canonical.lockedLists,
      lists: [[itemAPermuted, itemBPermuted], [], [], [], [], []],
    }

    s().commit(canonical as any)
    s().commit(permuted as any)

    expect(writes[0]).toBe(writes[1])
  })

  it('contentHash differs when snapshot content differs', () => {
    const writes: string[] = []
    const s = makeStore({ onAncestorWritten: (info) => { writes.push(info.contentHash) } })

    s().commit(makeSnapshot({
      lists: [[{ id: 'a', text: 'x', done: false, position: 0, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
    }))
    s().commit(makeSnapshot({
      lists: [[{ id: 'a', text: 'different', done: false, position: 0, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
    }))
    expect(writes[0]).not.toBe(writes[1])
  })

  it('falls back to console.log when onAncestorWritten is not wired', () => {
    const s = makeStore() // no callbacks
    s().commit(makeSnapshot())
    expect(logSpy).toHaveBeenCalledWith(
      '[ancestor]',
      expect.objectContaining({ committedAt: expect.any(Number), contentHash: expect.any(String) }),
    )
  })
})
