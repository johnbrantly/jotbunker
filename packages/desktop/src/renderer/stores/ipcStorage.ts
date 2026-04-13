import type { StateStorage } from 'zustand/middleware'

export const ipcStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await window.electronAPI.storeGetItem(name)
    } catch {
      console.warn(`[ipcStorage] getItem failed: ${name}`)
      return null
    }
  },
  setItem: async (name, value) => {
    try {
      await window.electronAPI.storeSetItem(name, value)
    } catch {
      console.warn(`[ipcStorage] setItem failed: ${name}`)
    }
  },
  removeItem: async (name) => {
    try {
      await window.electronAPI.storeRemoveItem(name)
    } catch {
      console.warn(`[ipcStorage] removeItem failed: ${name}`)
    }
  },
}
