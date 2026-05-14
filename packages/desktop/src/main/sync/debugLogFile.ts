import { mkdirSync, appendFileSync } from 'fs'
import { resolve } from 'path'

// Per-sync-session log file. One file per WebSocket connection cycle while
// the user has DEBUG LOGGING enabled. Filename: sync-{ISO-ts}.log.
//
// Lifecycle (driven from syncServer.ts):
//   debugLogEnabled OFF                       -> no session ever opens
//   debugLogEnabled ON  + phone connects      -> startSession()
//   debugLogEnabled ON  + phone disconnects   -> closeCurrentSession()
//   debugLogEnabled flipped ON  mid-connect   -> startSession() now
//   debugLogEnabled flipped OFF mid-connect   -> closeCurrentSession() now
//
// All persistence funnels through getCurrentSession()?.write(line). If no
// session is open, the line is dropped. That is the single privacy gate.

export interface SessionLogWriter {
  write(line: string): void
  close(): void
  readonly filename: string
}

let currentSession: SessionLogWriter | null = null
let logDir: string | null = null

export function configureLogDir(userDataPath: string): void {
  logDir = resolve(userDataPath, 'debug-logs')
  mkdirSync(logDir, { recursive: true })
}

export function startSession(): SessionLogWriter {
  if (currentSession) currentSession.close()
  if (!logDir) throw new Error('configureLogDir must be called before startSession')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `sync-${ts}.log`
  const filePath = resolve(logDir, filename)
  appendFileSync(filePath, `=== Session ${new Date().toISOString()} ===\n`)
  const writer: SessionLogWriter = {
    write(line: string): void {
      appendFileSync(filePath, line + '\n')
    },
    close(): void {
      if (currentSession === writer) currentSession = null
    },
    filename,
  }
  currentSession = writer
  return writer
}

export function getCurrentSession(): SessionLogWriter | null {
  return currentSession
}

export function closeCurrentSession(): void {
  if (currentSession) currentSession.close()
}
