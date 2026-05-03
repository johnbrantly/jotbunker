# JotBunker

JotBunker has both phone and computer apps for capture, lists, and the stuff you need to remember offline.  No cloud, no accounts, no subscription.

Phone captures fast — text, voice, images, drawings. Computer connects to the phone over your local network, syncing lists, notes, and media.  Tagging system and permanent storage on your hard drive as simple raw text, image, and audio files.  Search or integrate with knowledge retrieval systems on your own terms. Nothing leaves your Wi-Fi.

---

## Core Concepts

### [Jots](jots.md)
Six numbered slots for quick capture. Text, drawings, photos, voice recordings, and file attachments — all in one surface. The slot constraint forces intentional capture instead of infinite accumulation. Capture on your phone, download to your computer.

### [Lists](lists.md)
Shopping lists and to-dos that live on both devices. Six user-named categories. Drag to reorder, swipe to delete, tap to check off. Works offline, syncs when connected.

### [Locked Lists](locked-lists.md)
Biometric-protected reference lists for sensitive info — lock combos, gate codes, membership numbers, anniversaries. Readable without a connection. Private by default: biometric gate on the phone, encrypted on the wire, never touches a cloud.

### [Scratchpads](scratchpads.md)
Six freeform text areas for thinking in progress. Start a brainstorm on your computer, pick it up on your phone. Not a filing cabinet — a whiteboard.

---

## The System

### [Phone App](phone-app-overview.md)
The capture device. iOS and Android app with four tabs (Jots, Lists, Locked Lists, Scratchpads), settings, and a connect button for syncing with your computer.

### [Computer App](computer-app-overview.md)
The home base. Windows app that connects to your phone, displays everything the phone has, and lets you download, tag, and file jot content to your filesystem.

### [Install & First Run](computer-install-firstrun.md)
Installer, firewall rule, 4-step setup wizard (accent color, save folders, network/pairing), and uninstall.

### [Connecting & Sync](sync.md)
Phone connects to computer over local Wi-Fi via WebSocket. Encrypted with NaCl (X25519 key exchange + secretbox). No internet required. Connect, sync on demand, disconnect when done.

### [Pairing](pairing.md)
One-time QR code scan links phone to computer. Establishes a shared pairing secret so only your phone can connect to your computer.

### [Tags & Filing](computer-tags.md)
Computer-side organization. Tag a jot with a label, and its text, images, files, drawings, and audio get filed to a folder on your filesystem. Your files, your folders, your structure.

---

## Settings & Configuration

### [Phone Settings](phone-settings.md)
Full reference for all phone app settings — sync, screen lock, accent color, font size, categories, debug logging.

### [Computer Settings](computer-settings.md)
Full reference for all computer app settings: network sync, accent color, font size, categories, save folder, backup, debug logging, sync history.

### [Sync Preview & History](computer-settings-sync-history.md)
The mandatory SYNC PREVIEW dialog (DESKTOP WINS / PHONE WINS / CANCEL with a 60-second auto-cancel) and the sync history viewer.

###  [Palette Theming](theming.md)
HSL-based accent color with a grayscale desaturation slider.  Default: desaturated steel blue (hue 205, grayscale 75).

### [Security](security.md)
App lock (biometric on resume), locked list auto-lock timeout, encrypted backups, pairing secrets. Transport encryption on every synced message.

### [Backup & Restore](computer-backup.md)
Computer exports encrypted or plaintext backup files. Restore from file. No cloud involved.

### [System Messages](computer-system-messages.md)
Resizable log panel in the computer's side panel. Rolling 50-entry feed of saves, downloads, sync events, backups, and errors. Persists to `system-messages.log`.

### [Debug Logging](debug-logging.md)
Toggle in settings. Writes sync protocol logs to `%APPDATA%\JotBunker\debug-logs\` — computer and phone logs side by side.

### [Auto-Updates](computer-auto-updates.md)
Computer app checks for updates on launch. Download and install are user-initiated. Disable via Help menu.

---

## Pricing

100% free. No in-app purchases, no premium tier, no subscription. All features on all platforms.

---

## Technical Reference

- [Architecture](architecture.md) — monorepo layout, shared package, platform packages
- [Sync Protocol](sync-protocol.md) — wire format, message types, encryption, state merge
- [Data Storage](data-storage.md) — where data lives on each platform, persistence
- [Security](security.md) — transport encryption (NaCl), backup encryption (AES-GCM), biometric auth
