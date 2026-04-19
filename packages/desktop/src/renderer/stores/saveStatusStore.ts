import { create } from 'zustand'

// Global "writing jot(s) to disk" signal. Distinct from `isTransferring` on the
// sync hook, which covers phone → desktop in-memory transfers. This one covers
// DOWNLOAD ALL's multi-file write and the big ↓ Quicksave header button's
// waitForJotData + saveToTagWithMedia flow. Both ops take noticeable time when a
// jot has many attachments and must be mutually exclusive so a second click
// doesn't race the first.
interface SaveStatusState {
  isSaving: boolean
  setSaving: (v: boolean) => void
}

export const useSaveStatusStore = create<SaveStatusState>()((set) => ({
  isSaving: false,
  setSaving: (v) => set({ isSaving: v }),
}))
