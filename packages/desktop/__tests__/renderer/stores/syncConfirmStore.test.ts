import { describe, it, expect, beforeEach } from 'vitest'
import { useSyncConfirmStore } from '../../../src/renderer/stores/syncConfirmStore'
import type { AncestorSnapshot, MergeTie } from '@jotbunker/shared'
import { CATEGORY_COUNT } from '@jotbunker/shared'

// Phase 5.5 tie-surfacing tests for useSyncConfirmStore.
//
// Pre-cutover the store had `requestConfirmation(report) -> Promise<choice>`
// for the binary side-pick dialog. Post-cutover (Commit 5) it gets a new
// shape: `requestTieResolution(ties, mergedSnapshot) -> Promise<TieResolution>`
// where TieResolution is `{kind: 'applied', snapshot}` or `{kind: 'cancelled'}`.
//
// RED until Commit 5 ships the new API.

function emptySnapshot(): AncestorSnapshot {
  return {
    lists: Array.from({ length: CATEGORY_COUNT }, () => []),
    lockedLists: Array.from({ length: CATEGORY_COUNT }, () => []),
    listsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `L${i}`, section: 'lists' as const, updatedAt: 0,
    })),
    lockedListsCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `LL${i}`, section: 'lockedLists' as const, updatedAt: 0,
    })),
    scratchpad: Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
    scratchpadCategories: Array.from({ length: CATEGORY_COUNT }, (_, i) => ({
      label: `S${i}`, section: 'scratchpad' as const, updatedAt: 0,
    })),
  }
}

describe('useSyncConfirmStore Phase 5.5 tie-resolution API', () => {
  beforeEach(() => {
    useSyncConfirmStore.setState({ pending: null })
  })

  it('requestTieResolution resolves with {kind:"applied", snapshot} when respondApply fires', async () => {
    const store = useSyncConfirmStore.getState() as any
    const ties: MergeTie[] = [
      { section: 'lists', slot: 0, itemId: 'X', field: 'text' } as any,
    ]
    const baseSnapshot = emptySnapshot()
    const userSnapshot = { ...baseSnapshot, lists: baseSnapshot.lists.map((s) => [...s]) }

    const promise: Promise<any> = store.requestTieResolution(ties, baseSnapshot)
    // Pending is set with ties + mergedSnapshot for the dialog to render.
    expect((useSyncConfirmStore.getState() as any).pending).not.toBeNull()
    expect((useSyncConfirmStore.getState() as any).pending.ties).toEqual(ties)

    ;(useSyncConfirmStore.getState() as any).respondApply(userSnapshot)
    const resolution = await promise
    expect(resolution.kind).toBe('applied')
    expect(resolution.snapshot).toEqual(userSnapshot)
    // Pending cleared after resolution.
    expect((useSyncConfirmStore.getState() as any).pending).toBeNull()
  })

  it('requestTieResolution resolves with {kind:"cancelled"} when respondCancel fires', async () => {
    const store = useSyncConfirmStore.getState() as any
    const ties: MergeTie[] = [
      { section: 'lists', slot: 0, itemId: 'X', field: 'text' } as any,
    ]

    const promise: Promise<any> = store.requestTieResolution(ties, emptySnapshot())
    ;(useSyncConfirmStore.getState() as any).respondCancel()
    const resolution = await promise
    expect(resolution.kind).toBe('cancelled')
    expect((useSyncConfirmStore.getState() as any).pending).toBeNull()
  })

  it('multiple ties surface together in pending.ties', async () => {
    const store = useSyncConfirmStore.getState() as any
    const ties: MergeTie[] = [
      { section: 'lists', slot: 0, itemId: 'X', field: 'text' } as any,
      { section: 'lockedLists', slot: 1, itemId: 'Y', field: 'done' } as any,
      { section: 'scratchpad', slot: 2, field: 'content' } as any,
    ]

    const promise: Promise<any> = store.requestTieResolution(ties, emptySnapshot())
    expect((useSyncConfirmStore.getState() as any).pending.ties).toHaveLength(3)
    ;(useSyncConfirmStore.getState() as any).respondCancel()
    await promise
  })
})
