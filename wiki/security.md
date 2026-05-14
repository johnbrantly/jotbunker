# Security

JotBunker secures sync with transport encryption, a pairing secret, and a LAN-only firewall rule. This page covers each of those and the honest limits.

## Transport encryption

All sync traffic between phone and computer is encrypted with NaCl after an X25519 key exchange. Each connection generates fresh ephemeral keys; no long-lived keys are stored. The shared secret only exists for the lifetime of the connection. See [Sync Protocol](sync-protocol.md) for wire-level details.

## Pairing secret

The pairing secret is a random UUID created during the setup wizard. It is the only authentication factor for sync. Every handshake includes the secret, validated with a timing-safe comparison. The secret is sent only inside the encrypted channel, never in the clear.

**Storage.** The pairing secret is stored as plain text on both devices (on the phone in the app's private sandbox, on the computer in a JSON file). It is not protected by the OS keychain. On a jailbroken phone or a shared Windows account, the secret is readable from disk.

## App lock

When enabled, the phone app requires biometric authentication or your device passcode when it resumes from the background. This is a UI gate; it does not encrypt or decrypt anything.

## Locked lists

The Locked Lists tab on the phone requires biometric authentication or device credentials before showing. On the computer, locked lists are not gated; the assumption is your computer is already a secured environment. The data is stored as plain text on disk on both devices, the same as regular lists. The biometric prompt is a UI barrier, not a cryptographic one. See [Locked Lists](locked-lists.md).

## Backup encryption

Computer backups can be encrypted with a password you choose using AES-GCM with PBKDF2 key derivation. Plaintext backups are also available. See [Backup & Restore](computer-backup.md).

## What is NOT encrypted at rest

- All mobile data is stored as plain text in the phone app's sandbox.
- All computer data under `%APPDATA%\JotBunker\stores\` is plain JSON.
- Jot media on the computer is held in memory only, not cached to disk.
- The pairing secret is plain text on both devices.

## Network exposure (Windows Firewall)

JotBunker needs a Windows Firewall inbound rule so the phone can reach the sync server over your local network. The installer creates a rule with these properties:

- **App-scoped, not port-scoped.** Only `JotBunker.exe` gets the exception. Changing the sync port in Settings does not require updating the firewall.
- **TCP inbound only.** Outbound traffic and UDP are untouched.
- **All three profiles.** The rule is active on Domain, Private, and Public. Many home networks default to Public on Windows and most users never reclassify them; a Private-only rule would silently fail on those machines.
- **`LocalSubnet` only.** Remote IP is restricted to "same subnet as this interface". The public internet is blocked on every profile.

The result: the rule allows a path from devices on your local network to JotBunker, not from the internet. Your phone, your other computers, and VPN peers on a shared subnet can reach the server. A random IP from the internet cannot.

### Verify your installed rule

In any command prompt (no admin required to view):

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

If your output matches, you have the recommended default. A few common deviations:

- `Profiles: Private` only: you have manually tightened to Tier 1 below. JotBunker will only work when Windows has classified the active network as Private. Run `Get-NetConnectionProfile` to confirm.
- `RemoteIP` shows specific IPs rather than `LocalSubnet`: you (or an admin) applied Tier 2 below. Intentional.
- More than one `Jotbunker` rule: a leftover Block rule from a dismissed Windows Defender prompt, or a deliberate carve-out. List them all with `Get-NetFirewallRule -DisplayName "Jotbunker*"`.

To clean up any leftover Block rules (they silently override the Allow rule), run elevated. **Warning: this deletes the rule**; you will then need to reinstall JotBunker or recreate the rule manually for sync to keep working:

```powershell
Get-NetFirewallRule -DisplayName "Jotbunker*" | Where-Object { $_.Action -eq 'Block' } | Remove-NetFirewallRule
```

### Want to lock it down further

Even with `LocalSubnet` scoping, the default rule allows any device on your current subnet to reach JotBunker. The honest threat model is "another device on my local network got compromised and is poking around". The pairing secret and NaCl encryption protect against unauthorized pairing in those scenarios. If subnet-wide exposure is too loose for your taste, you can narrow it:

- **Tier 1 (Private profile only).** Edit the rule's Advanced tab and uncheck Domain and Public. The rule now only applies on networks Windows has classified as Private. **First check** that your Wi-Fi is actually classified Private; on many machines it isn't, and this tier will silently break sync if you skip the check.
    ```powershell
    Get-NetConnectionProfile | Select Name, InterfaceAlias, NetworkCategory
    ```
    If your Wi-Fi shows `Public`, set it Private first:
    ```powershell
    Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
    ```
    Good for people who use public Wi-Fi often.

- **Tier 2 (specific phone IP).** Open the rule's Scope tab and replace `LocalSubnet` with just your phone's LAN IP. Give your phone a DHCP reservation on your router so the IP does not change. Only that phone can connect. Combine with Tier 1 for "only this phone, only on my home network".

- **Tier 3 (port-only rule).** Delete the installer's rule. Create a new inbound TCP rule for port 8080 only, scoped to your phone's specific LAN IP (not `Any`), Private profile only. **Do not leave Remote IP as `Any`**; that opens port 8080 on every network the rule covers, including public Wi-Fi, and defeats the purpose. The tightest setup when done right, but also means you have to update the rule if you change the sync port in Settings.

- **VPN carve-outs.** The default rule already covers "reach my own devices via VPN" because the VPN adapter has its own subnet. If your VPN network has members other than your own devices, create a separate Public-scoped allow rule limited to the specific peer IPs, with a distinct rule name so the installer self-heal does not touch it.

None of the tiers is required for normal use. The default is appropriately scoped for the home-network case.

## Threat model

JotBunker protects against:

- **Network eavesdropping.** All sync traffic is encrypted.
- **Unauthorized device pairing.** Pairing secret required.
- **Casual access to locked lists.** Biometric or password gate on the phone.
- **Reachability from the public internet.** Firewall rule scoped to `LocalSubnet` on every profile.

JotBunker does NOT protect against:

- **Physical device access** with debugging tools. Data is plain text at rest.
- **Compromised OS** (jailbreak, malware with file access).
- **Brute force on backup passwords.** PBKDF2 iterations are set at 100,000.
- **A compromised device on your own subnet** TCP-connecting to the sync port. The pairing secret and NaCl encryption remain the application-layer gates. See the Tier options above to tighten the network layer.

See also: [Pairing](pairing.md) | [Sync Protocol](sync-protocol.md) | [Backup & Restore](computer-backup.md) | [Data Storage](data-storage.md)
