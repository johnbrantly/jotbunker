# Scratchpads

Six freeform text areas for thinking in progress.  Like a notepad.

---

## How it works

The Scratchpad tab shows one text area at a time. Switch between six categories using the category strip. Default categories: CLIENT, SCHOOL, CREATE, DREAM, TEMP, TBD. Each category holds a single block of freeform text.

Type whatever you want. There's no structure, no formatting, no character limit. Start a brainstorm on your computer, pick it up on your phone, or the other way around.

On the computer, you can **right-click a category pill** to rename it inline (no need to open settings).

### Header menu (⋯)

| Platform | Menu item | Action |
|---|---|---|
| Phone | CLEAR THIS SCRATCHPAD | Clears the text in the active category (confirmation dialog) |
| Computer | SAVE → {tag} | Saves the current scratchpad to the selected tag (only when a tag is selected) |
| Computer | CLEAR THIS SCRATCHPAD | Clears the text in the active category (confirmation dialog) |

## Sync behavior

Scratchpad text syncs bidirectionally via on-demand state exchange. Each category's text has a timestamp. Conflict resolution is LWW — the device with the more recent edit wins.

Category renames sync the same way as [Lists](lists.md) categories.

## Font size

Scratchpad has its own font size setting, independent of the list font size. Adjust in settings.

---

See also: [Lists](lists.md) | [Phone App](phone-app-overview.md) | [Sync](sync.md)
