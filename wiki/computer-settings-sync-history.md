# Sync Confirmation & History

The sync confirmation system lets you review what will change before a sync is applied. When enabled, a preview dialog appears showing exactly what each device has and what the merged result will look like.

---

## Enabling Sync Confirmation

Toggle **SYNC CONFIRMATION** to ON in [Computer Settings](computer-settings.md). When enabled, every manual sync pauses to show a preview dialog before applying changes. When disabled, syncs apply immediately with the default LWW merge — no preview, no warning, no override options, even if the divergence is large.

Auto-sync (when enabled) always skips the confirmation dialog regardless of this setting — it syncs silently in the background.

**Note:** Big divergence detection (>5 deletions or >20 total changes) only affects the confirmation dialog UI — it has no effect on the merge itself. If confirmation is disabled, a large divergence merges silently just like a small one. Enable sync confirmation if you want a safety net after extended offline periods on either device.

---

## Sync Preview Dialog

When a sync is initiated and confirmation is enabled, the dialog appears with:

### Title and timer

- **Title:** "SYNC PREVIEW"
- **Countdown:** "Auto-cancel in {seconds}s" — 60-second timeout. If no action is taken, the sync is automatically cancelled.

### Big divergence warning

If the sync involves more than 5 deletions or more than 20 total changes, a warning appears:

> **LARGE DIVERGENCE DETECTED**

This also unlocks additional resolution options (see buttons below).

### Report body

The report shows three perspectives on the sync:

| Section | What it shows |
|---|---|
| **PHONE HAS** (computer does not) | Items that exist on the phone but are missing from the computer |
| **COMPUTER HAS** (phone does not) | Items that exist on the computer but are missing from the phone |
| **COMPUTER AFTER MERGE** | What the computer's state will look like after the merge is applied |

Within each section, changes are grouped by data type (LISTS, LOCKED LISTS, SCRATCHPAD) and then by category. Each change is shown with a symbol and the item text (truncated to 50 characters):

| Symbol | Color | Meaning |
|---|---|---|
| `+` | Green | Item added |
| `-` | Red | Item deleted |
| `~` | Orange | Item text modified (shows old → new) |
| `☑` / `☐` | Gray | Item checked or unchecked |
| `↕` | Purple | Item reordered |

Category renames are shown as: `Old Name → New Name` (orange)

Scratchpad changes are shown as: `[Category Name] content changed`

If both devices are identical, the body shows: "Nothing to sync — Phone and Computer identical"

### Buttons

**Normal sync** (divergence within thresholds):

| Button | Action |
|---|---|
| CANCEL | Aborts the sync. No changes applied to either device |
| SYNC | Applies the standard Last-Write-Wins merge |

**Big divergence** (>5 deletions or >20 total changes):

| Button | Action |
|---|---|
| CANCEL | Aborts the sync |
| COMPUTER WINS | Computer keeps its state. Phone receives the computer's state and overwrites its own |
| PHONE WINS | Phone keeps its state. Computer adopts the phone's state entirely |
| MERGE | Applies the standard Last-Write-Wins merge (same as SYNC) |

**Empty sync** (no differences):

| Button | Action |
|---|---|
| OK | Closes the dialog |

### Timeout

The dialog auto-cancels after **60 seconds** with no user interaction. The countdown is displayed in the dialog header.

---

## Sync History

Accessed via the **VIEW SYNC HISTORY** button in the Sync Confirmation section of [Computer Settings](computer-settings.md).

### History list

- Stores the last **10** sync reports (newest first)
- Each entry shows:
  - **Timestamp** — formatted as `"Apr 12 14:35"`
  - **Summary** — aggregated counts like `"+3, -2, 5 mod, 2 toggled"` or `"No changes"`
- Click an entry to view its full report detail

### Detail view

When an entry is selected, the full report is displayed below the list with the same three-section layout as the Sync Preview Dialog (PHONE HAS, COMPUTER HAS, COMPUTER AFTER MERGE).

### Legend

A color legend is shown at the top of the dialog:

```
+ added   - deleted   ~ modified   ↕ reordered   ☑ toggled
```

### Clear history

- **CLEAR HISTORY** button (red) — appears when entries exist
- Shows confirmation: "Clear Sync History? This will delete all sync history entries. This cannot be undone."

---

## How the Report is Generated

When a sync is triggered:

1. The computer takes a snapshot of its current state (lists, locked lists, scratchpad)
2. The phone sends its current state
3. The computer computes what the merged result would be
4. Three comparisons are generated:
   - **phoneOnly**: phone state vs computer state (what phone has that computer doesn't)
   - **desktopOnly**: computer state vs phone state (what computer has that phone doesn't)
   - **desktopResult**: computer state vs merged state (what will change on the computer)
5. The report is saved to sync history regardless of whether the user confirms or cancels

### Item diff logic

For each category slot, items are compared by ID:
- **Added**: present in target but not in source
- **Deleted**: present in source but not in target
- **Modified**: same ID, different text
- **Checked**: same ID, different done state
- **Reordered**: same IDs but in a different order (only reported when more than 1 item moved)

### Big divergence thresholds

| Threshold | Value |
|---|---|
| Deletions | More than 5 across all sides |
| Total changes | More than 20 (added + deleted + modified + checked) across all sides |

Either threshold triggers the "LARGE DIVERGENCE DETECTED" warning and unlocks the COMPUTER WINS / PHONE WINS buttons.

---

## Auto-Sync and Confirmation

When [auto-sync](computer-settings.md#auto-sync) is enabled, syncs triggered by the debounce timer always skip the confirmation dialog — they use the `skipConfirmation` flag internally. The flag is reset after each sync. The report is still generated and saved to sync history, so you can review what happened via VIEW SYNC HISTORY.

The computer's top chrome shows "Auto-synced" (vs "Synced") to distinguish auto-triggered syncs from manual ones.

---

See also: [Sync](sync.md) | [Sync Protocol](sync-protocol.md) | [Computer Settings](computer-settings.md)
