import { vi } from 'vitest'

// ── react-native-quick-crypto ──
// Delegates to Node's built-in crypto for NaCl wire encryption (MobileTransport.ts)
vi.mock('react-native-quick-crypto', () => {
  const nodeCrypto = globalThis.crypto
  return {
    default: {
      getRandomValues: (arr: Uint8Array) => nodeCrypto.getRandomValues(arr),
      subtle: nodeCrypto.subtle,
    },
  }
})

// ── @react-native-async-storage/async-storage ──
const asyncStorageData: Record<string, string> = {}
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStorageData[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStorageData[key] = value
    }),
    removeItem: vi.fn(async (key: string) => {
      delete asyncStorageData[key]
    }),
  },
}))

export function resetAsyncStorage() {
  for (const key of Object.keys(asyncStorageData)) {
    delete asyncStorageData[key]
  }
}

// ── expo-crypto ──
vi.mock('expo-crypto', () => ({
  randomUUID: () => globalThis.crypto.randomUUID(),
}))

// ── expo-file-system ──
vi.mock('expo-file-system', () => ({
  File: vi.fn(),
  documentDirectory: '/mock/documents/',
}))

// ── zustand persist storage ──
// For tests that import stores directly, we need AsyncStorage available.
// The mock above handles this since zustand's createJSONStorage uses it.
