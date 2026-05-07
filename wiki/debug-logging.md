# Debug Logging

Toggle in settings. Writes **transport-level** sync protocol logs to disk — computer and phone logs side by side. Distinct from the always-on merge log line that lives in [System Messages](computer-system-messages.md).

---

## Two complementary log streams

JotBunker has two parallel log channels with different jobs:

| Channel | When on | Captures | Use for |
|---|---|---|---|
| `system-messages.log` (always on) | Always | Non-sync app events: jot saves, downloads, backups, errors | "What did the app do recently?" |
| `desktop-sync.log` (always-on sync events + toggle-gated transport) | Always logs sync events; transport-level events only when DEBUG LOGGING is on | Always: `[merge] applied ...`, `[ancestor] INFO ...`, `[tombstone]`, `[gc]`. When DEBUG LOGGING ON: also `[CONN]`, `[STATE]`, `[FILE]`, `[META]`, `[MANIFEST]`, `[ENGINE]`, `[PROTO]`, `[DOWNLOAD]` | "Did sync merge correctly?" + (with toggle on) "Why isn't the handshake/file transfer working?" |
| `phone-sync.log` (toggle-gated) | OFF by default | Phone-side transport events received over wire | Phone-perspective transport-layer triage |

The split exists because sync correctness signals are valuable always (privacy-safe counts and hashes only), while transport noise should be on-demand to keep the file readable when you're debugging.

## How to enable

On either device, go to Settings and toggle **Debug Logging** on. On the computer, this starts writing logs immediately. On the phone, the setting takes effect on the next sync connection.

## Where logs go

Computer writes to `%APPDATA%\JotBunker\debug-logs\`:

- **`desktop-sync.log`** — events from the computer's perspective (connection, state exchange, phase transitions)
- **`phone-sync.log`** — events from the phone's perspective (sent to computer over the encrypted sync channel)

Both files are appended to each session (prefixed with `=== Session {timestamp} ===`).

## Log format

```
[SYNC HH:MM:SS.mmm][TAG] message
```

Tags indicate the subsystem:
- `CONN` — connection events (phone connected/disconnected, key exchange, handshake)
- `ENGINE` — phase transitions (idle → connecting → key_exchange → handshake → syncing → docked). The `syncing` phase is only entered by the computer briefly between key exchange and handshake; the phone goes directly from `handshake` to `docked`
- `STATE` — state sync envelope events (what each side sent, tie-resolution outcome, cancel/timeout)
- `CLEAR` — jot clear acks
- `FILE` — single-file responses
- `META` — single-jot metadata responses
- `MANIFEST` — jot manifest (media ID summary)
- `PROTO` — protocol validation failures
- `DOWNLOAD` — bulk download flow

## Reading the logs

Enable debug logging on both devices, run a sync, and compare the two log files side by side to trace the full protocol flow.

## Sync history

Sync history (the per-sync count summaries shown in the SyncLogDialog on the computer) is separate from both log streams. See [Sync History](computer-settings-sync-history.md).

## Performance

Debug logging adds minimal overhead — it's string formatting and file writes. Leave it off in normal use; turn it on when diagnosing sync transport issues.

---

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [System Messages](computer-system-messages.md) | [Computer App](computer-app-overview.md)
