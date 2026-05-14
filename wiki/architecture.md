# Architecture

JotBunker is split into three pieces that share a common foundation. This page gives you a one-page tour for anyone evaluating the project or looking for the right place to make a change.

## The three packages

**Shared.** Plain TypeScript with no platform dependencies. The data shapes, the theme system, the sync engine, and the conflict-resolution logic all live here so the phone and the computer agree on every detail. Both apps import from this package.

**Mobile.** The phone app, built on Expo and React Native. Targets iOS and Android from the same codebase. The mobile app is the capture device: it owns the jots and lets you edit lists and scratchpads on the go. Local data lives in the phone's app sandbox.

**Computer.** The desktop app, built on Electron for Windows. The computer app is the home base. It runs a small WebSocket server on your local network that your phone connects to. Local data lives under `%APPDATA%\JotBunker\` as plain JSON files plus your backups and downloads.

## How they talk

The computer listens on a port (default 8080). The phone connects directly over your local Wi-Fi. Every message after the initial key exchange is encrypted with NaCl. There is no cloud relay, no account server, and no internet requirement once the two devices are paired.

Sync is on demand. The phone never connects on its own; you tap a button. When the computer says SYNC NOW, both sides exchange state and run an automatic merge that keeps both sides' changes. Jot media (drawings, audio, images, files) flows one direction: phone to computer.

## Key design choices

**Offline first.** The phone works fully without a connection. The computer works without a phone too. Sync is the bridge, not the source of truth.

**No real-time sync.** Sync only runs when the user asks. This keeps the protocol simple and lets each device be the authority on its own data between syncs.

**Same data shape on both sides.** Lists, locked lists, scratchpads, and categories all live in the shared package's data model so the merge has clean inputs.

**Two safety nets on top of automatic merge.** Most syncs need no human input. Two rare dialogs exist for the cases where the merge cannot resolve cleanly on its own. See [Sync](sync.md) and [Sync Protocol](sync-protocol.md).

**One toggle for debug.** When something looks wrong, the computer's DEBUG LOGGING setting captures the full sync conversation to a per-connection log file. The phone always emits its events over the wire; the computer decides whether to write them to disk.

## Build picture

The computer app builds with electron-vite and ships through electron-builder. The phone app builds with EAS Build (Expo's cloud build) for production releases. Both can run locally for development.

Tests run with Vitest across the shared, mobile, and computer projects.

For deeper technical detail, see [Sync Protocol](sync-protocol.md) and [Data Storage](data-storage.md).
