import type { Category } from '../types'
import { CATEGORY_COUNT, MAX_ITEMS_PER_CATEGORY } from '../constants'
import { recomputePositions } from '../sync/utils'

export interface StoreItem {
  id: string
  text: string
  done: boolean
  position: number
  createdAt: number
  updatedAt: number
}

export interface ItemSliceState {
  items: StoreItem[][]
  categories: Category[]
  activeSlot: number
  setActiveSlot: (slot: number) => void
  addItem: (text: string) => void
  toggleItem: (itemId: string) => void
  deleteItem: (itemId: string) => void
  updateItemText: (itemId: string, text: string) => void
  reorderItems: (slot: number, items: StoreItem[]) => void
  moveItemToCategory: (itemId: string, fromSlot: number, toSlot: number) => void
  updateCategories: (categories: Category[]) => void
  getUncheckedCount: (slot: number) => number
}

export interface ItemSliceConfig {
  defaultCategories: Category[]
  generateUUID: () => string
}

function emptySlots(): StoreItem[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

type ItemSliceSet = (partial: Partial<ItemSliceState> | ((state: ItemSliceState) => Partial<ItemSliceState> | ItemSliceState)) => void
type ItemSliceGet = () => ItemSliceState

export function createItemSlice(config: ItemSliceConfig) {
  return (set: ItemSliceSet, get: ItemSliceGet): ItemSliceState => ({
    items: emptySlots(),
    categories: config.defaultCategories,
    activeSlot: 0,

    setActiveSlot: (slot) => set({ activeSlot: slot }),

    addItem: (text) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        if (existing.length >= MAX_ITEMS_PER_CATEGORY) return state
        const now = Date.now()
        const newItem: StoreItem = {
          id: config.generateUUID(),
          text,
          done: false,
          position: 0,
          createdAt: now,
          updatedAt: now,
        }
        const updated = recomputePositions([newItem, ...existing])
        const newItems = [...state.items]
        newItems[slot] = updated
        return { items: newItems }
      }),

    toggleItem: (itemId) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const newItems = [...state.items]
        newItems[slot] = existing.map((item) =>
          item.id === itemId
            ? { ...item, done: !item.done, updatedAt: Date.now() }
            : item,
        )
        return { items: newItems }
      }),

    deleteItem: (itemId) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const newItems = [...state.items]
        newItems[slot] = recomputePositions(existing.filter((item) => item.id !== itemId))
        return { items: newItems }
      }),

    updateItemText: (itemId, text) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const newItems = [...state.items]
        newItems[slot] = existing.map((item) =>
          item.id === itemId
            ? { ...item, text, updatedAt: Date.now() }
            : item,
        )
        return { items: newItems }
      }),

    reorderItems: (slot, items) =>
      set((state: ItemSliceState) => {
        const now = Date.now()
        const newItems = [...state.items]
        newItems[slot] = items.map((item: StoreItem, i: number) => ({
          ...item,
          position: i,
          updatedAt: now,
        }))
        return { items: newItems }
      }),

    moveItemToCategory: (itemId, fromSlot, toSlot) =>
      set((state: ItemSliceState) => {
        const sourceItems = state.items[fromSlot] || []
        const item = sourceItems.find((i) => i.id === itemId)
        if (!item) return state
        const targetItems = state.items[toSlot] || []
        const now = Date.now()
        const newItems = [...state.items]
        newItems[fromSlot] = recomputePositions(sourceItems.filter((i) => i.id !== itemId))
        newItems[toSlot] = recomputePositions([{ ...item, position: 0, updatedAt: now }, ...targetItems])
        return { items: newItems }
      }),

    updateCategories: (categories) => set({ categories }),

    getUncheckedCount: (slot) => {
      const items = get().items[slot] || []
      return items.filter((item: StoreItem) => !item.done).length
    },
  })
}
