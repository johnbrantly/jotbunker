import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncEngine } from '../../src/sync/SyncEngine'
import type { MobileSyncPlatform, DesktopSyncPlatform } from '../../src/sync/SyncEngine'
import type { SyncTransport } from '../../src/sync/SyncTransport'
import type { SyncWireMessage } from '../../src/sync/protocol'

// ── Stubs ──

function stubTransport(): SyncTransport {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(() => true),
    onMessage: null,
    onStatusChange: null,
  }
}

function stubMobilePlatform(): MobileSyncPlatform {
  return {
    deviceId: 'test-phone',
    getLastSyncTimestamp: vi.fn(() => 0),
    setLastSyncTimestamp: vi.fn(),
    handleStateSync: vi.fn(),
    onConnectionStatusChange: vi.fn(),
    onLive: vi.fn(),
    handleKeyExchange: vi.fn(),
    handleDownloadRequest: vi.fn(),
    handleClearRequest: vi.fn(),
    handleFileRequest: vi.fn(),
    handleJotRefreshRequest: vi.fn(),
    handleJotMetaRequest: vi.fn(),
    handleSyncConfirm: vi.fn(),
    handleSyncCancel: vi.fn(),
    buildHandshake: vi.fn(() => ({
      type: 'handshake' as const,
      deviceId: 'test-phone',
      lastSyncTimestamp: 0,
      pairingSecret: 'sec',
    })),
  }
}

function stubDesktopPlatform(): DesktopSyncPlatform {
  return {
    deviceId: 'test-desktop',
    getLastSyncTimestamp: vi.fn(() => 0),
    setLastSyncTimestamp: vi.fn(),
    handleStateSync: vi.fn(),
    onConnectionStatusChange: vi.fn(),
    onLive: vi.fn(),
    handleKeyExchange: vi.fn(),
    handleHandshake: vi.fn(),
    sendStateSync: vi.fn(),
    handleJotRefreshResponse: vi.fn(),
    handleFileResponse: vi.fn(),
    handleClearComplete: vi.fn(),
    handleDownloadComplete: vi.fn(),
    handleJotManifest: vi.fn(),
    handleJotMetaResponse: vi.fn(),
    onStateSyncComplete: vi.fn(),
  }
}

/** Simulate receiving a message on the engine by calling the transport's onMessage callback */
function receiveMessage(transport: SyncTransport, msg: SyncWireMessage) {
  transport.onMessage?.(msg)
}

/** Simulate transport connecting */
function simulateConnect(transport: SyncTransport) {
  transport.onStatusChange?.(true)
}

// ── Connection lifecycle ──

describe('SyncEngine — connection lifecycle', () => {
  let transport: SyncTransport

  beforeEach(() => {
    transport = stubTransport()
  })

  it('connect() from idle sets phase to connecting and calls transport.connect()', () => {
    const engine = new SyncEngine(transport, stubMobilePlatform())
    engine.connect()
    expect(engine.currentPhase).toBe('connecting')
    expect(transport.connect).toHaveBeenCalled()
  })

  it('connect() from syncing is a no-op', () => {
    const engine = new SyncEngine(transport, stubMobilePlatform())
    engine.connect()
    simulateConnect(transport) // goes through key_exchange
    // Phase is now key_exchange (mobile) — not idle or disconnected
    const phase = engine.currentPhase
    engine.connect()
    expect(engine.currentPhase).toBe(phase)
    expect(transport.connect).toHaveBeenCalledTimes(1)
  })

  it('disconnect() sets phase to idle and calls transport.disconnect()', () => {
    const engine = new SyncEngine(transport, stubMobilePlatform())
    engine.connect()
    engine.disconnect()
    expect(engine.currentPhase).toBe('idle')
    expect(transport.disconnect).toHaveBeenCalled()
  })

  it('dispose() disconnects and nulls transport callbacks', () => {
    const engine = new SyncEngine(transport, stubMobilePlatform())
    engine.dispose()
    expect(engine.currentPhase).toBe('idle')
    expect(transport.onMessage).toBeNull()
    expect(transport.onStatusChange).toBeNull()
  })
})

// ── Mobile message routing ──

describe('SyncEngine — mobile mode', () => {
  let transport: SyncTransport
  let platform: MobileSyncPlatform

  beforeEach(() => {
    transport = stubTransport()
    platform = stubMobilePlatform()
  })

  it('key_exchange → builds handshake, sends it, phase docked immediately', async () => {
    const engine = new SyncEngine(transport, platform)
    engine.connect()
    simulateConnect(transport)

    await receiveMessage(transport, { type: 'key_exchange', publicKey: 'abc' } as SyncWireMessage)
    await vi.waitFor(() => {
      expect(platform.buildHandshake).toHaveBeenCalled()
      expect(transport.send).toHaveBeenCalled()
      // Phone never auto-syncs on connect; it docks immediately and waits
      // for SYNC NOW from the desktop.
      expect(engine.currentPhase).toBe('docked')
      expect(platform.onConnectionStatusChange).toHaveBeenCalledWith('connected')
    })
  })

  it('state_sync → calls handleStateSync, phase docked, does NOT update timestamp', async () => {
    const engine = new SyncEngine(transport, platform)
    engine.connect()
    simulateConnect(transport)

    const stateSync = {
      type: 'state_sync',
      lists: [],
      lockedLists: [],
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    } as SyncWireMessage

    await receiveMessage(transport, stateSync)
    await vi.waitFor(() => {
      expect(platform.handleStateSync).toHaveBeenCalled()
      expect(engine.currentPhase).toBe('docked')
      // Phone should NOT update timestamp (waits for sync_confirm)
      expect(platform.setLastSyncTimestamp).not.toHaveBeenCalled()
    })
  })

  it('jot_download_request → routes to handleDownloadRequest', async () => {
    const engine = new SyncEngine(transport, platform)
    const msg = { type: 'jot_download_request', jotIds: [1] } as SyncWireMessage
    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleDownloadRequest).toHaveBeenCalled()
    })
  })

  it('sync_confirm → routes to handleSyncConfirm', async () => {
    const engine = new SyncEngine(transport, platform)
    const msg = { type: 'sync_confirm', mode: 'desktop-wins' } as SyncWireMessage
    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleSyncConfirm).toHaveBeenCalled()
    })
  })

  it('sync_cancel → routes to handleSyncCancel', async () => {
    const engine = new SyncEngine(transport, platform)
    const msg = { type: 'sync_cancel' } as SyncWireMessage
    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleSyncCancel).toHaveBeenCalled()
    })
  })
})

// ── Desktop message routing ──

describe('SyncEngine — desktop (server) mode', () => {
  let transport: SyncTransport
  let platform: DesktopSyncPlatform

  beforeEach(() => {
    transport = stubTransport()
    platform = stubDesktopPlatform()
  })

  it('handshake → calls handleHandshake, phase docked', async () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    engine.connect()
    simulateConnect(transport)

    const msg = {
      type: 'handshake',
      deviceId: 'phone1',
      lastSyncTimestamp: 0,
      pairingSecret: 'sec',
    } as SyncWireMessage

    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleHandshake).toHaveBeenCalled()
      expect(engine.currentPhase).toBe('docked')
    })
  })

  it('state_sync → calls handleStateSync, phase docked', async () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    engine.connect()
    simulateConnect(transport)

    const msg = {
      type: 'state_sync',
      lists: [],
      lockedLists: [],
      listsCategories: [],
      lockedListsCategories: [],
      since: 0,
    } as SyncWireMessage

    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleStateSync).toHaveBeenCalled()
      expect(engine.currentPhase).toBe('docked')
      // Timestamp updates are the platform handler's responsibility now (so the
      // user-cancel path can correctly skip bumping). The engine no longer
      // bumps post-handler.
    })
  })

  it('file_response → routes to handleFileResponse', async () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    const msg = { type: 'file_response', jotId: 1, fileId: 'f1', fileType: 'image', data: 'abc', format: 'png' } as SyncWireMessage
    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleFileResponse).toHaveBeenCalled()
    })
  })

  it('jot_manifest → routes to handleJotManifest', async () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    const msg = { type: 'jot_manifest', jots: [] } as SyncWireMessage
    await receiveMessage(transport, msg)
    await vi.waitFor(() => {
      expect(platform.handleJotManifest).toHaveBeenCalled()
    })
  })

  it('requestRefresh() when docked → calls sendStateSync', async () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    engine.connect()
    simulateConnect(transport)

    // Manually move to docked phase via a handshake
    await receiveMessage(transport, {
      type: 'handshake',
      deviceId: 'ph',
      lastSyncTimestamp: 0,
      pairingSecret: 'sec',
    } as SyncWireMessage)

    await vi.waitFor(() => expect(engine.currentPhase).toBe('docked'))
    engine.requestRefresh()
    expect(platform.sendStateSync).toHaveBeenCalled()
  })

  it('requestRefresh() when not docked → no-op', () => {
    const engine = new SyncEngine(transport, platform, { serverMode: true })
    engine.requestRefresh()
    expect(platform.sendStateSync).not.toHaveBeenCalled()
  })
})

// ── Error handling ──

describe('SyncEngine — error handling', () => {
  it('handler exception is caught and does not crash', async () => {
    const transport = stubTransport()
    const platform = stubMobilePlatform()
    ;(platform.handleDownloadRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'))

    const engine = new SyncEngine(transport, platform)
    // Should not throw
    await receiveMessage(transport, { type: 'jot_download_request', jotIds: [1] } as SyncWireMessage)
    // Engine should still be functional
    expect(engine.currentPhase).toBeDefined()
  })
})
