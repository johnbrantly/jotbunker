import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from '@jotbunker/shared';
import { DEFAULT_SCRATCHPAD_CATEGORIES, CATEGORY_COUNT } from '@jotbunker/shared';

interface ScratchpadState {
  contents: { content: string; updatedAt: number }[];
  categories: Category[];
  activeSlot: number;
  setActiveSlot: (slot: number) => void;
  setContent: (text: string) => void;
  updateCategories: (categories: Category[]) => void;
}

const emptyContents = () => Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 }));

export const useScratchpadStore = create<ScratchpadState>()(
  persist(
    (set, get) => ({
      contents: emptyContents(),
      categories: DEFAULT_SCRATCHPAD_CATEGORIES,
      activeSlot: 0,

      setActiveSlot: (slot) => set({ activeSlot: slot }),

      setContent: (text) =>
        set((state) => {
          const newContents = [...state.contents];
          newContents[state.activeSlot] = { content: text, updatedAt: Date.now() };
          return { contents: newContents };
        }),

      updateCategories: (categories) => set({ categories }),
    }),
    {
      name: 'jotbunker-scratchpad',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contents: state.contents,
        categories: state.categories,
        activeSlot: state.activeSlot,
      }),
    },
  ),
);
