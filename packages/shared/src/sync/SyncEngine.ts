import type {
  SyncWireMessage,
  StateSync,
  JotDownloadRequest,
  JotClearRequest,
  FileRequest,
  KeyExchangeMessage,
  JotRefreshResponse,
  FileResponse,
  JotClearAck,
  JotManifest,
  JotMetaRequest,
  JotMetaResponse,
  SyncConfirm,
} from './protocol'
import type { SyncTransport } from './SyncTransport'
import { syncLog } from './syncLog'
import { SyncPhaseManager } from './SyncPhaseManager'

export type SyncPhase =
  | 'idle'
  | 'connecting'
  | 'handshake'
  | 'key_exchange'
  | 'syncing'
  | 'docked'
  | 'disconnected'

export type ConnectionStatus = 'connected' | 'connecting' | 'unreachable' | 'idle'

// ── Role-specific platform interfaces ──

/** Core callbacks required by both platforms */
export interface SyncPlatformCore {
  deviceId: string
  getLastSyncTimestamp(): number
  setLastSyncTimestamp(ts: number): void | Promise<void>
  handleStateSync(ss: StateSync, send: (msg: SyncWireMessage) => boolean): Promise<void>
  onConnectionStatusChange?(status: ConnectionStatus): void
  handleKeyExchange?(msg: KeyExchangeMessage): void
  onLive?(): void
}

/** Phone-only handlers (mobile platform) */
export interface MobilePlatformHandlers {
  handleDownloadRequest(msg: JotDownloadRequest, send: (msg: SyncWireMessage) => boolean): Promise<void>
  handleClearRequest(msg: JotClearRequest, send: (msg: SyncWireMessage) => boolean): void
  handleFileRequest(msg: FileRequest, send: (msg: SyncWireMessage) => boolean): Promise<void>
  handleJotRefreshRequest(send: (msg: SyncWireMessage) => boolean): void
  handleJotMetaRequest(msg: JotMetaRequest, send: (msg: SyncWireMessage) => boolean): void
  handleSyncConfirm(msg: SyncConfirm, send: (msg: SyncWireMessage) => boolean): void
  handleSyncCancel(): void
  buildHandshake(lastSyncTimestamp: number): SyncWireMessage
}

/** Desktop-only handlers */
export interface DesktopPlatformHandlers {
  handleHandshake(msg: SyncWireMessage, send: (msg: SyncWireMessage) => boolean): Promise<void>
  sendStateSync(send: (msg: SyncWireMessage) => boolean): void
  handleJotRefreshResponse(data: JotRefreshResponse): Promise<void>
  handleFileResponse(data: FileResponse): Promise<void>
  handleClearComplete(data: JotClearAck): void
  handleDownloadComplete(data: unknown): void
  handleJotManifest?(data: JotManifest): void
  handleJotMetaResponse?(data: JotMetaResponse): Promise<void>
  onStateSyncComplete?(): void
}

/** Composite platform types */
export type MobileSyncPlatform = SyncPlatformCore & MobilePlatformHandlers
export type DesktopSyncPlatform = SyncPlatformCore & DesktopPlatformHandlers

export interface SyncEngineOptions {
  /** When true, engine is the server (desktop). Skips sending handshake on connect. */
  serverMode?: boolean
}

export class SyncEngine {
  private transport: SyncTransport
  private platform: MobileSyncPlatform | DesktopSyncPlatform
  private serverMode: boolean
  private phaseManager: SyncPhaseManager

  private disposed = false

  constructor(
    transport: SyncTransport,
    platform: MobileSyncPlatform | DesktopSyncPlatform,
    options?: SyncEngineOptions,
  ) {
    this.transport = transport
    this.platform = platform
    this.serverMode = options?.serverMode ?? false

    this.phaseManager = new SyncPhaseManager(transport, platform, this.serverMode)

    transport.onMessage = (msg) => this.handleMessage(msg)
    transport.onStatusChange = (connected) => this.phaseManager.handleTransportStatus(connected, () => this.isMobile())
  }

  private isMobile(): this is { platform: MobileSyncPlatform } {
    return !this.serverMode
  }

  private isDesktop(): this is { platform: DesktopSyncPlatform } {
    return this.serverMode
  }

  get currentPhase(): SyncPhase { return this.phaseManager.phase }

  connect(): void {
    if (this.phaseManager.phase !== 'idle' && this.phaseManager.phase !== 'disconnected') return
    this.phaseManager.setPhase('connecting')
    this.transport.connect()
  }

  disconnect(): void {
    this.phaseManager.clearPhaseTimeout()
    this.transport.disconnect()
    this.phaseManager.setPhase('idle')
    this.platform.onConnectionStatusChange?.('idle')
  }

  dispose(): void {
    this.disposed = true
    this.disconnect()
    this.transport.onMessage = null
    this.transport.onStatusChange = null
  }

  /** Desktop-only: re-trigger state exchange while docked */
  requestRefresh(): void {
    if (this.phaseManager.phase !== 'docked' || !this.isDesktop()) return
    ;(this.platform as DesktopSyncPlatform).sendStateSync((m) => this.transport.send(m))
  }

  private async handleMessage(msg: SyncWireMessage): Promise<void> {
    try {
    switch (msg.type) {
      case 'handshake':
        if (this.isDesktop()) {
          await this.platform.handleHandshake(msg, (m) => this.transport.send(m))
          // handleHandshake never sends state_sync; dock immediately so SYNC
          // NOW can drive the exchange.
          this.phaseManager.setPhase('docked')
          this.platform.onConnectionStatusChange?.('connected')
          this.platform.onLive?.()
        }
        break

      case 'key_exchange':
        this.platform.handleKeyExchange?.(msg as KeyExchangeMessage)
        if (this.isMobile()) {
          this.phaseManager.setPhase('handshake')
          const handshake = this.platform.buildHandshake(this.platform.getLastSyncTimestamp())
          this.transport.send(handshake)
          // Phone never auto-syncs on connect; dock immediately so the user
          // can edit while the desktop drives the next state exchange.
          this.phaseManager.setPhase('docked')
          this.platform.onConnectionStatusChange?.('connected')
          this.platform.onLive?.()
        } else {
          this.phaseManager.setPhase('syncing')
        }
        break

      case 'key_init':
        // Desktop-side: handled by syncServer, not the engine
        break

      case 'state_sync': {
        const ss = msg as StateSync
        await this.platform.handleStateSync(ss, (m) => this.transport.send(m))

        this.phaseManager.clearPhaseTimeout()
        this.phaseManager.setPhase('docked')
        this.platform.onConnectionStatusChange?.('connected')
        // Timestamp updates are handled by the platform's handleStateSync
        // itself: desktop bumps on success/empty paths but not on user-cancel,
        // phone bumps in handleSyncConfirm after the user picks a side.
        this.platform.onLive?.()
        break
      }

      case 'jot_download_request':
        if (this.isMobile()) {
          await this.platform.handleDownloadRequest(msg as JotDownloadRequest, (m) => this.transport.send(m))
        }
        break

      case 'jot_clear_request':
        if (this.isMobile()) {
          this.platform.handleClearRequest(msg as JotClearRequest, (m) => this.transport.send(m))
        }
        break

      case 'file_request':
        if (this.isMobile()) {
          await this.platform.handleFileRequest(msg as FileRequest, (m) => this.transport.send(m))
        }
        break

      case 'jot_refresh_request':
        if (this.isMobile()) {
          this.platform.handleJotRefreshRequest((m) => this.transport.send(m))
        }
        break

      case 'jot_meta_request':
        if (this.isMobile()) {
          this.platform.handleJotMetaRequest(msg as JotMetaRequest, (m) => this.transport.send(m))
        }
        break

      case 'jot_meta_response':
        if (this.isDesktop()) {
          await this.platform.handleJotMetaResponse?.(msg as JotMetaResponse)
        }
        break

      case 'jot_refresh_response':
        if (this.isDesktop()) {
          await this.platform.handleJotRefreshResponse(msg as JotRefreshResponse)
        }
        break

      case 'file_response':
        if (this.isDesktop()) {
          await this.platform.handleFileResponse(msg as FileResponse)
        }
        break

      case 'jot_clear_ack':
        if (this.isDesktop()) {
          this.platform.handleClearComplete(msg as JotClearAck)
        }
        break

      case 'jot_manifest':
        if (this.isDesktop()) {
          this.platform.handleJotManifest?.(msg as JotManifest)
        }
        break

      case 'sync_confirm':
        if (this.isMobile()) {
          this.platform.handleSyncConfirm(msg as SyncConfirm, (m) => this.transport.send(m))
        }
        break

      case 'sync_cancel':
        if (this.isMobile()) {
          this.platform.handleSyncCancel()
        }
        break

      case 'heartbeat':
        break

      default:
        break
    }
    } catch (err) {
      syncLog('ENGINE', `Error handling ${msg.type}: ${err instanceof Error ? err.stack : err}`)
    }
  }
}
