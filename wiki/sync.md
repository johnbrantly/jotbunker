# Connecting & Sync

Phone connects to computer over local Wi-Fi. Encrypted, peer-to-peer, no internet required.

---

## The sync concept

JotBunker sync is on-demand and entirely user-driven. The phone connects to the computer, then nothing happens until the user explicitly clicks SYNC NOW on the computer. Each sync is a complete state exchange resolved by user choice: the user picks which side wins, and the losing side is replaced wholesale. There is no automatic merge, no real-time streaming of changes, no background reconciliation.  

Been out in the world and coming back for a data dump?  Sync upon return and choose phone wins.  Been working on your computer and about to hit the road?  Sync before you leave, choose computer wins.

## Connection flow

1. User taps Sync on the phone (the phone never auto-connects on launch or foreground)
2. Phone opens a WebSocket to the computer's IP and port (configured during [pairing](pairing.md))
3. Phone sends a `key_init` message with a temporary X25519 public key
4. Computer responds with `key_exchange` containing its public key
5. Both derive a shared secret; all subsequent messages are NaCl secretbox-encrypted
6. Phone sends `handshake` with device name, pairing secret, and last sync timestamp
7. Computer validates the pairing secret and accepts the connection. Both sides are now connected. **No state exchange happens** until the user requests one.

## State sync

State sync only runs when the user clicks SYNC NOW on the computer. Steps:

1. Computer sends its full state (lists, locked lists, scratchpad, categories with timestamps)
2. Phone saves the computer state locally, then sends its own state back
3. Computer compares both sides and generates a human-readable sync report (adds, deletes, modifications, reorders, check-toggles with actual item text)
4. SYNC PREVIEW dialog appears on the computer with a 60-second auto-cancel timer. The user picks one of three buttons:
   - **DESKTOP WINS**: phone replaces its lists / locked lists / scratchpad wholesale with the computer's state
   - **PHONE WINS**: computer replaces its lists / locked lists / scratchpad wholesale with the phone's state
   - **CANCEL**: no changes on either side; sync is aborted
5. Computer sends `sync_confirm` (with `mode: desktop-wins | phone-wins`) or `sync_cancel` over the encrypted channel
6. Both sides apply the chosen side's state and update `lastSyncTimestamp`

If the diff is empty (both sides identical), the dialog is skipped entirely and the sync completes silently with a timestamp update.

If the user lets the 60-second timer expire, the sync is cancelled. No data changes on either device. The `lastSyncTimestamp` is not updated, so the next SYNC NOW will show the same divergence again.

## Button states during transfers and saves

To prevent overlapping operations from stepping on each other, the computer temporarily dims and disables certain buttons while a transfer or save is in progress:

- **While phone → computer media is still arriving** (after expanding a jot or starting a download): Sync Now, Download All, the big ↓ save button on every jot, and the per-row save buttons for any item whose data hasn't arrived yet are all disabled.
- **While the computer is writing a jot to disk** (Download All in progress, or a per-jot save including media): Sync Now, Download All, and every jot's big ↓ save button are disabled. Per-row save buttons for items whose data is already loaded remain disabled during this window as well.

Buttons re-enable automatically the moment the operation finishes. The sidebar system messages log shows what's happening in plain text.

## Resolution model

For Lists, Locked Lists, and Scratchpad, the resolution is wholesale replacement of the losing side. There is no per-item, per-slot, or timestamp-based merge. The user is responsible for picking the side they want to keep, and that side replaces the other across all six category slots, all items, and all category labels.

Jots sync separately and are unaffected by this flow; jot media is phone → computer only and travels via `jot_manifest`, `jot_meta_request/response`, `jot_refresh_request/response`, and `jot_download_request/response` (see [Sync Protocol](sync-protocol.md)).

## What syncs

| Data | Direction | Method |
|---|---|---|
| Lists (items + categories) | Bidirectional | User-choice replacement (DESKTOP WINS / PHONE WINS) |
| Locked Lists | Bidirectional | User-choice replacement (DESKTOP WINS / PHONE WINS) |
| Scratchpads (text + categories) | Bidirectional | User-choice replacement (DESKTOP WINS / PHONE WINS) |
| Jot media (images, files, audio, drawings) | Phone → Computer | Manifest + binary download |
| Settings | Not synced | Local to each device |

---

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Security](security.md) | [Sync Preview & History](computer-settings-sync-history.md)
