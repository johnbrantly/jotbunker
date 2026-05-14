# Tags and Filing

Computer-side organization. Tag a jot with a label, and its content gets filed to a folder on your filesystem.

## How it works

Tags are labels you create in the computer app's side panel. When you tag a jot, its text, images, drawings, files, and audio are copied to a folder on your hard drive:

```
{tagRootPath}/{tagName}/
```

The tag root path is yours to configure (default `Documents/JotBunker Tags/`). Each filed item gets a timestamped filename, for example `20260412143022-filename.ext`. Images are copied as-is, drawings are saved as PNG, audio stays as `.m4a`, files are copied, and text becomes a `.txt` file.

## Tag management

### Side panel

The tag list lives in the left side panel. From top to bottom:

- **TAGS header** with an info tooltip.
- **Add tag.** An input field ("New tag...") plus an ADD button. Enter also adds.
- **Search.** An input field ("Search tags...") plus a SEARCH/CLEAR button. Filters the tag list in real time and shows "{n} of {total} tags" when filtering.
- **Tag list.** Scrollable. Favorites sort to the top; within each group, alphabetical. Click a tag to select it as the active filing destination. Click again or press Escape to deselect.
- **MANAGE button.** Opens the Manage Tags dialog (see below).
- **Save-to-tag button** (pinned at the bottom). Shows where the currently active list or scratchpad would be saved:

```
SAVE {LIST | LOCKED LIST | SCRATCHPAD}
{CATEGORY NAME}
to {selected tag name}
```

When no tag is selected, it shows "SELECT A TAG TO SAVE" (disabled). It is hidden when you are on the Jots tab with no tag selected.

### Manage Tags dialog

Opens from the MANAGE button. Shows all tags in alphabetical order. For each tag:

- **Heart icon.** Toggle favorite on or off. Quicksave is always favorited and cannot be toggled.
- **Tag label.** Shown with red strikethrough if marked for deletion.
- **Delete icon.** Mark or unmark for deletion. Quicksave cannot be deleted.

Changes are batched; nothing applies until you click APPLY. CANCEL discards them. The APPLY button shows the deletion count when tags are marked, for example "APPLY (2 deletions)".

Deleting a tag removes the label from JotBunker. It does NOT delete the filed content from your filesystem.

A **Quicksave** tag exists by default, is always favorited, and cannot be deleted.

## What gets filed

When you file a jot to a tag:

- Jot text becomes `{timestamp}-{filename}.txt`.
- Each image becomes `{timestamp}-image_{n}.{ext}`.
- Each audio recording becomes `{timestamp}-audio_{n}.m4a`.
- Each file attachment becomes `{timestamp}-{originalFilename}`.
- Drawings become `{timestamp}-drawing.png`.

These are plain files on your filesystem. You can search them, back them up, or feed them into any knowledge management system you want.

## Computer-only

Tags exist only on the computer. The phone does not know about tags; tagging is a filing layer that sits on top of the sync and download system.

See also: [Jots](jots.md) | [Computer App](computer-app-overview.md)
