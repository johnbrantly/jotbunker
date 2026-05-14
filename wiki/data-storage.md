# Data Storage

Where your data lives on each device, what is encrypted, and what OS-level backups cover.

## Mobile (iOS and Android)

### App data

All of the phone app's data is stored as JSON in the app's private sandbox:

- **Jots.** Text, drawings, image references, file references, recording references.
- **Lists.** Items and categories.
- **Locked Lists.** Items and categories. The unlocked state is in memory only.
- **Scratchpads.** Text by category, categories.
- **Ancestor.** A snapshot of the last successful sync. Used to merge cleanly next time.
- **Settings.** Theme, sync config, pairing secret, security settings, font sizes.

App data is plain text in the app's private sandbox.

### Binary files

- **Audio recordings.** `.m4a` files written to a temporary or cache directory. The jot store holds a reference.
- **Images.** References to URIs from the photo picker. If you pick from your photo library, the original stays in Photos.
- **File attachments.** Files picked from the device. The jot store holds a reference plus file name, mime type, and size.
- **Drawings.** Stored inside the jot data, not as separate files.

### iCloud and OS backup coverage

- App data goes to the app's database, which is included in iCloud backup.
- Audio files in temp or cache directories are excluded from iCloud backup.
- Image references may point to temporary copies that break after restore.

Bottom line: an iCloud restore recovers all text data (lists, scratchpads, settings, jot text, drawings), but audio recordings and image attachments are lost.

## Computer (Windows)

All app data lives under `%APPDATA%\JotBunker\`.

### Stored data

```
stores/
  Lists, Locked Lists, Scratchpad
  Ancestor (last successful sync snapshot)
  Settings (pairing secret stored in plain text)
  Tags
  Console (system messages log)
```

These are plain JSON files.

### Other files

| File | Purpose |
|---|---|
| `window-state.json` | Window position and size |
| `autoupdate-disabled.flag` | Opt-out flag for auto-update startup check |
| `system-messages.log` | Rolling fifty-entry app log for non-sync events |
| `debug-logs/sync-{timestamp}.log` | One file per sync session. Only written when DEBUG LOGGING is on. Captures every sync event from both devices in a single file; phone-side events are prefixed `[phone]`. |

### User-facing exports

| Path | Contents |
|---|---|
| `{tagRootPath}/{tagName}/<timestamp>/JotN/...` (default `Documents/JotBunker Tags/`) | Bulk Download All output |
| `{tagRootPath}/{tagName}/{ts}-<filename>` | Per-item downloads and per-jot tag saves |

## What is encrypted vs. plain text

| Data | Mobile | Computer |
|---|---|---|
| Lists / Locked Lists | Plain text on device | Plain text on disk |
| Scratchpad | Plain text on device | Plain text on disk |
| Pairing secret | Plain text on device | Plain text on disk |
| Sync traffic | NaCl encrypted on the wire | NaCl encrypted on the wire |
| Backup files | Not applicable | AES-GCM encrypted, or plain text (your choice) |

See [Security](security.md) for the full threat model.

See also: [Security](security.md) | [Backup](computer-backup.md) | [Computer App](computer-app-overview.md) | [Phone App](phone-app-overview.md)
