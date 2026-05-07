// In-memory fake for window.electronAPI.storeGetItem / storeSetItem /
// storeRemoveItem. The real ipcStorage adapter (renderer/stores/ipcStorage.ts)
// calls these three methods; backing them with a Record<string, string> lets
// renderer-side store tests run under node without spinning up the main
// process or fs. installIpcStorageFake() is wired into the desktop test
// setup so it runs before any store module is imported.

export const ipcStorageStore: Record<string, string> = {}

export function installIpcStorageFake(): void {
  const win = ((globalThis as any).window = (globalThis as any).window || {})
  const api = (win.electronAPI = win.electronAPI || {})
  api.storeGetItem = async (name: string) =>
    Object.prototype.hasOwnProperty.call(ipcStorageStore, name)
      ? ipcStorageStore[name]
      : null
  api.storeSetItem = async (name: string, value: string) => {
    ipcStorageStore[name] = value
  }
  api.storeRemoveItem = async (name: string) => {
    delete ipcStorageStore[name]
  }
}

export function resetIpcStorageFake(): void {
  for (const key of Object.keys(ipcStorageStore)) {
    delete ipcStorageStore[key]
  }
}
