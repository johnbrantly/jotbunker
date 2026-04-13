# Security

What's protected, what isn't, and how.

---

## Transport encryption

All sync traffic between phone and computer is encrypted with NaCl secretbox after an X25519 key exchange. Each connection generates fresh ephemeral keypairs — no long-lived keys. The shared secret is derived with `nacl.box.before()` and used for `nacl.secretbox()` with random 24-byte nonces. See [Sync Protocol](sync-protocol.md) for the wire-level details.

## Pairing secret

The pairing secret (a random UUID) is the only authentication factor. It's established during [pairing](pairing.md) and validated during every handshake using a timing-safe comparison. The secret is transmitted only inside the encrypted channel — never in plaintext on the wire.

**Storage:** The pairing secret is stored in plaintext on both devices (AsyncStorage on mobile, JSON file on the computer). It is not protected by the OS keychain. On a jailbroken phone or a shared Windows account, the secret is readable from disk.

## App lock

When enabled, the phone app requires biometric authentication or device passcode/PIN/pattern when resuming from the background. This is a UI gate — it doesn't encrypt or decrypt anything.

## Locked lists

The Locked Lists tab requires biometric authentication or device credentials on the phone. On the computer, locked lists are not gated — the assumption is your computer is already a secured environment. This protects against casual shoulder-surfing on the phone, not forensic extraction. The locked list data is stored in the same plaintext stores as regular lists — AsyncStorage on mobile, JSON files on the computer. See [Locked Lists](locked-lists.md).

## Backup encryption

Computer backups can be encrypted with a user-provided password using AES-GCM with PBKDF2 key derivation. Plaintext backups are also available. See [Backup](computer-backup.md).

## What is NOT encrypted at rest

- All mobile store data (AsyncStorage) — plaintext in the app sandbox
- All computer store data (`%APPDATA%\Jotbunker\stores/`) — plaintext JSON files
- Computer jot media held in memory (not cached to disk)
- Pairing secret — plaintext on both devices

## Threat model

Jotbunker protects against:
- **Network eavesdropping** — all sync traffic is encrypted
- **Unauthorized device pairing** — pairing secret required
- **Casual access to locked lists** — biometric/password gate

Jotbunker does **not** protect against:
- **Physical device access** with debugging tools (data is plaintext at rest)
- **Compromised OS** (jailbreak, malware with file access)
- **Brute force on backup passwords** (PBKDF2 iteration count is 100k, below current recommendations)

---

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Backup](computer-backup.md) | [Data Storage](data-storage.md)
