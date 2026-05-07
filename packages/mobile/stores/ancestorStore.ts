import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAncestorSlice } from '@jotbunker/shared';
import type { AncestorSliceState } from '@jotbunker/shared';

// Phase 3: per-device ancestor snapshot. Written after every successful sync
// per Strategy A (independent writes). Mobile leaves the slice's logging
// callbacks unwired so it falls back to console.log / console.warn (Metro
// or logcat). Desktop wires its own callbacks into useConsoleStore.

export const useAncestorStore = create<AncestorSliceState>()(
  persist(
    createAncestorSlice({}),
    {
      name: 'jotbunker-ancestor',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ record: state.record }),
    },
  ),
);
