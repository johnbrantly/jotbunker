import nacl from 'tweetnacl';
import QuickCrypto from 'react-native-quick-crypto';
import type { SyncTransport, SyncWireMessage } from '@jotbunker/shared';
import { parseMessage, uint8ToBase64, base64ToUint8, syncLog } from '@jotbunker/shared';

// Seed tweetnacl's PRNG with react-native-quick-crypto
nacl.setPRNG((x, n) => {
  const bytes = new Uint8Array(n);
  QuickCrypto.getRandomValues(bytes);
  for (let i = 0; i < n; i++) x[i] = bytes[i];
});

const CONNECT_TIMEOUT = 3_000;

export class MobileTransport implements SyncTransport {
  onMessage: ((msg: SyncWireMessage) => void) | null = null;
  onStatusChange: ((connected: boolean) => void) | null = null;

  private ws: WebSocket | null = null;
  private serverIp: string;
  private port: number;
  private pairingSecret: string;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  // NaCl channel encryption
  channelKeyPair: nacl.BoxKeyPair | null = null;
  desktopPublicKey: Uint8Array | null = null;
  sharedKey: Uint8Array | null = null;

  constructor(serverIp: string, port: number, pairingSecret: string) {
    this.serverIp = serverIp;
    this.port = port;
    this.pairingSecret = pairingSecret;
  }

  updateConfig(serverIp: string, port: number, pairingSecret: string): void {
    this.serverIp = serverIp;
    this.port = port;
    this.pairingSecret = pairingSecret;
  }

  connect(): void {
    if (!this.serverIp) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.disposed = false;

    syncLog('CONN', `Connecting to ws://${this.serverIp}:${this.port}`);

    this.openSocket();
  }

  disconnect(): void {
    this.disposed = true;
    if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.channelKeyPair = null;
    this.sharedKey = null;
  }

  send(msg: SyncWireMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.sharedKey) {
        const nonce = nacl.randomBytes(24);
        const plaintext = new TextEncoder().encode(JSON.stringify(msg));
        const ciphertext = nacl.secretbox(plaintext, nonce, this.sharedKey);
        this.ws.send(JSON.stringify({ enc: true, n: uint8ToBase64(nonce), d: uint8ToBase64(ciphertext) }));
      } else {
        this.ws.send(JSON.stringify(msg));
      }
      return true;
    }
    return false;
  }

  private openSocket(): void {
    try {
      const ws = new WebSocket(`ws://${this.serverIp}:${this.port}`);
      this.ws = ws;

      this.connectTimeout = setTimeout(() => {
        this.connectTimeout = null;
        if (ws.readyState !== WebSocket.OPEN) {
          const deadWs = this.ws;
          this.ws = null;
          deadWs?.close();
          this.onStatusChange?.(false);
        }
      }, CONNECT_TIMEOUT);

      ws.onopen = () => {
        syncLog('CONN', 'WebSocket open');
        if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
        this.desktopPublicKey = null;
        this.channelKeyPair = nacl.box.keyPair();
        this.sharedKey = null;
        // Send key_init with just the public key (no secret) before encrypted channel
        this.send({ type: 'key_init', publicKey: uint8ToBase64(this.channelKeyPair.publicKey) });
        this.onStatusChange?.(true);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          this.handleRawMessage(event.data);
        }
      };

      ws.onclose = () => {
        syncLog('CONN', 'WebSocket closed');
        if (this.connectTimeout) { clearTimeout(this.connectTimeout); this.connectTimeout = null; }
        if (ws !== this.ws) return;
        this.ws = null;
        this.channelKeyPair = null;
        this.sharedKey = null;
        this.onStatusChange?.(false);
      };

      ws.onerror = () => {};
    } catch {
      this.onStatusChange?.(false);
    }
  }

  private handleRawMessage(raw: string): void {
    let messageStr = raw;
    try {
      const outer = JSON.parse(raw);
      if (outer.enc && this.sharedKey) {
        const decrypted = nacl.secretbox.open(base64ToUint8(outer.d), base64ToUint8(outer.n), this.sharedKey);
        if (!decrypted) { console.warn('[MobileTransport] decrypt failed'); return; }
        messageStr = new TextDecoder().decode(decrypted);
      }
    } catch { /* not encrypted — pass through */ }
    const msg = parseMessage(messageStr);
    if (!msg) return;

    // Handle key_exchange locally to set up encryption
    if (msg.type === 'key_exchange') {
      const ke = msg as { type: 'key_exchange'; publicKey: string };
      this.desktopPublicKey = base64ToUint8(ke.publicKey);
      this.sharedKey = nacl.box.before(this.desktopPublicKey, this.channelKeyPair!.secretKey);
      syncLog('CONN', 'Encrypted channel established');
    }

    this.onMessage?.(msg);
  }
}
