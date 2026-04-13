# Sync Protocol

Wire format, message types, encryption, and state merge.

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
  ├──── handshake (deviceId, secret, lastSync, autoSync?) ──>│  Encrypted
  │                                  │
```

Each connection uses fresh ephemeral X25519 keypairs. The shared key is never stored — it exists only for the lifetime of the connection.

## Message types

| Type | Direction | Purpose |
|---|---|---|
| `key_init` | Phone → Computer | Phone's ephemeral public key |
| `key_exchange` | Computer → Phone | Computer's ephemeral public key |
| `handshake` | Phone → Computer | Device ID, pairing secret, last sync timestamp, optional `autoSync` flag |
| `state_sync` | Both | Full state dump (lists, locked lists, scratchpad, categories) |
| `sync_confirm` | Computer → Phone | Confirms sync with mode: `merge`, `desktop-wins`, or `phone-wins`. In `merge` mode, includes the computed `mergedState` payload |
| `sync_cancel` | Computer → Phone | Cancels the pending sync. Phone discards the pending computer state it was holding; no data changes on either side |
| `jot_manifest` | Phone → Computer | Summary of jot media (`imageIds`, `fileIds`, `audioIds`, drawings) |
| `jot_meta_request/response` | Computer → Phone → Computer | Request metadata for a single jot |
| `jot_download_request/response` | Computer → Phone → Computer | Full binary download of jot content |
| `jot_refresh_request/response` | Computer → Phone → Computer | Refresh all jot metadata |
| `jot_clear_request/ack` | Computer → Phone → Computer | Clear jot content on phone |
| `file_request/response` | Computer → Phone → Computer | Download a single binary file |
| `heartbeat` | Both | Keep-alive |
| `debug_log` | Phone → Computer | Phone's debug log lines (written to `phone-sync.log`) |

## State merge algorithm

Phone sends its PRE-MERGE state via `state_sync`. Computer receives it, computes a merge preview, and optionally shows a confirmation dialog to the user. Computer then sends either `sync_confirm` (with a mode) or `sync_cancel`. Phone performs the actual merge only after receiving `sync_confirm`.

**Confirmation modes:**

| Mode | Behavior |
|---|---|
| `merge` | Standard LWW merge (default) |
| `desktop-wins` | Computer state overwrites phone state on conflicts |
| `phone-wins` | Phone state overwrites computer state on conflicts |

**Items:** Merge by ID. If both sides have the same item, highest `updatedAt` wins (LWW). New items from either side are added. Missing items are checked against `remoteSince` — if the remote has been alive since time X and a local item has `updatedAt < X`, it was deleted remotely.

**Categories:** Same LWW by `updatedAt`. Default categories with `updatedAt = 0` that don't exist on the remote are treated as "dropped defaults" (the remote replaced them with custom categories).

**Scratchpad:** Per-category LWW by timestamp. If local has no content and remote does, remote wins.

**Locked lists:** Always included in the sync — no opt-out.

**Clock skew protection:** A 500ms grace window prevents items from being incorrectly deleted when device clocks are slightly out of sync.

---

See also: [Sync](sync.md) | [Security](security.md) | [Debug Logging](debug-logging.md) | [Sync Confirmation & History](computer-settings-sync-history.md)
