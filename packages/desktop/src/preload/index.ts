import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Get server IP
  getServerIp: () => ipcRenderer.invoke('sync:get-server-ip'),

  // Get network interfaces
  getNetworkInterfaces: () => ipcRenderer.invoke('sync:get-network-interfaces'),

  // Sync status
  onSyncStatus: (cb: (status: { connectionState: 'disconnected' | 'socket_open' | 'authenticated'; deviceId: string | null }) => void) => {
    ipcRenderer.on('sync:status', (_event, status) => cb(status))
  },

  // Generic sync message channels (new — used by SyncEngine/DesktopTransport)
  syncSend: (msg: unknown) => {
    ipcRenderer.send('sync:send', msg)
  },
  onSyncMessage: (cb: (msg: unknown) => void) => {
    ipcRenderer.on('sync:message', (_event, data) => cb(data))
  },

  // Store persistence (IPC-backed file storage)
  storeGetItem: (name: string) => ipcRenderer.invoke('store:get-item', name) as Promise<string | null>,
  storeSetItem: (name: string, value: string) => ipcRenderer.invoke('store:set-item', name, value) as Promise<void>,
  storeRemoveItem: (name: string) => ipcRenderer.invoke('store:remove-item', name) as Promise<void>,

  // Documents path
  getDocumentsPath: () => ipcRenderer.invoke('app:get-documents-path') as Promise<string>,

  // Folder picker
  pickFolder: (defaultPath?: string) => ipcRenderer.invoke('dialog:pick-folder', defaultPath || ''),

  // Request jot download. Both tagRootPath and tagName are required — destination is
  // always {tagRootPath}/{tagName}/<timestamp>/JotN/... — no silent fallbacks.
  requestJotDownload: (jotIds: number[], tagRootPath: string, tagName: string) => {
    ipcRenderer.send('sync:request-download', { jotIds, tagRootPath, tagName })
  },

  // Download complete
  onDownloadComplete: (cb: (result: unknown) => void) => {
    ipcRenderer.on('sync:download-complete', (_event, data) => cb(data))
  },

  // Request jot clear
  requestJotClear: (jotIds: number[]) => {
    ipcRenderer.send('sync:request-clear', jotIds)
  },

  // Jot refresh (manual pull)
  requestJotRefresh: () => {
    ipcRenderer.send('sync:request-jot-refresh')
  },
  // Request single jot metadata (lazy fetch)
  requestJotMeta: (jotId: number) => {
    ipcRenderer.send('sync:request-jot-meta', jotId)
  },

  // File transfer (binary sync)
  requestFile: (req: { jotId: number; fileId: string; fileType: 'image' | 'audio' }) => {
    ipcRenderer.send('sync:request-file', req)
  },

  // Save base64 data to tag folder
  saveBase64File: (data: { base64: string; format: string; tagRootPath: string; tagName: string; filename: string }) =>
    ipcRenderer.invoke('download:save-base64', data) as Promise<{ success: boolean; path: string; error?: string }>,

  // Save rasterized drawing PNG into a DOWNLOAD ALL output's Jot<N>/drawing.png
  saveDownloadedDrawing: (data: { baseDir: string; jotId: number; drawingPngBase64: string }) =>
    ipcRenderer.invoke('download:save-drawing', data) as Promise<{ success: boolean; path?: string; error?: string }>,

  // Menu events
  onMenuOpenSettings: (cb: () => void) => {
    ipcRenderer.on('menu:open-settings', () => cb())
  },
  onMenuOpenAbout: (cb: () => void) => {
    ipcRenderer.on('menu:open-about', () => cb())
  },

  // Backup / Restore / Export
  saveBackup: (data: Record<string, unknown>) =>
    ipcRenderer.invoke('backup:save', data),
  restoreBackup: () => ipcRenderer.invoke('backup:restore'),
  exportTasks: (data: { sections: unknown[]; downloadDir?: string }) =>
    ipcRenderer.invoke('export:tasks', data),

  // Tag-based filing
  saveToTag: (data: { tagRootPath: string; tagName: string; filename: string; text: string }) =>
    ipcRenderer.invoke('tags:save', data),
  saveToTagWithMedia: (data: { tagRootPath: string; tagName: string; filename: string; text: string; jotId: number; drawingPngBase64?: string | null; images?: { base64: string; format: string }[]; recordings?: { base64: string }[]; files?: { base64: string; fileName: string }[] }) =>
    ipcRenderer.invoke('tags:save-with-media', data),

  // Set sync port
  setSyncPort: (port: number) => ipcRenderer.invoke('sync:set-port', port),

  // Set pairing secret
  setPairingSecret: (secret: string) => ipcRenderer.send('sync:set-pairing-secret', secret),

  // Set sync debug log
  setSyncDebugLog: (enabled: boolean) => ipcRenderer.send('sync:set-debug-log', enabled),

  // Send debug log line to main process for file writing
  sendDebugLog: (line: string) => ipcRenderer.send('sync:renderer-log', line),

  // Write system message to persistent log file
  writeSystemLog: (timestamp: number, text: string) => ipcRenderer.send('console:write-log', timestamp, text),

  // Auto-update
  onUpdateAvailable: (cb: (version: string) => void) => {
    ipcRenderer.on('update:available', (_event, version) => cb(version))
  },
  onUpdateDownloaded: (cb: () => void) => {
    ipcRenderer.on('update:downloaded', () => cb())
  },
  startUpdateDownload: () => {
    ipcRenderer.send('update:start-download')
  },
  installUpdate: () => {
    ipcRenderer.send('update:install')
  },
  onUpdateChecking: (cb: () => void) => {
    ipcRenderer.on('update:checking', () => cb())
  },
  onUpdateProgress: (cb: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('update:download-progress', (_event, progress) => cb(progress))
  },
  onUpdateUpToDate: (cb: (info: { version: string }) => void) => {
    ipcRenderer.on('update:up-to-date', (_event, info) => cb(info))
  },
  onUpdateError: (cb: (info: { message: string }) => void) => {
    ipcRenderer.on('update:error', (_event, info) => cb(info))
  },

  // Remove all sync listeners (cleanup)
  removeAllSyncListeners: () => {
    ipcRenderer.removeAllListeners('sync:status')
    ipcRenderer.removeAllListeners('sync:message')
    ipcRenderer.removeAllListeners('sync:download-complete')
    ipcRenderer.removeAllListeners('menu:open-settings')
    ipcRenderer.removeAllListeners('menu:open-about')
    ipcRenderer.removeAllListeners('update:available')
    ipcRenderer.removeAllListeners('update:downloaded')
    ipcRenderer.removeAllListeners('update:checking')
    ipcRenderer.removeAllListeners('update:download-progress')
    ipcRenderer.removeAllListeners('update:up-to-date')
    ipcRenderer.removeAllListeners('update:error')
  },
})
