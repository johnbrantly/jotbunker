# Sync Protocol

Wire format, message types, encryption, and three-way merge.

---

## Transport

JSON messages over WebSocket. Computer runs the server (default port 8080), phone is the client. After key exchange, all messages are NaCl secretbox-encrypted.

## Encryption lifecycle

```
Phone                              Computer
  │                                  │
  ├──── key_init (publicKey) ───────>│   Plaintext
  │<──── key_exchange (publicKey) ───┤   Plaintext
  │                                  │
  │  Both derive shared secret via nacl.box.before()
  │  All subsequent messages use nacl.secretbox()
  │                                  │
  ├──── handshake (deviceId, secret, lastSync) ──>│  Encrypted
  │                                  │
```

Each connection uses fresh ephemeral X25519 keypairs. The shared key is never stored — it exists only for the lifetime of the connection.

## Message types

| Type | Direction | Purpose |
|---|---|---|
| `key_init` | Phone → Computer | Phone's ephemeral public key |
| `key_exchange` | Computer → Phone | Computer's ephemeral public key |
| `handshake` | Phone → Computer | Device ID, pairing secret, last sync timestamp. After the handshake both sides finish connecting; no state exchange happens until the user clicks SYNC NOW |
| `state_sync` | Both | Full state dump (lists, locked lists, scratchpad, categories, item-level timestamps, stable ids). Items are sent **raw, including tombstones** — the receiver needs deletion records to merge correctly |
| `sync_confirm` | Computer → Phone | Confirms the sync. Carries the merged snapshot computed by the three-way merge; the phone applies it directly. The legacy `mode` field (`desktop-wins` / `phone-wins`) is still present for backward compatibility but the snapshot wins when both are sent |
| `sync_cancel` | Computer → Phone | Cancels the pending sync (only fires if a tie picker was opened and the user cancelled or it timed out). No data changes on either side |
| `jot_manifest` | Phone → Computer | Summary of jot media (`imageIds`, `fileIds`, `audioIds`, drawings) |
| `jot_meta_request/response` | Computer → Phone → Computer | Request metadata for a single jot |
| `jot_download_request/response` | Computer → Phone → Computer | Full binary download of jot content |
| `jot_refresh_request/response` | Computer → Phone → Computer | Refresh all jot metadata |
| `jot_clear_request/ack` | Computer → Phone → Computer | Clear jot content on phone |
| `file_request/response` | Computer → Phone → Computer | Download a single binary file |
| `heartbeat` | Both | Keep-alive |
| `debug_log` | Phone → Computer | Phone's debug log lines (written to `phone-sync.log` when DEBUG LOGGING is on) |

## Sync resolution — three-way merge

For Lists, Locked Lists, and Scratchpad, sync is resolved by an authoritative three-way merge — not by user choice. The computer reads three inputs:

1. **Local state** — what the computer has right now
2. **Phone state** — sent in `state_sync`
3. **Ancestor** — a saved snapshot of the last successful sync, persisted on each device

For each item (matched by stable UUID), the merge classifies the case across all three inputs:

| Situation | Outcome |
|---|---|
| Item only on one side, ancestor doesn't have it | Add to merged result |
| Item on both sides, identical | Keep |
| Item on both sides, one side edited a field, other side untouched | Edit wins |
| Item on both sides, both edited different fields | Both edits applied to the same row |
| Item on both sides, both edited the same field, different values | Last-write-wins by `updatedAt` |
| Item on both sides, same field, exactly equal `updatedAt` | **Tie** — surfaces in the per-tie picker dialog |
| Item tombstoned on one side (deleted), live or edited on the other | Delete wins |
| Item ordering differs | Reorder via LCS; positions interpolated as fractional floats |

The merged snapshot is applied locally and shipped to the phone in `sync_confirm.snapshot`. Both sides commit a fresh ancestor (Strategy A: independent writes per device).

**Tombstones two-cycle GC.** When a delete propagates, the deleted row stays in raw storage and in the next ancestor commit so the *following* sync can confirm both sides are aware of it. Once both sides' ancestors hold the tombstone, `gcTombstonesAgainst` physically reaps it from disk on the next sync.

**Ties.** True ties (same field, same `updatedAt` ms) surface a per-tie picker dialog — one row per tie, with the phone value and computer value as side-by-side buttons. Apply requires picking every row; 60-second auto-cancel. In normal solo-user usage, ties are exceedingly rare.

**Empty syncs.** When ancestor / phone / computer all match, the merge runs but every counter reads zero and the sync completes silently with a timestamp update.

**Locked lists.** Always included in the merge; no opt-out.

**Jots are unaffected.** Jot media (text, drawings, images, audio, files) sync separately via `jot_manifest`, `jot_meta_request/response`, `jot_refresh_request/response`, and `jot_download_request/response`. Jots are phone → computer only and are never touched by the merge flow above.

---

See also: [Sync](sync.md) | [Security](security.md) | [Debug Logging](debug-logging.md) | [Sync History](computer-settings-sync-history.md)
