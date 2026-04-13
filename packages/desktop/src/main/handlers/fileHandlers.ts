import type { IpcMain } from 'electron'
import { dialog } from 'electron'
import { getWindow } from '../window'
import { writeBackup, restoreBackup, writeTaskExport, writeTagFile, writeTagFileWithMedia, saveTextFile } from '../download'
import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function registerFileHandlers(ipc: IpcMain): void {
  // Folder picker for download path
  ipc.handle('dialog:pick-folder', async (_e, defaultPath?: string) => {
    const win = getWindow()
    if (!win) return ''
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      defaultPath: defaultPath || undefined,
    })
    return result.canceled ? '' : result.filePaths[0] || ''
  })

  // Backup / Restore / Export
  ipc.handle('backup:save', (_e, data: Record<string, unknown>) => {
    const { downloadDir, ...rest } = data
    return writeBackup(rest, (downloadDir as string) || undefined)
  })

  ipc.handle('backup:restore', async () => {
    const win = getWindow()
    if (!win) return { success: false, error: 'No window available' }
    const result = await dialog.showOpenDialog(win, {
      title: 'Restore Backup',
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) {
      return { success: false, error: 'cancelled' }
    }
    return restoreBackup(result.filePaths[0])
  })

  ipc.handle('export:tasks', (_e, { sections, downloadDir }) => {
    return writeTaskExport(sections, downloadDir || undefined)
  })

  // Save single image
  // Save single text
  ipc.handle('download:save-text', (_e, data: { text: string; downloadDir: string; filename?: string }) => {
    return saveTextFile(data.text, data.downloadDir || undefined, data.filename)
  })

  // Save base64 data to tag folder
  ipc.handle('download:save-base64', (_e, data: { base64: string; format: string; tagRootPath: string; tagName: string; filename: string }) => {
    try {
      const tagRoot = data.tagRootPath || join(app.getPath('documents'), 'Jotbunker Tags')
      const tagDir = join(tagRoot, data.tagName)
      mkdirSync(tagDir, { recursive: true })
      const d = new Date()
      const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
      const filePath = join(tagDir, `${ts}-${data.filename}`)
      writeFileSync(filePath, Buffer.from(data.base64, 'base64'))
      return { success: true, path: filePath }
    } catch (err: unknown) {
      return { success: false, path: '', error: err instanceof Error ? err.message : String(err) }
    }
  })

  // Tag-based filing
  ipc.handle('tags:save', (_e, data) => writeTagFile(data))
  ipc.handle('tags:save-with-media', (_e, data) => writeTagFileWithMedia(data))
}
