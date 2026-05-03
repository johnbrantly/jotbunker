# Debug Logging

Toggle in settings. Writes sync protocol logs to disk — computer and phone logs side by side.

---

## How to enable

On either device, go to Settings and toggle **Debug Logging** on. On the computer, this starts writing logs immediately. On the phone, the setting takes effect on the next sync connection.

## Where logs go

Computer writes to `%APPDATA%\JotBunker\debug-logs\`:

- **`desktop-sync.log`** — events from the computer's perspective (connection, state exchange, phase transitions)
- **`phone-sync.log`** — events from the phone's perspective (sent to computer over the encrypted sync channel)

Both files are overwritten each session (prefixed with `=== Session {timestamp} ===`).

## Log format

```
[SYNC HH:MM:SS.mmm][TAG] message
```

Tags indicate the subsystem:
- `CONN` — connection events (phone connected/disconnected, key exchange, handshake)
- `ENGINE` — phase transitions (idle → connecting → key_exchange → handshake → syncing → docked). The `syncing` phase is only entered by the computer briefly between key exchange and handshake; the phone goes directly from `handshake` to `docked`
- `STATE` — state sync messages (what each side sent, which side the user picked, cancel/timeout)
- `CLEAR` — jot clear acks
- `FILE` — single-file responses
- `META` — single-jot metadata responses
- `MANIFEST` — jot manifest (media ID summary)

## Reading the logs

Enable debug logging on both devices, run a sync, and compare the two log files side by side to trace the full protocol flow.

## Sync report and history

Sync reports and sync history (viewable via SyncReportDialog and SyncLogDialog on the computer) are separate from debug logs. Debug logs capture low-level protocol detail; sync reports summarize what changed in each sync session.

## Performance

Debug logging adds minimal overhead — it's string formatting and file writes. Leave it off in normal use; turn it on when diagnosing sync issues.

---

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [Computer App](computer-app-overview.md)
