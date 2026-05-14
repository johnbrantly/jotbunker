# Sync Protocol

How the phone and computer talk to each other over your local network. Useful if you are evaluating the project, writing a similar app, or contributing.

## Transport

The computer runs a WebSocket server on a configurable port (default 8080). The phone is the client. Both sides exchange JSON messages.

The first two messages exchange ephemeral X25519 public keys. Both sides derive a shared secret from the key pair. Every message after that is encrypted with NaCl secretbox using fresh nonces. The shared key only exists for the lifetime of the connection.

```
Phone                              Computer
  |                                  |
  |--- key_init (publicKey) -------->|   plaintext
  |<-- key_exchange (publicKey) -----|   plaintext
  |                                  |
  |   both sides derive a shared secret
  |   all later messages are encrypted
  |                                  |
  |--- handshake (id, secret, ts) -->|   encrypted
  |                                  |
```

## Message types

| Type | Direction | Purpose |
|---|---|---|
| `key_init` | Phone to Computer | Phone's ephemeral public key |
| `key_exchange` | Computer to Phone | Computer's ephemeral public key |
| `handshake` | Phone to Computer | Device id, pairing secret, last sync timestamp |
| `state_sync` | Both | Full state for lists, locked lists, scratchpad, and categories. Items include deletion markers so the receiver can resolve "I deleted this" cleanly. |
| `sync_confirm` | Computer to Phone | Confirms the sync and carries the merged snapshot the phone applies |
| `sync_cancel` | Computer to Phone | Cancels a sync the user backed out of |
| `jot_manifest` | Phone to Computer | List of jot media ids so the computer knows what to fetch |
| `jot_meta_request` / `_response` | Both | Metadata for one jot |
| `jot_download_request` / `_response` | Both | Full jot content for download |
| `jot_refresh_request` / `_response` | Both | Refresh all jot metadata |
| `jot_clear_request` / `_ack` | Both | Clear jot content on the phone |
| `file_request` / `_response` | Both | Download one binary file |
| `heartbeat` | Both | Keep-alive |
| `debug_log` | Phone to Computer | Phone's sync log lines, batched and shipped while connected |

## How sync resolves changes

Lists, locked lists, and scratchpads use an automatic three-way merge. The computer reads three inputs:

1. What the computer has right now.
2. What the phone has right now (sent in the state message).
3. A saved snapshot of the last successful sync (the ancestor).

For each item, the merge compares those three views and chooses an outcome. The cases:

| Situation | Outcome |
|---|---|
| Item added on one side only | Add it to the result |
| Item present on both sides, unchanged | Keep it |
| One side edited a field, the other did not | Keep the edit |
| Both sides edited different fields of the same item | Both edits apply |
| Both sides edited the same field with different values | Most recent change wins |
| Both sides edited the same field at the exact same moment | The app asks you which to keep |
| One side deleted the item | The deletion wins |
| Item order differs between sides | Combine the orderings; positions are interpolated so future edits stay stable |

The merged result is applied on the computer and sent to the phone. Both sides save a fresh ancestor snapshot for the next sync.

## Two safety dialogs

The merge handles the everyday cases without input. Two rare cases interrupt:

**Sync conflict.** Happens when both devices edited the same value at the same instant. The app shows a small dialog asking which value to keep, one row per conflict. Pick a side per row and the sync finishes. Cancel or wait sixty seconds and the sync aborts with no changes.

**Large change detected.** Happens when one side is missing eighty percent or more of the items the computer remembered from the last sync, and those items have no deletion markers. Almost always this means one side was reinstalled or wiped. The app cannot tell on its own whether you meant to delete everything, so it stops and asks. Three buttons:

- **Use computer data.** The computer's current state is treated as the truth. The phone gets that state in full.
- **Use phone data.** The phone's current state is treated as the truth. The computer is replaced with the phone's data.
- **Cancel sync.** Nothing changes on either side.

The dialog times out after sixty seconds and cancels.

## Other notes

**Locked lists are part of the merge.** They sync exactly like regular lists.

**Jots are one-way.** Jot media (text, drawings, photos, audio, files) flows phone to computer. The merge above does not apply to jots; the phone is always the source of truth for jot content.

**Empty syncs run silently.** If nothing changed on either side, the sync completes with no visible result and just updates the last-sync time.

See also: [Sync](sync.md) | [Security](security.md) | [Debug Logging](debug-logging.md)
