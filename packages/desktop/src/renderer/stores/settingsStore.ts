import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_HUE, DEFAULT_GRAYSCALE, DEFAULT_SYNC_PORT } from '@jotbunker/shared'
import { ipcStorage } from './ipcStorage'

interface SettingsState {
  setupComplete: boolean
  setSetupComplete: (v: boolean) => void
  accentHue: number
  setAccentHue: (hue: number) => void
  accentGrayscale: number
  setAccentGrayscale: (gs: number) => void
  syncPort: number
  setSyncPort: (port: number) => void
  syncInterfaceIp: string
  setSyncInterfaceIp: (ip: string) => void
  scratchpadFontSize: number
  setScratchpadFontSize: (size: number) => void
  listFontSize: number
  setListFontSize: (size: number) => void
  tagFontSize: number
  setTagFontSize: (size: number) => void
  tagRootPath: string
  setTagRootPath: (path: string) => void
  debugLog: boolean
  setDebugLog: (v: boolean) => void
  syncConfirmation: boolean
  setSyncConfirmation: (v: boolean) => void
  pairingSecret: string
  setPairingSecret: (secret: string) => void
  autoSyncEnabled: boolean
  setAutoSyncEnabled: (v: boolean) => void
  autoSyncDelaySec: number
  setAutoSyncDelaySec: (n: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      setupComplete: false,
      setSetupComplete: (v) => set({ setupComplete: v }),
      accentHue: DEFAULT_HUE,
      setAccentHue: (hue) => set({ accentHue: hue }),
      accentGrayscale: DEFAULT_GRAYSCALE,
      setAccentGrayscale: (gs) => set({ accentGrayscale: gs }),
      syncPort: DEFAULT_SYNC_PORT,
      setSyncPort: (port) => set({ syncPort: port }),
      syncInterfaceIp: '',
      setSyncInterfaceIp: (ip) => set({ syncInterfaceIp: ip }),
      scratchpadFontSize: 16,
      setScratchpadFontSize: (size) => set({ scratchpadFontSize: size }),
      listFontSize: 15,
      setListFontSize: (size) => set({ listFontSize: size }),
      tagFontSize: 10,
      setTagFontSize: (size) => set({ tagFontSize: size }),
      tagRootPath: '',
      setTagRootPath: (path) => set({ tagRootPath: path }),
      debugLog: false,
      setDebugLog: (v) => set({ debugLog: v }),
      syncConfirmation: false,
      setSyncConfirmation: (v) => set({ syncConfirmation: v }),
      pairingSecret: '',
      setPairingSecret: (secret) => set({ pairingSecret: secret }),
      autoSyncEnabled: false,
      setAutoSyncEnabled: (v) => set({ autoSyncEnabled: v }),
      autoSyncDelaySec: 30,
      setAutoSyncDelaySec: (n) => set({ autoSyncDelaySec: n }),
    }),
    {
      name: 'jotbunker-settings',
      storage: createJSONStorage(() => ipcStorage),
      version: 3,
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          persisted.setupComplete = true
        }
        if (version < 2) {
          persisted.syncConfirmation = false
        }
        if (version < 3) {
          persisted.autoSyncEnabled = false
          persisted.autoSyncDelaySec = 30
        }
        return persisted
      },
    },
  ),
)
