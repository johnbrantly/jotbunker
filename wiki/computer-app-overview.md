# Computer App

Windows app built with Electron. The home base (bunker) — connect to your phone, view everything, download and file content to your filesystem.

---

## Layout

```
Top Chrome         — PHONE CONNECTED / PHONE DISCONNECTED indicator, SYNC NOW button, "Synced X ago" timestamp, settings gear
Side Panel (left)  — tag list ([details](computer-tags.md)), system messages ([details](computer-system-messages.md))
Content Area       — tab-switched: Jots, Lists, Locked Lists, Scratchpad
Bottom Nav         — tab bar
```

Additional overlays: Settings Modal, About Modal, Setup Wizard, SyncReportDialog, SyncLogDialog.

## Jots tab

Displays jot content in cards — text, drawings (rendered as images), photo galleries, and audio recordings. You can assign a tag and download jot content to your filesystem.

## Lists, Locked Lists, Scratchpad tabs

Mirror the phone's tabs. Lists and locked lists support drag-to-reorder via mouse (using dnd-kit). Locked lists are not gated on the computer — the assumption is your computer is already a secured environment. Scratchpad is a text editor.

## Setup wizard

On first launch, a 4-step wizard walks you through setup:
1. **Welcome** — intro screen
2. **Accent color** — pick your theme hue and grayscale
3. **Save folders** — configure the tag root path for filing downloads
4. **Network** — select network interface, port, and generate a pairing secret with QR code for your phone to scan

## System tray

The app minimizes to the Windows system tray. Left-click the tray icon to show the window. Right-click for a context menu (show, quit). The taskbar icon can be toggled.

## Auto-update

Checks for updates 3 seconds after launch. Download and install are both user-initiated — nothing happens automatically. Disable the startup check via Help menu. See [Auto-Updates](computer-auto-updates.md) for full details.

## Settings

Settings modal accessed via the gear icon. Sections: Network Sync, Accent Color, Font Size, Categories (×3), Save Folder, Data Backup, Debug Logging, and Sync History. See [Computer Settings](computer-settings.md) for full reference.

## Data locations

All app data lives in `%APPDATA%\JotBunker\`:

| Path | Contents |
|---|---|
| `stores/` | JSON files for each store (lists, locked lists, settings, sync history, etc.) |
| `window-state.json` | Window position and size |
| `debug-logs/` | Sync protocol logs |
| `system-messages.log` | Rolling 50-entry app log |

User-facing exports go to:
- `Documents/JotBunker Downloads/` — downloaded jot content
- User-configured tag root path (defaults to `Documents/JotBunker Tags/`) — tagged/filed content in `{tagRootPath}/{tagName}/`

---

See also: [Phone App](phone-app-overview.md) | [Sync](sync.md) | [Tags](computer-tags.md) | [Data Storage](data-storage.md)
