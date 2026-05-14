import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createAncestorSlice, syncLog } from '@jotbunker/shared'
import type { AncestorSliceState } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

// Per-device ancestor snapshot. Written after every successful sync per
// Strategy A (independent writes). Compare contentHash on phone vs desktop
// to confirm convergence.
//
// Logging routes through syncLog, gated by the user's DEBUG LOGGING toggle.
// Privacy: counts + contentHash only. NEVER any item text.

export const useAncestorStore = create<AncestorSliceState>()(
  persist(
    createAncestorSlice({
      onAncestorWritten: (info) => {
        syncLog('ANCESTOR', `committedAt=${info.committedAt} hash=${info.contentHash} counts=lists:${info.counts.lists}/locked:${info.counts.lockedLists}/scratchpad:${info.counts.scratchpad}`)
      },
      onAncestorWriteFailed: (info) => {
        syncLog('ANCESTOR', `WARN write failed: ${info.error}`)
      },
    }),
    {
      name: 'jotbunker-ancestor',
      storage: createJSONStorage(() => ipcStorage),
      partialize: (state) => ({ record: state.record }),
    },
  ),
)
