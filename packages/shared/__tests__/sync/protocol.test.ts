import { describe, it, expect } from 'vitest'
import {
  parseMessage,
} from '../../src/sync/protocol'
import type { SyncMessageType } from '../../src/sync/protocol'

describe('parseMessage', () => {
  // Minimal valid payloads per message type
  const validMessages: [SyncMessageType, Record<string, unknown>][] = [
    ['key_init', { publicKey: 'abc' }],
    ['key_exchange', { publicKey: 'abc' }],
    ['handshake', { deviceId: 'd1', lastSyncTimestamp: 0, pairingSecret: 'sec' }],
    ['heartbeat', {}],
    ['jot_download_request', { jotIds: [1] }],
    ['jot_download_response', { jots: [] }],
    ['jot_clear_request', { jotIds: [1] }],
    ['jot_clear_ack', { cleared: [1] }],
    ['jot_refresh_request', {}],
    ['jot_refresh_response', { jots: [] }],
    ['file_request', { jotId: 1, fileId: 'f1', fileType: 'image' }],
    ['file_response', { jotId: 1, fileId: 'f1', fileType: 'image', data: 'base64', format: 'png' }],
    ['jot_meta_request', { jotId: 1 }],
    ['jot_meta_response', { jot: { id: 1 } }],
    ['jot_manifest', { jots: [] }],
    ['debug_log', { lines: ['hello'] }],
    ['state_sync', { lists: [], lockedLists: [], listsCategories: [], lockedListsCategories: [], since: 0 }],
    ['sync_confirm', { mode: 'merge' }],
    ['sync_cancel', {}],
  ]

  it.each(validMessages)('parses valid "%s" message', (type, fields) => {
    const raw = JSON.stringify({ type, ...fields })
    const result = parseMessage(raw)
    expect(result).not.toBeNull()
    expect(result!.type).toBe(type)
  })

  it('returns null for invalid JSON', () => {
    expect(parseMessage('not json {')).toBeNull()
  })

  it('returns null for missing type field', () => {
    expect(parseMessage(JSON.stringify({ data: 'hello' }))).toBeNull()
  })

  it('returns null for unknown type', () => {
    expect(parseMessage(JSON.stringify({ type: 'unknown_type' }))).toBeNull()
  })

  it('returns null for non-string type', () => {
    expect(parseMessage(JSON.stringify({ type: 42 }))).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseMessage('')).toBeNull()
  })

  // Field validation rejection tests
  describe('rejects messages with missing/wrong-typed fields', () => {
    it('rejects handshake missing pairingSecret', () => {
      const raw = JSON.stringify({ type: 'handshake', deviceId: 'd1', lastSyncTimestamp: 0 })
      expect(parseMessage(raw)).toBeNull()
    })

    it('rejects handshake with wrong type for lastSyncTimestamp', () => {
      const raw = JSON.stringify({ type: 'handshake', deviceId: 'd1', lastSyncTimestamp: 'not a number', pairingSecret: 'sec' })
      expect(parseMessage(raw)).toBeNull()
    })

    it('rejects key_init missing publicKey', () => {
      expect(parseMessage(JSON.stringify({ type: 'key_init' }))).toBeNull()
    })

    it('rejects jot_download_request with non-array jotIds', () => {
      expect(parseMessage(JSON.stringify({ type: 'jot_download_request', jotIds: 'not array' }))).toBeNull()
    })

    it('rejects file_request missing fileType', () => {
      expect(parseMessage(JSON.stringify({ type: 'file_request', jotId: 1, fileId: 'f1' }))).toBeNull()
    })

    it('rejects state_sync missing lists', () => {
      expect(parseMessage(JSON.stringify({ type: 'state_sync', lockedLists: [], listsCategories: [], lockedListsCategories: [], since: 0 }))).toBeNull()
    })

    it('rejects jot_meta_response with non-object jot', () => {
      expect(parseMessage(JSON.stringify({ type: 'jot_meta_response', jot: 'not an object' }))).toBeNull()
    })

    it('rejects jot_meta_response with jot missing id', () => {
      expect(parseMessage(JSON.stringify({ type: 'jot_meta_response', jot: { text: 'no id' } }))).toBeNull()
    })

    it('rejects file_response missing data', () => {
      expect(parseMessage(JSON.stringify({ type: 'file_response', jotId: 1, fileId: 'f1', fileType: 'image', format: 'png' }))).toBeNull()
    })

    it('rejects sync_confirm missing mode', () => {
      expect(parseMessage(JSON.stringify({ type: 'sync_confirm' }))).toBeNull()
    })

    it('rejects sync_confirm with invalid mode', () => {
      expect(parseMessage(JSON.stringify({ type: 'sync_confirm', mode: 'yolo' }))).toBeNull()
    })
  })
})
