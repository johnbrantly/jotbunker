# Lists

Todo lists with six user-named categories, drag-to-reorder, and bidirectional sync.

## How it works

The Lists tab shows one list at a time. Switch between lists using the category strip. Six categories, each with its own items. Default categories: ASAP, TODO, WORK, HOME, SHOP, TEMP. Rename any category in the phone settings, or by right-clicking the category name on the computer.

Each item has:

- A **checkbox** (tap to toggle done).
- **Text** (editable inline).
- A **drag handle** (long-press and drag to reorder).
- A **delete** action (swipe or tap).

Items are ordered by position. When you reorder, positions are recomputed and synced.

### Computer-only shortcuts

- Right-click a category pill to rename it inline (no need to open settings).
- Drag a list item onto a different category pill to move it to that category.

### Header menu

The three-dot menu in the list header (visible when items exist):

| Platform | Menu item | Action |
|---|---|---|
| Phone | DELETE ALL {CATEGORY} ITEMS | Clears all items in the active category (asks first) |
| Computer | SAVE → {tag} | Saves the current list to the selected tag (only when a tag is selected) |
| Computer | DELETE ALL {CATEGORY} ITEMS | Clears all items in the active category (asks first) |

## Sync behavior

Lists sync both directions. Both devices keep the same items and categories. Sync runs an automatic merge: the computer compares its current state, the phone's state, and a saved snapshot of the last successful sync, then produces a result that includes both sides' adds, edits, deletions, and reorders. Category renames merge the same way. In the normal case, you do not pick a winner; both sides' changes survive.

If both devices changed the same value at the exact same moment, the app asks which one to keep. This is rare in solo use.

## Offline behavior

Changes you make while disconnected stay on the device. When you reconnect and sync, the merge combines what each side did since the last sync. Adds on both sides survive. Reorders on both sides combine. Deletes always win over edits on the other side.

See also: [Locked Lists](locked-lists.md) | [Sync](sync.md) | [Phone App](phone-app-overview.md)
