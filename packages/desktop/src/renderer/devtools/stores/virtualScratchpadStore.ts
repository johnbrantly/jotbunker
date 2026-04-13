import { create } from 'zustand'
import type { Category } from '@jotbunker/shared'
import { DEFAULT_SCRATCHPAD_CATEGORIES } from '@jotbunker/shared'

interface VirtualScratchpadState {
  contents: Record<string, { content: string; updatedAt: number }>
  categories: Category[]
  activeCategoryId: string
  setActiveCategory: (id: string) => void
  setContent: (text: string) => void
  updateCategories: (categories: Category[]) => void
}

export const useVirtualScratchpadStore = create<VirtualScratchpadState>()(
  (set) => ({
    contents: {},
    categories: DEFAULT_SCRATCHPAD_CATEGORIES,
    activeCategoryId: DEFAULT_SCRATCHPAD_CATEGORIES[0].id,

    setActiveCategory: (id) => set({ activeCategoryId: id }),

    setContent: (text) =>
      set((state) => ({
        contents: {
          ...state.contents,
          [state.activeCategoryId]: {
            content: text,
            updatedAt: Date.now(),
          },
        },
      })),

    updateCategories: (categories) => set({ categories }),
  }),
)
