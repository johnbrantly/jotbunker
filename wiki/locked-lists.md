# Locked Lists

Biometric-protected reference lists for sensitive information. Same functionality as [Lists](lists.md), but gated behind biometric authentication or a device passcode on the phone.

## How it works

The Locked Lists tab works exactly like Lists: six categories, drag-to-reorder items, checkboxes, inline editing. Default categories: NAMES, PLACES, LEGAL, LOGINS, CRATE, TBD. The header menu has the same options as Lists: delete all items in the active category, and on the computer, save to a tag. The same computer-only shortcuts apply (right-click a category pill to rename, drag items onto a category pill to move them).

The difference is the biometric gate on the phone. When you open the Locked Lists tab, the app prompts for authentication using Face ID or Touch ID on iOS, or fingerprint, face unlock, PIN, or pattern on Android. If authentication fails, the tab stays locked. When you navigate away, the tab auto-locks after a configurable timeout.

## What "locked" means

On mobile, the lock is a biometric check that verifies you are the device owner before showing the data. The data itself is stored on the device the same way regular lists are. There is no separate encryption key for locked list content. The biometric gate is a UI barrier, not a cryptographic one.

On the computer, locked lists are not gated. The assumption is your computer is already a secured environment.

Sync traffic is always encrypted; locked list content travels the same NaCl-encrypted channel as everything else. See [Security](security.md).

## Auto-lock timeout

You can configure how quickly the tab re-locks after you navigate away. Options range from immediate to several minutes. Set this in the Screen Lock section of phone settings.

## Sync behavior

Locked lists sync both directions using the same automatic merge as regular lists. Both sides' edits survive without picking a winner. The biometric gate is local to the phone; syncing does not require re-authentication. When the computer receives locked list data from the phone, it merges and displays it directly.

See also: [Lists](lists.md) | [Security](security.md) | [Data Storage](data-storage.md)
