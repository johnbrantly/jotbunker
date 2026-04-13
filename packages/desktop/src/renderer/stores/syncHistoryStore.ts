import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SyncReport } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

const MAX_ENTRIES = 10

export interface SyncHistoryEntry {
  id: number
  timestamp: number
  summary: string
  report: SyncReport
}

interface SyncHistoryState {
  entries: SyncHistoryEntry[]
  nextId: number
  addEntry: (summary: string, report: SyncReport) => void
  clear: () => void
}

export const useSyncHistoryStore = create<SyncHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      nextId: 1,
      addEntry: (summary, report) =>
        set((state) => {
          const entry: SyncHistoryEntry = {
            id: state.nextId,
            timestamp: Date.now(),
            summary,
            report,
          }
          const entries = [entry, ...state.entries]
          if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
          return { entries, nextId: state.nextId + 1 }
        }),
      clear: () => set({ entries: [], nextId: 1 }),
    }),
    {
      name: 'jotbunker-sync-history',
      storage: createJSONStorage(() => ipcStorage),
      partialize: (state) => ({
        entries: state.entries,
        nextId: state.nextId,
      }),
    },
  ),
)
