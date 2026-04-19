# JotBunker Changelog

## [v1.0.5] - 2026-04-19

- Add Microsoft Azure Artifact Signing to Windows installer
- Fix github issue #2 Files downloading to Jotbunker Downloads errantly
- Fix Jots - audio recording while connected to computer causes issues
- Fix Jots - scrolling for 3 or more audio recordings on phone
- Fix Jots to Computer transfer - picked-file URI sandboxing (image + file attachments)
- Fix Jots to Computer transfer - sync all - would miss finger drawings
- Added mutex while jot data transferred-cached for sync and download buttons
- Jots - File - use same pattern for delete as audio - red x instead of tap and hold
- Add 1024x1024 adaptive-icon for android
- usesCleartextTraffic: true in app.config.ts for android to fix sync connection

## [v1.0.4] - 2026-04-17

- Prep for android submission:
- Fix double DONE button in Settings on iPhone when editing category
- Android: keyboard-dismiss on tap-anywhere-above-keyboard
- Truncate category pill text if over 7 chars instead of auto-shrinking
- Improve text sizing on category pills
- Tweak font contrast for less eye strain
- Tweak design of bottom nav + strip tray for cross-platform consistency

## [v1.0.3] - 2026-04-16
- Prep for android submission:
- Move Ionicons to the simple-string variant of the expo-font plugin
- Ionicons fontFamily must be lowercase `ionicons`, not `Ionicons`
- Fix Android top-chrome icons (gear, link) by native-embedding Ionicons.ttf
- Copy font TTFs into project assets for the expo-font Android plugin
- Fix production Android hang by deleting stale monorepo Metro overrides
- Finish rebrand "Jotbunker" → "JotBunker" in all UI and docs

## [v1.0.2] - 2026-04-14
- Start rebrand "Jotbunker" → "JotBunker" in all UI and docs
- fix slider on desktop settings 
- settings tweak for desktop scrollbar
- Settings and About — Add Privacy Link
- updated help-about and settings on phone with copyright and website link
- Update Test Case Coverage
- make download button not red

## [v1.0.1] - 2026-04-13
- FIRST PUBLIC RELEASE
- Auto-Updater Improvements and Upgrade Bug Fixes
- Installer Creates Firewall Rule — Application Not Port
- Cleanup NSIS Installer / Uninstaller for Electron Computer App
