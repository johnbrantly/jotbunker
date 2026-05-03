# JotBunker Changelog

## [v1.0.7] - 2026-05- 02
- Android: updated adaptive-icon.png with more padding for proper logo image centering
- Mobile: fix drag-and-hold gesture missing on Lists / Locked Lists by memoizing RowItem
- Sync: replace LWW (Last-Write-Wins) merge for Lists / Locked Lists / Scratchpad with mandatory user choice on every sync (DESKTOP WINS / PHONE WINS / CANCEL, 60-second auto-cancel). Jots sync is unchanged.
- Settings: removed the "SYNC CONFIRMATION OFF/ON" toggle (sync now always prompts); the section becomes "SYNC HISTORY" and keeps the VIEW SYNC HISTORY button
- Sync simplification after daily use test/hardening: removed all auto-connect and auto-sync features. Phone no longer auto-connects on app open or foreground; user taps Connect. Phone settings "Auto-connect" and "Sync on auto-connect" toggles removed. Computer "AUTO SYNC" toggle and delay slider removed. Connecting no longer triggers an automatic state exchange; sync only happens when the user clicks SYNC NOW on the computer. Keep Awake feature unchanged.


## [v1.0.6] - 2026-04-20

**Desktop-only release.** 

- Fix Windows installer firewall rule: scoped to `LocalSubnet` across Domain, Private, and Public profiles
- Upgrade self-heal: existing 1.0.1-1.0.5 installs (which shipped `profile=any` with no remote-IP restriction) silently
- Updated installer consent prompt text to accurately describe the `LocalSubnet` scope
- Wiki: new firewall-rule verification section, four-entry deviations list, tightening guide in Security docs

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
