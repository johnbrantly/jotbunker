# Computer App: Install and First Run

## Download

Grab the latest `JotBunker-{version}-setup.exe` from the [Downloads page](https://jotbunker.com).

## Code signing

The Windows installer is digitally signed. Windows SmartScreen shows **John Brantly** as the verified publisher. On a brand-new release SmartScreen may still show a generic warning the first time it runs ("More info" then "Run anyway"). The signature is valid either way; you can verify it by right-clicking the `.exe` and looking at Digital Signatures.

## Install

The installer needs administrator privileges. It needs to create a Windows Firewall rule so your phone can reach the sync server over your local network. A computer you cannot administer is not a bunker.

The installer is a standard wizard:

1. **Welcome.** Click Next.
2. **Install location.** Defaults to `C:\Program Files\JotBunker`.
3. **Firewall rule.** The installer asks whether to create a Windows Firewall inbound rule for the sync server. Click **Yes** (recommended). The rule allows `JotBunker.exe` to accept inbound TCP connections only from devices on your local network (Windows' `LocalSubnet` scope). The public internet is blocked, regardless of how Windows classified your Wi-Fi.
4. **Install.** Files are copied and a desktop shortcut is placed.

On an upgrade over an existing install, the firewall prompt is skipped and the rule is silently re-applied. Your settings and data are preserved.

### What the installer does

- Installs the app to `C:\Program Files\JotBunker`.
- Creates a desktop shortcut and a Start Menu entry.
- Creates a Windows Firewall inbound rule allowing `JotBunker.exe` on TCP, scoped to `LocalSubnet` across Domain, Private, and Public profiles.
- On upgrade, re-applies the firewall rule so older installs converge on the current setting.
- Registers the app in Add/Remove Programs for clean uninstall.

### Why administrator is required

The firewall rule is what lets your phone reach the computer's sync server. Without it, Windows blocks the connection silently or with a generic prompt on first launch. Creating the rule at install time means the app just works the first time you sync.

Per-user installs are not supported because they cannot create firewall rules. Phone sync is the core feature; without it, there is no reason to run the computer app.

### Why `LocalSubnet` instead of Private profile only

Windows classifies every network as Domain, Private, or Public. The right classification for home Wi-Fi is Private, but in practice Windows silently defaults many home networks to Public, and most users never reclassify. A Private-only firewall rule fails on those machines.

Instead, the rule applies on all three profiles but restricts the allowed source to `LocalSubnet`, a Windows Firewall token that resolves to "the IP range on this interface". In practice:

- **Your home LAN.** Devices on the same subnet (your phone, your laptop, your VPN peers) can reach JotBunker.
- **The public internet.** Blocked, regardless of how Windows classified your Wi-Fi.
- **VPNs like ZeroTier or Tailscale.** The virtual adapter has its own subnet; peers on that subnet are allowed automatically.
- **Coffee shop or hotel Wi-Fi.** Other customers on the same Wi-Fi can TCP-connect, but they cannot pair without your pairing secret, and traffic stays encrypted. See [Security](security.md) for ways to tighten this if it concerns you.

## First Run Wizard

On first launch, a four-step wizard sets you up.

### Step 1: Welcome

Introduction screen. Click **GET STARTED**.

### Step 2: Accent Color

Pick your theme with the hue and grayscale sliders. Default is desaturated steel blue. You can change this any time in [Settings](computer-settings.md).

### Step 3: Save Folders

Configure the **Tag Save Folder**, the root directory where tagged content gets filed. Default is `Documents\JotBunker Tags`. Click **CHANGE** to pick a different folder or **SKIP SETUP** to use the default.

### Step 4: Network

Configure the sync server:

- **Adapter.** Pick the network interface your phone will connect through (usually Wi-Fi).
- **Port.** The TCP port the sync server listens on (default 8080).
- **QR Code.** Open the JotBunker phone app, go to Settings, Network Settings, Scan QR Code, and scan the code shown.

Click **FINISH** to complete setup. The app starts and the sync server begins listening.

## After Setup

- Closing the window minimizes to the system tray; the app keeps running.
- Right-click the tray icon for Open, Show on Taskbar, Quit.
- Your phone can now connect any time both devices are on the same network.
- See [Computer Settings](computer-settings.md) for everything you can change.

## Uninstall

Uninstall via Windows **Settings, Apps, JotBunker**. The uninstaller:

- Removes the app and its shortcuts.
- Removes the Windows Firewall rule.
- Cleans up the auto-updater cache.
- Asks whether to remove your app data and settings under `%APPDATA%\JotBunker`.
- Preserves your backups (`%LOCALAPPDATA%\JotBunker\backups`) and your Tag Save Folder. Delete those manually if you no longer need them.

See also: [Computer App](computer-app-overview.md) | [Computer Settings](computer-settings.md) | [Pairing](pairing.md) | [Auto-Updates](computer-auto-updates.md)
