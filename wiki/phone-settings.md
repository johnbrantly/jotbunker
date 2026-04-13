# Phone Settings

Full-screen modal with blur overlay. Changes are not applied until you tap **SAVE**. **CANCEL** discards all changes. The header shows the app icon and version number.

---

## Computer Sync

Controls the connection between your phone and computer.

### When not paired

| Element | Type | Description |
|---|---|---|
| NETWORK SETTINGS | Button | Opens edit mode to enter connection details manually |
| IP ADDRESS | Text input | Computer's local IP (e.g., `192.168.1.100`) |
| PORT | Text input (numeric) | WebSocket port, default `8080` |
| PAIRING SECRET | Text input | UUID from the computer's QR code |
| SCAN QR CODE | Button | Opens the camera to scan the computer's pairing QR code |
| DONE | Button | Exits edit mode |

### When paired

| Element | Type | Default | Description |
|---|---|---|---|
| Connection status | Display | — | Green dot = CONNECTED, yellow dot = CONNECTING, gray dot = DISCONNECTED |
| NETWORK SETTINGS | Button | — | Opens edit mode (shows IP, port, secret, Unpair button) |
| Auto-connect | Toggle (OFF/ON) | ON | Automatically connects to computer when app opens or returns to foreground |
| Sync on auto-connect | Toggle (OFF/ON) | ON | Automatically syncs after auto-connecting. Fades to 30% opacity when Auto-connect is OFF |
| Keep awake | Toggle (OFF/ON) | OFF | Prevents phone device auto-lock while connected to computer |



### Keep awake sub-settings

Only visible when Keep awake is ON.

| Element | Type | Default | Description |
|---|---|---|---|
| Keep awake duration | Slider | 5 minutes | Range: 1–60 minutes. Disabled when "Always" is checked |
| Always keep awake | Checkbox | OFF | Keeps screen on indefinitely while connected. Shows helper: "Keeps screen on while connected. Uses more battery." |

### Unpair

Visible in edit mode when paired. Shows a confirmation alert:

> Are you sure you want to unpair? This will:
> - Disconnect from computer sync
> - Clear your pairing credentials
>
> You'll need to scan the computer QR code again to re-pair.

---

## Screen Lock Options

Collapsed by default — shows a one-line summary (e.g., "LOCKED LISTS: ON (30s) · APP LOCK: OFF"). Tap **MODIFY** to expand.

| Element | Type | Default | Description |
|---|---|---|---|
| Require Unlock for Locked Lists | Toggle (OFF/ON) | ON | Requires biometric/passcode to access the Locked Lists tab |
| Locked Lists Unlocked For — MINUTES | Slider | varies | Range: 0–15. Only visible when lock is ON |
| Locked Lists Unlocked For — SECONDS | Slider | varies | Range: 0–59. Only visible when lock is ON. Combined with minutes to set total unlock duration before auto-relock |
| APP LOCK | Toggle (OFF/ON) | OFF | Requires biometric/passcode when app returns from background |
| DONE | Button | — | Exits edit mode |

---

## Accent Color

Live color preview circle in the section header updates as you drag.

| Element | Type | Default | Description |
|---|---|---|---|
| Hue | Slider (rainbow gradient) | 205 | Range: 0–360°. Selects the base accent color |
| Grayscale | Slider (color-to-gray gradient) | 75 | Range: 0–100. 0 = full color, 100 = monochrome |
| RESTORE DEFAULT | Button | — | Resets hue to 205 and grayscale to 75 (desaturated steel blue). Shows a preview circle of the default color |

See [Theming](theming.md) for how `buildTheme(hue, grayscale)` generates the full palette.

---

## Font Size

Pill toggles (S / M / L) for each text area.

| Element | Options | Default | Description |
|---|---|---|---|
| SCRATCHPAD | S (13px) · M (16px) · L (20px) | M | Font size for scratchpad text editor |
| LISTS | S (12px) · M (15px) · L (19px) | M | Font size for list items (applies to both Lists and Locked Lists) |

---

## Categories

Three independent category editors, each with a **MODIFY** button to expand. Each editor shows 6 numbered text inputs.

| Editor | Store | Auth required? |
|---|---|---|
| SCRATCHPAD CATEGORIES | scratchpadStore | No |
| LISTS CATEGORIES | listsStore | No |
| LOCKED LISTS CATEGORIES | lockedListsStore | Yes — biometric/passcode prompt if lock is enabled |

**Input constraints:**
- Auto-uppercase
- Max length: 10 characters
- Placeholder shows current label

---

## Debug Logging

| Element | Type | Default | Description |
|---|---|---|---|
| DEBUG LOGGING | Toggle (OFF/ON) | OFF | Enables sync protocol logging. Logs are sent to the computer over the encrypted sync channel and written to `phone-sync.log` |

See [Debug Logging](debug-logging.md) for details on log format and file locations.

---

See also: [Phone App](phone-app-overview.md) | [Computer Settings](computer-settings.md) | [Theming](theming.md)
