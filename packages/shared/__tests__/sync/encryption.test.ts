import { describe, it, expect } from 'vitest'
import nacl from 'tweetnacl'
import { uint8ToBase64, base64ToUint8 } from '../../src/encoding'
import type { SyncWireMessage } from '../../src/sync/protocol'

describe('NaCl encrypt/decrypt round-trip', () => {
  function deriveSharedKey(mySecret: Uint8Array, theirPublic: Uint8Array) {
    return nacl.box.before(theirPublic, mySecret)
  }

  it('secretbox encrypt → decrypt round-trip with shared key', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const message = new TextEncoder().encode('hello jotbunker')

    const encrypted = nacl.secretbox(message, nonce, sharedKey)
    const decrypted = nacl.secretbox.open(encrypted, nonce, sharedKey)

    expect(decrypted).not.toBeNull()
    expect(new TextDecoder().decode(decrypted!)).toBe('hello jotbunker')
  })

  it('wrong key returns null', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()
    const eve = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const wrongKey = deriveSharedKey(eve.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const message = new TextEncoder().encode('secret')

    const encrypted = nacl.secretbox(message, nonce, sharedKey)
    const decrypted = nacl.secretbox.open(encrypted, nonce, wrongKey)

    expect(decrypted).toBeNull()
  })

  it('tampered ciphertext returns null', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const message = new TextEncoder().encode('tamper test')

    const encrypted = nacl.secretbox(message, nonce, sharedKey)
    // Flip a byte
    encrypted[0] ^= 0xff

    const decrypted = nacl.secretbox.open(encrypted, nonce, sharedKey)
    expect(decrypted).toBeNull()
  })

  it('full round-trip through base64 encoding', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const message = new TextEncoder().encode('base64 round trip')

    const encrypted = nacl.secretbox(message, nonce, sharedKey)

    // Encode to base64
    const b64Cipher = uint8ToBase64(encrypted)
    const b64Nonce = uint8ToBase64(nonce)

    // Decode from base64
    const restoredCipher = base64ToUint8(b64Cipher)
    const restoredNonce = base64ToUint8(b64Nonce)

    const decrypted = nacl.secretbox.open(restoredCipher, restoredNonce, sharedKey)
    expect(decrypted).not.toBeNull()
    expect(new TextDecoder().decode(decrypted!)).toBe('base64 round trip')
  })

  it('JSON SyncWireMessage round-trip through encrypt/base64/decrypt', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)

    const original: SyncWireMessage = {
      type: 'state_sync',
      lists: [],
      lockedLists: [],
      listsCategories: [],
      lockedListsCategories: [],
      since: Date.now(),
    }

    const plaintext = new TextEncoder().encode(JSON.stringify(original))
    const encrypted = nacl.secretbox(plaintext, nonce, sharedKey)
    const b64 = uint8ToBase64(encrypted)

    // Receiver side
    const restored = base64ToUint8(b64)
    const decrypted = nacl.secretbox.open(restored, nonce, sharedKey)
    expect(decrypted).not.toBeNull()

    const parsed = JSON.parse(new TextDecoder().decode(decrypted!))
    expect(parsed).toEqual(original)
  })

  it('cross-compatibility: Buffer base64 (desktop) ↔ uint8ToBase64/base64ToUint8 (mobile)', () => {
    const alice = nacl.box.keyPair()
    const bob = nacl.box.keyPair()

    const sharedKey = deriveSharedKey(alice.secretKey, bob.publicKey)
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    const message = new TextEncoder().encode('cross-compat test')

    const encrypted = nacl.secretbox(message, nonce, sharedKey)

    // Desktop style: Buffer-based base64
    const desktopB64 = Buffer.from(encrypted).toString('base64')

    // Mobile style: decode with base64ToUint8
    const mobileDecoded = base64ToUint8(desktopB64)
    const decrypted = nacl.secretbox.open(mobileDecoded, nonce, sharedKey)
    expect(decrypted).not.toBeNull()
    expect(new TextDecoder().decode(decrypted!)).toBe('cross-compat test')

    // And the reverse: mobile encodes, desktop decodes
    const mobileB64 = uint8ToBase64(encrypted)
    const desktopDecoded = new Uint8Array(Buffer.from(mobileB64, 'base64'))
    const decrypted2 = nacl.secretbox.open(desktopDecoded, nonce, sharedKey)
    expect(decrypted2).not.toBeNull()
    expect(new TextDecoder().decode(decrypted2!)).toBe('cross-compat test')
  })
})
