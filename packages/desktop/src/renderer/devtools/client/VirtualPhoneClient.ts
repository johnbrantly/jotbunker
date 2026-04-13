import type {
  SyncWireMessage,
  StateSync,
  ListItem,
  KeyExchangeMessage,
} from '@jotbunker/shared'
import { parseMessage, JOT_COUNT } from '@jotbunker/shared'
import {
  nacl,
  uint8ToBase64,
  base64ToUint8,
  generateKeyPair,
  computeSharedKey,
  encryptMessage,
  decryptMessage,
} from './clientCrypto'
import type { ConnectionStatus } from '../stores/workbenchStore'
import { useWorkbenchStore } from '../stores/workbenchStore'

export type StatusCallback = (status: ConnectionStatus) => void
export type StateSyncCallback = (ss: StateSync) => Promise<void> | void
export type WireCallback = (
  direction: 'send' | 'recv',
  type: string,
  data: unknown,
) => void

export class VirtualPhoneClient {
  private ws: WebSocket | null = null
  private channelKeyPair: nacl.BoxKeyPair | null = null
  private sharedKey: Uint8Array | null = null
  private desktopPublicKey: Uint8Array | null = null
  private stateSyncDone = false
  private pendingPairingSecret = ''

  onStatusChange: StatusCallback = () => {}
  onStateSync: StateSyncCallback = () => {}
  onWireMessage: WireCallback = () => {}

  get status(): ConnectionStatus {
    return useWorkbenchStore.getState().connectionStatus
  }

  connect(port: number, pairingSecret: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return
    this.setStatus('connecting')
    this.stateSyncDone = false
    this.sharedKey = null
    this.desktopPublicKey = null
    this.channelKeyPair = generateKeyPair()
    this.pendingPairingSecret = pairingSecret

    try {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`)
      this.ws = ws

      ws.onopen = () => {
        // Send key_init with just the public key (plaintext)
        const keyInit: SyncWireMessage = {
          type: 'key_init',
          publicKey: uint8ToBase64(this.channelKeyPair!.publicKey),
        }
        this.rawSend(keyInit)
      }

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          this.handleMessage(event.data).catch((err) => {
            console.error('[VirtualPhoneClient] handleMessage error:', err)
          })
        }
      }

      ws.onclose = () => {
        this.ws = null
        this.sharedKey = null
        this.channelKeyPair = null
        this.stateSyncDone = false
        this.setStatus('disconnected')
      }

      ws.onerror = () => {}
    } catch {
      this.setStatus('disconnected')
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.sharedKey = null
    this.channelKeyPair = null
    this.stateSyncDone = false
    this.setStatus('disconnected')
  }

  isStateSyncDone(): boolean {
    return this.stateSyncDone
  }

  private setStatus(status: ConnectionStatus): void {
    useWorkbenchStore.getState().setConnectionStatus(status)
    this.onStatusChange(status)
  }

  private rawSend(msg: SyncWireMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    let data: string
    if (this.sharedKey) {
      data = encryptMessage(JSON.stringify(msg), this.sharedKey)
    } else {
      data = JSON.stringify(msg)
    }
    this.ws.send(data)
    this.logWire('send', msg.type, msg)
  }

  private async handleMessage(raw: string): Promise<void> {
    let messageStr = raw
    if (this.sharedKey) {
      const result = decryptMessage(raw, this.sharedKey)
      if (result === null) {
        console.error('[Workbench] Decryption FAILED for message, dropping. Raw length:', raw.length)
        return
      }
      messageStr = result
    }

    const msg = parseMessage(messageStr)
    if (!msg) {
      console.error('[Workbench] parseMessage returned null. messageStr:', messageStr.slice(0, 200))
      return
    }

    console.log('[Workbench] recv:', msg.type)
    this.logWire('recv', msg.type, msg)

    switch (msg.type) {
      case 'key_exchange': {
        const ke = msg as KeyExchangeMessage
        this.desktopPublicKey = base64ToUint8(ke.publicKey)
        this.sharedKey = computeSharedKey(
          this.desktopPublicKey,
          this.channelKeyPair!.secretKey,
        )
        console.log('[Workbench] Shared key derived, encrypted channel up')
        // Now send handshake encrypted (pairing secret never in plaintext)
        this.rawSend({
          type: 'handshake',
          deviceId: 'Virtual Phone',
          lastSyncTimestamp: 0,
          pairingSecret: this.pendingPairingSecret,
        })
        break
      }

      case 'state_sync': {
        console.log('[Workbench] state_sync received, processing...')
        const ss = msg as StateSync
        await this.onStateSync(ss)
        console.log('[Workbench] state_sync processed')
        break
      }

      case 'heartbeat':
        // No response needed - the WebSocket pong handles keepalive
        break

      case 'jot_refresh_request':
        // Send a minimal jot_refresh_response
        this.rawSend({
          type: 'jot_refresh_response',
          jots: [],
        })
        // Send empty manifest
        this.rawSend({
          type: 'jot_manifest',
          jots: Array.from({ length: JOT_COUNT }, (_, i) => ({
            id: i + 1,
            hasText: false,
            hasDrawing: false,
            imageIds: [],
            audioIds: [],
          })),
        })
        break

      default:
        break
    }
  }

  sendStateSyncResponse(data: {
    lists: Record<string, ListItem[]>
    lockedLists: Record<string, ListItem[]>
    listsCategories: { id: string; label: string; section: string; updatedAt: number }[]
    lockedListsCategories: { id: string; label: string; section: string; updatedAt: number }[]
    scratchpad: Record<string, { content: string; updatedAt: number }>
    scratchpadCategories: { id: string; label: string; section: string; updatedAt: number }[]
  }): void {
    this.rawSend({
      type: 'state_sync',
      lists: data.lists,
      lockedLists: data.lockedLists,
      listsCategories: data.listsCategories as any,
      lockedListsCategories: data.lockedListsCategories as any,
      since: 0,
      scratchpad: data.scratchpad,
      scratchpadCategories: data.scratchpadCategories as any,
    })

    this.stateSyncDone = true
    this.setStatus('connected')
  }

  private logWire(direction: 'send' | 'recv', type: string, data: unknown): void {
    const summary = summarizeMessage(type, data)
    this.onWireMessage(direction, type, data)
    useWorkbenchStore.getState().addWireLogEntry({
      timestamp: Date.now(),
      direction,
      messageType: type,
      summary,
      raw: data,
    })
  }
}

function summarizeMessage(type: string, data: unknown): string {
  const d = data as Record<string, unknown>
  switch (type) {
    case 'handshake':
      return `device=${d.deviceId}`
    case 'key_exchange':
      return 'Encrypted channel'
    case 'state_sync': {
      const lists = d.lists as Record<string, unknown[]> | undefined
      const lockedLists = d.lockedLists as Record<string, unknown[]> | undefined
      const lCount = lists
        ? Object.values(lists).reduce((s, a) => s + a.length, 0)
        : 0
      const sCount = lockedLists
        ? Object.values(lockedLists).reduce((s, a) => s + a.length, 0)
        : 0
      return `lists=${lCount} lockedLists=${sCount}`
    }
    case 'heartbeat':
      return 'ping'
    default:
      return type
  }
}

// Singleton instance
export const virtualClient = new VirtualPhoneClient()
