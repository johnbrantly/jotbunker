# Sync Preview & History

Every sync on the computer goes through a mandatory SYNC PREVIEW dialog. The user picks which side wins; the losing side is replaced wholesale. Recent syncs are recorded in a history viewer for after-the-fact review.

---

## SYNC PREVIEW dialog

When the user clicks SYNC NOW on the computer and the diff is non-empty, the dialog blocks until the user picks an option or the 60-second timer auto-cancels.

### Title and timer

- **Title:** "SYNC PREVIEW"
- **Countdown:** "Auto-cancel in {seconds}s" (60-second timeout)
- **Subtitle:** A short reminder that Lists, Locked Lists, and Scratchpad will be replaced wholesale on the losing side, and that Jots are unaffected

### Report body

Two sections, each only rendered if non-empty:

| Section | What it shows |
|---|---|
| **PHONE HAS** (computer does not) | Items, categories, and scratchpad content the phone has that the computer does not |
| **COMPUTER HAS** (phone does not) | Items, categories, and scratchpad content the computer has that the phone does not |

Within each section, changes are grouped by data type (LISTS, LOCKED LISTS, SCRATCHPAD) and then by category. Each change is shown with a symbol and the item text (truncated to 50 characters):

| Symbol | Color | Meaning |
|---|---|---|
| `+` | Green | Item added |
| `-` | Red | Item deleted |
| `~` | Orange | Item text modified (shows old → new) |
| `☑` / `☐` | Gray | Item checked or unchecked |
| `↕` | Purple | Item reordered |

Category renames are shown as: `Old Name → New Name` (orange).

Scratchpad changes are shown as: `[Category Name] content changed`.

### Buttons

| Button | Action |
|---|---|
| CANCEL | Aborts the sync. No changes applied to either device. `lastSyncTimestamp` is not updated |
| DESKTOP WINS | Computer keeps its state; phone replaces its lists / locked lists / scratchpad wholesale with the computer's state |
| PHONE WINS | Phone keeps its state; computer replaces its lists / locked lists / scratchpad wholesale with the phone's state |

### Empty syncs

If both sides are identical (no diff), the dialog is skipped entirely. The sync completes silently and `lastSyncTimestamp` is updated.

### Timeout

After 60 seconds with no input, `respond('cancel')` fires automatically. This sends a `sync_cancel` to the phone, both sides keep their pre-sync state, and `lastSyncTimestamp` is not updated. The devices remain connected; only the sync exchange is aborted.

---

## Sync History

Accessed via the **VIEW SYNC HISTORY** button in the Sync History section of [Computer Settings](computer-settings.md).

### History list

- Stores the last **10** sync reports (newest first)
- Each entry shows:
  - **Timestamp** formatted as `Apr 12 14:35`
  - **Summary** with aggregated counts like `+3, -2, 5 mod, 2 toggled` or `No changes`
- Click an entry to view its full report detail

### Detail view

When an entry is selected, the full report is displayed below the list with two sections: PHONE HAS (computer does not) and COMPUTER HAS (phone does not).

### Legend

A color legend is shown at the top of the dialog:

```
+ added   - deleted   ~ modified   ↕ reordered   ☑ toggled
```

### Clear history

- **CLEAR HISTORY** button (red) appears when entries exist
- Shows confirmation: "Clear Sync History? This will delete all sync history entries. This cannot be undone."

---

## How the report is generated

When SYNC NOW runs:

1. Computer takes a snapshot of its current state (lists, locked lists, scratchpad)
2. Phone sends its current state over the encrypted channel
3. Computer computes a diff between the two pre-sync states
4. Two perspectives are generated:
   - **phoneOnly**: items the phone has that the computer doesn't
   - **desktopOnly**: items the computer has that the phone doesn't
5. The report is saved to sync history, regardless of whether the user picks a side or cancels

### Item diff logic

For each category slot, items are compared by ID:
- **Added**: present in target but not in source
- **Deleted**: present in source but not in target
- **Modified**: same ID, different text
- **Checked**: same ID, different done state
- **Reordered**: same IDs but in a different order (only reported when more than 1 item moved)

---

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [Computer Settings](computer-settings.md)
