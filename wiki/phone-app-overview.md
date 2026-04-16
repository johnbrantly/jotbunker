# Phone App

iOS and Android app built with Expo. The capture side of JotBunker:  four tabs, offline-first, no account required.

---

## Layout

Four tabs across the bottom:
- **Jots** — six quick-capture slots ([details](jots.md))
- **Lists** — todo lists with categories ([details](lists.md))
- **Locked Lists** — biometric-gated reference lists ([details](locked-lists.md))
- **Scratchpads** — freeform text by category ([details](scratchpads.md))

Top bar shows sync status (DISCONNECTED / CONNECTING / CONNECTED), a Sync button, and a settings gear. Auto-connect and auto-sync can be enabled in settings.

## First launch

A setup wizard walks you through two steps:
1. **Welcome** — intro screen
2. **Accent color** — pick your theme hue and grayscale

Pairing with your computer is done later from settings or the scan-QR screen ([details](pairing.md)).

## Settings

Settings is a modal overlay with blur background. Six sections: Computer Sync, Screen Lock Options, Accent Color, Font Size, Categories, and Debug Logging. See [Phone Settings](phone-settings.md) for full reference.

## Offline-first

Everything works without a network connection. Data persists in AsyncStorage on the device. Sync is an on-demand state exchange — when you connect and sync, both devices merge their states.

---

See also: [Computer App](computer-app.md) | [Sync](sync.md) | [Pairing](pairing.md)
