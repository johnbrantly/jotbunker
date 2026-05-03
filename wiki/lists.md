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

Lists sync **bidirectionally** between phone and computer. Both devices maintain the same items and categories. Sync is resolved by user choice on every sync: a SYNC PREVIEW dialog on the computer shows what each side has and asks the user to pick **DESKTOP WINS**, **PHONE WINS**, or **CANCEL** (60-second auto-cancel). The losing side is replaced wholesale, including items, category labels, and unchecked counts. There is no automatic merge.

Category renames travel with the chosen side; whichever device wins keeps both its items and its category labels.

## Offline behavior

Changes made while disconnected are kept locally. When you reconnect and sync, both devices exchange their current state and merge — sync is an on-demand state exchange, not a queue replay.

---

See also: [Locked Lists](locked-lists.md) | [Sync](sync.md) | [Phone App](phone-app-overview.md)
