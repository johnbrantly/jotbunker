import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { InputModeId } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'
import { JOT_COUNT } from '@jotbunker/shared'
import type { JotMeta } from '@jotbunker/shared'

export interface AudioRecording {
  id: string
  dataUri: string
  duration: number
  createdAt: number
}

export interface JotImage {
  id: string
  dataUri: string
  format: string
  createdAt: number
}

export interface JotFile {
  id: string
  dataUri: string
  fileName: string
  mimeType: string
  size: number
  createdAt: number
}

export interface JotData {
  text: string
  textUpdatedAt: number
  drawing: string | null
  drawingUpdatedAt: number
  images: JotImage[]
  recordings: AudioRecording[]
  files: JotFile[]
}

function emptyJot(): JotData {
  return { text: '', textUpdatedAt: 0, drawing: null, drawingUpdatedAt: 0, images: [], recordings: [], files: [] }
}

export interface ManifestEntry {
  hasText: boolean
  hasDrawing: boolean
  imageIds: string[]
  audioIds: string[]
  fileIds: string[]
}

interface JotsState {
  jots: Record<number, JotData>
  manifest: Record<number, ManifestEntry>
  jotMetaFetched: Record<number, boolean>
  jotMetaLoading: Record<number, boolean>
  activeJotId: number
  activeMode: InputModeId
  setActiveJot: (id: number) => void
  setActiveMode: (mode: InputModeId) => void
  clearJot: (jotId: number) => void
  setManifest: (entries: { id: number; hasText: boolean; hasDrawing: boolean; imageIds: string[]; audioIds: string[]; fileIds: string[] }[]) => void
  setJotMetaLoading: (jotId: number, loading: boolean) => void
  setJotMetaFetched: (jotId: number, fetched: boolean) => void
  invalidateJotMeta: (jotId: number) => void

  // Sync-specific actions
  setJotMetadata: (jotId: number, meta: JotMeta) => void
  updateText: (jotId: number, text: string) => void
  setImageData: (jotId: number, imageId: string, base64: string, format: string) => void
  setAudioData: (jotId: number, audioId: string, base64: string) => void
  setImageLoading: (jotId: number, imageId: string, loading: boolean) => void
  setAudioLoading: (jotId: number, audioId: string, loading: boolean) => void
  setFileData: (jotId: number, fileId: string, base64: string, mimeType: string, fileName: string, size: number) => void
  setFileLoading: (jotId: number, fileId: string, loading: boolean) => void
}

function initJots(): Record<number, JotData> {
  const jots: Record<number, JotData> = {}
  for (let i = 1; i <= JOT_COUNT; i++) {
    jots[i] = emptyJot()
  }
  return jots
}

export const useJotsStore = create<JotsState>()(
    persist(
      (set, get) => ({
      jots: initJots(),
      manifest: {},
      jotMetaFetched: {},
      jotMetaLoading: {},
      activeJotId: 1,
      activeMode: 'type',

      setActiveJot: (id) => set({ activeJotId: id }),
      setActiveMode: (mode) => set({ activeMode: mode }),

      setManifest: (entries) =>
        set((state) => {
          const manifest = { ...state.manifest }
          for (const s of entries) {
            manifest[s.id] = { hasText: s.hasText, hasDrawing: s.hasDrawing, imageIds: s.imageIds, audioIds: s.audioIds, fileIds: s.fileIds || [] }
          }
          return { manifest }
        }),

      setJotMetaLoading: (jotId, loading) =>
        set((state) => ({
          jotMetaLoading: { ...state.jotMetaLoading, [jotId]: loading },
        })),

      setJotMetaFetched: (jotId, fetched) =>
        set((state) => ({
          jotMetaFetched: { ...state.jotMetaFetched, [jotId]: fetched },
        })),

      invalidateJotMeta: (jotId) =>
        set((state) => ({
          jotMetaFetched: { ...state.jotMetaFetched, [jotId]: false },
        })),

      clearJot: (jotId) =>
        set((state) => ({
          jots: { ...state.jots, [jotId]: emptyJot() },
        })),

      // ── Sync-specific actions ──

      setJotMetadata: (jotId, meta) =>
        set((state) => {
          const images: JotImage[] = meta.images.map((im) => ({
            id: im.id,
            dataUri: '',
            format: im.format,
            createdAt: im.createdAt,
          }))
          const recordings: AudioRecording[] = meta.recordings.map((rec) => ({
            id: rec.id,
            dataUri: '',
            duration: rec.duration,
            createdAt: rec.createdAt,
          }))
          const files: JotFile[] = (meta.files || []).map((f) => ({
            id: f.id,
            dataUri: '',
            fileName: f.fileName,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt,
          }))
          return {
            jots: {
              ...state.jots,
              [jotId]: {
                text: meta.text,
                textUpdatedAt: meta.textUpdatedAt || 0,
                drawing: meta.drawing,
                drawingUpdatedAt: meta.drawingUpdatedAt || 0,
                images,
                recordings,
                files,
              },
            },
          }
        }),

      updateText: (jotId, text) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: { ...state.jots[jotId], text, textUpdatedAt: Date.now() },
          },
        })),

      setImageData: (jotId, imageId, base64, format) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              images: state.jots[jotId].images.map((img) =>
                img.id === imageId ? { ...img, dataUri: `data:image/${format};base64,${base64}` } : img,
              ),
            },
          },
        })),

      setAudioData: (jotId, audioId, base64) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              recordings: state.jots[jotId].recordings.map((rec) =>
                rec.id === audioId ? { ...rec, dataUri: `data:audio/mp4;base64,${base64}` } : rec,
              ),
            },
          },
        })),

      setImageLoading: (jotId, imageId, loading) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              images: state.jots[jotId]?.images?.map((img) =>
                img.id === imageId ? { ...img, loading } : img,
              ) || [],
            },
          },
        })),

      setAudioLoading: (jotId, audioId, loading) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              recordings: state.jots[jotId]?.recordings?.map((rec) =>
                rec.id === audioId ? { ...rec, loading } : rec,
              ) || [],
            },
          },
        })),

      setFileData: (jotId, fileId, base64, mimeType, fileName, size) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              files: (state.jots[jotId]?.files || []).map((f) =>
                f.id === fileId ? { ...f, dataUri: `data:${mimeType};base64,${base64}`, fileName, size } : f,
              ),
            },
          },
        })),

      setFileLoading: (jotId, fileId, loading) =>
        set((state) => ({
          jots: {
            ...state.jots,
            [jotId]: {
              ...state.jots[jotId],
              files: (state.jots[jotId]?.files || []).map((f) =>
                f.id === fileId ? { ...f, loading } : f,
              ),
            },
          },
        })),
    }),
      {
        name: 'jotbunker-jots',
        storage: createJSONStorage(() => ipcStorage),
        partialize: (state) => ({
          // Only persist manifest and active state — jot data is always fetched fresh from phone
          manifest: state.manifest,
          activeJotId: state.activeJotId,
          activeMode: state.activeMode,
        }),
      },
    ),
)
