# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

- **Sensitive issues**: Email [john@johnbrantly.com](mailto:john@johnbrantly.com) with details. Please allow reasonable time for a fix before public disclosure.
- **General bugs**: Open a [GitHub Issue](https://github.com/johnbrantly/jotbunker/issues).

## Scope

Jotbunker syncs over your local network only. No data leaves your LAN — there are no cloud servers, no accounts, no telemetry.

## Encryption

All sync traffic between phone and computer is encrypted with NaCl secretbox after an X25519 key exchange. Each connection generates fresh ephemeral keypairs — no long-lived keys. The pairing secret is validated using a timing-safe comparison inside the encrypted channel.

Computer backups can be encrypted with a user-provided password using AES-GCM with PBKDF2 key derivation.

## What is NOT encrypted at rest

- Mobile store data (AsyncStorage) — plaintext in the app sandbox
- Computer store data (`%APPDATA%\Jotbunker\stores/`) — plaintext JSON files
- Pairing secret — plaintext on both devices

Jotbunker protects against network eavesdropping and unauthorized device pairing. It does not protect against physical device access with debugging tools or a compromised OS. 

## Disclaimer

This software is provided as-is under the [GPL v3.0](LICENSE). Use at your own risk.
