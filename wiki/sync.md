# Connecting and Sync

Phone connects to computer over your local Wi-Fi. Encrypted, peer-to-peer, no internet required.

## The sync concept

Sync is on demand and entirely user-driven. The phone connects to the computer, then nothing happens until you click SYNC NOW on the computer. Each sync is a complete state exchange resolved by an automatic three-way merge. Both sides' edits survive without you picking a winner. The computer compares its own state, the phone's state, and a saved snapshot of the last successful sync, then produces a result that includes everyone's adds, edits, deletions, and reorders.

Been out adding things to your phone? Been at your computer crossing things off? Sync. The result has both. No dialog, no choice, no lost edits.

Two safety dialogs can interrupt a sync, both rare:

- **Sync conflict.** Opens when both devices changed the same value at the exact same moment. You pick which version to keep, one row per conflict. In normal use you will not see it.
- **Large change detected.** Opens when eighty percent or more of the items the computer remembered from the last sync are missing on one side with no deletion records. Almost always this means one side was reinstalled or wiped. Three buttons: USE COMPUTER DATA, USE PHONE DATA, CANCEL SYNC. The picked side's data is sent to the other device.

Both dialogs auto-cancel after sixty seconds with no changes on either device.

## Connection flow

1. You tap Sync on the phone. The phone never connects on its own.
2. The phone opens a WebSocket to the computer's IP and port (set during [pairing](pairing.md)).
3. Both sides exchange ephemeral keys and derive a shared secret. Every later message is encrypted.
4. The phone sends a handshake with its device name, pairing secret, and last sync timestamp.
5. The computer validates the pairing secret and accepts the connection. Both sides are now connected, but **no state exchange happens** until you click SYNC NOW.

## State sync

When you click SYNC NOW on the computer:

1. The computer asks the phone for its current state.
2. The phone sends its lists, locked lists, scratchpad, and categories.
3. The computer reads its own state and the saved ancestor snapshot from the last successful sync.
4. The computer runs a three-way merge.
5. The merged result is applied on the computer.
6. The computer sends the merged snapshot to the phone, which applies it directly.
7. Both sides save a fresh ancestor snapshot for next time.

If the merge produces a true tie (same value changed on both sides at the exact same instant), the sync conflict dialog appears. If you cancel or wait sixty seconds, the sync aborts with no changes on either device.

If both sides are identical, the sync runs silently and just updates the timestamp.

## What the merge does in plain language

| Situation | Result |
|---|---|
| Phone added a new item, computer did not touch it | Item appears on the computer |
| Computer added a new item, phone did not touch it | Item appears on the phone |
| Both sides added different new items | Both new items survive |
| Phone edited item A's text, computer toggled item A's checkbox | Both changes apply to the same item |
| Both sides edited the same field of the same item | Most recent change wins; if exactly tied, the sync conflict dialog opens |
| Phone deleted an item, computer did not touch it | Item is gone on both sides |
| Phone deleted an item, computer edited the same item | Delete wins |
| Both sides reordered the same list | Both reorderings combine into one stable order |
| Both sides added an item at the same position | Both items survive; order is consistent across devices |

## Button states during transfers and saves

To prevent overlapping operations from stepping on each other, the computer briefly disables certain buttons while a transfer or save is in progress:

- **While phone-to-computer media is still arriving** (after expanding a jot or starting a download): Sync Now, Download All, the big save button on every jot, and the per-row save buttons for items whose data has not arrived yet are all disabled.
- **While the computer is writing a jot to disk** (Download All in progress, or a per-jot save with media): Sync Now, Download All, and every jot's big save button are disabled.

Buttons re-enable the moment the operation finishes. The system messages panel shows what is happening in plain text.

## What syncs

| Data | Direction | Method |
|---|---|---|
| Lists (items and categories) | Both ways | Three-way merge |
| Locked Lists | Both ways | Three-way merge |
| Scratchpads (text and categories) | Both ways | Three-way merge (most recent change wins on text bodies) |
| Jot media (images, files, audio, drawings) | Phone to computer | Manifest plus binary download |
| Settings | Not synced | Local to each device |

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Security](security.md) | [Debug Logging](debug-logging.md)
