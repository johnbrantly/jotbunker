# Computer App — Install & First Run

## Download

Download the latest `Jotbunker-{version}-setup.exe` from the [Downloads](https://jotbunker.com) page.

## Install

The installer requires **administrator privileges**. This is intentional — Jotbunker needs to create a Windows Firewall rule so your phone can connect to the sync server over your local network. A system you don't have admin access to isn't a bunker.

The installer presents a standard wizard:

1. **Welcome** — click Next
2. **Install location** — defaults to `C:\Program Files\Jotbunker`. You can change this if needed.
3. **Firewall rule** — the installer asks whether to create a Windows Firewall inbound rule for the sync server. Click **Yes** (recommended) — this lets your phone connect to the computer over your local network. If you decline, Windows will show its own firewall prompt on first launch instead.
4. **Install** — files are copied, desktop shortcut is placed

On **upgrades** (installing a new version over an existing one), the firewall prompt is skipped automatically if the rule already exists. Your settings and app data are preserved.

### What the installer does

- Installs the app to `C:\Program Files\Jotbunker`
- Creates a desktop shortcut and Start Menu entry
- Asks to create a Windows Firewall inbound rule allowing `Jotbunker.exe` on TCP (first install only — skipped on upgrades if rule exists)
- Registers in Add/Remove Programs for clean uninstall

### Why administrator is required

The firewall rule is what lets your phone reach the computer's sync server. Without it, Windows blocks the connection and you'd get a firewall prompt on first launch with no context. By creating the rule at install time, the app just works — connect your phone and sync.

Per-user installs are not supported because they cannot create firewall rules. Phone sync is the core feature of the computer app — without it, there's no reason to run it.

---

## First Run Wizard

On first launch, a 4-step wizard walks you through setup:

### Step 1 — Welcome
Introduction screen. Click **GET STARTED**.

### Step 2 — Accent Color
Pick your theme using the hue and grayscale sliders. Default is desaturated steel blue (hue 205, grayscale 75). You can always change this later in [Settings](computer-settings.md).

### Step 3 — Save Folders
Configure the **Tag Save Folder** — the root directory where tagged content is filed. Defaults to `Documents\Jotbunker Tags`. Click **CHANGE** to pick a different folder, or **SKIP SETUP** to use the default.

### Step 4 — Network
Configure the sync server:

- **Adapter** — select the network interface your phone will connect through (typically your Wi-Fi adapter)
- **Port** — the TCP port the sync server listens on (default 8080)
- **QR Code** — a pairing code is generated automatically. Open the Jotbunker phone app, go to Settings → Network Settings → Scan QR Code, and scan this code to pair your devices

Click **FINISH** to complete setup. The app starts and the sync server begins listening.

---

## After Setup

- The app minimizes to the **system tray** when you close the window (it doesn't quit)
- Right-click the tray icon for options (Open, Show on Taskbar, Quit)
- Your phone can now connect whenever both devices are on the same network
- See [Computer Settings](computer-settings.md) for all configurable options

---

## Uninstall

Uninstall via **Settings → Apps → Jotbunker** (Add/Remove Programs). The uninstaller:

- Removes the app and desktop/Start Menu shortcuts
- Removes the Windows Firewall rule
- Cleans up the auto-updater cache
- **Asks** whether to remove your app data and settings (`%APPDATA%\Jotbunker`)
- **Preserves** your backups (`%LOCALAPPDATA%\Jotbunker\backups`), Tag Save Folder, and Downloads — delete these manually if you no longer need them

---

See also: [Computer App](computer-app-overview.md) | [Computer Settings](computer-settings.md) | [Pairing](pairing.md) | [Auto-Updates](computer-auto-updates.md)
