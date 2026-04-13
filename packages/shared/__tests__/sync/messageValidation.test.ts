import { describe, it, expect } from 'vitest'
import { parseMessage } from '../../src/sync/protocol'

describe('parseMessage field validation — rejection cases', () => {
  it('handshake with missing deviceId → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'handshake', lastSyncTimestamp: 0, pairingSecret: 'sec',
    }))).toBeNull()
  })

  it('handshake with pairingSecret as number → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'handshake', deviceId: 'd1', lastSyncTimestamp: 0, pairingSecret: 123,
    }))).toBeNull()
  })

  it('key_init with missing publicKey → null', () => {
    expect(parseMessage(JSON.stringify({ type: 'key_init' }))).toBeNull()
  })

  it('key_init with publicKey as number → null', () => {
    expect(parseMessage(JSON.stringify({ type: 'key_init', publicKey: 42 }))).toBeNull()
  })

  it('file_response with missing data → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'file_response', jotId: 1, fileId: 'f1', fileType: 'image', format: 'png',
    }))).toBeNull()
  })

  it('file_response with jotId as string → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'file_response', jotId: 'not-a-number', fileId: 'f1', fileType: 'image', data: 'abc', format: 'png',
    }))).toBeNull()
  })

  it('state_sync with lists as string → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'state_sync', lists: 'not-an-array', lockedLists: [], listsCategories: [], lockedListsCategories: [], since: 0,
    }))).toBeNull()
  })

  it('state_sync with missing since → null', () => {
    expect(parseMessage(JSON.stringify({
      type: 'state_sync', lists: [], lockedLists: [], listsCategories: [], lockedListsCategories: [],
    }))).toBeNull()
  })

})

describe('parseMessage field validation — acceptance (sanity checks)', () => {
  it('valid handshake is accepted', () => {
    const result = parseMessage(JSON.stringify({
      type: 'handshake', deviceId: 'd1', lastSyncTimestamp: 0, pairingSecret: 'sec',
    }))
    expect(result).not.toBeNull()
    expect(result!.type).toBe('handshake')
  })

  it('valid key_init is accepted', () => {
    const result = parseMessage(JSON.stringify({ type: 'key_init', publicKey: 'abc123' }))
    expect(result).not.toBeNull()
    expect(result!.type).toBe('key_init')
  })

  it('valid file_response is accepted', () => {
    const result = parseMessage(JSON.stringify({
      type: 'file_response', jotId: 1, fileId: 'f1', fileType: 'image', data: 'base64data', format: 'png',
    }))
    expect(result).not.toBeNull()
    expect(result!.type).toBe('file_response')
  })

  it('valid state_sync is accepted', () => {
    const result = parseMessage(JSON.stringify({
      type: 'state_sync', lists: [], lockedLists: [], listsCategories: [], lockedListsCategories: [], since: 0,
    }))
    expect(result).not.toBeNull()
    expect(result!.type).toBe('state_sync')
  })

})
