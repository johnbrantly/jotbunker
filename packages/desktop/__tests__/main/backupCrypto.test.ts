import { describe, it, expect } from 'vitest'
import { encryptBackup, decryptBackup } from '../../src/renderer/crypto/backupCrypto'

describe('backupCrypto', () => {
  it('encrypt then decrypt returns original JSON', async () => {
    const json = JSON.stringify({ items: [{ id: '1', text: 'hello' }] })
    const encrypted = await encryptBackup(json, 'test-password')
    const decrypted = await decryptBackup(encrypted, 'test-password')
    expect(decrypted).toBe(json)
  })

  it('wrong password throws', async () => {
    const encrypted = await encryptBackup('secret data', 'correct-password')
    await expect(decryptBackup(encrypted, 'wrong-password')).rejects.toThrow()
  })

  it('empty string round-trips', async () => {
    const encrypted = await encryptBackup('', 'pw')
    const decrypted = await decryptBackup(encrypted, 'pw')
    expect(decrypted).toBe('')
  })

  it('large payload round-trips', async () => {
    const large = JSON.stringify({ data: 'x'.repeat(100_000) })
    const encrypted = await encryptBackup(large, 'pw')
    const decrypted = await decryptBackup(encrypted, 'pw')
    expect(decrypted).toBe(large)
  })

  it('two encryptions of same data produce different ciphertext', async () => {
    const json = '{"a":1}'
    const a = await encryptBackup(json, 'pw')
    const b = await encryptBackup(json, 'pw')
    expect(a.salt).not.toBe(b.salt)
    expect(a.data).not.toBe(b.data)
  })
})
