# Sync History

Every sync on the computer runs an automatic three-way merge of Lists, Locked Lists, and Scratchpads. Recent syncs are recorded in a history viewer for after-the-fact review. The legacy SYNC PREVIEW dialog only fires on a genuine field-level tie (same field of the same item, edited on both sides at the same instant).

---

## Sync flow on the computer

When the user clicks SYNC NOW:

1. The computer reads its local state, the phone's `state_sync` payload, and the saved ancestor snapshot
2. It runs a three-way merge
3. The merged result is applied locally and sent to the phone
4. A merge entry is added to Sync History summarizing what changed
5. A new ancestor snapshot is committed on both sides

You will not normally see any dialog. Sync feels instantaneous.

## Per-tie resolution dialog (rare)

The dialog only opens when the merge produces one or more **ties** — same field of the same item, edited on both sides with exactly equal `updatedAt` millisecond timestamps. In single-user usage with phone + laptop this is essentially never; in laboratory testing with deliberately synchronized clocks it can happen.

When it opens:

- **Title:** "SYNC PREVIEW"
- **Countdown:** "Auto-cancel in {seconds}s" (60-second timeout)
- **Body:** One row per tie. Each row shows the section (LISTS / LOCKED LISTS / SCRATCHPAD), the slot, the item context, and the phone value vs the computer value as side-by-side selectable buttons.
- **APPLY** is enabled only after every row has been picked. Cancel aborts the entire sync; no data changes on either side and no ancestor commit happens.

## Sync History

Accessed via the **VIEW SYNC HISTORY** button in the Sync History section of [Computer Settings](computer-settings.md).

### History list

- Stores the last **10** sync entries (newest first)
- Each entry shows:
  - **Timestamp** formatted as `Apr 12 14:35`
  - **Summary** with merge counts like `+3 phone, +1 computer, 2 edited, 1 tombstoned` or `No changes`
- Click an entry to view its full detail
- Older legacy entries (created before the merge upgrade) render in their original "PHONE HAS / COMPUTER HAS" diff format until the rolling-10 window rotates them out

### Detail view (post-merge entries)

Shows the merge counts:

| Field | Meaning |
|---|---|
| Added from phone | Items the phone introduced that the computer didn't have |
| Added from computer | Items the computer introduced that the phone didn't have |
| Edited (different fields) | Same item, different fields touched on each side; both edits kept |
| Edited (LWW) | Same item, same field touched on both sides; latest write won |
| Tombstoned | Items deleted on one side and reaped on both |
| Ties | Same field, exactly equal `updatedAt` — picked manually in the dialog |

### Clear history

- **CLEAR HISTORY** button (red) appears when entries exist
- Shows confirmation: "Clear Sync History? This will delete all sync history entries. This cannot be undone."

---

## Where the merge log lives

For lower-level evidence of what each sync did, the computer's `%APPDATA%\Jotbunker\debug-logs\desktop-sync.log` records two lines per sync (always-on, not gated by DEBUG LOGGING):

```
[merge] applied lists:N/locked:M/scratchpad:K addedPhone:X addedDesktop:Y editedField:Z editedLWW:W tombstoned:T ties:R
[ancestor] INFO committedAt=... hash=... counts=lists:N/locked:M/scratchpad:K
```

Counts and hashes only — no item text — so it's safe even though Locked Lists carry secrets. See [Debug Logging](debug-logging.md) for the full log-stream split.

---

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [Computer Settings](computer-settings.md)
