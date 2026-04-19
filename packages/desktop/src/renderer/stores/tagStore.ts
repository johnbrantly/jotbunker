import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ipcStorage } from './ipcStorage'

export const QUICKSAVE_TAG_ID = 'quicksave'

export interface Tag {
  id: string
  label: string
  createdAt: number
  isFavorite: boolean
}

const QUICKSAVE_TAG: Tag = {
  id: QUICKSAVE_TAG_ID,
  label: 'Quicksave',
  createdAt: 0,
  isFavorite: true,
}

interface TagState {
  tags: Tag[]
  selectedTagId: string
  addTag: (label: string) => void
  removeTag: (id: string) => void
  removeTags: (ids: string[]) => void
  toggleFavorite: (id: string) => void
  selectTag: (id: string) => void
}

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [QUICKSAVE_TAG],
      selectedTagId: QUICKSAVE_TAG_ID,

      addTag: (label) =>
        set((state) => ({
          tags: [
            ...state.tags,
            {
              id: crypto.randomUUID(),
              label,
              createdAt: Date.now(),
              isFavorite: false,
            },
          ],
        })),

      removeTag: (id) =>
        set((state) => {
          if (id === QUICKSAVE_TAG_ID) return state
          return {
            tags: state.tags.filter((t) => t.id !== id),
            selectedTagId: state.selectedTagId === id ? QUICKSAVE_TAG_ID : state.selectedTagId,
          }
        }),

      removeTags: (ids) =>
        set((state) => {
          const idSet = new Set(ids)
          idSet.delete(QUICKSAVE_TAG_ID)
          if (idSet.size === 0) return state
          return {
            tags: state.tags.filter((t) => !idSet.has(t.id)),
            selectedTagId: idSet.has(state.selectedTagId) ? QUICKSAVE_TAG_ID : state.selectedTagId,
          }
        }),

      toggleFavorite: (id) =>
        set((state) => {
          if (id === QUICKSAVE_TAG_ID) return state
          return {
            tags: state.tags.map((t) =>
              t.id === id ? { ...t, isFavorite: !t.isFavorite } : t,
            ),
          }
        }),

      selectTag: (id) => set({ selectedTagId: id }),
    }),
    {
      name: 'jotbunker-tags',
      storage: createJSONStorage(() => ipcStorage),
      partialize: (state) => ({
        tags: state.tags,
        selectedTagId: state.selectedTagId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<TagState> & { selectedTagId?: string | null }
        let tags = (p.tags ?? []).map((t) => ({ ...t, isFavorite: t.isFavorite ?? false }))
        // Ensure quicksave tag exists
        const hasQuicksave = tags.some((t) => t.id === QUICKSAVE_TAG_ID)
        if (!hasQuicksave) {
          tags = [QUICKSAVE_TAG, ...tags]
        } else {
          // Force quicksave to always be favorited
          tags = tags.map((t) => t.id === QUICKSAVE_TAG_ID ? { ...t, isFavorite: true } : t)
        }
        // Invariant: selectedTagId always points to an existing tag. If stale/null, snap to Quicksave.
        const persistedSelected = p.selectedTagId
        const selectedTagId = (persistedSelected && tags.some((t) => t.id === persistedSelected))
          ? persistedSelected
          : QUICKSAVE_TAG_ID
        return {
          ...current,
          ...p,
          tags,
          selectedTagId,
        }
      },
    },
  ),
)
