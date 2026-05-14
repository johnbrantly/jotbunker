import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCKED_LISTS_CATEGORIES, createItemSlice, syncLog } from '@jotbunker/shared';
import type { ItemSliceState } from '@jotbunker/shared';

export type { StoreItem as LockedListItem } from '@jotbunker/shared';

// Tombstone + GC events ship via the always-on debug_log wire batch. Privacy:
// Locked Lists items carry secrets - text MUST NEVER appear in any log line.

interface LockedListsState extends ItemSliceState {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useLockedListsStore = create<LockedListsState>()(
  persist(
    (set, get) => ({
      ...createItemSlice({
        defaultCategories: DEFAULT_LOCKED_LISTS_CATEGORIES,
        generateUUID: Crypto.randomUUID,
        onTombstoneCreated: (info) => {
          syncLog('TOMBSTONE', `lockedLists deleteItem id=${info.id} slot=${info.slot} at=${info.deletedAt}`)
        },
        onTombstoneViolation: (info) => {
          syncLog('TOMBSTONE', `WARN lockedLists ${info.op} on tombstoned id=${info.id} slot=${info.slot}`)
        },
        onTombstoneGC: (info) => {
          syncLog('GC', `lockedLists dropped ${info.droppedCount} tombstones`)
        },
      })(set, get),
      isUnlocked: false,
      unlock: () => set({ isUnlocked: true }),
      lock: () => set({ isUnlocked: false }),
    }),
    {
      name: 'jotbunker-lockedLists',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
        activeSlot: state.activeSlot,
        // isUnlocked intentionally NOT persisted — always starts locked
      }),
    },
  ),
);
