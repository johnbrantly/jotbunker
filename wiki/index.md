# JotBunker

JotBunker has both phone and computer apps for capture, lists, and the stuff you need to remember offline. No cloud, no accounts, no subscription.

Phone captures fast: text, voice, images, drawings. Computer connects to the phone over your local network, syncing lists, notes, and media. A tagging system stores everything on your hard drive as plain text, image, and audio files. Search them, back them up, or feed them into any knowledge system you want. Nothing leaves your Wi-Fi.

## Core concepts

### [Jots](jots.md)
Six numbered slots for quick capture. Text, drawings, photos, voice recordings, and file attachments, all in one surface. The slot constraint forces intentional capture instead of infinite accumulation. Capture on your phone, download to your computer.

### [Lists](lists.md)
Shopping lists and todos that live on both devices. Six user-named categories. Drag to reorder, swipe to delete, tap to check off. Works offline; syncs when connected.

### [Locked Lists](locked-lists.md)
Biometric-protected reference lists for sensitive info like gate codes, lock combos, membership numbers, anniversaries. Readable without a connection. Private by default: biometric gate on the phone, encrypted on the wire, never touches a cloud.

### [Scratchpads](scratchpads.md)
Six freeform text areas for thinking in progress. Start a brainstorm on your computer, pick it up on your phone. Not a filing cabinet. A whiteboard.

## The system

### [Phone App](phone-app-overview.md)
The capture device. iOS and Android app with four tabs (Jots, Lists, Locked Lists, Scratchpads), settings, and a connect button for syncing with your computer.

### [Computer App](computer-app-overview.md)
The home base. Windows app that connects to your phone, displays everything the phone has, and lets you download, tag, and file jot content to your filesystem.

### [Install and First Run](computer-install-firstrun.md)
Installer, firewall rule, four-step setup wizard (accent color, save folders, network and pairing), and uninstall.

### [Connecting and Sync](sync.md)
Phone connects to computer over local Wi-Fi via WebSocket. Encrypted with NaCl (X25519 key exchange plus secretbox). No internet required. Connect, sync on demand, disconnect when done.

### [Pairing](pairing.md)
One-time QR code scan links your phone to your computer. Establishes a shared pairing secret so only your phone can connect to your computer.

### [Tags and Filing](computer-tags.md)
Computer-side organization. Tag a jot with a label, and its text, images, files, drawings, and audio get filed to a folder on your filesystem. Your files, your folders, your structure.

## Settings and configuration

### [Phone Settings](phone-settings.md)
Full reference for the phone app's settings: sync, screen lock, accent color, font size, and categories.

### [Computer Settings](computer-settings.md)
Full reference for the computer app's settings: network sync, accent color, font size, categories, save folder, backup, debug logging.

### [Palette Theming](theming.md)
HSL-based accent color with a grayscale slider. Default is desaturated steel blue (hue 205, grayscale 75).

### [Security](security.md)
App lock (biometric on resume), locked list auto-lock timeout, encrypted backups, pairing secrets. Transport encryption on every synced message.

### [Backup and Restore](computer-backup.md)
Computer exports encrypted or plaintext backup files. Restore from a file. No cloud involved.

### [System Messages](computer-system-messages.md)
Resizable log panel in the computer's side panel. Rolling fifty-entry feed of saves, downloads, backups, and errors.

### [Debug Logging](debug-logging.md)
A single toggle in the computer's Settings. When on, every WebSocket connection produces a log file under `%APPDATA%\JotBunker\debug-logs\` capturing the full sync conversation. When off, nothing is written.

### [Auto-Updates](computer-auto-updates.md)
The computer app checks for updates on launch. Download and install are user-initiated. You can disable the startup check from the Help menu.

## Pricing

100% free. No in-app purchases, no premium tier, no subscription. All features on all platforms.

## Technical reference

- [Architecture](architecture.md). The three packages and how they fit together.
- [Sync Protocol](sync-protocol.md). Wire format, message types, encryption, conflict resolution.
- [Data Storage](data-storage.md). Where data lives on each platform.
- [Security](security.md). Transport encryption, backup encryption, biometric auth.
