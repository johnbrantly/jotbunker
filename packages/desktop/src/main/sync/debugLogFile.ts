import { mkdirSync, appendFileSync } from 'fs'
import { resolve } from 'path'

export interface DebugLogWriter {
  writeDesktop(line: string): void
  writePhone(line: string): void
}

let writer: DebugLogWriter | null = null

export function initDebugLogWriter(userDataPath: string): DebugLogWriter {
  if (writer) return writer

  const logDir = resolve(userDataPath, 'debug-logs')
  mkdirSync(logDir, { recursive: true })

  const desktopPath = resolve(logDir, 'desktop-sync.log')
  const phonePath = resolve(logDir, 'phone-sync.log')
  const sessionLine = `\n=== Session ${new Date().toISOString()} ===\n`
  appendFileSync(desktopPath, sessionLine)
  appendFileSync(phonePath, sessionLine)

  writer = {
    writeDesktop(line: string): void {
      appendFileSync(desktopPath, line + '\n')
    },
    writePhone(line: string): void {
      appendFileSync(phonePath, line + '\n')
    },
  }
  return writer
}

export function getDebugLogWriter(): DebugLogWriter | null {
  return writer
}
