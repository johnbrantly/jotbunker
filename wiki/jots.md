# Jots

Six numbered capture slots on your phone. Text, drawings, photos, voice recordings, and file attachments, all in one surface.

## How it works

Each jot is a numbered slot (JOT 1 through JOT 6). You switch between them using the jot strip at the bottom of the screen. Each jot has five input modes:

- **Text.** Freeform text entry.
- **Draw.** Finger drawing.
- **Image.** Attach photos from your camera roll.
- **File.** Attach files from your device.
- **Audio.** Record and play back voice memos.

Switch modes with the mode strip above the jot strip. Each jot stores all five types independently. You can have text, a drawing, photos, files, and recordings in a single jot.

### Header menu

The three-dot menu in the jot header shows options based on the active input mode:

| Active mode | Menu item | Action |
|---|---|---|
| Text (with content) | CLEAR TEXT | Clears the text for this jot |
| Draw (with drawing) | CLEAR DRAWING | Removes the drawing |
| Image (with images) | CLEAR ALL IMAGES | Removes all images |
| File (with files) | CLEAR ALL FILES | Removes all file attachments |
| Audio (with recordings) | CLEAR ALL AUDIO | Removes all recordings |
| Always | CLEAR JOT {n} | Clears everything in the jot (asks first) |

On the computer, the Jots tab header has a **REFRESH** menu item (visible when the phone is connected) that re-fetches all jot metadata from the phone.

## Why six?

The slot constraint is intentional. Six jots forces you to capture what matters and clear what does not. This is not a filing cabinet; it is a capture surface. When a jot fills up, download it to your computer and clear the slot.

## Media storage

Text and drawing data are stored inside the jot itself. Images and audio recordings are saved as files on the device; the jot holds references to them. When you delete a recording or image from a jot, the file is also removed.

## Sync behavior

Jots sync **phone to computer only**. The phone is the source of truth for jot content. When connected, the computer receives a manifest listing the images, files, and audio in each jot. The computer fetches media as needed and holds it in memory for viewing and downloading. Nothing is cached to disk. Each session fetches fresh from the phone.

After a fresh phone install, jots start empty. Jot content does not flow back from computer to phone; the computer is a viewer and a download tool, not a restore source for jots.

## Downloads

From the computer, you can download a jot's content to your filesystem. Text becomes a `.txt` file, drawings become PNG images, photos are copied, files are copied, and audio recordings are saved as `.m4a`. Downloads are filed into a [tagged](computer-tags.md) folder under your configured tag root path (default `Documents/JotBunker Tags/`).

See also: [Phone App](phone-app-overview.md) | [Sync](sync.md) | [Tags](computer-tags.md)
