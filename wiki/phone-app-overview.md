# Phone App

iOS and Android app built with Expo. The capture side of JotBunker: four tabs, offline-first, no account required.

## Layout

Four tabs across the bottom:

- **Jots.** Six quick-capture slots. See [Jots](jots.md).
- **Lists.** Todo lists with categories. See [Lists](lists.md).
- **Locked Lists.** Biometric-gated reference lists. See [Locked Lists](locked-lists.md).
- **Scratchpads.** Freeform text by category. See [Scratchpads](scratchpads.md).

The top bar shows the sync status (DISCONNECTED / CONNECTING / CONNECTED), a Sync button, and a settings gear. The phone never connects on its own; you tap the Sync button.

## First launch

A setup wizard walks you through two steps:

1. **Welcome.** Intro screen.
2. **Accent color.** Pick your theme hue and grayscale.

Pairing with your computer is done later from settings or the scan-QR screen. See [Pairing](pairing.md).

## Settings

Settings is a modal overlay. Five sections: Computer Sync, Screen Lock, Accent Color, Font Size, Categories. See [Phone Settings](phone-settings.md) for the full reference.

## Offline-first

Everything works without a network connection. Data persists on the device. Sync is an on-demand state exchange: when you connect and sync, the computer runs an automatic merge so both sides' edits survive without you picking a winner.

See also: [Computer App](computer-app-overview.md) | [Sync](sync.md) | [Pairing](pairing.md)
