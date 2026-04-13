import { describe, it, expect } from 'vitest'
import {
  uint8ToBase64,
  base64ToUint8,
} from '../src/encoding'

describe('uint8ToBase64 / base64ToUint8 round-trip', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255, 42])
    const b64 = uint8ToBase64(original)
    const back = base64ToUint8(b64)
    expect(back).toEqual(original)
  })

  it('round-trips empty array', () => {
    const empty = new Uint8Array(0)
    const b64 = uint8ToBase64(empty)
    const back = base64ToUint8(b64)
    expect(back).toEqual(empty)
  })

  it('round-trips a 32-byte key', () => {
    const key = new Uint8Array(32)
    for (let i = 0; i < 32; i++) key[i] = i * 8
    const b64 = uint8ToBase64(key)
    expect(typeof b64).toBe('string')
    expect(base64ToUint8(b64)).toEqual(key)
  })
})
