import type { SyncTransport } from './SyncTransport'
import type { MobileSyncPlatform, DesktopSyncPlatform, SyncPhase } from './SyncEngine'
import { syncLog } from './syncLog'

export class SyncPhaseManager {
  phase: SyncPhase = 'idle'
  phaseTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(
    private transport: SyncTransport,
    private platform: MobileSyncPlatform | DesktopSyncPlatform,
    private serverMode: boolean,
  ) {}

  setPhase(phase: SyncPhase): void {
    syncLog('ENGINE', `phase: ${this.phase} -> ${phase}`)
    this.phase = phase
  }

  clearPhaseTimeout(): void {
    if (this.phaseTimeout) {
      clearTimeout(this.phaseTimeout)
      this.phaseTimeout = null
    }
  }

  handleTransportStatus(connected: boolean, isMobile: () => boolean): void {
    if (connected) {
      if (this.serverMode) {
        this.setPhase('syncing')
        this.platform.onConnectionStatusChange?.('connecting')
      } else if (isMobile()) {
        this.setPhase('key_exchange')
        this.platform.onConnectionStatusChange?.('connecting')
      }
    } else {
      this.clearPhaseTimeout()
      this.setPhase('disconnected')
      this.platform.onConnectionStatusChange?.('unreachable')
    }
  }
}
