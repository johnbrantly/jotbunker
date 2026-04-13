/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    platform: string

    // Server IP
    getServerIp: () => Promise<string>

    // Network interfaces
    getNetworkInterfaces: () => Promise<{ name: string; address: string }[]>

    // Sync status
    onSyncStatus: (cb: (status: { connectionState: 'disconnected' | 'socket_open' | 'authenticated'; deviceId: string | null }) => void) => void

    // Generic sync message channels (used by SyncEngine/DesktopTransport)
    syncSend: (msg: unknown) => void
    onSyncMessage: (cb: (msg: unknown) => void) => void

    // Store persistence (IPC-backed file storage)
    storeGetItem: (name: string) => Promise<string | null>
    storeSetItem: (name: string, value: string) => Promise<void>
    storeRemoveItem: (name: string) => Promise<void>

    // Documents path
    getDocumentsPath: () => Promise<string>

    // Folder picker
    pickFolder: (defaultPath?: string) => Promise<string>

    // Download
    requestJotDownload: (jotIds: number[], downloadPath?: string) => void
    onDownloadComplete: (cb: (result: unknown) => void) => void

    // Clear
    requestJotClear: (jotIds: number[]) => void

    // Jot refresh (manual pull)
    requestJotRefresh: () => void

    // Request single jot metadata (lazy fetch)
    requestJotMeta: (jotId: number) => void

    // File transfer (binary sync)
    requestFile: (req: { jotId: number; fileId: string; fileType: 'image' | 'audio' }) => void

    saveTextFile: (data: { text: string; downloadDir: string; filename?: string }) => Promise<{ success: boolean; path: string; error?: string }>
    saveBase64File: (data: { base64: string; format: string; tagRootPath: string; tagName: string; filename: string }) => Promise<{ success: boolean; path: string; error?: string }>

    // Menu events
    onMenuOpenSettings: (cb: () => void) => void
    onMenuOpenAbout: (cb: () => void) => void

    // Backup / Restore / Export
    saveBackup: (data: Record<string, unknown>) => Promise<{ success: boolean; path?: string; error?: string }>
    restoreBackup: () => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>
    exportTasks: (data: { sections: unknown[]; downloadDir?: string }) => Promise<{ success: boolean; paths: string[]; error?: string }>

    // Tag-based filing
    saveToTag: (data: { tagRootPath: string; tagName: string; filename: string; text: string }) => Promise<{ success: boolean; path: string; error?: string }>
    saveToTagWithMedia: (data: { tagRootPath: string; tagName: string; filename: string; text: string; jotId: number; drawingPngBase64?: string | null; images?: { base64: string; format: string }[]; recordings?: { base64: string }[]; files?: { base64: string; fileName: string }[] }) => Promise<{ success: boolean; path: string; fileCount?: number; error?: string }>

    // Set sync port
    setSyncPort: (port: number) => Promise<void>

    // Set pairing secret
    setPairingSecret: (secret: string) => void

    // Set sync debug log
    setSyncDebugLog: (enabled: boolean) => void

    // Send debug log line to main process for file writing
    sendDebugLog: (line: string) => void

    // Write system message to persistent log file
    writeSystemLog: (timestamp: number, text: string) => void

    // Auto-update
    onUpdateAvailable: (cb: (version: string) => void) => void
    onUpdateDownloaded: (cb: () => void) => void
    startUpdateDownload: () => void
    installUpdate: () => void
    onUpdateChecking: (cb: () => void) => void
    onUpdateProgress: (cb: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => void
    onUpdateUpToDate: (cb: (info: { version: string }) => void) => void
    onUpdateError: (cb: (info: { message: string }) => void) => void

    // Cleanup
    removeAllSyncListeners: () => void
  }
}
