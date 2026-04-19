import type { JotMeta } from '@jotbunker/shared'
import { syncLog } from '@jotbunker/shared'
import { useJotsStore } from '../../stores/jotsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTagStore } from '../../stores/tagStore'
import { useConsoleStore } from '../../stores/consoleStore'
import type { BinaryQueue } from './binaryQueue'

export interface DownloadResult {
  success: boolean
  path: string
  jotCount: number
  /** List of jotIds that were downloaded. Used by the renderer to write drawings
   *  client-side after main's writeJotFiles completes. See spec/fix-download-all-drawings-PLAN.md. */
  jotIds?: number[]
  error?: string
}

export async function processSingleJotFiles(
  jotMeta: JotMeta,
  binaryQueue: BinaryQueue,
): Promise<void> {
  let queued = 0

  for (const img of jotMeta.images) {
    queued++
    binaryQueue.enqueueDeferred({ jotId: jotMeta.id, fileId: img.id, fileType: 'image', format: img.format })
  }

  for (const rec of jotMeta.recordings) {
    queued++
    binaryQueue.enqueueDeferred({ jotId: jotMeta.id, fileId: rec.id, fileType: 'audio', format: rec.format })
  }

  for (const file of (jotMeta.files || [])) {
    queued++
    binaryQueue.enqueueDeferred({ jotId: jotMeta.id, fileId: file.id, fileType: 'file', format: file.mimeType })
  }

  syncLog('FILE', `jot ${jotMeta.id}: ${queued} files queued for download`)
  binaryQueue.updateStatus()
  binaryQueue.processNext()
}

export async function processJotMetadata(
  jots: JotMeta[],
  binaryQueue: BinaryQueue,
): Promise<void> {
  const noteStore = useJotsStore.getState()

  for (const jotMeta of jots) {
    // Always trust phone — jots are phone→desktop only
    noteStore.setJotMetadata(jotMeta.id, jotMeta)
    await processSingleJotFiles(jotMeta, binaryQueue)
  }
}

export async function requestDownload(
  jotIds: number[],
  setDownloadStatus: (status: string | null) => void,
): Promise<void> {
  const tagRootPath = useSettingsStore.getState().tagRootPath
  const tagState = useTagStore.getState()
  const selectedTag = tagState.tags.find((t) => t.id === tagState.selectedTagId)

  if (!tagRootPath || !selectedTag) {
    useConsoleStore.getState().log('Download cancelled: tag or folder not configured')
    return
  }

  syncLog('DOWNLOAD', `requestDownload jots=[${jotIds.join(',')}] → ${tagRootPath}/${selectedTag.label}`)
  useConsoleStore.getState().log('Downloading...')
  window.electronAPI.requestJotDownload(jotIds, tagRootPath, selectedTag.label)
}
