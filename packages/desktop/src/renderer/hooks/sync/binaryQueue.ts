import { syncLog } from '@jotbunker/shared'
import { useJotsStore } from '../../stores/jotsStore'

export interface BinaryQueueItem {
  jotId: number
  fileId: string
  fileType: 'image' | 'audio' | 'file'
  format: string
}

export class BinaryQueue {
  private queue: BinaryQueueItem[] = []
  private _transferActive = false
  private _transferTimer: ReturnType<typeof setTimeout> | null = null
  private _total = 0
  private _completed = 0
  private _connected = false
  private onStatusChange: (status: string | null) => void

  constructor(onStatusChange: (status: string | null) => void) {
    this.onStatusChange = onStatusChange
  }

  get transferActive(): boolean { return this._transferActive }
  set connected(v: boolean) {
    this._connected = v
    if (!v && this._transferActive) {
      // Connection lost during transfer — cancel cleanly.
      // File will be re-requested on next phone refresh after reconnect.
      this.cancelTransfer()
    }
  }

  updateStatus(): void {
    if (this._total === 0 || this._completed >= this._total) {
      this.onStatusChange(null)
    } else {
      this.onStatusChange(`Syncing ${this._completed}/${this._total} files...`)
    }
  }

  processNext(): void {
    if (this._transferActive || this.queue.length === 0 || !this._connected) {
      syncLog('FILE', `processNext skip: active=${this._transferActive} queue=${this.queue.length} connected=${this._connected}`)
      this.updateStatus()
      return
    }

    const item = this.queue.shift()!
    this._transferActive = true
    syncLog('FILE', `requestFile ${item.fileType} ${item.fileId} jot=${item.jotId}`)

    // 15s timeout — if no completeTransfer() arrives, skip and continue
    this._transferTimer = setTimeout(() => {
      this._transferTimer = null
      syncLog('FILE', `transfer TIMEOUT ${item.fileType} ${item.fileId}`)
      console.warn(`[binaryQueue] Transfer timeout for ${item.fileType} ${item.fileId}`)
      const noteStore = useJotsStore.getState()
      if (item.fileType === 'image') {
        noteStore.setImageLoading(item.jotId, item.fileId, false)
      } else if (item.fileType === 'audio') {
        noteStore.setAudioLoading(item.jotId, item.fileId, false)
      } else {
        noteStore.setFileLoading(item.jotId, item.fileId, false)
      }
      this._transferActive = false
      this._completed++
      this.updateStatus()
      this.processNext()
    }, 15_000)

    const noteStore = useJotsStore.getState()
    if (item.fileType === 'image') {
      noteStore.setImageLoading(item.jotId, item.fileId, true)
    } else if (item.fileType === 'audio') {
      noteStore.setAudioLoading(item.jotId, item.fileId, true)
    } else {
      noteStore.setFileLoading(item.jotId, item.fileId, true)
    }

    this.updateStatus()
    window.electronAPI.requestFile({
      jotId: item.jotId,
      fileId: item.fileId,
      fileType: item.fileType,
    })
  }

  enqueue(item: BinaryQueueItem): void {
    syncLog('FILE', `enqueue ${item.fileType} ${item.fileId} (queue=${this.queue.length})`)
    this.queue.push(item)
    this._total++
    this.updateStatus()
    this.processNext()
  }

  purgeJot(jotId: number): void {
    const removed = this.queue.filter((it) => it.jotId === jotId).length
    this.queue = this.queue.filter((it) => it.jotId !== jotId)
    this._total = Math.max(0, this._total - removed)
    this.updateStatus()
  }

  completeTransfer(): void {
    if (this._transferTimer) { clearTimeout(this._transferTimer); this._transferTimer = null }
    this._transferActive = false
    this._completed++
    syncLog('FILE', `transfer complete (${this._completed}/${this._total})`)
    this.updateStatus()
    this.processNext()
  }

  cancelTransfer(): void {
    if (this._transferTimer) { clearTimeout(this._transferTimer); this._transferTimer = null }
    this._transferActive = false
  }

  reset(): void {
    if (this._transferTimer) { clearTimeout(this._transferTimer); this._transferTimer = null }
    this.queue = []
    this._transferActive = false
    this._total = 0
    this._completed = 0
    this.onStatusChange(null)
  }

  /** Enqueue without triggering processNext (for batch loading during metadata sync) */
  enqueueDeferred(item: BinaryQueueItem): void {
    this.queue.push(item)
    this._total++
  }
}
