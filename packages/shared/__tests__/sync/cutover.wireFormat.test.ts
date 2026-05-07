import { describe, it, expect } from 'vitest'
import { parseMessage } from '../../src/sync/protocol'

// Phase 5.5 wire format tests for the new sync_confirm shape: optional
// `snapshot` field carrying the merged result. New receivers prefer
// snapshot; old receivers fall back to mode-driven behavior.
//
// RED until Commit 3 ships:
//   1. The optional `snapshot` field on the SyncConfirm interface
//   2. A validator update that rejects malformed snapshot values

describe('sync_confirm wire format (Phase 5.5)', () => {
  it('accepts sync_confirm with snapshot field and round-trips it', () => {
    const snapshot = {
      lists: [[{ id: 'X', text: 'a', done: false, position: 1, createdAt: 1, updatedAt: 1 }], [], [], [], [], []],
      lockedLists: [[], [], [], [], [], []],
      listsCategories: [],
      lockedListsCategories: [],
      scratchpad: [{ content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }, { content: '', updatedAt: 0 }],
      scratchpadCategories: [],
    }
    const raw = JSON.stringify({ type: 'sync_confirm', mode: 'phone-wins', snapshot })
    const parsed = parseMessage(raw)
    expect(parsed).not.toBeNull()
    expect(parsed!.type).toBe('sync_confirm')
    // Snapshot field round-trips intact.
    expect((parsed as any).snapshot).toEqual(snapshot)
  })

  it('accepts old-format sync_confirm without snapshot field', () => {
    // Backward-compat: pre-cutover senders ship `{type, mode}` only. Post-
    // cutover receivers fall back to the old mode-driven path.
    const raw = JSON.stringify({ type: 'sync_confirm', mode: 'desktop-wins' })
    const parsed = parseMessage(raw)
    expect(parsed).not.toBeNull()
    expect((parsed as any).snapshot).toBeUndefined()
  })

  it('rejects sync_confirm with non-object snapshot field', () => {
    // Validator post-Commit 3 must check that if snapshot is present, it's
    // an object (not a number, string, or null). RED today: existing
    // validator only checks `mode`, ignores `snapshot`.
    const raw = JSON.stringify({ type: 'sync_confirm', mode: 'phone-wins', snapshot: 42 })
    expect(parseMessage(raw)).toBeNull()
  })

  it('rejects sync_confirm with null snapshot field', () => {
    const raw = JSON.stringify({ type: 'sync_confirm', mode: 'phone-wins', snapshot: null })
    expect(parseMessage(raw)).toBeNull()
  })

  it('still rejects sync_confirm missing mode (Phase 5 invariant)', () => {
    const raw = JSON.stringify({ type: 'sync_confirm', snapshot: {} })
    expect(parseMessage(raw)).toBeNull()
  })
})
