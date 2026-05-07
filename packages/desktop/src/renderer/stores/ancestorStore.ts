import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createAncestorSlice } from '@jotbunker/shared'
import type { AncestorSliceState } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

// Phase 3: per-device ancestor snapshot. Written after every successful sync
// per Strategy A (independent writes). The maintainer compares the contentHash
// log line on phone and desktop to confirm both ancestors converged after a
// real sync.
//
// Logging routes to desktop-sync.log via electronAPI.sendDebugLog (always-on,
// not gated by DEBUG LOGGING). system-messages.log is reserved for non-sync
// app events.

export const useAncestorStore = create<AncestorSliceState>()(
  persist(
    createAncestorSlice({
      onAncestorWritten: (info) => {
        // INFO: counts + contentHash only. NEVER any item text - locked
        // lists carry secrets and desktop-sync.log persists to disk.
        window.electronAPI.sendDebugLog(
          `[ancestor] INFO committedAt=${info.committedAt} hash=${info.contentHash} counts=lists:${info.counts.lists}/locked:${info.counts.lockedLists}/scratchpad:${info.counts.scratchpad}`,
        )
      },
      onAncestorWriteFailed: (info) => {
        window.electronAPI.sendDebugLog(`[ancestor] WARN write failed: ${info.error}`)
      },
    }),
    {
      name: 'jotbunker-ancestor',
      storage: createJSONStorage(() => ipcStorage),
      partialize: (state) => ({ record: state.record }),
    },
  ),
)
