import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LISTS_CATEGORIES, createItemSlice, syncLog } from '@jotbunker/shared'
import type { ItemSliceState } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

export type { StoreItem as ListsItem } from '@jotbunker/shared'

// Tombstone + GC events route through syncLog, which is gated by the user's
// DEBUG LOGGING toggle. Privacy: ids/counts only, never text.

export const useListsStore = create<ItemSliceState>()(
  persist(
    createItemSlice({
      defaultCategories: DEFAULT_LISTS_CATEGORIES,
      generateUUID: () => crypto.randomUUID(),
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
      storage: createJSONStorage(() => ipcStorage),
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
        activeSlot: state.activeSlot,
      }),
    },
  ),
)
