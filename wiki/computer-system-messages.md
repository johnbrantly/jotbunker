# System Messages

The system messages panel is a resizable log area at the bottom of the left side panel. It shows a rolling feed of app events — saves, downloads, sync operations, backups, and errors.

---

## Panel layout

- **Resize handle** — drag the top edge of the panel up or down. Default height: 200px, minimum: 92px, maximum: 33% of the side panel
- **Header** — "SYSTEM MESSAGES" label
- **Message area** — scrollable list, newest messages at the top. Each line shows a timestamp and message text
- **CLEAR button** — appears at the bottom when messages exist. Clears all entries from the panel (no confirmation)

## Message format

Each message shows:

```
HH:MM:SS  message text
```

Timestamps are 24-hour format (e.g., `14:32:05`).

## Rolling limit

The panel holds a maximum of **50 messages**. When a new message is logged and the limit is reached, the oldest message is dropped.

## Persistence

Every message is also written to disk at `%APPDATA%\JotBunker\system-messages.log` via IPC. The log file maintains the same 50-entry rolling limit. The CLEAR button only clears the in-memory display — it does not delete the log file.

## What gets logged

### App lifecycle
- `JotBunker started` — on app launch

### Jot downloads
- `Downloading...` — when a jot download is initiated
- `JOT {id} → {path}` — successful jot save to tag
- `{N} JOTS → {path}` — batch download success
- `Download failed: {error}` — download error

### Individual file saves
- `Image saved to {path}` / `Image save failed: {error}`
- `Audio saved to {path}` / `Audio save failed: {error}`
- `File saved to {path}` / `File save failed: {error}`
- `Drawing saved to {path}` / `Drawing save failed: {error}`

### Save to tag (lists/scratchpad)
- `{SOURCE} → {path}` — successful save (e.g., `SCRATCHPAD → C:\...`)
- `Save failed: {error}` / `Save error: {error}`

### Jot data fetching
- `Fetching JOT {id} data...` — fetching media for save-with-media
- `Fetching JOT {id} text...` — lazy-loading text for save

### Jot clear
- `Cleared Jot {id} from phone` — after phone confirms jot deletion

### Backup and restore
- `Secure backup saved: {path}` — encrypted backup success
- `Backup saved: {path}` — plaintext backup success
- `Backup error: {error}` — backup failure
- `Backup restored successfully` — restore complete
- `Wrong password or corrupted backup` — decryption failure
- `Restore error: {error}` — restore failure

---

See also: [Computer App](computer-app-overview.md) | [Debug Logging](debug-logging.md) | [Data Storage](data-storage.md)
