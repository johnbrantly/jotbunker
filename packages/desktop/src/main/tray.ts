import { app, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { showWindow, setQuitting, getWindow, setShowOnTaskbar } from './window'

let tray: Tray | null = null
let showOnTaskbar = true

function rebuildMenu(): void {
  if (!tray) return
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open JotBunker',
      click: () => showWindow(),
    },
    { type: 'separator' },
    {
      label: 'Show on Taskbar',
      type: 'checkbox',
      checked: showOnTaskbar,
      click: (item) => {
        showOnTaskbar = item.checked
        setShowOnTaskbar(showOnTaskbar)
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        setQuitting(true)
        const win = getWindow()
        if (win) win.close()
        process.exit(0)
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

export function createTray(): Tray {
  // In dev, __dirname is src/main or out/main — resources is two levels up.
  // In production, electron-builder copies extraResources to process.resourcesPath.
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(__dirname, '../../resources/icon.png')
  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('JotBunker')

  rebuildMenu()

  // Left-click shows/focuses window
  tray.on('click', () => showWindow())

  return tray
}
