import { create } from 'zustand'
import { JOT_COUNT } from '@jotbunker/shared'

interface JotData {
  text: string
  textUpdatedAt: number
}

function emptyJot(): JotData {
  return { text: '', textUpdatedAt: 0 }
}

function initJots(): Record<number, JotData> {
  const jots: Record<number, JotData> = {}
  for (let i = 1; i <= JOT_COUNT; i++) {
    jots[i] = emptyJot()
  }
  return jots
}

interface VirtualJotsState {
  jots: Record<number, JotData>
  activeJotId: number
  setActiveJot: (id: number) => void
  updateText: (jotId: number, text: string) => void
  updateTextRemote: (jotId: number, text: string, textUpdatedAt: number) => void
  clearJot: (jotId: number) => void
}

export const useVirtualJotsStore = create<VirtualJotsState>()((set) => ({
  jots: initJots(),
  activeJotId: 1,

  setActiveJot: (id) => set({ activeJotId: id }),

  updateText: (jotId, text) =>
    set((state) => ({
      jots: {
        ...state.jots,
        [jotId]: { text, textUpdatedAt: Date.now() },
      },
    })),

  updateTextRemote: (jotId, text, textUpdatedAt) =>
    set((state) => ({
      jots: {
        ...state.jots,
        [jotId]: { text, textUpdatedAt },
      },
    })),

  clearJot: (jotId) =>
    set((state) => ({
      jots: { ...state.jots, [jotId]: emptyJot() },
    })),
}))
