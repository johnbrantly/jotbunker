# Debug Logging

When sync misbehaves and you want to share what happened with support, turn on debug logging on the computer. The app then writes a log file for each sync session. Off by default.

## How to turn it on

On the computer, open Settings, find DEBUG LOGGING, toggle it on, then click SAVE. From this point forward, every time your phone connects, the app writes a new log file. Toggle it off again to stop.

The phone has no toggle of its own. While the phone is connected to the computer, it sends its sync activity to the computer over the encrypted channel. The computer is the one that decides whether to save those events to disk.

## Where the log file lives

```
%APPDATA%\JotBunker\debug-logs\sync-{timestamp}.log
```

The filename includes the timestamp of when the connection started. Each WebSocket connection produces one file. Multiple syncs during the same connection all end up in the same file. Closing the phone or disconnecting closes the file.

## Sending a log to support

If support asks for a log of a sync that misbehaved:

1. Turn debug logging on.
2. Reproduce the issue.
3. Open `%APPDATA%\JotBunker\debug-logs\` and grab the most recent `sync-...log` file.
4. Attach it to the support email.

The log contains counts, ids, and resolution outcomes only. It never contains the text of your items, scratchpad content, or category labels.

## Performance

When the toggle is off, nothing is written and there is no overhead. When it is on, the writes are tiny (a few KB per sync) and happen on the computer only.

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [Computer App](computer-app-overview.md)
