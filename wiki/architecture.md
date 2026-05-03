# Architecture

Monorepo with three packages: shared foundation, mobile app, computer app.

---

## Monorepo layout

```
jotbunker/                        # npm workspaces root
├── packages/
│   ├── shared/                   # Pure TypeScript library
│   ├── mobile/                   # Expo Router app (iOS/Android)
│   └── desktop/                  # Electron + electron-vite (Windows)
├── wiki/                         # This documentation
├── vitest.config.ts              # Multi-project test config
└── .github/workflows/release.yml # Tag → Windows build → GitHub release
```

## Shared package (`packages/shared/`)

Pure TypeScript — no platform dependencies. Both mobile and desktop import from `@jotbunker/shared`. Contains:

- **Types** — `ListItem`, `Category`, `MergeStores`, plus the wire-protocol message types
- **Constants** — version, jot count (6), default categories, input modes
- **Theme** — `buildTheme(hue, grayscale)` generates the full color palette
- **Sync engine** — `SyncEngine`, `SyncPhaseManager`, `SyncTransport`, protocol types, diff/report computation (`syncReport.ts`), sync logging
- **Store utilities** — `createItemSlice` factory for lists/lockedLists

## Mobile package (`packages/mobile/`)

Expo SDK 54 app with Expo Router navigation. Targets iOS and Android.

- **Stores:** Zustand with AsyncStorage persistence; sync drives store updates from the engine, not via middleware
- **Transport:** Direct WebSocket (`MobileTransport`) with NaCl encryption via `react-native-quick-crypto`
- **Build profiles:** Dev (with expo-dev-client), Preview (standalone), Production (App Store). Controlled by `EAS_BUILD_PROFILE` env var → conditional autolinking exclusion in `app.config.ts`

## Computer package (`packages/desktop/`)

Electron 35 with electron-vite. Windows only.

- **Main process:** WebSocket server (`syncServer.ts`), file cache, download/export, IPC handlers
- **Renderer:** React 19 SPA with Zustand stores, IPC-based sync transport
- **Preload:** `contextBridge` exposes ~35 whitelisted API methods (no raw `ipcRenderer`)

## Dependency strategy

- Use `npx expo install` for Expo packages (picks SDK-compatible versions)
- Never use raw `npm install <package>` for Expo deps
- Platform-specific fixes stay on the platform side (gradle for Android, Podfile for iOS)
- No shared npm resolution hacks (`.npmrc`, `legacy-peer-deps`, postinstall)

## Build system

| Platform | Tool | Trigger |
|---|---|---|
| iOS | EAS Build (`--local`) on Mac Mini | Manual — `~/build-{dev,preview,prod}-jotbunker.sh` |
| Android (emulator) | `build-android-emu.ps1` + `adb reverse` + `npx expo start --localhost` | Manual |
| Android (device) | `build-android.ps1` + `adb reverse` + `npx expo start --localhost` | Manual |
| Computer | electron-vite + electron-builder | `npm run dist` locally, or push `v*` git tag for GitHub Actions CI |
| Tests | Vitest 3 | `npm test` (runs shared, mobile, computer projects) |

## Key design decisions

- **Zustand everywhere** — same store pattern on both platforms, shared `createItemSlice` factory
- **Sync via the engine** — `SyncEngine` orchestrates the wire protocol; `desktopPlatform.handleStateSync` and `mobilePlatform.handleSyncConfirm` apply state directly to stores after a user picks DESKTOP WINS or PHONE WINS
- **No `.ios.tsx`/`.android.tsx` files** — minimal `Platform.OS` checks, cross-platform by default
- **Computer is the server** — phone initiates connections; computer listens on a configurable port
- **Offline-first, user-resolved sync** — both devices work independently; when you sync, the computer prompts you to pick which side wins (Lists / Locked Lists / Scratchpad replaced wholesale on the losing side; Jots are phone → computer only)

---

See also: [Sync Protocol](sync-protocol.md) | [Data Storage](data-storage.md)
