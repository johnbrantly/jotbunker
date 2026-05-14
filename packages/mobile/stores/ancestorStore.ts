import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAncestorSlice, syncLog } from '@jotbunker/shared';
import type { AncestorSliceState } from '@jotbunker/shared';

// Per-device ancestor snapshot. Written after every successful sync per
// Strategy A (independent writes). Logging events ship via the always-on
// debug_log wire batch and land in the computer's per-session log file when
// the user has DEBUG LOGGING ON. Privacy: counts + contentHash only.

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ record: state.record }),
    },
  ),
);
