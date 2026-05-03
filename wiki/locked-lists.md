# Locked Lists

Biometric-protected reference lists for sensitive information. Same functionality as [Lists](lists.md), but gated behind biometric authentication or device passcode/PIN/pattern on the phone.

---

## How it works

The Locked Lists tab works exactly like the Lists tab — six categories, drag-to-reorder items, checkboxes, inline editing. Default categories: NAMES, PLACES, LEGAL, LOGINS, CRATE, TBD. The header menu (⋯) has the same options as [Lists](lists.md) — delete all items in the active category, and on the computer, save to a tag. The same computer-only interactions apply: right-click a category pill to rename, drag items onto category pills to move them.

The difference is the biometric gate. When you navigate to the Locked Lists tab, the app prompts for authentication — Face ID/Touch ID on iOS, fingerprint/face unlock/PIN/pattern on Android. If authentication fails, the tab stays locked. When you navigate away, the tab auto-locks after a configurable timeout.

## What "locked" means

On mobile, the lock is a **biometric check** — it verifies you're the device owner before showing the data. The data itself is stored in AsyncStorage in plaintext, the same as regular lists. There is no separate encryption key for locked list content. The biometric gate is a UI barrier, not a cryptographic one.  

On the computer, locked lists are not gated — the assumption is your computer is already a secured environment. The data is stored as plaintext JSON in `%APPDATA%\JotBunker\stores\`.

Data on the wire is always encrypted — locked list content syncs over the same NaCl-encrypted WebSocket as everything else (see [Security](security.md)).

## Auto-lock timeout

You can configure how quickly the tab re-locks after navigating away. Options range from immediate to several minutes. This is set in the Screen Lock section of settings.

## Sync behavior

Locked lists sync bidirectionally using the same user-choice flow as regular lists. The SYNC PREVIEW dialog on the computer shows what each side has and asks the user to pick DESKTOP WINS, PHONE WINS, or CANCEL; the losing side is replaced wholesale. The biometric gate is local to the phone; syncing doesn't require re-authentication. When the computer receives locked list data from the phone, it stores and displays it directly.

---

See also: [Lists](lists.md) | [Security](security.md) | [Data Storage](data-storage.md)
