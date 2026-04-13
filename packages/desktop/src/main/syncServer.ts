import { ipcMain, app } from 'electron'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import type { Server as HttpServer } from 'http'
import { networkInterfaces } from 'os'
import { timingSafeEqual } from 'crypto'
import nacl from 'tweetnacl'
import type { SyncWireMessage, Handshake, KeyInit, DebugLogMessage } from '@jotbunker/shared'
import { parseMessage, syncLog, setSyncLogEnabled, setSyncLogSink } from '@jotbunker/shared'
import { writeJotFiles } from './download'
import { getWindow } from './window'
import { initDebugLogWriter, getDebugLogWriter } from './sync/debugLogFile'

// Node.js Buffer-based base64 helpers
function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}
function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'))
}

let httpServer: HttpServer | null = null
let wss: WebSocketServer | null = null
let phoneSocket: WebSocket | null = null

// Sync state
let phoneDeviceId: string | null = null
let desktopKeyPair: nacl.BoxKeyPair | null = null
let sharedKey: Uint8Array | null = null
let pairingSecret = ''
const pendingDownloadQueue: string[] = []

export function setPairingSecret(secret: string): void {
  pairingSecret = secret
}

function notifyRenderer(channel: string, data: unknown): void {
  const win = getWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

function send(msg: SyncWireMessage): boolean {
  if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
    if (sharedKey) {
      const nonce = nacl.randomBytes(24)
      const plaintext = Buffer.from(JSON.stringify(msg), 'utf-8')
      const ciphertext = nacl.secretbox(plaintext, nonce, sharedKey)
      phoneSocket.send(JSON.stringify({ enc: true, n: toBase64(nonce), d: toBase64(ciphertext) }))
    } else {
      phoneSocket.send(JSON.stringify(msg))
    }
    return true
  }
  return false
}

function resetConnection(): void {
  phoneSocket = null
  phoneDeviceId = null
  desktopKeyPair = null
  sharedKey = null
  notifyRenderer('sync:status', { connectionState: 'disconnected', deviceId: null })
}

function handleMessage(raw: string): void {
  let messageStr = raw
  try {
    const outer = JSON.parse(raw)
    if (outer.enc && sharedKey) {
      const decrypted = nacl.secretbox.open(fromBase64(outer.d), fromBase64(outer.n), sharedKey)
      if (!decrypted) { console.warn('[syncServer] decrypt failed'); return }
      messageStr = Buffer.from(decrypted).toString('utf-8')
    }
  } catch { /* not encrypted — pass through */ }
  const msg = parseMessage(messageStr)
  if (!msg) { syncLog('CONN', 'Message parse failed'); return }

  switch (msg.type) {
    case 'key_init': {
      const ki = msg as KeyInit
      syncLog('CONN', 'Received key_init, establishing encrypted channel')
      desktopKeyPair = nacl.box.keyPair()
      send({ type: 'key_exchange', publicKey: toBase64(desktopKeyPair.publicKey) })
      sharedKey = nacl.box.before(fromBase64(ki.publicKey), desktopKeyPair.secretKey)
      syncLog('CONN', 'Encrypted channel up, awaiting handshake')
      break
    }

    case 'handshake': {
      const hs = msg as Handshake
      if (pairingSecret) {
        let match = false
        try {
          match = timingSafeEqual(Buffer.from(hs.pairingSecret), Buffer.from(pairingSecret))
        } catch {}
        if (!match) {
          syncLog('CONN', `Rejected handshake from ${hs.deviceId} — wrong pairing secret`)
          phoneSocket?.close(4001, 'Invalid pairing secret')
          return
        }
      }
      phoneDeviceId = hs.deviceId
      syncLog('CONN', `Handshake from ${hs.deviceId}, pairing secret validated`)
      notifyRenderer('sync:status', { connectionState: 'authenticated', deviceId: phoneDeviceId })
      notifyRenderer('sync:message', msg)
      break
    }

    case 'jot_download_response': {
      const downloadPath = pendingDownloadQueue.shift() ?? ''
      const result = writeJotFiles(msg, downloadPath)
      notifyRenderer('sync:download-complete', result)
      break
    }

    case 'debug_log': {
      const dlm = msg as DebugLogMessage
      const logWriter = getDebugLogWriter()
      if (logWriter) {
        for (const line of dlm.lines) logWriter.writePhone(line)
      }
      break
    }

    default:
      // Forward all other messages to renderer via generic channel
      notifyRenderer('sync:message', msg)
      break
  }
}

function registerIpcHandlers(): void {
  // Generic send channel — renderer sends any sync message to phone
  ipcMain.on('sync:send', (_event, msg: SyncWireMessage) => {
    send(msg)
  })

  // Download/clear requests
  ipcMain.on('sync:request-download', (_event, data: { jotIds: number[]; downloadPath: string }) => {
    pendingDownloadQueue.push(data.downloadPath || '')
    send({ type: 'jot_download_request', jotIds: data.jotIds })
  })

  ipcMain.on('sync:request-clear', (_event, jotIds: number[]) => {
    send({ type: 'jot_clear_request', jotIds })
  })

  ipcMain.on('sync:request-jot-refresh', () => {
    send({ type: 'jot_refresh_request' })
  })

  ipcMain.on('sync:request-jot-meta', (_event, jotId: number) => {
    send({ type: 'jot_meta_request', jotId })
  })

  ipcMain.on('sync:request-file', (_event, data: { jotId: number; fileId: string; fileType: 'image' | 'audio' }) => {
    send({ type: 'file_request', ...data })
  })

  // Debug logging
  ipcMain.on('sync:set-debug-log', (_event, enabled: boolean) => {
    setSyncLogEnabled(enabled)
    if (enabled) {
      const writer = initDebugLogWriter(app.getPath('userData'))
      setSyncLogSink(writer.writeDesktop)
    } else {
      setSyncLogSink(null)
    }
  })

  ipcMain.on('sync:renderer-log', (_event, line: string) => {
    const writer = initDebugLogWriter(app.getPath('userData'))
    writer.writeDesktop(line)
  })

  // Pairing secret
  ipcMain.on('sync:set-pairing-secret', (_event, secret: string) => {
    pairingSecret = secret
  })

}

let ipcRegistered = false

export function startSyncServer(port = 8080): void {
  if (wss) return


  if (!ipcRegistered) {
    registerIpcHandlers()
    ipcRegistered = true
  }

  // HTTP server handles /ping for reachability and upgrades WebSocket connections
  httpServer = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', deviceId: 'desktop' }))
      return
    }
    res.writeHead(404)
    res.end()
  })

  wss = new WebSocketServer({ server: httpServer, maxPayload: 50 * 1024 * 1024 })

  wss.on('connection', (ws, req) => {
    const replacing = phoneSocket && phoneSocket.readyState === WebSocket.OPEN
    syncLog('CONN', `Phone connected${replacing ? ' (replacing stale connection)' : ''}`)
    if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
      phoneSocket.close()
    }

    sharedKey = null
    desktopKeyPair = null
    phoneDeviceId = null

    phoneSocket = ws

    // Enable TCP keepalive so dead connections (app killed, phone off) are detected
    // within ~10s instead of waiting for TCP's default timeout
    req.socket.setKeepAlive(true, 5_000)

    notifyRenderer('sync:status', { connectionState: 'socket_open', deviceId: null })

    ws.on('message', (data) => { handleMessage(data.toString()) })
    ws.on('close', () => { if (ws === phoneSocket) { syncLog('CONN', 'Phone disconnected'); resetConnection() } })
    ws.on('error', () => { if (ws === phoneSocket) resetConnection() })
  })

  httpServer.listen(port)
}

export function restartSyncServer(port: number): void {
  if (phoneSocket) { phoneSocket.close() }
  resetConnection()
  if (wss) { wss.close(); wss = null }
  if (httpServer) { httpServer.close(); httpServer = null }
  startSyncServer(port)
}

export function getServerIp(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

export function getNetworkInterfaces(): { name: string; address: string }[] {
  const nets = networkInterfaces()
  const results: { name: string; address: string }[] = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ name, address: net.address })
      }
    }
  }
  return results
}
