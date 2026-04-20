# Computer App — Install & First Run

## Download

Download the latest `JotBunker-{version}-setup.exe` from the [Downloads](https://jotbunker.com) page.

## Code signing

The Windows installer is digitally signed. When you run it, Windows SmartScreen shows **John Brantly** as the verified publisher instead of the "Unknown publisher" warning older versions displayed. Over time, as more users install signed releases, SmartScreen builds reputation and eventually stops prompting entirely.

If SmartScreen still shows a generic blue warning the first time you run a new version, click **More info** → **Run anyway**. This is normal for new releases until reputation accumulates; the signature is still valid and verifiable (right-click the `.exe` → Properties → Digital Signatures).

## Install

The installer requires **administrator privileges**. This is intentional — JotBunker needs to create a Windows Firewall rule so your phone can connect to the sync server over your local network. A system you don't have admin access to isn't a bunker.

The installer presents a standard wizard:

1. **Welcome** — click Next
2. **Install location** — defaults to `C:\Program Files\JotBunker`. You can change this if needed.
3. **Firewall rule** — the installer asks whether to create a Windows Firewall inbound rule for the sync server. Click **Yes** (recommended). The rule allows `JotBunker.exe` to accept inbound TCP connections only from devices on your **local network** (Windows' `LocalSubnet` scope). The public internet is blocked regardless of how Windows has classified your Wi-Fi. If you decline, Windows will show its own firewall prompt on first launch instead.
4. **Install** — files are copied, desktop shortcut is placed

On **upgrades** (installing a new version over an existing one), the firewall prompt is skipped automatically. The installer silently re-applies the rule with the current recommended scope, so installs from 1.0.1 through 1.0.5 (which used a broader `profile=any` rule with no remote-IP restriction) end up converged on the 1.0.6 definition. Your settings and app data are preserved.

### What the installer does

- Installs the app to `C:\Program Files\JotBunker`
- Creates a desktop shortcut and Start Menu entry
- Asks to create a Windows Firewall inbound rule allowing `JotBunker.exe` on TCP, limited to `LocalSubnet` across Domain, Private, and Public profiles (first install only, skipped on upgrades if rule exists)
- On upgrade, silently re-applies the rule so installs from older versions are converged on the current scope
- Registers in Add/Remove Programs for clean uninstall

### Why administrator is required

The firewall rule is what lets your phone reach the computer's sync server. Without it, Windows blocks the connection and you'd get a firewall prompt on first launch with no context. By creating the rule at install time, the app just works: connect your phone on your home Wi-Fi and sync.

Per-user installs are not supported because they cannot create firewall rules. Phone sync is the core feature of the computer app; without it, there's no reason to run it.

### Why `LocalSubnet` instead of Private-profile-only

Windows classifies every network you connect to as Domain, Private, or Public. The right classification for home Wi-Fi is Private, but in practice Windows silently defaults many home networks to Public (especially if the user declined network discovery on first connect), and most users never reclassify. A Private-only firewall rule breaks JotBunker on those machines and triggers a Windows firewall prompt every launch.

Instead, the rule applies across Domain, Private, and Public profiles but restricts the allowed source to `LocalSubnet` — a built-in Windows Firewall token that resolves per-adapter to "the IP range on this interface." The practical effect:

- **Your home LAN** (regardless of how Windows classified it): devices on the same subnet as your computer can reach JotBunker. Your phone, is one of those devices.
- **The public internet**: blocked. Your computer is not reachable from outside your network even if your router somehow forwarded the port.
- **A VPN like ZeroTier or Tailscale**: the virtual adapter has its own subnet; peers on that subnet are allowed. No extra rule required even for the niche "use my VPN to reach my own devices" case.
- **Coffee-shop or hotel Wi-Fi**: other customers on the same Wi-Fi (same subnet) can TCP-connect. They cannot actually pair without your pairing secret, and traffic stays NaCl-encrypted, but if that residual exposure concerns you, see [Security](security.md) for tightening options.

If you want to tighten this further (restrict to Private profile only, a specific LAN subnet, or a specific phone IP), see [Security](security.md).

---

## First Run Wizard

On first launch, a 4-step wizard walks you through setup:

### Step 1 — Welcome
Introduction screen. Click **GET STARTED**.

### Step 2 — Accent Color
Pick your theme using the hue and grayscale sliders. Default is desaturated steel blue (hue 205, grayscale 75). You can always change this later in [Settings](computer-settings.md).

### Step 3 — Save Folders
Configure the **Tag Save Folder** — the root directory where tagged content is filed. Defaults to `Documents\JotBunker Tags`. Click **CHANGE** to pick a different folder, or **SKIP SETUP** to use the default.

### Step 4 — Network
Configure the sync server:

- **Adapter** — select the network interface your phone will connect through (typically your Wi-Fi adapter)
- **Port** — the TCP port the sync server listens on (default 8080)
- **QR Code** — a pairing code is generated automatically. Open the JotBunker phone app, go to Settings → Network Settings → Scan QR Code, and scan this code to pair your devices

Click **FINISH** to complete setup. The app starts and the sync server begins listening.

---

## After Setup

- The app minimizes to the **system tray** when you close the window (it doesn't quit)
- Right-click the tray icon for options (Open, Show on Taskbar, Quit)
- Your phone can now connect whenever both devices are on the same network
- See [Computer Settings](computer-settings.md) for all configurable options

---

## Uninstall

Uninstall via **Settings → Apps → JotBunker** (Add/Remove Programs). The uninstaller:

- Removes the app and desktop/Start Menu shortcuts
- Removes the Windows Firewall rule
- Cleans up the auto-updater cache
- **Asks** whether to remove your app data and settings (`%APPDATA%\JotBunker`)
- **Preserves** your backups (`%LOCALAPPDATA%\JotBunker\backups`), Tag Save Folder, and Downloads — delete these manually if you no longer need them

---

See also: [Computer App](computer-app-overview.md) | [Computer Settings](computer-settings.md) | [Pairing](pairing.md) | [Auto-Updates](computer-auto-updates.md)
