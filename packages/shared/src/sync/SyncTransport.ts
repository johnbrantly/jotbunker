import type { SyncWireMessage } from './protocol'

/** Desktop-side connection state used by syncServer → renderer IPC */
export type DesktopConnectionState = 'disconnected' | 'socket_open' | 'authenticated'

export interface SyncTransport {
  connect(): void
  disconnect(): void
  send(msg: SyncWireMessage): boolean
  onMessage: ((msg: SyncWireMessage) => void) | null
  onStatusChange: ((connected: boolean) => void) | null
}
