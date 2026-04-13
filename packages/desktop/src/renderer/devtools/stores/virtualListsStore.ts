import { create } from 'zustand'
import { createItemSlice, DEFAULT_LISTS_CATEGORIES } from '@jotbunker/shared'
import type { ItemSliceState } from '@jotbunker/shared'

export const useVirtualListsStore = create<ItemSliceState>()(
  createItemSlice({
    defaultCategories: DEFAULT_LISTS_CATEGORIES,
    generateUUID: () => crypto.randomUUID(),
  }),
)
