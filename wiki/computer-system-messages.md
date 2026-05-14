# System Messages

A resizable log panel at the bottom of the left side panel. It shows a rolling feed of recent app events: saves, downloads, backups, errors.

## Panel layout

- A resize handle along the top edge. Default height 200px, minimum 92px, maximum a third of the side panel.
- A "SYSTEM MESSAGES" header.
- A scrolling list of messages, newest at the top. Each line has a timestamp and the message text.
- A CLEAR button at the bottom (visible when there are messages). It clears the on-screen display only.

## Message format

```
HH:MM:SS  message text
```

Timestamps are 24-hour.

## Rolling limit

The panel holds at most fifty messages. When a new one arrives and the limit is hit, the oldest message drops.

## Persistence

Every message is also written to disk at `%APPDATA%\JotBunker\system-messages.log`. The log file uses the same fifty-entry rolling limit. CLEAR only affects the on-screen display; the file is not deleted.

## What gets logged

The panel is for app events other than sync. Typical entries:

- App started.
- Jot downloads (per jot and batch).
- Individual file saves (image, audio, file, drawing).
- Save to tag (lists and scratchpad).
- Jot data fetching.
- Jot clear actions.
- Backup and restore results.

Sync events do not appear here. When DEBUG LOGGING is on, every sync gets its own log file under `%APPDATA%\JotBunker\debug-logs\`. When the toggle is off, sync events are not saved anywhere. See [Debug Logging](debug-logging.md).

See also: [Computer App](computer-app-overview.md) | [Debug Logging](debug-logging.md) | [Data Storage](data-storage.md)
