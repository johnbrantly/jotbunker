import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createWindow, setQuitting, getWindow } from './window'
import { createTray } from './tray'
import { startSyncServer } from './syncServer'
import { registerSyncHandlers } from './handlers/syncHandlers'
import { registerStoreHandlers } from './handlers/storeHandlers'
import { registerFileHandlers } from './handlers/fileHandlers'
import { join } from 'path'
import { existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'

// Ensure dev mode uses the same userData path as production (%APPDATA%\Jotbunker)
app.setName('Jotbunker')


// Single instance lock — focus existing window if already running
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.whenReady().then(() => {
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Jotbunker',
      message: 'Jotbunker is already running.',
      detail: 'Check your system tray for the existing instance.',
    })
    app.quit()
  })
} else {
app.on('second-instance', () => {
  const win = getWindow()
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
})

app.whenReady().then(() => {
  // Create stores/ directory for IPC-backed persistence
  const storesDir = join(app.getPath('userData'), 'stores')
  mkdirSync(storesDir, { recursive: true })

  electronApp.setAppUserModelId('com.jotbunker.desktop')

  if (is.dev) {
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  }

  createWindow()
  createTray()

  // Start WebSocket sync server
  startSyncServer(8080)

  // Register IPC handlers
  registerSyncHandlers(ipcMain)
  registerStoreHandlers(ipcMain, storesDir)
  registerFileHandlers(ipcMain)

  // Auto-update preference (persisted in userData)
  const updatePrefPath = join(app.getPath('userData'), 'autoupdate-disabled.flag')
  let autoUpdateDisabled = existsSync(updatePrefPath)
  let manualCheck = false

  // Application menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CommandOrControl+,',
          click: () => {
            const win = getWindow()
            if (win) win.webContents.send('menu:open-settings')
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CommandOrControl+Q',
          click: () => {
            setQuitting(true)
            const win = getWindow()
            if (win) win.close()
            app.quit()
          },
        },
      ],
    },
    ...(is.dev ? [{
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'CommandOrControl+Shift+I',
          click: () => {
            const win = getWindow()
            if (win) win.webContents.toggleDevTools()
          },
        },
      ],
    }] : []),
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Jotbunker',
          click: () => {
            const win = getWindow()
            if (win) win.webContents.send('menu:open-about')
          },
        },
        { type: 'separator' },
        {
          label: 'Disable Auto-Update on Startup',
          type: 'checkbox',
          checked: autoUpdateDisabled,
          click: (menuItem) => {
            autoUpdateDisabled = menuItem.checked
            if (autoUpdateDisabled) {
              writeFileSync(updatePrefPath, '')
            } else {
              try { unlinkSync(updatePrefPath) } catch {}
            }
          },
        },
        {
          label: 'Check for Updates',
          click: () => {
            manualCheck = true
            const win = getWindow()
            if (win) win.webContents.send('update:checking')
            autoUpdater.checkForUpdates()
          },
        },
      ],
    },
  ])
  Menu.setApplicationMenu(menu)

  // Auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  if (!autoUpdateDisabled) {
    setTimeout(() => autoUpdater.checkForUpdates(), 3000)
  }
  autoUpdater.on('update-available', (info) => {
    manualCheck = false
    const win = getWindow()
    if (win) win.webContents.send('update:available', info.version)
  })
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) {
      const win = getWindow()
      if (win) win.webContents.send('update:up-to-date', { version: app.getVersion() })
      manualCheck = false
    }
  })
  autoUpdater.on('download-progress', (progress) => {
    const win = getWindow()
    if (win) win.webContents.send('update:download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    })
  })
  autoUpdater.on('update-downloaded', () => {
    const win = getWindow()
    if (win) win.webContents.send('update:downloaded')
  })
  autoUpdater.on('error', (err) => {
    console.log('Auto-updater error:', err.message)
    if (manualCheck) {
      const win = getWindow()
      if (win) win.webContents.send('update:error', { message: err.message })
      manualCheck = false
    }
  })
  ipcMain.on('update:start-download', () => autoUpdater.downloadUpdate())
  ipcMain.on('update:install', () => autoUpdater.quitAndInstall())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On Windows, keep running in tray
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
} // end gotLock else
