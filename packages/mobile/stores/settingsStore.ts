import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCKED_LISTS_LOCK_MS, DEFAULT_HUE, DEFAULT_GRAYSCALE, DEFAULT_SYNC_PORT } from '@jotbunker/shared';

interface SettingsState {
  setupComplete: boolean;
  setSetupComplete: (v: boolean) => void;
  syncServerIp: string;
  setSyncServerIp: (ip: string) => void;
  syncPort: number;
  setSyncPort: (port: number) => void;
  syncPairingSecret: string;
  setSyncPairingSecret: (secret: string) => void;
  syncOnConnect: boolean;
  setSyncOnConnect: (v: boolean) => void;
  lockedListsLockEnabled: boolean;
  setLockedListsLockEnabled: (v: boolean) => void;
  lockedListsLockTimeout: number;
  setLockedListsLockTimeout: (ms: number) => void;
  accentHue: number;
  setAccentHue: (hue: number) => void;
  accentGrayscale: number;
  setAccentGrayscale: (gs: number) => void;
  scratchpadFontSize: number;
  setScratchpadFontSize: (size: number) => void;
  listFontSize: number;
  setListFontSize: (size: number) => void;
  appLockEnabled: boolean;
  setAppLockEnabled: (v: boolean) => void;
  keepAwakeEnabled: boolean;
  setKeepAwakeEnabled: (v: boolean) => void;
  keepAwakeMinutes: number;
  setKeepAwakeMinutes: (m: number) => void;
  keepAwakeAlways: boolean;
  setKeepAwakeAlways: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      setupComplete: false,
      setSetupComplete: (v) => set({ setupComplete: v }),
      syncServerIp: '',
      setSyncServerIp: (ip) => set({ syncServerIp: ip }),
      syncPort: DEFAULT_SYNC_PORT,
      setSyncPort: (port) => set({ syncPort: port }),
      syncPairingSecret: '',
      setSyncPairingSecret: (secret) => set({ syncPairingSecret: secret }),
      syncOnConnect: true,
      setSyncOnConnect: (v) => set({ syncOnConnect: v }),
      lockedListsLockEnabled: true,
      setLockedListsLockEnabled: (v) => set({ lockedListsLockEnabled: v }),
      lockedListsLockTimeout: DEFAULT_LOCKED_LISTS_LOCK_MS,
      setLockedListsLockTimeout: (ms) => set({ lockedListsLockTimeout: ms }),
      accentHue: DEFAULT_HUE,
      setAccentHue: (hue) => set({ accentHue: hue }),
      accentGrayscale: DEFAULT_GRAYSCALE,
      setAccentGrayscale: (gs) => set({ accentGrayscale: gs }),
      scratchpadFontSize: 16,
      setScratchpadFontSize: (size) => set({ scratchpadFontSize: size }),
      listFontSize: 15,
      setListFontSize: (size) => set({ listFontSize: size }),
      appLockEnabled: false,
      setAppLockEnabled: (v) => set({ appLockEnabled: v }),
      keepAwakeEnabled: false,
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      keepAwakeMinutes: 5,
      setKeepAwakeMinutes: (m) => set({ keepAwakeMinutes: m }),
      keepAwakeAlways: false,
      setKeepAwakeAlways: (v) => set({ keepAwakeAlways: v }),
    }),
    {
      name: 'jotbunker-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted: any, version: number) => {
        if (version === 0) {
          persisted.setupComplete = true;
        }
        if (version < 2) {
          // Auto-connect / auto-sync features removed; strip stale keys.
          delete persisted.autoConnectOnOpen;
          delete persisted.autoSyncOnConnect;
        }
        if (version < 3) {
          // Phone-side debug toggle removed; computer is the single gate point
          // for sync log persistence. Phone is always loud over the wire.
          delete persisted.debugLog;
        }
        return persisted;
      },
    },
  ),
);
