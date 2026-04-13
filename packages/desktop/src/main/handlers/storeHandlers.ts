import type { IpcMain } from 'electron'
import { app } from 'electron'
import { join } from 'path'
import { safePath } from '../safePath'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'

export function registerStoreHandlers(ipc: IpcMain, storesDir: string): void {
  ipc.handle('store:get-item', (_e, name: string) => {
    const filePath = safePath(storesDir, `${name}.json`)
    try {
      return readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipc.handle('store:set-item', (_e, name: string, value: string) => {
    const filePath = safePath(storesDir, `${name}.json`)
    writeFileSync(filePath, value, 'utf-8')
  })

  ipc.handle('store:remove-item', (_e, name: string) => {
    const filePath = safePath(storesDir, `${name}.json`)
    try {
      unlinkSync(filePath)
    } catch {}
  })

  // System message log — rolling 50 entries
  const sysLogPath = join(app.getPath('userData'), 'system-messages.log')
  ipc.on('console:write-log', (_e, timestamp: number, text: string) => {
    let entries: { timestamp: number; text: string }[] = []
    try {
      const raw = readFileSync(sysLogPath, 'utf-8')
      entries = JSON.parse(raw)
    } catch {}
    entries.unshift({ timestamp, text })
    if (entries.length > 50) entries.length = 50
    writeFileSync(sysLogPath, JSON.stringify(entries, null, 2))
  })

  ipc.handle('app:get-documents-path', () => app.getPath('documents'))
}
