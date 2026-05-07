# Lists

Todo lists with six user-named categories, drag-to-reorder, and bidirectional sync.

---

## How it works

The Lists tab shows a single list at a time. Switch between lists using the category strip — six categories, each with its own set of items. Default categories: ASAP, TODO, WORK, HOME, SHOP, TEMP. You can rename any category in [settings](phone-app-overview.md) in the phone app, or by right-clicking the category name on the computer app.

Each item has:
- A **checkbox** (tap to toggle done/undone)
- **Text** (editable inline)
- A **drag handle** (long-press and drag to reorder)
- A **delete** action (swipe or tap)

Items are ordered by position. When you reorder, positions are recomputed and synced.

### Computer-only interactions

- **Right-click a category pill** to rename it inline (no need to open settings)
- **Drag a list item onto a different category pill** to move it to that category

### Header menu (⋯)

The three-dot menu in the list header (only visible when items exist):

| Platform | Menu item | Action |
|---|---|---|
| Phone | DELETE ALL {CATEGORY} ITEMS | Clears all items in the active category (confirmation dialog) |
| Computer | SAVE → {tag} | Saves the current list to the selected tag (only when a tag is selected) |
| Computer | DELETE ALL {CATEGORY} ITEMS | Clears all items in the active category (confirmation dialog) |

## Sync behavior

Lists sync **bidirectionally** between phone and computer. Both devices maintain the same items and categories. Sync runs an automatic three-way merge: the computer compares its state, the phone's state, and a saved snapshot of the last successful sync, and produces a merged result that includes both sides' adds, edits, deletions, and reorders. Category renames merge the same way. No dialog, no choice, no lost edits in the normal case.

The legacy pick-a-side dialog still exists but only fires on a genuine field-level tie (same field of the same item, edited on both sides at the same instant) — exceedingly rare in solo-user usage.

## Offline behavior

Changes made while disconnected are kept locally. When you reconnect and sync, the merge sees what each side did since the last sync and combines them. Adds on both sides survive; reorders on both sides combine; deletes always win over concurrent edits.

---

See also: [Locked Lists](locked-lists.md) | [Sync](sync.md) | [Phone App](phone-app-overview.md)
