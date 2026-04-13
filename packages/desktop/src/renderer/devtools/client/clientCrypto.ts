import nacl from 'tweetnacl'
import { uint8ToBase64, base64ToUint8 } from '@jotbunker/shared'

export { nacl, uint8ToBase64, base64ToUint8 }

export function generateKeyPair(): nacl.BoxKeyPair {
  return nacl.box.keyPair()
}

export function computeSharedKey(
  theirPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): Uint8Array {
  return nacl.box.before(theirPublicKey, mySecretKey)
}

export function encryptMessage(
  plaintext: string,
  sharedKey: Uint8Array,
): string {
  const nonce = nacl.randomBytes(24)
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = nacl.secretbox(encoded, nonce, sharedKey)
  return JSON.stringify({
    enc: true,
    n: uint8ToBase64(nonce),
    d: uint8ToBase64(ciphertext),
  })
}

export function decryptMessage(
  raw: string,
  sharedKey: Uint8Array,
): string | null {
  try {
    const outer = JSON.parse(raw)
    if (!outer.enc) return raw
    const decrypted = nacl.secretbox.open(
      base64ToUint8(outer.d),
      base64ToUint8(outer.n),
      sharedKey,
    )
    if (!decrypted) return null
    return new TextDecoder().decode(decrypted)
  } catch {
    return raw
  }
}

