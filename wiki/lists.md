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

Lists sync **bidirectionally** between phone and computer. Both devices maintain the same items and categories. Conflict resolution uses Last-Write-Wins (LWW) — whichever device edited an item more recently has its version kept. New items created on either side are merged in. Items deleted on one side are detected and removed on the other using the `remoteSince` timestamp mechanism (see [Sync Protocol](sync-protocol.md)).

Category renames also sync with LWW. If both devices rename the same category, the more recent rename wins.

## Offline behavior

Changes made while disconnected are kept locally. When you reconnect and sync, both devices exchange their current state and merge — sync is an on-demand state exchange, not a queue replay.

---

See also: [Locked Lists](locked-lists.md) | [Sync](sync.md) | [Phone App](phone-app-overview.md)
