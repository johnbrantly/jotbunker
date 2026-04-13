import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WebSocket, WebSocketServer } from 'ws'

// Mock the window module to return a fake BrowserWindow
const mockWebContentsSend = vi.fn()
vi.mock('../../src/main/window', () => ({
  getWindow: () => ({
    isDestroyed: () => false,
    webContents: { send: mockWebContentsSend },
  }),
}))

// Mock download module
vi.mock('../../src/main/download', () => ({
  writeJotFiles: vi.fn(() => ({ success: true, path: '/mock', jotCount: 1 })),
  writeJotFilesFromCache: vi.fn(() => ({ success: true, path: '/mock', jotCount: 1 })),
}))

// We need to import after mocks are set up
import { startSyncServer, getServerIp } from '../../src/main/syncServer'
import { ipcMain } from 'electron'
import { getIpcListener } from '../setup'

beforeEach(() => {
  vi.clearAllMocks()
  mockWebContentsSend.mockClear()
})

describe('getServerIp', () => {
  it('returns a string IP address', () => {
    const ip = getServerIp()
    expect(typeof ip).toBe('string')
    expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/)
  })
})

describe('startSyncServer', () => {
  it('registers IPC handlers on start', () => {
    startSyncServer(0)

    const onCalls = (ipcMain.on as any).mock.calls.map((c: any[]) => c[0])
    expect(onCalls).toContain('sync:send')
    expect(onCalls).toContain('sync:request-download')
    expect(onCalls).toContain('sync:request-clear')
    expect(onCalls).toContain('sync:request-file')

    // File cache IPC handlers were removed — no longer registered here
  })
})

describe('sync:send handler', () => {
  it('forwards messages to phone without crashing when disconnected', () => {
    startSyncServer(0)

    const handler = getIpcListener('sync:send')
    expect(handler).toBeDefined()

    // No phone connected — messages are sent via send() which returns false silently
    handler!({}, { type: 'heartbeat' })
  })
})
