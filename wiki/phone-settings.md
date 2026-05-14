# Phone Settings

A full-screen modal with a blur background. Changes do not apply until you tap **SAVE**. **CANCEL** discards them. The header shows the app icon and version number.

## Computer Sync

Controls the connection between your phone and computer.

### When not paired

| Element | Type | Description |
|---|---|---|
| NETWORK SETTINGS | Button | Opens edit mode to enter connection details manually |
| IP ADDRESS | Text input | The computer's local IP (for example `192.168.1.100`) |
| PORT | Text input (numeric) | WebSocket port, default `8080` |
| PAIRING SECRET | Text input | The UUID from the computer's QR code |
| SCAN QR CODE | Button | Opens the camera to scan the computer's pairing QR code |
| DONE | Button | Exits edit mode |

### When paired

| Element | Type | Default | Description |
|---|---|---|---|
| Connection status | Display | (none) | Green dot = CONNECTED, yellow dot = CONNECTING, gray dot = DISCONNECTED |
| NETWORK SETTINGS | Button | (none) | Opens edit mode (shows IP, port, secret, Unpair button) |
| Keep awake | Toggle (OFF/ON) | OFF | Prevents the phone's auto-lock while connected to the computer |

### Keep awake sub-settings

Visible only when Keep awake is ON.

| Element | Type | Default | Description |
|---|---|---|---|
| Keep awake duration | Slider | 5 minutes | Range 1 to 60 minutes. Disabled when "Always" is checked. |
| Always keep awake | Checkbox | OFF | Keeps the screen on indefinitely while connected. Uses more battery. |

### Unpair

Visible in edit mode when paired. Shows a confirmation alert:

> Are you sure you want to unpair? This will:
> - Disconnect from computer sync
> - Clear your pairing credentials
>
> You will need to scan the computer QR code again to re-pair.

## Screen Lock Options

Collapsed by default; shows a one-line summary (for example "LOCKED LISTS: ON (30s) APP LOCK: OFF"). Tap **MODIFY** to expand.

| Element | Type | Default | Description |
|---|---|---|---|
| Require Unlock for Locked Lists | Toggle (OFF/ON) | ON | Requires biometric or passcode to access the Locked Lists tab |
| Locked Lists Unlocked For: MINUTES | Slider | varies | Range 0 to 15. Visible only when lock is ON. |
| Locked Lists Unlocked For: SECONDS | Slider | varies | Range 0 to 59. Visible only when lock is ON. Combined with minutes to set the total unlock duration. |
| APP LOCK | Toggle (OFF/ON) | OFF | Requires biometric or passcode when the app returns from background |
| DONE | Button | (none) | Exits edit mode |

## Accent Color

A live preview circle in the section header updates as you drag the sliders.

| Element | Type | Default | Description |
|---|---|---|---|
| Hue | Slider | 205 | Range 0 to 360 degrees. The base accent color. |
| Grayscale | Slider | 75 | Range 0 to 100. 0 is full color, 100 is monochrome. |
| RESTORE DEFAULT | Button | (none) | Resets to desaturated steel blue (hue 205, grayscale 75) |

See [Theming](theming.md) for how the palette is built.

## Font Size

Three-size pill toggles for each text area.

| Element | Options | Default | Description |
|---|---|---|---|
| SCRATCHPAD | S / M / L | M | Font size in the scratchpad editor |
| LISTS | S / M / L | M | Font size in lists (applies to both Lists and Locked Lists) |

## Categories

Three independent category editors, each with a **MODIFY** button. Each editor has six numbered text inputs.

| Editor | Auth required? |
|---|---|
| SCRATCHPAD CATEGORIES | No |
| LISTS CATEGORIES | No |
| LOCKED LISTS CATEGORIES | Yes. Biometric or passcode prompt if Locked Lists lock is enabled. |

Category names auto-uppercase and have a maximum length of ten characters.

## Sync debug logging

The phone has no debug-logging toggle. While connected, the phone always sends its sync events to the computer over the encrypted channel. The computer decides whether to persist them based on its own DEBUG LOGGING setting. See [Debug Logging](debug-logging.md).

See also: [Phone App](phone-app-overview.md) | [Computer Settings](computer-settings.md) | [Theming](theming.md)
