import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncPhaseManager } from '../../src/sync/SyncPhaseManager'
import type { SyncTransport } from '../../src/sync/SyncTransport'
import type { MobileSyncPlatform } from '../../src/sync/SyncEngine'

function stubTransport(): SyncTransport {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(() => true),
    onMessage: null,
    onStatusChange: null,
  }
}

function stubPlatform() {
  return {
    deviceId: 'test-device',
    getLastSyncTimestamp: vi.fn(() => 0),
    setLastSyncTimestamp: vi.fn(),
    handleStateSync: vi.fn(),
    onConnectionStatusChange: vi.fn(),
  } as unknown as MobileSyncPlatform & {
    onConnectionStatusChange: ReturnType<typeof vi.fn>
    setLastSyncTimestamp: ReturnType<typeof vi.fn>
  }
}

describe('SyncPhaseManager', () => {
  let transport: SyncTransport
  let platform: ReturnType<typeof stubPlatform>

  beforeEach(() => {
    transport = stubTransport()
    platform = stubPlatform()
  })

  it('connect (mobile mode) → phase key_exchange, callback connecting', () => {
    const mgr = new SyncPhaseManager(transport, platform, false)
    mgr.handleTransportStatus(true, () => true)

    expect(mgr.phase).toBe('key_exchange')
    expect(platform.onConnectionStatusChange).toHaveBeenCalledWith('connecting')
  })

  it('connect (server mode) → phase syncing, callback connecting', () => {
    const mgr = new SyncPhaseManager(transport, platform, true)
    mgr.handleTransportStatus(true, () => false)

    expect(mgr.phase).toBe('syncing')
    expect(platform.onConnectionStatusChange).toHaveBeenCalledWith('connecting')
  })

  it('disconnect from docked → phase disconnected, NO timestamp update, callback unreachable', () => {
    // b997700: disconnect no longer updates lastSyncTimestamp (caused data loss)
    const mgr = new SyncPhaseManager(transport, platform, false)
    mgr.setPhase('docked')

    mgr.handleTransportStatus(false, () => true)

    expect(mgr.phase).toBe('disconnected')
    expect(platform.setLastSyncTimestamp).not.toHaveBeenCalled()
    expect(platform.onConnectionStatusChange).toHaveBeenCalledWith('unreachable')
  })

  it('disconnect from syncing → phase disconnected, callback unreachable', () => {
    const mgr = new SyncPhaseManager(transport, platform, true)
    mgr.setPhase('syncing')

    mgr.handleTransportStatus(false, () => false)

    expect(mgr.phase).toBe('disconnected')
    expect(platform.onConnectionStatusChange).toHaveBeenCalledWith('unreachable')
  })

  it('phase timeout clears on disconnect', () => {
    const mgr = new SyncPhaseManager(transport, platform, false)
    mgr.phaseTimeout = setTimeout(() => {}, 60000) as any

    mgr.handleTransportStatus(false, () => true)

    expect(mgr.phaseTimeout).toBeNull()
  })
})
