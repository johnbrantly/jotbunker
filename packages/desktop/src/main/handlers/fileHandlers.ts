import type { IpcMain } from 'electron'
import { dialog } from 'electron'
import { getWindow } from '../window'
import { writeBackup, restoreBackup, writeTaskExport, writeTagFile, writeTagFileWithMedia } from '../download'
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
    return writeTaskExport(sections, downloadDir || '')
  })

  // Save base64 data to tag folder. tagRootPath and tagName are both required —
  // no silent fallbacks. Renderer guarantees both are non-empty via store invariants.
  ipc.handle('download:save-base64', (_e, data: { base64: string; format: string; tagRootPath: string; tagName: string; filename: string }) => {
    if (!data.tagRootPath || !data.tagName) {
      return { success: false, path: '', error: 'download:save-base64 requires tagRootPath and tagName' }
    }
    try {
      const tagDir = join(data.tagRootPath, data.tagName)
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

  // Write a rasterized drawing PNG into a DOWNLOAD ALL output directory.
  // Renderer calls this after sync:download-complete for each jot that had a
  // drawing in its local jotsStore. Mirrors the Save-to-Tag rasterize flow.
  ipc.handle('download:save-drawing', (_e, data: { baseDir: string; jotId: number; drawingPngBase64: string }) => {
    try {
      if (!data.baseDir || !data.drawingPngBase64) {
        return { success: false, error: 'baseDir and drawingPngBase64 required' }
      }
      const jotDir = join(data.baseDir, `Jot${data.jotId}`)
      mkdirSync(jotDir, { recursive: true })
      const filePath = join(jotDir, 'drawing.png')
      writeFileSync(filePath, Buffer.from(data.drawingPngBase64, 'base64'))
      return { success: true, path: filePath }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })
}
