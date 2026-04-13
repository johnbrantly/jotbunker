import { vi } from 'vitest'

// ── window.electronAPI mock ──
// All IPC methods that the renderer uses via preload
const listeners: Record<string, Function[]> = {}

function addListener(channel: string, cb: Function) {
  if (!listeners[channel]) listeners[channel] = []
  listeners[channel].push(cb)
}

export function emitToRenderer(channel: string, data: unknown) {
  for (const cb of listeners[channel] || []) {
    cb(data)
  }
}

export function resetListeners() {
  for (const key of Object.keys(listeners)) {
    delete listeners[key]
  }
}

const electronAPI = {
  platform: 'win32',
  getServerIp: vi.fn(async () => '192.168.1.100'),

  // Sync channels
  syncSend: vi.fn(),
  onSyncMessage: vi.fn((cb: Function) => addListener('sync:message', cb)),
  onSyncStatus: vi.fn((cb: (status: { connectionState: string; deviceId: string | null }) => void) => addListener('sync:status', cb)),

  // Folder picker
  pickFolder: vi.fn(async () => '/mock/folder'),

  // Jot download/clear
  requestJotDownload: vi.fn(),
  onDownloadComplete: vi.fn((cb: Function) => addListener('sync:download-complete', cb)),
  requestJotClear: vi.fn(),
  onClearComplete: vi.fn((cb: Function) => addListener('sync:clear-complete', cb)),

  // Locked Lists key
  onLockedListsKey: vi.fn((cb: Function) => addListener('sync:lockedLists-key', cb)),

  // File transfer
  requestFile: vi.fn(),
  onFileResponse: vi.fn((cb: Function) => addListener('sync:file-response', cb)),

  // Cache
  downloadFromCache: vi.fn(async () => ({ success: true, path: '/mock', jotCount: 1 })),
  saveFileToCache: vi.fn(async () => '/mock/cached/file'),
  isFileCached: vi.fn(async () => false),
  getCachedPath: vi.fn(async () => null),
  clearJotCache: vi.fn(),
  removeFileFromCache: vi.fn(),

  // Cleanup
  removeAllSyncListeners: vi.fn(() => resetListeners()),
}

// @ts-ignore - Set up global window.electronAPI
globalThis.window = globalThis.window || ({} as any)
;(globalThis.window as any).electronAPI = electronAPI

export { electronAPI }

// ── electron mock (for main process tests) ──
const ipcHandlers: Record<string, Function> = {}
const ipcListeners: Record<string, Function> = {}

vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn((channel: string, handler: Function) => {
      ipcListeners[channel] = handler
    }),
    handle: vi.fn((channel: string, handler: Function) => {
      ipcHandlers[channel] = handler
    }),
  },
  app: {
    getPath: vi.fn(() => '/mock/userData'),
  },
  BrowserWindow: vi.fn(),
}))

export function getIpcListener(channel: string): Function | undefined {
  return ipcListeners[channel]
}

export function getIpcHandler(channel: string): Function | undefined {
  return ipcHandlers[channel]
}

// ── ws mock (for syncServer tests) ──
vi.mock('ws', () => {
  class MockWebSocket {
    static OPEN = 1
    static CLOSED = 3
    readyState = 1
    listeners: Record<string, Function[]> = {}
    sentMessages: string[] = []

    on(event: string, cb: Function) {
      if (!this.listeners[event]) this.listeners[event] = []
      this.listeners[event].push(cb)
    }
    send(data: string) {
      this.sentMessages.push(data)
    }
    close() {
      this.readyState = 3
    }
    emit(event: string, ...args: unknown[]) {
      for (const cb of this.listeners[event] || []) {
        cb(...args)
      }
    }
  }

  class MockWebSocketServer {
    listeners: Record<string, Function[]> = {}
    constructor(_opts: any) {}
    on(event: string, cb: Function) {
      if (!this.listeners[event]) this.listeners[event] = []
      this.listeners[event].push(cb)
    }
    close() {}
    emit(event: string, ...args: unknown[]) {
      for (const cb of this.listeners[event] || []) {
        cb(...args)
      }
    }
  }

  return {
    WebSocket: MockWebSocket,
    WebSocketServer: MockWebSocketServer,
  }
})
