import type { SyncTransport, SyncWireMessage } from '@jotbunker/shared'

export class DesktopTransport implements SyncTransport {
  onMessage: ((msg: SyncWireMessage) => void) | null = null
  onStatusChange: ((connected: boolean) => void) | null = null

  private statusListenerSetup = false

  connect(): void {
    if (this.statusListenerSetup) return
    this.statusListenerSetup = true

    // Status changes from main process
    window.electronAPI.onSyncStatus((status) => {
      if (status.connectionState === 'authenticated') {
        this.onStatusChange?.(true)
      } else if (status.connectionState === 'disconnected') {
        this.onStatusChange?.(false)
      }
      // 'socket_open' is intentionally ignored — raw socket accept is not
      // a real connection (no handshake/encryption yet) nor a disconnect
    })

    // All sync protocol messages from main process arrive here
    window.electronAPI.onSyncMessage((msg: SyncWireMessage) => {
      this.onMessage?.(msg)
    })
  }

  disconnect(): void {
    // Desktop is the server — phone initiates disconnects
  }

  // Always returns true — actual queuing happens in the main process (syncServer.ts)
  // which owns the WebSocket and knows if the phone is reachable.
  send(msg: SyncWireMessage): boolean {
    window.electronAPI.syncSend(msg)
    return true
  }
}
