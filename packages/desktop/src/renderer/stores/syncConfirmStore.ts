import { create } from 'zustand'
import type { SyncReport } from '@jotbunker/shared'

export type SyncConfirmChoice = 'confirm' | 'cancel' | 'desktop-wins' | 'phone-wins'

interface SyncConfirmState {
  pending: {
    report: SyncReport
    resolve: (choice: SyncConfirmChoice) => void
  } | null
  requestConfirmation: (report: SyncReport) => Promise<SyncConfirmChoice>
  respond: (choice: SyncConfirmChoice) => void
}

export const useSyncConfirmStore = create<SyncConfirmState>()((set, get) => ({
  pending: null,

  requestConfirmation(report: SyncReport): Promise<SyncConfirmChoice> {
    return new Promise<SyncConfirmChoice>((resolve) => {
      set({ pending: { report, resolve } })
    })
  },

  respond(choice: SyncConfirmChoice) {
    const { pending } = get()
    if (pending) {
      pending.resolve(choice)
      set({ pending: null })
    }
  },
}))
