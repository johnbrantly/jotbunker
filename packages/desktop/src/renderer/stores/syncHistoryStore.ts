import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SyncReport, MergeReport } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

const MAX_ENTRIES = 10

// Phase 5.5 cutover: discriminated-union entry shape. Pre-cutover entries
// carry a `report: SyncReport` (legacy "PHONE HAS / DESKTOP HAS" format).
// Post-cutover entries carry `kind: 'merge'` plus `mergeReport: MergeReport`
// (new auto-merge counts). Detail panel branches on `kind`; mixed history
// renders without crashing.

export interface LegacySyncHistoryEntry {
  id: number
  timestamp: number
  summary: string
  report: SyncReport
  /** Absent on pre-cutover entries; renderer treats absence as legacy. */
  kind?: undefined
}

export interface MergeSyncHistoryEntry {
  id: number
  timestamp: number
  summary: string
  mergeReport: MergeReport
  kind: 'merge'
}

export type SyncHistoryEntry = LegacySyncHistoryEntry | MergeSyncHistoryEntry

interface SyncHistoryState {
  entries: SyncHistoryEntry[]
  nextId: number
  /**
   * Phase 5.5 add: post-cutover sync events. Replaces the legacy
   * `addEntry(summary, report)`. Pre-cutover entries persisted under the
   * legacy shape continue to render via the detail panel's legacy branch.
   */
  addMergeEntry: (summary: string, mergeReport: MergeReport) => void
  clear: () => void
}

export const useSyncHistoryStore = create<SyncHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      nextId: 1,
      addMergeEntry: (summary, mergeReport) =>
        set((state) => {
          const entry: MergeSyncHistoryEntry = {
            id: state.nextId,
            timestamp: Date.now(),
            summary,
            mergeReport,
            kind: 'merge',
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
