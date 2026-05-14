import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DEFAULT_LISTS_CATEGORIES, createItemSlice, syncLog } from '@jotbunker/shared';
import type { ItemSliceState } from '@jotbunker/shared';

export type { StoreItem as ListsItem } from '@jotbunker/shared';

// Tombstone + GC events ship via the always-on debug_log wire batch (phone is
// always loud per the asymmetric debug architecture). Lands in the computer's
// per-session log file IF and only if the user has DEBUG LOGGING ON. Privacy:
// ids only, never text.

export const useListsStore = create<ItemSliceState>()(
  persist(
    createItemSlice({
      defaultCategories: DEFAULT_LISTS_CATEGORIES,
      generateUUID: Crypto.randomUUID,
      onTombstoneCreated: (info) => {
        syncLog('TOMBSTONE', `lists deleteItem id=${info.id} slot=${info.slot} at=${info.deletedAt}`)
      },
      onTombstoneViolation: (info) => {
        syncLog('TOMBSTONE', `WARN lists ${info.op} on tombstoned id=${info.id} slot=${info.slot}`)
      },
      onTombstoneGC: (info) => {
        syncLog('GC', `lists dropped ${info.droppedCount} tombstones`)
      },
    }),
    {
      name: 'jotbunker-lists',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
        activeSlot: state.activeSlot,
      }),
    },
  ),
);
