# Auto-Updates

The computer app checks for updates on launch and lets you download and install them from within the app. Updates are delivered via the generic HTTP provider at the configured update server URL, with GitHub Releases as a fallback.

---

## Update check

- On launch, the app checks for updates **3 seconds after startup** (background, no UI)
- Only one check per launch — no recurring schedule
- If auto-update is disabled (see below), the startup check is skipped entirely
- You can always check manually via **Help → Check for Updates**, even if auto-update is disabled

## Manual check

When you click **Help → Check for Updates**:

| Result | What you see |
|---|---|
| Checking | Modal: "Checking for Updates..." |
| Update found | Modal: "Update {version} Available" with DOWNLOAD and LATER buttons |
| Already current | Modal: "You're Up to Date" with current version (auto-dismisses after 4 seconds) |
| Error | Modal: "Update Error" with error details |

The startup check is silent — if you're already on the latest version, no modal appears.

## Update flow

| Stage | What happens | What you see |
|---|---|---|
| Check | App queries the update server in the background | Nothing (startup) or "Checking..." (manual) |
| Available | Update found, version sent to renderer | Modal: "Update {version} Available" with DOWNLOAD and LATER buttons |
| Download | User clicks DOWNLOAD, update downloads in background | Modal: "Downloading {version}" with progress bar showing percentage and bytes transferred |
| Downloaded | Download complete | Modal: "Update Ready" with RESTART and LATER buttons |
| Install | User clicks RESTART | App quits, installer runs, app relaunches on new version |

Both download and install are **user-initiated** — nothing happens automatically. `autoDownload` and `autoInstallOnAppQuit` are both set to `false`.

Clicking **LATER** at any stage dismisses the modal. The update stays available for next launch.

## Disabling auto-update

**Help menu → "Disable Auto-Update on Startup"** (checkbox)

When checked, a flag file is created at `%APPDATA%\JotBunker\autoupdate-disabled.flag`. The app reads this file on startup — if it exists, the 3-second update check is skipped.

- Checking the box creates the flag file (disables startup check)
- Unchecking deletes the flag file (re-enables startup check)
- **Help → Check for Updates** still works regardless — it bypasses the flag

## Error handling

If the update check or download fails (network issues, bad signature, etc.):
- Error is logged to console
- **Manual check:** error is shown in the update modal
- **Startup check:** error is logged silently (no UI)
- The app continues running normally

## Update modal

Centered overlay with blur backdrop, theme-aware styling matching other app dialogs.

| State | Title | Body | Buttons |
|---|---|---|---|
| Checking | Checking for Updates... | — | — |
| Available | Update {version} Available | A new version of JotBunker is available. | LATER / DOWNLOAD |
| Downloading | Downloading {version} | Progress bar + percentage + bytes | LATER |
| Downloaded | Update Ready | Restart JotBunker to apply the update. | LATER / RESTART |
| Up to date | You're Up to Date | JotBunker {version} is the latest version. | OK (auto-dismiss 4s) |
| Error | Update Error | Error message | OK |

## Update providers

The app checks for updates from two sources, in order:

1. **Generic HTTP** — `https://jotbunker.com/updates` (primary)
2. **GitHub Releases** — fallback if the generic server is unavailable

## IPC channels

| Channel | Direction | Purpose |
|---|---|---|
| `update:checking` | Main → Renderer | Manual check started — show spinner |
| `update:available` | Main → Renderer | Notifies renderer of available version |
| `update:download-progress` | Main → Renderer | Download progress (percent, speed, bytes) |
| `update:downloaded` | Main → Renderer | Notifies renderer download is complete |
| `update:up-to-date` | Main → Renderer | No update available (manual check only) |
| `update:error` | Main → Renderer | Error during check/download (manual check only) |
| `update:start-download` | Renderer → Main | User clicked DOWNLOAD |
| `update:install` | Renderer → Main | User clicked RESTART → calls `quitAndInstall()` |

---

See also: [Computer App](computer-app-overview.md) | [Computer Settings](computer-settings.md)
