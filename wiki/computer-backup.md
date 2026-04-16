# Backup & Restore

Computer exports encrypted or plaintext backup files. Restore from file. No cloud involved.

---

## What's backed up

A backup includes:
- Lists (items and categories)
- Locked Lists (items and categories)
- Scratchpad (text and categories)
- Tags
- Settings (theme, sync config, font sizes)

Backups do **not** include jot media (images, files, audio, drawings). Those are handled separately via [downloads](jots.md) and [tags](computer-tags.md).

## Encrypted backup

When you choose an encrypted backup:
1. You provide a password
2. The password is run through PBKDF2 (100k iterations, SHA-256) to derive an AES key
3. The backup payload is encrypted with AES-GCM (random IV, authentication tag)
4. The resulting file contains the salt, IV, auth tag, and ciphertext

To restore, you provide the same password. If it's wrong, decryption fails and the restore is rejected.

## Plaintext backup

A plaintext backup is a JSON file with the same payload, unencrypted. Useful for debugging or migrating data, but it exposes all content including locked list items.

## Where backups are saved

Backup files are written to `%LOCALAPPDATA%\JotBunker\backups\` by default. Filenames are timestamped:
- `backup-2026-04-12T14-32-05-000Z.json` — plaintext
- `secure-backup-2026-04-12T14-32-05-000Z.json` — encrypted

This is separate from the app's main data directory (`%APPDATA%\JotBunker\`). The uninstaller gives the option to keep or delete the `%LOCALAPPDATA%\JotBunker\` directory.

## Restore

Restore replaces the current computer state with the backup's data. This is destructive — current data is overwritten. A confirmation dialog warns before proceeding.

## Computer-only

Backup and restore are computer features. The phone does not have a built-in backup mechanism (though its data is included in iCloud/Google backups at the OS level — see [Data Storage](data-storage.md) for details on what that covers).

---

See also: [Security](security.md) | [Data Storage](data-storage.md) | [Computer App](computer-app-overview.md)
