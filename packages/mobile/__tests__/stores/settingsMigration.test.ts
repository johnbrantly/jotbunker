import { describe, it, expect } from 'vitest'
import { DEFAULT_HUE, DEFAULT_GRAYSCALE, DEFAULT_SYNC_PORT, DEFAULT_LOCKED_LISTS_LOCK_MS } from '@jotbunker/shared'

// Extract the migrate function logic from settingsStore's persist config
// The migration: version 0 → 1 sets setupComplete = true
function migrate(persisted: any, version: number): any {
  if (version === 0) {
    persisted.setupComplete = true
  }
  return persisted
}

describe('settingsStore migration', () => {
  it('version 0 → 1 migration sets setupComplete = true', () => {
    const v0State = {
      setupComplete: false,
      syncServerIp: '192.168.1.1',
      syncPort: DEFAULT_SYNC_PORT,
      syncPairingSecret: 'abc',
      accentHue: DEFAULT_HUE,
    }

    const migrated = migrate(v0State, 0)
    expect(migrated.setupComplete).toBe(true)
    expect(migrated.syncServerIp).toBe('192.168.1.1')
  })

  it('version 1 data passes through unchanged', () => {
    const v1State = {
      setupComplete: false,
      syncServerIp: '',
      syncPort: DEFAULT_SYNC_PORT,
      syncPairingSecret: '',
      accentHue: DEFAULT_HUE,
      accentGrayscale: DEFAULT_GRAYSCALE,
    }

    const result = migrate({ ...v1State }, 1)
    expect(result.setupComplete).toBe(false)
    expect(result).toEqual(v1State)
  })

  it('missing fields get defaults from zustand (not overwritten by migration)', () => {
    // Simulates loading version 0 state that predates some fields
    const sparseV0 = {
      setupComplete: false,
      syncServerIp: '10.0.0.1',
    }

    const migrated = migrate(sparseV0, 0)
    expect(migrated.setupComplete).toBe(true)
    // Fields not present before persist merge remain absent — zustand's merge fills defaults
    expect(migrated.syncServerIp).toBe('10.0.0.1')
  })

  it('v1 state missing newer fields survives migration (zustand merge fills defaults)', () => {
    // Simulates a v1 state saved before keepAwake fields were added.
    const oldV1State = {
      setupComplete: true,
      syncServerIp: '192.168.1.5',
      syncPort: DEFAULT_SYNC_PORT,
      syncPairingSecret: 'secret',
      accentHue: DEFAULT_HUE,
      accentGrayscale: DEFAULT_GRAYSCALE,
      lockedListsLockEnabled: true,
      lockedListsLockTimeout: DEFAULT_LOCKED_LISTS_LOCK_MS,
      debugLog: false,
    }

    const result = migrate({ ...oldV1State }, 1)
    // Migration should not touch v1 state. Newer fields like keepAwakeEnabled,
    // keepAwakeMinutes, keepAwakeAlways are NOT added by migration; zustand's
    // merge strategy fills them from the store's initial state at runtime.
    expect(result.setupComplete).toBe(true)
    expect(result.syncServerIp).toBe('192.168.1.5')
    expect(result.keepAwakeEnabled).toBeUndefined()
    expect(result.keepAwakeMinutes).toBeUndefined()
    expect(result.keepAwakeAlways).toBeUndefined()
  })

  it('v1 → v2 migration strips removed autoConnectOnOpen / autoSyncOnConnect keys', () => {
    function migrateV2(persisted: any, version: number): any {
      if (version === 0) {
        persisted.setupComplete = true
      }
      if (version < 2) {
        delete persisted.autoConnectOnOpen
        delete persisted.autoSyncOnConnect
      }
      return persisted
    }

    const v1State = {
      setupComplete: true,
      syncServerIp: '192.168.1.5',
      autoConnectOnOpen: true,
      autoSyncOnConnect: true,
    }

    const result = migrateV2({ ...v1State }, 1)
    expect(result.setupComplete).toBe(true)
    expect(result.syncServerIp).toBe('192.168.1.5')
    expect(result.autoConnectOnOpen).toBeUndefined()
    expect(result.autoSyncOnConnect).toBeUndefined()
  })
})
