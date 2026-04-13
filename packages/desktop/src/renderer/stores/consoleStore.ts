import { create } from 'zustand'

export interface ConsoleEntry {
  id: number
  timestamp: number
  text: string
}

interface ConsoleState {
  entries: ConsoleEntry[]
  log: (text: string) => void
  clear: () => void
}

let nextId = 1

export const useConsoleStore = create<ConsoleState>()((set) => ({
  entries: [],
  log: (text) =>
    set((state) => {
      const entry = { id: nextId++, timestamp: Date.now(), text }
      const entries = [entry, ...state.entries]
      if (entries.length > 50) entries.length = 50
      // Write to persistent log file (fire-and-forget)
      window.electronAPI?.writeSystemLog?.(entry.timestamp, text)
      return { entries }
    }),
  clear: () => set({ entries: [] }),
}))
