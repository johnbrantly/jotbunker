import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readFileSync, readdirSync } from 'fs'
import type { JotDownloadResponse } from '@jotbunker/shared'
import { syncLog } from '@jotbunker/shared'
import { safePath } from './safePath'

function getDownloadDir(): string {
  return join(app.getPath('documents'), 'Jotbunker Downloads')
}

function pad(n: number): string {
  return n.toString().padStart(3, '0')
}

export interface DownloadResult {
  success: boolean
  path: string
  jotCount: number
  error?: string
}

export function writeJotFiles(response: JotDownloadResponse, downloadDir?: string): DownloadResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseDir = join(downloadDir || getDownloadDir(), timestamp)

  try {
    mkdirSync(baseDir, { recursive: true })
    syncLog('DOWNLOAD', `writeJotFiles: ${response.jots.length} jots → ${baseDir}`)

    for (const jot of response.jots) {
      const jotDir = join(baseDir, `Jot${jot.id}`)
      mkdirSync(jotDir, { recursive: true })

      // Text
      if (jot.text && jot.text.trim().length > 0) {
        writeFileSync(join(jotDir, 'text.txt'), jot.text, 'utf-8')
      }

      // Drawing (base64 PNG)
      if (jot.drawing) {
        const buf = Buffer.from(jot.drawing, 'base64')
        writeFileSync(join(jotDir, 'drawing.png'), buf)
      }

      // Images
      for (let i = 0; i < jot.images.length; i++) {
        const img = jot.images[i]
        const ext = img.format || 'jpg'
        const filename = `image_${pad(i + 1)}.${ext}`
        const buf = Buffer.from(img.data, 'base64')
        writeFileSync(join(jotDir, filename), buf)
      }

      // Audio recordings
      for (let i = 0; i < (jot.recordings || []).length; i++) {
        const rec = jot.recordings[i]
        const m4aPath = join(jotDir, `audio_${pad(i + 1)}.m4a`)
        const buf = Buffer.from(rec.data, 'base64')
        writeFileSync(m4aPath, buf)
      }
    }

    syncLog('DOWNLOAD', `writeJotFiles complete: ${response.jots.length} jots`)
    return {
      success: true,
      path: baseDir,
      jotCount: response.jots.length,
    }
  } catch (err: unknown) {
    return {
      success: false,
      path: baseDir,
      jotCount: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── Backup / Restore ──

export interface BackupData {
  encrypted?: boolean
  salt?: string
  iv?: string
  data?: string
  secureKey?: string
  scratchpad?: { contents: Record<string, unknown>; categories: unknown[] }
  lists?: { items: Record<string, unknown[]>; categories: unknown[] }
  lockedLists?: { items: Record<string, unknown[]>; categories: unknown[] }
  tags?: { id: string; label: string; createdAt: number; isFavorite?: boolean }[]
  exportedAt: string
}

export interface BackupResult {
  success: boolean
  path?: string
  error?: string
}

export interface RestoreResult {
  success: boolean
  data?: BackupData
  error?: string
}

function getBackupDir(): string {
  return join(process.env.LOCALAPPDATA || app.getPath('userData'), 'Jotbunker', 'backups')
}

export function writeBackup(data: Record<string, unknown>, downloadDir?: string): BackupResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = downloadDir ? join(downloadDir, 'backups') : getBackupDir()
  const prefix = data.encrypted === true ? 'secure-backup' : 'backup'
  const filePath = join(dir, `${prefix}-${timestamp}.json`)

  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: filePath }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function restoreBackup(filePath: string): RestoreResult {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    // Encrypted backups: return raw — renderer decrypts and validates inner data
    if (data.encrypted === true) {
      return { success: true, data: data as BackupData }
    }

    if (
      !data.lists || !data.lockedLists ||
      !data.lists.items || !data.lists.categories ||
      !data.lockedLists.items || !data.lockedLists.categories
    ) {
      return { success: false, error: 'Invalid backup file: missing lists or lockedLists data' }
    }
    // scratchpad is optional for backwards compatibility with older backups

    return { success: true, data: data as BackupData }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Task Export ──

export interface TaskExportSection {
  name: string
  categories: { label: string; items?: { text: string; done: boolean }[]; text?: string }[]
}

export interface TaskExportResult {
  success: boolean
  paths: string[]
  error?: string
}

// ── Tag-based filing ──

function getTagDir(tagRootPath?: string): string {
  return tagRootPath || join(app.getPath('documents'), 'Jotbunker Tags')
}

function sanitizeForFs(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '').trim() || 'untitled'
}

function formatTimestamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`
}

export interface TagSaveResult {
  success: boolean
  path: string
  fileCount?: number
  error?: string
}

export function writeTagFile(data: {
  tagRootPath: string
  tagName: string
  filename: string
  text: string
}): TagSaveResult {
  const tagRoot = getTagDir(data.tagRootPath || undefined)
  const tagDir = safePath(tagRoot, sanitizeForFs(data.tagName))
  const ts = formatTimestamp()
  const safeName = sanitizeForFs(data.filename)
  const filePath = safePath(tagDir, `${ts}-${safeName}.txt`)

  try {
    mkdirSync(tagDir, { recursive: true })
    writeFileSync(filePath, data.text, 'utf-8')
    return { success: true, path: filePath }
  } catch (err: unknown) {
    return { success: false, path: filePath, error: err instanceof Error ? err.message : String(err) }
  }
}

export function writeTagFileWithMedia(data: {
  tagRootPath: string
  tagName: string
  filename: string
  text: string
  jotId: number
  drawingPngBase64?: string | null
  images?: { base64: string; format: string }[]
  recordings?: { base64: string }[]
  files?: { base64: string; fileName: string }[]
}): TagSaveResult {
  const tagRoot = getTagDir(data.tagRootPath || undefined)
  const tagDir = safePath(tagRoot, sanitizeForFs(data.tagName))
  const ts = formatTimestamp()
  const safeName = sanitizeForFs(data.filename)
  let fileCount = 0

  try {
    mkdirSync(tagDir, { recursive: true })

    // Write text
    const textPath = safePath(tagDir, `${ts}-${safeName}.txt`)
    writeFileSync(textPath, data.text, 'utf-8')
    fileCount++

    // Drawing (rasterized PNG from renderer)
    if (data.drawingPngBase64) {
      const buf = Buffer.from(data.drawingPngBase64, 'base64')
      writeFileSync(safePath(tagDir, `${ts}-${safeName}-drawing.png`), buf)
      fileCount++
    }

    // Images (base64 from renderer store)
    if (data.images) {
      data.images.forEach((img, i) => {
        const num = String(i + 1).padStart(2, '0')
        const buf = Buffer.from(img.base64, 'base64')
        writeFileSync(safePath(tagDir, `${ts}-${safeName}-image-${num}.${img.format || 'jpg'}`), buf)
        fileCount++
      })
    }

    // Audio recordings (base64 from renderer store)
    if (data.recordings) {
      data.recordings.forEach((rec, i) => {
        const num = String(i + 1).padStart(2, '0')
        const buf = Buffer.from(rec.base64, 'base64')
        writeFileSync(safePath(tagDir, `${ts}-${safeName}-audio-${num}.m4a`), buf)
        fileCount++
      })
    }

    // File attachments (base64 from renderer store)
    if (data.files) {
      data.files.forEach((file, i) => {
        const num = String(i + 1).padStart(2, '0')
        const buf = Buffer.from(file.base64, 'base64')
        const safeFn = sanitizeForFs(file.fileName)
        writeFileSync(safePath(tagDir, `${ts}-${safeName}-file-${num}-${safeFn}`), buf)
        fileCount++
      })
    }

    return { success: true, path: tagDir, fileCount }
  } catch (err: unknown) {
    return { success: false, path: tagDir, fileCount, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Single image save ──

export function saveSingleImage(
  cachedPath: string,
  format: string,
  downloadDir?: string,
  filename?: string,
): { success: boolean; path: string; error?: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = downloadDir || getDownloadDir()
  const ext = format || 'jpg'
  const baseName = filename || `image.${ext}`
  const filePath = join(dir, `${timestamp}-${baseName}`)

  try {
    mkdirSync(dir, { recursive: true })
    if (existsSync(cachedPath)) {
      copyFileSync(cachedPath, filePath)
      return { success: true, path: filePath }
    }
    return { success: false, path: filePath, error: 'Cached file not found' }
  } catch (err: unknown) {
    return { success: false, path: filePath, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Single audio save ──

export function saveSingleAudio(
  cachedPath: string,
  downloadDir?: string,
  filename?: string,
): { success: boolean; path: string; error?: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = downloadDir || getDownloadDir()
  const baseName = filename || 'audio.m4a'
  const filePath = join(dir, `${timestamp}-${baseName}`)

  try {
    mkdirSync(dir, { recursive: true })
    if (existsSync(cachedPath)) {
      copyFileSync(cachedPath, filePath)
      return { success: true, path: filePath }
    }
    return { success: false, path: filePath, error: 'Cached file not found' }
  } catch (err: unknown) {
    return { success: false, path: filePath, error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Single text save ──

export function saveTextFile(
  text: string,
  downloadDir?: string,
  filename?: string,
): { success: boolean; path: string; error?: string } {
  const dir = downloadDir || getDownloadDir()
  const filePath = join(dir, filename || 'text.txt')

  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, text, 'utf-8')
    return { success: true, path: filePath }
  } catch (err: unknown) {
    return { success: false, path: filePath, error: err instanceof Error ? err.message : String(err) }
  }
}

export function writeTaskExport(sections: TaskExportSection[], downloadDir?: string): TaskExportResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = join(downloadDir || getDownloadDir(), 'task exports')
  const paths: string[] = []

  try {
    mkdirSync(dir, { recursive: true })

    for (const section of sections) {
      const filePath = join(dir, `${section.name}-${timestamp}.txt`)
      const lines: string[] = []

      for (const cat of section.categories) {
        lines.push(`=== ${cat.label} ===`)
        if (cat.text != null) {
          lines.push(cat.text)
        } else if (cat.items) {
          for (const item of cat.items) {
            lines.push(item.done ? `[x] ${item.text}` : `[ ] ${item.text}`)
          }
        }
        lines.push('')
      }

      writeFileSync(filePath, lines.join('\n'), 'utf-8')
      paths.push(filePath)
    }

    return { success: true, paths }
  } catch (err: unknown) {
    return { success: false, paths: [], error: err instanceof Error ? err.message : String(err) }
  }
}
