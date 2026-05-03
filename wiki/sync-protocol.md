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
| `state_sync` | Both | Full state dump (lists, locked lists, scratchpad, categories) |
| `sync_confirm` | Computer → Phone | Confirms sync with mode: `desktop-wins` or `phone-wins`. The user picks which side wins on every sync; the losing side is replaced wholesale |
| `sync_cancel` | Computer → Phone | Cancels the pending sync. Phone discards the pending computer state it was holding; no data changes on either side |
| `jot_manifest` | Phone → Computer | Summary of jot media (`imageIds`, `fileIds`, `audioIds`, drawings) |
| `jot_meta_request/response` | Computer → Phone → Computer | Request metadata for a single jot |
| `jot_download_request/response` | Computer → Phone → Computer | Full binary download of jot content |
| `jot_refresh_request/response` | Computer → Phone → Computer | Refresh all jot metadata |
| `jot_clear_request/ack` | Computer → Phone → Computer | Clear jot content on phone |
| `file_request/response` | Computer → Phone → Computer | Download a single binary file |
| `heartbeat` | Both | Keep-alive |
| `debug_log` | Phone → Computer | Phone's debug log lines (written to `phone-sync.log`) |

## Sync resolution

For Lists, Locked Lists, and Scratchpad, sync is resolved by user choice on every sync, not by automatic merge. Phone sends its state via `state_sync`. Computer compares both sides, computes a diff report, and shows a SYNC PREVIEW dialog with three buttons: **DESKTOP WINS**, **PHONE WINS**, **CANCEL**. The user picks which side keeps its data; the losing side is replaced wholesale (lists items, locked-lists items, scratchpad contents, and all category labels). The dialog has a 60-second auto-cancel timeout.

**Confirmation modes:**

| Mode | Behavior |
|---|---|
| `desktop-wins` | Computer state replaces phone state for Lists, Locked Lists, and Scratchpad |
| `phone-wins` | Phone state replaces computer state for Lists, Locked Lists, and Scratchpad |

**Empty syncs:** When the diff is empty (no changes on either side), the dialog is skipped and the sync completes silently with a timestamp update.

**Locked lists:** Always included in the sync; no opt-out.

**Jots are unaffected.** Jot media (text, drawings, images, audio, files) sync separately via `jot_manifest`, `jot_meta_request/response`, `jot_refresh_request/response`, and `jot_download_request/response`. Jots are phone → computer only and are never touched by the user-choice resolution flow above.

---

See also: [Sync](sync.md) | [Security](security.md) | [Debug Logging](debug-logging.md) | [Sync Preview & History](computer-settings-sync-history.md)
