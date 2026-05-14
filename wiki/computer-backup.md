# Backup and Restore

The computer exports encrypted or plaintext backup files. Restore from a file. No cloud involved.

## What is backed up

A backup includes:

- Lists (items and categories)
- Locked Lists (items and categories)
- Scratchpad (text and categories)
- Tags
- Settings (theme, sync config, font sizes)

Backups do NOT include jot media (images, files, audio, drawings). Those are handled separately through [downloads](jots.md) and [tags](computer-tags.md).

## Encrypted backup

When you choose an encrypted backup:

1. You provide a password.
2. The password is run through PBKDF2 (100,000 iterations, SHA-256) to derive an AES key.
3. The backup payload is encrypted with AES-GCM (random IV, authentication tag).
4. The resulting file contains the salt, IV, auth tag, and ciphertext.

To restore, you provide the same password. Wrong password rejects the restore.

## Plaintext backup

A plaintext backup is a JSON file with the same payload, unencrypted. Useful for debugging or moving data between machines, but it exposes all content, including locked list items.

## Where backups are saved

Backup files go to `%LOCALAPPDATA%\JotBunker\backups\` by default. Filenames are timestamped:

- `backup-2026-04-12T14-32-05-000Z.json` (plaintext)
- `secure-backup-2026-04-12T14-32-05-000Z.json` (encrypted)

This is separate from the app's main data directory (`%APPDATA%\JotBunker\`). The uninstaller offers to keep or delete `%LOCALAPPDATA%\JotBunker\`.

## Restore

Restoring replaces your current Lists, Locked Lists, Scratchpad, and Tags with the backup's data. This is destructive; your current data is overwritten. A confirmation dialog warns before proceeding.

After a restore, your next sync runs as a fresh merge. The computer's restored items win on shared items, and any items the phone has that the backup did not contain will merge in as additions. If you want the phone to match the restored state exactly, delete the unwanted items from the phone after the next sync and then sync again.

## Computer-only

Backup and restore are computer features. The phone does not have a built-in backup mechanism, though its data is part of iCloud and Google backups at the OS level. See [Data Storage](data-storage.md) for what those cover.

See also: [Security](security.md) | [Data Storage](data-storage.md) | [Computer App](computer-app-overview.md)
