import { uint8ToBase64, base64ToUint8 } from '@jotbunker/shared'

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(password)
  const baseKey = await crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptBackup(
  json: string,
  password: string,
): Promise<{ salt: string; iv: string; data: string }> {
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)
  const iv = new Uint8Array(IV_BYTES)
  crypto.getRandomValues(iv)

  const key = await deriveKey(password, salt)
  const encoded = new TextEncoder().encode(json)
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded),
  )

  return {
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    data: uint8ToBase64(ciphertext),
  }
}

export async function decryptBackup(
  encrypted: { salt: string; iv: string; data: string },
  password: string,
): Promise<string> {
  const salt = base64ToUint8(encrypted.salt)
  const iv = base64ToUint8(encrypted.iv)
  const ciphertext = base64ToUint8(encrypted.data)

  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}
