# Connecting & Sync

Phone connects to computer over local Wi-Fi. Encrypted, peer-to-peer, no internet required.

---

## The sync concept

Jotbunker sync is on-demand: the phone connects to the computer, both sides exchange their full state, conflicts are resolved via Last-Write-Wins, and then they're done. There is no real-time streaming of changes — each sync is a complete state exchange triggered by user action.

In the UI: DISCONNECTED → CONNECTING → CONNECTED. In the sync engine: `idle → connecting → key_exchange → handshake → syncing → docked → disconnected`. The engine phases are internal — the user sees connection status.

## Connection flow

1. Phone opens a WebSocket to the computer's IP and port (configured during [pairing](pairing.md))
2. Phone sends a `key_init` message with a temporary X25519 public key
3. Computer responds with `key_exchange` containing its public key
4. Both derive a shared secret — all subsequent messages are NaCl secretbox-encrypted
5. Phone sends `handshake` with device name, pairing secret, last sync timestamp, and an `autoSync` flag
6. Computer validates the pairing secret and accepts the connection
7. If `autoSync` is true, sync begins immediately after connection

## State sync

Sync is a multi-step exchange with an optional confirmation gate:

1. Computer sends its full state (lists, locked lists, scratchpad, categories with timestamps)
2. Phone saves the computer state locally, then sends its own **pre-merge** state back
3. Computer computes a merge preview and generates a human-readable sync report (adds, deletes, modifications, reorders, check-toggles with actual item text)
4. **If sync confirmation is enabled on the computer:** a [confirmation dialog](computer-settings-sync-history.md) appears with a 60-second timeout. Options depend on divergence size — see [Sync Confirmation & History](computer-settings-sync-history.md) for details.
5. Computer sends `sync_confirm` (with `mode`: `merge`, `desktop-wins`, or `phone-wins`) or `sync_cancel`
6. Phone merges based on the chosen mode — LWW merge, full phone replace, or full computer replace
7. Both sides update `lastSyncTimestamp`

If sync confirmation is disabled, the computer sends `sync_confirm` with mode `merge` automatically (no dialog).

The computer also has a **SYNC NOW** button that re-triggers a full state exchange at any time while connected.

## Merge algorithm

Conflicts are resolved per-slot using Last-Write-Wins (LWW) by `updatedAt` timestamp. Categories use the same approach across their fixed 6 slots. Deletion detection uses `remoteSince` (the other side's last sync timestamp) with a 500ms clock-skew grace period.

## Settings

| Setting | Platform | Description |
|---|---|---|
| Auto-connect on open | Phone | Automatically connects to computer when the app is opened |
| Auto-sync on connect | Phone | Automatically starts sync when connection is established |
| Sync confirmation | Computer | Shows a confirmation dialog before applying sync (60s timeout) |
| Auto-sync on change | Computer | Debounced auto-sync when lists/lockedLists/scratchpad data changes |

## What syncs

| Data | Direction | Method |
|---|---|---|
| Lists (items + categories) | Bidirectional | Full state exchange |
| Locked Lists | Bidirectional | Full state exchange |
| Scratchpads (text + categories) | Bidirectional | Full state exchange |
| Jot media (images, files, audio, drawings) | Phone → Computer | Manifest + binary download |
| Settings | Not synced | Local to each device |

---

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Security](security.md) | [Sync Confirmation & History](computer-settings-sync-history.md)
