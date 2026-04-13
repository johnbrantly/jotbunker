import { create } from 'zustand'
import { createItemSlice, DEFAULT_LOCKED_LISTS_CATEGORIES } from '@jotbunker/shared'
import type { ItemSliceState } from '@jotbunker/shared'

export const useVirtualLockedListsStore = create<ItemSliceState>()(
  createItemSlice({
    defaultCategories: DEFAULT_LOCKED_LISTS_CATEGORIES,
    generateUUID: () => crypto.randomUUID(),
  }),
)
