import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LISTS_CATEGORIES, createItemSlice } from '@jotbunker/shared'
import type { ItemSliceState } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

export type { StoreItem as ListsItem } from '@jotbunker/shared'

// Tombstone + GC log lines route to desktop-sync.log via electronAPI.sendDebugLog
// (always-on, not gated by DEBUG LOGGING). Privacy: ids/counts only, never text.

export const useListsStore = create<ItemSliceState>()(
  persist(
    createItemSlice({
      defaultCategories: DEFAULT_LISTS_CATEGORIES,
      generateUUID: () => crypto.randomUUID(),
      onTombstoneCreated: (info) => {
        window.electronAPI.sendDebugLog(`[tombstone] INFO lists deleteItem id=${info.id} slot=${info.slot} at=${info.deletedAt}`)
      },
      onTombstoneViolation: (info) => {
        window.electronAPI.sendDebugLog(`[tombstone] WARN lists ${info.op} on tombstoned id=${info.id} slot=${info.slot}`)
      },
      onTombstoneGC: (info) => {
        window.electronAPI.sendDebugLog(`[gc] INFO lists dropped ${info.droppedCount} tombstones`)
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
