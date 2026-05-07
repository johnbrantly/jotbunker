import { create } from 'zustand'
import type { AncestorSnapshot, MergeTie } from '@jotbunker/shared'

// Phase 5.5 cutover: replaces the old requestConfirmation Promise-bridge for
// the binary "pick a side" dialog with requestTieResolution for the new
// per-tie picker. The old binary dialog is gone; this dialog only fires
// when mergedResult.ties.length > 0 - i.e., when both sides edited the same
// field at the same updatedAt.

export type TieResolution =
  | { kind: 'applied'; snapshot: AncestorSnapshot }
  | { kind: 'cancelled' }

interface PendingTieResolution {
  ties: MergeTie[]
  mergedSnapshot: AncestorSnapshot
  resolve: (resolution: TieResolution) => void
}

interface SyncConfirmState {
  pending: PendingTieResolution | null
  /**
   * Open the tie-resolution dialog. Returns a Promise that resolves when
   * the user picks per-tie values and applies, or cancels. The dialog
   * component reads `pending` to render rows; it calls `respondApply` with
   * the modified snapshot or `respondCancel` to abort.
   */
  requestTieResolution: (
    ties: MergeTie[],
    mergedSnapshot: AncestorSnapshot,
  ) => Promise<TieResolution>
  respondApply: (snapshot: AncestorSnapshot) => void
  respondCancel: () => void
}

export const useSyncConfirmStore = create<SyncConfirmState>()((set, get) => ({
  pending: null,

  requestTieResolution(ties, mergedSnapshot) {
    return new Promise<TieResolution>((resolve) => {
      set({ pending: { ties, mergedSnapshot, resolve } })
    })
  },

  respondApply(snapshot) {
    const { pending } = get()
    if (pending) {
      pending.resolve({ kind: 'applied', snapshot })
      set({ pending: null })
    }
  },

  respondCancel() {
    const { pending } = get()
    if (pending) {
      pending.resolve({ kind: 'cancelled' })
      set({ pending: null })
    }
  },
}))
