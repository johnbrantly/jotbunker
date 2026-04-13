import { BrowserWindow, shell, nativeImage, app, screen } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'

interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

const getStateFile = (): string => join(app.getPath('userData'), 'window-state.json')
const DEFAULTS: WindowState = { x: -1, y: -1, width: 1000, height: 750, isMaximized: false }

function loadWindowState(): WindowState {
  try {
    const state: WindowState = JSON.parse(readFileSync(getStateFile(), 'utf-8'))
    const visible = screen.getAllDisplays().some((d) => {
      const b = d.bounds
      return (
        state.x + state.width > b.x &&
        state.x < b.x + b.width &&
        state.y + state.height > b.y &&
        state.y < b.y + b.height
      )
    })
    return visible ? state : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let lastBounds: Electron.Rectangle | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

function saveToDisk(state: WindowState): void {
  try {
    writeFileSync(getStateFile(), JSON.stringify(state))
  } catch {
    // ignore write errors
  }
}

function saveWindowState(win: BrowserWindow): void {
  const maximized = win.isMaximized()
  const bounds = maximized && lastBounds ? lastBounds : win.getBounds()
  saveToDisk({ ...bounds, isMaximized: maximized })
}

function saveWindowStateDebounced(win: BrowserWindow): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveWindowState(win), 500)
}

let mainWindow: BrowserWindow | null = null
let quitting = false

export function setQuitting(value: boolean): void {
  quitting = value
}

export function getWindow(): BrowserWindow | null {
  return mainWindow
}

export function createWindow(): BrowserWindow {
  const state = loadWindowState()
  const centered = state.x === -1 && state.y === -1
  const iconPath = join(__dirname, '../../resources/icon.png')
  mainWindow = new BrowserWindow({
    title: 'Jotbunker',
    icon: nativeImage.createFromPath(iconPath),
    width: state.width,
    height: state.height,
    ...(centered ? {} : { x: state.x, y: state.y }),
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (state.isMaximized) mainWindow!.maximize()
    mainWindow!.show()
  })

  const trackBounds = (): void => {
    if (mainWindow && !mainWindow.isMaximized()) {
      lastBounds = mainWindow.getBounds()
    }
    saveWindowStateDebounced(mainWindow!)
  }
  mainWindow.on('resize', trackBounds)
  mainWindow.on('move', trackBounds)

  // Hide to tray instead of closing
  mainWindow.on('close', (event) => {
    saveWindowState(mainWindow!)
    if (!quitting) {
      event.preventDefault()
      mainWindow!.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      if (new URL(details.url).protocol === 'https:') {
        shell.openExternal(details.url)
      }
    } catch {}
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function showWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
}

export function setShowOnTaskbar(show: boolean): void {
  if (!mainWindow) return
  mainWindow.setSkipTaskbar(!show)
}
