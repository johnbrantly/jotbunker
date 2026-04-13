# Pairing

One-time QR code scan that links your phone to your computer. Establishes a shared secret so only your phone can connect.

---

## How it works

1. **Computer generates a pairing secret** — a random UUID created during the setup wizard
2. **Computer displays a QR code** — encodes the computer's local IP address, WebSocket port, and the pairing secret
3. **Phone scans the QR code** — extracts the IP, port, and secret
4. **Phone stores the connection details** — IP, port, and pairing secret are saved in the settings store
5. **Done** — the phone now knows where to find the computer and how to authenticate

## What the QR code contains

The QR code encodes a JSON object with:
- `ip` — the computer's local network IP (e.g., `192.168.1.100`)
- `port` — the WebSocket port (default `8080`)
- `secret` — the pairing secret (UUID)

## Authentication

Every time the phone connects, it sends the pairing secret inside the encrypted handshake message (after the NaCl key exchange). The computer validates the secret using a timing-safe comparison. If the secret doesn't match, the connection is rejected.

The pairing secret never travels in plaintext over the wire — it's only sent after the encrypted channel is established.

## Re-pairing

To pair with a different computer or re-pair after a reset:
1. On the computer: run through the setup wizard again (generates a new secret and QR code)
2. On the phone: go to Settings → Network Sync, or re-scan from the setup wizard

The old pairing secret is overwritten on both devices.

## Storage

The pairing secret is stored in the settings store on both devices — AsyncStorage on mobile, JSON file on the computer. See [Security](security.md) for details on what this means for data protection.

---

See also: [Sync](sync.md) | [Security](security.md) | [Phone App](phone-app-overview.md)
