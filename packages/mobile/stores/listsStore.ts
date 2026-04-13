import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DEFAULT_LISTS_CATEGORIES, createItemSlice } from '@jotbunker/shared';
import type { ItemSliceState } from '@jotbunker/shared';

export type { StoreItem as ListsItem } from '@jotbunker/shared';

export const useListsStore = create<ItemSliceState>()(
  persist(
    createItemSlice({
      defaultCategories: DEFAULT_LISTS_CATEGORIES,
      generateUUID: Crypto.randomUUID,
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
