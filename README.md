# Jotbunker

A cross-platform note-taking and quick-capture app. Your phone captures jots — text, drawings, images, files, and audio — across 6 numbered slots. Your computer connects over your local network to sync and archive everything. 100% free, no accounts, no cloud.

## Features

- **6 Jots** — quick-capture slots for text, drawings, images, files, and audio recordings
- **Lists** — drag-to-reorder checklists with 6 categories
- **Locked Lists** — biometric/passcode-protected lists
- **Scratchpad** — freeform text notes with 6 categories
- **Encrypted LAN Sync** — phone and computer sync over your local network using NaCl encryption (X25519 + secretbox)
- **Computer Archiving** — download jot content, file to tagged folders, backup/restore
- **Auto-Updater** — computer app checks for updates automatically

## Stack

| Layer | Technology |
|-------|-----------|
| Phone | Expo SDK 54 (iOS / Android) |
| Computer | Electron 35 (Windows) |
| UI | React 19, TypeScript |
| State | Zustand 5 |
| Encryption | TweetNaCl |

Monorepo with npm workspaces: `packages/shared`, `packages/mobile`, `packages/desktop`.

## Building from Source

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

```bash
npm install
```

This installs all workspaces (shared, mobile, desktop).

### Computer App (Electron)

```bash
cd packages/desktop
npm run dev          # dev mode with hot-reload
npm run dist         # build distributable installer
```

### Phone App (Expo)

Requires a development build on your device. See [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).

```bash
cd packages/mobile
npx expo start       # start dev server
```

### Tests

```bash
npm test             # run all tests
npm run test:shared  # shared package only
npm run test:mobile  # mobile package only
npm run test:desktop # desktop package only
```

## License

GPL-3.0 — see [LICENSE](LICENSE).

## Contributions

Not accepting contributions at this time.
