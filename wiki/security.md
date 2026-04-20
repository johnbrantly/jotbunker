# Security

JotBunker secures sync with transport encryption, a pairing secret, and a LAN-only firewall rule. This page documents each — and the honest limits of all three.

---

## Transport encryption

All sync traffic between phone and computer is encrypted with NaCl secretbox after an X25519 key exchange. Each connection generates fresh ephemeral keypairs — no long-lived keys. The shared secret is derived with `nacl.box.before()` and used for `nacl.secretbox()` with random 24-byte nonces. See [Sync Protocol](sync-protocol.md) for the wire-level details.

## Pairing secret

The pairing secret (a random UUID) is the only authentication factor. It's established during [pairing](pairing.md) and validated during every handshake using a timing-safe comparison. The secret is transmitted only inside the encrypted channel — never in plaintext on the wire.

**Storage:** The pairing secret is stored in plaintext on both devices (AsyncStorage on mobile, JSON file on the computer). It is not protected by the OS keychain. On a jailbroken phone or a shared Windows account, the secret is readable from disk.

## App lock

When enabled, the phone app requires biometric authentication or device passcode/PIN/pattern when resuming from the background. This is a UI gate — it doesn't encrypt or decrypt anything.

## Locked lists

The Locked Lists tab requires biometric authentication or device credentials on the phone. On the computer, locked lists are not gated — the assumption is your computer is already a secured environment. This protects against casual shoulder-surfing on the phone, not forensic extraction. The locked list data is stored in the same plaintext stores as regular lists — AsyncStorage on mobile, JSON files on the computer. See [Locked Lists](locked-lists.md).

## Backup encryption

Computer backups can be encrypted with a user-provided password using AES-GCM with PBKDF2 key derivation. Plaintext backups are also available. See [Backup](computer-backup.md).

## What is NOT encrypted at rest

- All mobile store data (AsyncStorage) — plaintext in the app sandbox
- All computer store data (`%APPDATA%\JotBunker\stores/`) — plaintext JSON files
- Computer jot media held in memory (not cached to disk)
- Pairing secret — plaintext on both devices

## Network exposure (Windows Firewall)

JotBunker needs an inbound firewall rule so the phone can reach the computer's sync server over your local network. The installer creates one at install time with these properties:

- **App-scoped**, not port-scoped — only `JotBunker.exe` can receive inbound traffic. No other program on your computer gets a new firewall exception. Changing the sync port in Settings does not require a firewall update.
- **TCP inbound only** — outbound traffic and UDP are untouched.
- **Active on Domain, Private, and Public profiles** — so the rule works regardless of how Windows has classified your current Wi-Fi. Most home networks are classified Public by default on Windows, and most users never reclassify them; a Private-only rule would silently fail on those machines.
- **Remote IP restricted to `LocalSubnet`** — a Windows Firewall token that resolves per-adapter to "same IP range as this interface." The public internet is blocked on every profile.

This matches the LAN pinhole story: the rule allows a path from devices on the local network to JotBunker, not a path from the public internet. The phone, your other computers, your VPN peers — all typically on a local subnet — reach JotBunker. A random IP from the internet does not.

### Verify your installed rule

Run this in any command prompt (no admin required to view):

```
netsh advfirewall firewall show rule name="Jotbunker" verbose
```

Expected output:

```
Rule Name:     Jotbunker
Enabled:       Yes
Direction:     In
Profiles:      Domain,Private,Public
LocalIP:       Any
RemoteIP:      LocalSubnet
Protocol:      TCP
LocalPort:     Any
RemotePort:    Any
Program:       C:\Program Files\Jotbunker\Jotbunker.exe
Action:        Allow
```

If your output matches the above line-for-line, your installed rule is the current recommended default. A few common deviations and what they mean:

- `Profiles: Domain,Private,Public` but `RemoteIP: Any` — you have a legacy 1.0.1-1.0.5 rule (`profile=any`, no IP restriction). Upgrade to 1.0.6 or later to converge.
- `Profiles: Private` (without Domain and Public) — you've manually tightened to Tier 1 below. JotBunker will only work when Windows has classified the active network as Private; run `Get-NetConnectionProfile` to confirm.
- `RemoteIP` shows a specific IP or list of IPs rather than `LocalSubnet` — you (or an admin) have applied Tier 2 below. Intentional; leave alone if that's what you wanted.
- More than one `Jotbunker` rule appears — either you have a leftover **Block** rule from a dismissed Windows Defender prompt (see below for cleanup), or you added a deliberate carve-out. List all matching rules with `Get-NetFirewallRule -DisplayName "Jotbunker*"` to see what's there.

To clean up any leftover Block rules (they silently override the Allow rule on their profile), run elevated.  **Warning, this will delete the rule** and you will have to reinstall Jotbunker, or manually recreate the rule for Jotbunker sync to continue working:

```powershell
Get-NetFirewallRule -DisplayName "Jotbunker*" | Where-Object { $_.Action -eq 'Block' } | Remove-NetFirewallRule
```

### Want to lock it down further

Even with `LocalSubnet` scoping, the default rule allows any device on your current subnet to reach JotBunker. The honest threat model is **"another device on my local network got compromised and is now poking around"** — a kid's tablet, a smart TV, an IoT bulb, another customer on a coffee-shop Wi-Fi. JotBunker's own pairing secret protects against unauthorized pairing in those scenarios, and sync traffic is NaCl-encrypted end-to-end. But if subnet-wide exposure isn't tight enough for your risk tolerance, you can narrow it:

- **Tier 1 (restrict to Private profile only).** Edit the `Jotbunker` rule's Advanced tab in Windows Defender Firewall and uncheck Domain and Public. The rule will now only apply on networks Windows has classified as Private. **Important first:** verify your Wi-Fi is actually classified Private — on many Windows installs it isn't, and this tier will silently break sync if you skip the check. Elevated PowerShell:
    ```powershell
    Get-NetConnectionProfile | Select Name, InterfaceAlias, NetworkCategory
    ```
    If your Wi-Fi shows `Public`, set it to Private first:
    ```powershell
    Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
    ```
    Then apply Tier 1. Result: JotBunker is reachable only on networks you've explicitly marked as home or work, and silently blocked everywhere else. Good for travelers who use public Wi-Fi often.

- **Tier 2 (restrict to a specific phone IP).** Open the `Jotbunker` rule's Scope tab and replace `LocalSubnet` under Remote IP address with just your phone's LAN IP. Give your phone a DHCP reservation on your router so the IP doesn't change. Now only that specific phone can connect. Combine with Tier 1 for "only this phone, only on my home network."

- **Tier 3 (replace the app rule with a port rule).** Delete the installer's `Jotbunker` rule. Create a new inbound rule for TCP port 8080 only, scoped to your phone's IP, Private profile only. Tightest setup — also means you'll need to update the rule if you change the sync port in Settings.

- **VPN / ZeroTier carve-out.** The default `LocalSubnet` rule already covers the common case of "reach my own devices via VPN." If your VPN network has authorized members other than your own devices, create a separate Public-scoped allow rule limited to the specific peer IPs you want to reach JotBunker, using a distinct rule name so it survives upgrades (the installer's self-heal only touches rules named exactly `Jotbunker`).

None of the tiers is required for normal use. The default is appropriately scoped for the home-network use case and defense-in-depth against typical coffee-shop scenarios.

## Threat model

JotBunker protects against:
- **Network eavesdropping** — all sync traffic is encrypted
- **Unauthorized device pairing** — pairing secret required
- **Casual access to locked lists** — biometric/password gate
- **Reachability from the public internet** — Windows Firewall rule is scoped to `LocalSubnet` on every profile

JotBunker does **not** protect against:
- **Physical device access** with debugging tools (data is plaintext at rest)
- **Compromised OS** (jailbreak, malware with file access)
- **Brute force on backup passwords** (PBKDF2 iteration count is 100k)
- **A compromised device on your own subnet** TCP-connecting to the sync port (the firewall rule allows any peer on the same subnet; pairing secret + NaCl encryption remain the app-layer gates; see "Want to lock it down further" above for Tier 1/2/3 mitigations)

---

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Backup](computer-backup.md) | [Data Storage](data-storage.md)
