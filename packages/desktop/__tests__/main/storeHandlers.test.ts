import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fs before imports
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}))

import { registerStoreHandlers } from '../../src/main/handlers/storeHandlers'
import { ipcMain } from 'electron'
import { getIpcHandler } from '../setup'

import { resolve } from 'path'

const storesDir = resolve('/mock/stores')

beforeEach(() => {
  vi.clearAllMocks()
  registerStoreHandlers(ipcMain, storesDir)
})

describe('storeHandlers — path traversal protection', () => {
  it('store:get-item with traversal name → throws', () => {
    const handler = getIpcHandler('store:get-item')!
    expect(() => handler({}, '../secrets')).toThrow('Path traversal blocked')
  })

  it('store:set-item with traversal name → throws', () => {
    const handler = getIpcHandler('store:set-item')!
    expect(() => handler({}, '../../etc/passwd', '{}')).toThrow('Path traversal blocked')
  })

  it('store:remove-item with traversal name → throws', () => {
    const handler = getIpcHandler('store:remove-item')!
    expect(() => handler({}, '../../../secret')).toThrow('Path traversal blocked')
  })

  it('store:get-item with normal name works', () => {
    const handler = getIpcHandler('store:get-item')!
    const result = handler({}, 'lists')
    expect(result).toBe('{}')
  })

  it('store:set-item with normal name works', () => {
    const handler = getIpcHandler('store:set-item')!
    expect(() => handler({}, 'lists', '{"items":[]}')).not.toThrow()
  })
})
