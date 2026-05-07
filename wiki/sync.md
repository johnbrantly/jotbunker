# Connecting & Sync

Phone connects to computer over local Wi-Fi. Encrypted, peer-to-peer, no internet required.

---

## The sync concept

JotBunker sync is on-demand and entirely user-driven. The phone connects to the computer, then nothing happens until the user explicitly clicks SYNC NOW on the computer. For Lists, Locked Lists, and Scratchpads, each sync is a complete state exchange resolved by an **automatic three-way merge** — both sides' edits survive without you having to pick a winner. The computer compares the local computer state, the phone's state, and a saved snapshot of the last successful sync, and produces a merged result that includes everyone's adds, edits, deletions, and reorders.

Been out in the world adding things to your phone? Been at your computer crossing things off? Sync — the merged result has both. No dialog, no choice, no lost edits.

The legacy "PICK A SIDE" dialog still exists but only fires on a genuine conflict — the same field of the same item edited on both sides at the same instant. In normal use you will not see it.

## Connection flow

1. User taps Sync on the phone (the phone never auto-connects on launch or foreground)
2. Phone opens a WebSocket to the computer's IP and port (configured during [pairing](pairing.md))
3. Phone sends a `key_init` message with a temporary X25519 public key
4. Computer responds with `key_exchange` containing its public key
5. Both derive a shared secret; all subsequent messages are NaCl secretbox-encrypted
6. Phone sends `handshake` with device name, pairing secret, and last sync timestamp
7. Computer validates the pairing secret and accepts the connection. Both sides are now connected. **No state exchange happens** until the user requests one.

## State sync

State sync only runs when the user clicks SYNC NOW on the computer. Steps:

1. Computer asks the phone for its full state (lists, locked lists, scratchpad, categories, with item-level timestamps and stable ids)
2. Phone sends `state_sync` with its current state
3. Computer reads its own state and the saved **ancestor snapshot** from the last successful sync
4. Computer runs a three-way merge: for each item, it compares ancestor / phone / computer to decide what survived, what was added, what was edited, what was deleted
5. The merged snapshot is applied to the computer's lists, locked lists, and scratchpad
6. Computer sends `sync_confirm` to the phone with the merged snapshot attached; phone applies it directly
7. Both sides save a fresh ancestor snapshot of the merged state, ready for the next sync

If the merge produces a true tie (same field of the same item, edited on both sides at the same `updatedAt` millisecond), a per-tie picker dialog appears so you can pick which value wins. This is rare. Otherwise the sync is silent and instantaneous.

If both sides are identical, the sync still runs but every counter reads zero — confirmation that nothing diverged.

If the user cancels the rare tie picker (or lets its 60-second timer expire), the sync is aborted, no data changes on either device, and `lastSyncTimestamp` is not updated.

## What the merge does in plain language

| Situation | Result |
|---|---|
| Phone added a new item, computer didn't touch it | Item appears on the computer |
| Computer added a new item, phone didn't touch it | Item appears on the phone |
| Both sides added different new items | Both new items survive |
| Phone edited item A's text, computer edited item A's checkbox | Both changes apply to the same item — phone's new text + computer's checked state |
| Both sides edited the same field of the same item | Last edit wins (most recent `updatedAt`); if exactly tied, the picker dialog opens |
| Phone deleted an item, computer didn't touch it | Item is gone on both sides |
| Phone deleted an item, computer edited the same item | Delete wins |
| Both sides reordered the same list | Combined order; new positions interpolated to keep both sides' moves |
| Both sides added an item at the same position | Both items survive at that position; render order is deterministic across devices via id tiebreak |

## Button states during transfers and saves

To prevent overlapping operations from stepping on each other, the computer temporarily dims and disables certain buttons while a transfer or save is in progress:

- **While phone → computer media is still arriving** (after expanding a jot or starting a download): Sync Now, Download All, the big ↓ save button on every jot, and the per-row save buttons for any item whose data hasn't arrived yet are all disabled.
- **While the computer is writing a jot to disk** (Download All in progress, or a per-jot save including media): Sync Now, Download All, and every jot's big ↓ save button are disabled. Per-row save buttons for items whose data is already loaded remain disabled during this window as well.

Buttons re-enable automatically the moment the operation finishes. The sidebar system messages log shows what's happening in plain text.

## What syncs

| Data | Direction | Method |
|---|---|---|
| Lists (items + categories) | Bidirectional | Three-way merge |
| Locked Lists | Bidirectional | Three-way merge |
| Scratchpads (text + categories) | Bidirectional | Three-way merge (last-edit-wins on text bodies) |
| Jot media (images, files, audio, drawings) | Phone → Computer | Manifest + binary download |
| Settings | Not synced | Local to each device |

---

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Security](security.md) | [Sync History](computer-settings-sync-history.md)
