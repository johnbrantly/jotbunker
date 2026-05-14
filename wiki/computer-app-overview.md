# Computer App

A Windows app built with Electron. The home base of your Bunker: connect to your phone, view everything, download content to your filesystem.

## Layout

```
Top Chrome         PHONE CONNECTED / PHONE DISCONNECTED indicator, SYNC NOW button,
                   "Synced X ago" timestamp, settings gear
Side Panel (left)  tag list, system messages
Content Area       tab-switched: Jots, Lists, Locked Lists, Scratchpad
Bottom Nav         tab bar
```

A few overlays sit on top when needed: Settings, About, the setup wizard for first launch, and two rare sync dialogs (the sync conflict picker and the large-change dialog).

## Jots tab

Shows jot content in cards: text, drawings (rendered as images), photo galleries, audio, and file attachments. You can assign a tag to a jot and download its content to your filesystem.

## Lists, Locked Lists, Scratchpad tabs

These mirror the phone's tabs. Lists and locked lists support drag-to-reorder with the mouse. Locked lists are not gated on the computer; the assumption is your computer is already a secured environment. Scratchpad is a plain text editor.

## Setup wizard

On first launch, a four-step wizard walks you through setup:

1. **Welcome.** Intro screen.
2. **Accent color.** Pick your theme.
3. **Save folders.** Choose where tagged content gets filed on your hard drive.
4. **Network.** Pick the network adapter your phone connects through, the port, and generate a pairing QR code for your phone to scan.

## System tray

The app minimizes to the Windows system tray when you close the window. Left-click the tray icon to show the window. Right-click for a context menu (show, quit).

## Auto-update

Checks for updates a few seconds after launch. Both download and install are user-initiated; nothing happens on its own. You can disable the startup check from the Help menu. See [Auto-Updates](computer-auto-updates.md) for details.

## Settings

Settings opens from the gear icon. Sections: Network Sync, Accent Color, Font Size, Categories (one editor per surface), Save Folder, Data Backup, Debug Logging. See [Computer Settings](computer-settings.md) for full reference.

## Data locations

All app data lives in `%APPDATA%\JotBunker\`:

| Path | Contents |
|---|---|
| `stores/` | JSON files for each section (lists, locked lists, ancestor, settings, tags, console) |
| `window-state.json` | Window position and size |
| `debug-logs/sync-{timestamp}.log` | One file per sync session, only written when DEBUG LOGGING is on |
| `system-messages.log` | Rolling 50-entry app log for non-sync events like saves, downloads, backups, and errors |

User-facing exports go to the tag root path you configured (default `Documents/JotBunker Tags/`). Tagged content is filed there under `{tagRootPath}/{tagName}/`.

See also: [Phone App](phone-app-overview.md) | [Sync](sync.md) | [Tags](computer-tags.md) | [Data Storage](data-storage.md)
