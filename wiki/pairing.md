# Pairing

A one-time QR code scan that links your phone to your computer. Establishes a shared secret so only your phone can connect.

## How it works

1. The computer generates a pairing secret (a random UUID) during the setup wizard.
2. The computer shows a QR code that encodes the computer's local IP address, the WebSocket port, and the pairing secret.
3. On the phone, scan that QR code from Settings or the setup wizard.
4. The phone stores the connection details (IP, port, pairing secret).
5. Done. The phone now knows where to find the computer and how to authenticate.

## What the QR code contains

A small JSON payload with:

- `ip`: the computer's local network IP (for example `192.168.1.100`)
- `port`: the WebSocket port (default `8080`)
- `secret`: the pairing secret (a UUID)

## Authentication

Every time the phone connects, it sends the pairing secret inside the encrypted handshake message (after the key exchange completes). The computer validates the secret using a timing-safe comparison. If the secret does not match, the connection is rejected.

The pairing secret never travels in plain text on the wire; it is only sent after the encrypted channel is established.

## Re-pairing

To pair with a different computer or re-pair after a reset:

1. On the computer, run the setup wizard again. This generates a new secret and QR code.
2. On the phone, go to Settings, Network Sync, or re-scan from the setup wizard.

The old pairing secret is overwritten on both devices.

See also: [Sync](sync.md) | [Security](security.md) | [Phone App](phone-app-overview.md)
