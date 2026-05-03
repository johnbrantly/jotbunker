# Computer Settings

Settings modal accessed via the gear icon in the top chrome. Changes are not applied until you click **SAVE**. **CANCEL** discards all changes. Title: "SETTINGS".

---

## Network Sync

Controls the WebSocket server that your phone connects to.

### Adapter and port

| Element | Type | Default | Description |
|---|---|---|---|
| ADAPTER PHONE CONNECTS THROUGH | Dropdown | First available | Lists network interfaces by name and IP (e.g., "Wi-Fi — 192.168.1.100"). Shows "— select adapter —" when none selected. If a previously selected adapter is no longer available, an orange warning appears |
| PORT THIS COMPUTER LISTENS ON | Number input | 8080 | Range: 1–65535. The WebSocket port the phone connects to |

### QR pairing code

Only visible when an adapter is selected.

| Element | Type | Description |
|---|---|---|
| QR code | Display (140×140px) | Encodes `{ip}:{port}:{secret}` for the phone to scan |
| IP:Port | Display (monospace) | Shows `{ip}:{port}` below the QR code |
| SHOW SECRET / HIDE SECRET | Toggle button | Reveals or hides the full pairing secret UUID |

---

## Accent Color

Live color preview circle (24×24px) in the section header updates as you adjust.

| Element | Type | Default | Description |
|---|---|---|---|
| Hue | Range slider (rainbow gradient) | 205 | Range: 0–360°. Selects the base accent color |
| Grayscale | Range slider (color-to-gray gradient) | 75 | Range: 0–100. 0 = full color, 100 = monochrome. Gradient updates based on selected hue |
| RESTORE DEFAULT | Button | — | Resets hue to 205 and grayscale to 75 (desaturated steel blue). Shows a preview circle of the default color |

See [Theming](theming.md) for how `buildTheme(hue, grayscale)` generates the full palette.

---

## Font Size

Pill toggles (S / M / L) for each text area.

| Element | Options | Default | Description |
|---|---|---|---|
| SCRATCHPAD | S (13px) · M (16px) · L (20px) | M | Font size for scratchpad text editor |
| LISTS | S (12px) · M (15px) · L (19px) | M | Font size for list items (applies to both Lists and Locked Lists) |
| TAGS | S (9px) · M (10px) · L (12px) | M | Font size for tag labels in the side panel. Computer-only — phone does not have this setting |

---

## Categories

Three independent category editors. Each shows 6 numbered text inputs.

| Editor | Default categories |
|---|---|
| SCRATCHPAD CATEGORIES | CLIENT, SCHOOL, CREATE, DREAM, TEMP, CUSTOM |
| LISTS CATEGORIES | ASAP, TODO, WORK, HOME, SHOP, TEMP |
| LOCKED LISTS CATEGORIES | NAMES, PLACES, LEGAL, LOGINS, CRATE, CUSTOM |

**Input constraints:**
- Auto-uppercase
- Max length: 10 characters

Unlike the phone, no biometric authentication is required to edit Locked Lists categories on the computer.

---

## Save Folder

| Element | Type | Default | Description |
|---|---|---|---|
| TAG SAVE FOLDER | Path display + CHANGE button | `Documents\JotBunker Tags` | Shows the current tag root path (right-to-left text direction with ellipsis for long paths). CHANGE opens a folder picker dialog |

This is the root directory where all [tagged content](computer-tags.md) is filed. Each tag creates a subfolder: `{tagRootPath}\{tagName}\`.

---

## Data Backup

Three action buttons for backup and restore. See [Backup & Restore](computer-backup.md) for details on encryption and file format.

| Element | Type | Description |
|---|---|---|
| SECURE BACKUP | Button | Opens a password dialog (create mode with confirmation field). Encrypts all data with AES-GCM (PBKDF2 key derivation, 100k iterations). Saves to a file with salt, IV, and ciphertext |
| BACKUP | Button | Exports all data as a plaintext JSON file. No password required |
| RESTORE | Button | Opens a file picker. Detects encrypted vs plaintext. Encrypted files prompt for password (unlock mode). Plaintext files show a confirmation dialog |

**What's backed up:** scratchpad contents/categories, lists items/categories, locked lists items/categories, tags, export timestamp.

**Restore confirmation:** "This will replace ALL your current Scratchpad, Lists, Locked Lists, and Tags data with the backup. This cannot be undone."

**After restore:** `lastSyncTimestamp` is reset so the next sync performs a full merge.

---

## Debug Logging

| Element | Type | Default | Description |
|---|---|---|---|
| DEBUG LOGGING | Toggle (OFF/ON) | OFF | Enables sync protocol logging. Writes to `%APPDATA%\JotBunker\debug-logs\` |

See [Debug Logging](debug-logging.md) for details on log format and file locations.

---

## Sync History

| Element | Type | Description |
|---|---|---|
| VIEW SYNC HISTORY | Button | Opens the sync log modal showing the last 10 sync reports |

The SYNC PREVIEW dialog runs on every sync (no toggle). It shows DESKTOP WINS, PHONE WINS, and CANCEL with a 60-second auto-cancel timer. If the timer expires the sync is cancelled, no data changes on either device, and `lastSyncTimestamp` is not updated. The connection remains live; only the sync exchange is aborted.

See [Sync Preview & History](computer-settings-sync-history.md) for the dialog details and the sync history viewer.

---

See also: [Computer App](computer-app-overview.md) | [Phone Settings](phone-settings.md) | [Theming](theming.md) | [Backup & Restore](computer-backup.md)
