# Computer Settings

The settings modal opens from the gear icon in the top chrome. Changes do not apply until you click **SAVE**. **CANCEL** discards changes.

## Network Sync

Controls the WebSocket server your phone connects to.

### Adapter and port

| Element | Type | Default | Description |
|---|---|---|---|
| ADAPTER PHONE CONNECTS THROUGH | Dropdown | First available | Lists network interfaces by name and IP. If a previously selected adapter is unavailable, an orange warning appears. |
| PORT THIS COMPUTER LISTENS ON | Number input | 8080 | Range 1 to 65535. The port your phone connects to. |

### QR pairing code

Visible when an adapter is selected.

| Element | Type | Description |
|---|---|---|
| QR code | Display | Encodes the IP, port, and pairing secret for your phone to scan |
| IP:Port | Display | Shown below the QR code |
| SHOW SECRET / HIDE SECRET | Toggle button | Reveals or hides the full pairing secret |

## Accent Color

A live preview circle in the section header updates as you adjust.

| Element | Type | Default | Description |
|---|---|---|---|
| Hue | Range slider | 205 | Range 0 to 360 degrees. The base accent color. |
| Grayscale | Range slider | 75 | Range 0 to 100. 0 is full color, 100 is monochrome. |
| RESTORE DEFAULT | Button | (none) | Resets to a desaturated steel blue (hue 205, grayscale 75). |

See [Theming](theming.md) for the palette details.

## Font Size

Three-size pill toggles for each text area.

| Element | Options | Default | Description |
|---|---|---|---|
| SCRATCHPAD | S / M / L | M | Font size in the scratchpad editor |
| LISTS | S / M / L | M | Font size in lists (and locked lists) |
| TAGS | S / M / L | M | Font size for tag labels in the side panel. Computer only. |

## Categories

Three independent category editors, each with six numbered text inputs.

| Editor | Default categories |
|---|---|
| SCRATCHPAD CATEGORIES | CLIENT, SCHOOL, CREATE, DREAM, TEMP, CUSTOM |
| LISTS CATEGORIES | ASAP, TODO, WORK, HOME, SHOP, TEMP |
| LOCKED LISTS CATEGORIES | NAMES, PLACES, LEGAL, LOGINS, CRATE, CUSTOM |

Category names auto-uppercase and have a maximum length of ten characters. Unlike the phone, no biometric prompt is required to edit Locked Lists categories on the computer.

## Save Folder

| Element | Type | Default | Description |
|---|---|---|---|
| TAG SAVE FOLDER | Path display plus CHANGE button | `Documents\JotBunker Tags` | The root folder for all tagged content. CHANGE opens a folder picker. |

Each tag creates a subfolder beneath this root: `{tagRootPath}\{tagName}\`. See [Tags & Filing](computer-tags.md).

## Data Backup

Three buttons for backup and restore. See [Backup & Restore](computer-backup.md) for encryption details.

| Element | Description |
|---|---|
| SECURE BACKUP | Prompts for a password and encrypts the backup with AES-GCM |
| BACKUP | Exports all data as plain JSON, no password required |
| RESTORE | Opens a file picker. Encrypted files prompt for a password. Plaintext files show a confirmation dialog. |

A restore replaces your current lists, locked lists, scratchpad, and tags with the backup contents. The next sync runs as a fresh merge.

## Debug Logging

| Element | Type | Default | Description |
|---|---|---|---|
| DEBUG LOGGING | Toggle (OFF/ON) | OFF | When on, writes a log file for each sync session to `%APPDATA%\JotBunker\debug-logs\`. |

See [Debug Logging](debug-logging.md).

## Sync conflict resolution

Sync runs an automatic merge on every SYNC NOW. Both sides' edits survive without you picking a winner. Two rare dialogs can interrupt the sync:

**Sync conflict.** Opens when both devices changed the same value at the exact same moment. The app shows a small dialog with the phone's value and the computer's value side by side; pick a side per row. Sixty-second auto-cancel. Cancelling leaves both devices unchanged.

**Large change detected.** Opens when eighty percent or more of the items the computer remembered from the last sync are missing on one side with no deletion records. Almost always this means one device was reinstalled or wiped. Three buttons: USE COMPUTER DATA, USE PHONE DATA, CANCEL SYNC. The picked side's data is sent to the other device. Sixty-second auto-cancel.

For diagnosing sync issues, turn on DEBUG LOGGING. Every connection writes a `sync-{timestamp}.log` file under `%APPDATA%\JotBunker\debug-logs\` capturing the full sync conversation. See [Debug Logging](debug-logging.md).

See also: [Computer App](computer-app-overview.md) | [Phone Settings](phone-settings.md) | [Theming](theming.md) | [Backup & Restore](computer-backup.md)
