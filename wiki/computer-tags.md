# Tags & Filing

Computer-side organization. Tag a jot with a label, and its content gets filed to a folder on your filesystem.

---

## How it works

Tags are labels you create in the computer app's side panel. When you tag a jot, its text, images, drawings, files, and audio are copied to a folder on your hard drive:

```
{tagRootPath}/{tagName}/
```

The tag root path is user-configurable (defaults to `Documents/Jotbunker Tags/`). Each filed item gets a timestamped filename (e.g., `20260412143022-filename.ext`). Images are copied as-is, drawings are rasterized to PNG, audio stays as `.m4a`, files are copied, and text becomes a `.txt` file.

## Tag management

### Side panel

The tag list lives in the left side panel. From top to bottom:

- **TAGS** header with info tooltip
- **Add tag** — input field ("New tag...") + ADD button. Enter key also adds
- **Search** — input field ("Search tags...") + SEARCH/CLEAR button. Filters the tag list in real time. Shows "{n} of {total} tags" when filtering
- **Tag list** — scrollable list of tags. Favorites sort to the top; within each group, sorted alphabetically. Click a tag to select it as the active filing destination. Click again or press Escape to deselect
- **MANAGE** button — opens the Manage Tags dialog (see below)
- **Save-to-tag button** (pinned at bottom) — shows where the currently active list or scratchpad would be saved:

```
SAVE {LIST|LOCKED LIST|SCRATCHPAD}
{CATEGORY NAME}
→ {selected tag name}
```

When no tag is selected, it shows "SELECT A TAG TO SAVE" (disabled). Not shown when on the Jots tab with no tag selected.

### Manage Tags dialog

Opened via the MANAGE button. A modal dialog titled "MANAGE TAGS" showing all tags sorted alphabetically. For each tag:

- **Heart icon** — toggle favorite on/off. Quicksave is always favorited and cannot be toggled
- **Tag label** — shown with strikethrough in red if marked for deletion
- **Delete icon (✕)** — mark/unmark for deletion. Quicksave cannot be deleted

Changes are batched — nothing is applied until you click:
- **CANCEL** — discards all changes
- **APPLY** — applies favorite toggles and deletions. Button shows deletion count when tags are marked (e.g., "APPLY (2 deletions)")

Deleting a tag removes the label from Jotbunker but does **not** delete the filed content from your filesystem.

A **Quicksave** tag exists by default, is always favorited, and cannot be deleted.

## What gets filed

When you file a jot to a tag:
- Jot text → `{timestamp}-{filename}.txt`
- Each image → `{timestamp}-image_{n}.{ext}`
- Each audio recording → `{timestamp}-audio_{n}.m4a`
- Each file attachment → `{timestamp}-{originalFilename}`
- Drawing → `{timestamp}-drawing.png`

Files are plain files on your filesystem. You can search them, back them up, or feed them into any knowledge management system you want.

## Computer-only

Tags exist only on the computer. The phone doesn't know about tags — it's a filing and organization layer that sits on top of the sync/download system.

---

See also: [Jots](jots.md) | [Computer App](computer-app-overview.md)
