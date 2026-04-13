# Data Storage

Where data lives on each platform, what's encrypted, and what OS-level backups cover.

---

## Mobile (iOS/Android)

### Store data (AsyncStorage)

All Zustand stores persist to AsyncStorage as JSON:

| Key | Contents |
|---|---|
| `jotbunker-jots` | 6 jots: text, drawing (SVG JSON), image URIs, file URIs, recording URIs |
| `jotbunker-lists` | Items, categories, active category |
| `jotbunker-lockedLists` | Items, categories, active category (isUnlocked is transient — not persisted) |
| `jotbunker-scratchpad` | Text by category, categories, active category |
| `jotbunker-settings` | Theme, sync config, pairing secret, security settings, font sizes, debug toggle |

AsyncStorage is plaintext in the app's private sandbox.

### Binary files

- **Audio recordings** — `.m4a` files written by expo-audio to a temporary/cache directory. Referenced by URI in `jotbunker-jots`.
- **Images** — URIs from expo-image-picker. If picked from the photo library, the original stays in Photos. The URI may point to a temp copy.
- **File attachments** — files picked via expo-document-picker. Referenced by URI, fileName, mimeType, and size in `jotbunker-jots`.
- **Drawings** — stored as JSON strings (SVG path data) inside the jots store. No separate files.

### iCloud / OS backup coverage

- **AsyncStorage** → stored in the app's SQLite database → **included in iCloud backup**
- **Audio files** → in temp/cache directories → **excluded from iCloud backup**
- **Image URIs** → may reference temp copies → **URIs may break after restore** (files gone, references stale)

Bottom line: an iCloud restore recovers all text data (lists, scratchpad, settings, jot text, drawings) but **audio recordings and image attachments are lost**.

---

## Computer (Windows)

All data lives in `%APPDATA%\Jotbunker\`:

### Store data

```
stores/
├── jotbunker-lists.json
├── jotbunker-lockedLists.json
├── jotbunker-scratchpad.json
├── jotbunker-settings.json       ← contains pairing secret in plaintext
├── jotbunker-tags.json
├── jotbunker-console.json
└── jotbunker-sync-history.json
```

Plaintext JSON files, read/written by the main process via IPC.

### Other files

| File | Purpose |
|---|---|
| `window-state.json` | Window position and size |
| `autoupdate-disabled.flag` | Opt-out flag for auto-update |
| `system-messages.log` | Rolling 50-entry app log |
| `debug-logs/desktop-sync.log` | Computer sync protocol log |
| `debug-logs/phone-sync.log` | Phone sync protocol log (received over wire) |

### User-facing exports

| Path | Contents |
|---|---|
| `Documents/Jotbunker Downloads/` | Downloaded jot content (timestamped folders) |
| `{tagRootPath}/{tagName}/` (defaults to `Documents/Jotbunker Tags/`) | Tagged/filed content (text, images, files, audio, drawings) |

---

## What's encrypted vs plaintext

| Data | Mobile | Computer |
|---|---|---|
| Lists / Locked Lists | Plaintext (AsyncStorage) | Plaintext (JSON file) |
| Scratchpad | Plaintext (AsyncStorage) | Plaintext (JSON file) |
| Pairing secret | Plaintext (AsyncStorage) | Plaintext (JSON file) |
| Sync traffic | NaCl secretbox (on wire only) | NaCl secretbox (on wire only) |
| Backup files | N/A | AES-GCM (encrypted) or plaintext (user choice) |

See [Security](security.md) for the full threat model.

---

See also: [Security](security.md) | [Backup](computer-backup.md) | [Computer App](computer-app-overview.md) | [Phone App](phone-app-overview.md)
