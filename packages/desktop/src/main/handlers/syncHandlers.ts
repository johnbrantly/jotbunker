import type { IpcMain } from 'electron'
import { getServerIp, getNetworkInterfaces, restartSyncServer, setPairingSecret } from '../syncServer'

export function registerSyncHandlers(ipc: IpcMain): void {
  ipc.handle('sync:get-server-ip', () => getServerIp())
  ipc.handle('sync:get-network-interfaces', () => getNetworkInterfaces())
  ipc.handle('sync:set-port', (_e, port: number) => restartSyncServer(port))
  ipc.on('sync:set-pairing-secret', (_e, secret: string) => setPairingSecret(secret))
}
