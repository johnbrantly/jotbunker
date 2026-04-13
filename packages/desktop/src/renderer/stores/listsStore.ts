import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LISTS_CATEGORIES, createItemSlice } from '@jotbunker/shared'
import type { ItemSliceState } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

export type { StoreItem as ListsItem } from '@jotbunker/shared'

export const useListsStore = create<ItemSliceState>()(
  persist(
    createItemSlice({
      defaultCategories: DEFAULT_LISTS_CATEGORIES,
      generateUUID: () => crypto.randomUUID(),
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
