# Auto-Updates

The computer app checks for updates when it launches. You can also check on demand. Both download and install are user-initiated; nothing happens on its own.

## Startup check

A few seconds after the app starts, it checks for a new version in the background. No dialog appears if you are on the latest version. If a new version is available, a dialog opens with DOWNLOAD and LATER buttons.

You can disable the startup check from the Help menu (see below).

## Manual check

From the Help menu, click **Check for Updates**. The dialog reports one of:

| Result | What you see |
|---|---|
| Checking | "Checking for Updates..." |
| Update available | "Update {version} Available" with DOWNLOAD and LATER buttons |
| Already current | "You're Up to Date" with the current version (auto-dismisses after a few seconds) |
| Error | "Update Error" with details |

## Update flow

| Stage | What happens | What you see |
|---|---|---|
| Check | The app asks the update server | Nothing on startup, "Checking..." on manual check |
| Available | A new version exists | "Update {version} Available" with DOWNLOAD and LATER |
| Download | You click DOWNLOAD | "Downloading {version}" with a progress bar |
| Downloaded | Download finished | "Update Ready" with RESTART and LATER |
| Install | You click RESTART | The app closes, the installer runs, the new version starts |

LATER dismisses the dialog at any stage. The update stays available for next launch.

## Disabling auto-update on startup

Open the Help menu and check "Disable Auto-Update on Startup". This creates a small flag file at `%APPDATA%\JotBunker\autoupdate-disabled.flag`. Uncheck it to re-enable.

The manual Check for Updates command always works, even when the startup check is disabled.

## Error handling

If the check or download fails (network problems, bad signature, etc.):

- The error is logged to the system messages.
- Manual checks show the error in the dialog.
- Startup checks fail silently.

The app keeps running normally.

## Update sources

The app looks for updates in two places in order:

1. `https://jotbunker.com/updates` (primary)
2. GitHub Releases (fallback)

See also: [Computer App](computer-app-overview.md) | [Computer Settings](computer-settings.md)
