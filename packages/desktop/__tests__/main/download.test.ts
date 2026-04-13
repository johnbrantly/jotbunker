import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock electron (app.getPath)
vi.mock('electron', () => ({
  app: { getPath: () => '/mock/documents' },
}))

// Mock fs
vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  copyFileSync: vi.fn(),
  readFileSync: vi.fn(),
}))

import { writeJotFiles } from '../../src/main/download'
import { mkdirSync, writeFileSync } from 'fs'
import type { JotDownloadResponse } from '@jotbunker/shared'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('writeJotFiles — recordings', () => {
  it('jot with 0 recordings writes no audio files', () => {
    const response: JotDownloadResponse = {
      type: 'jot_download_response',
      jots: [{ id: 1, text: 'hello', drawing: null, images: [], recordings: [] }],
    }

    const result = writeJotFiles(response, '/tmp/test')
    expect(result.success).toBe(true)
    expect(result.jotCount).toBe(1)

    // writeFileSync called only for text.txt (no audio files)
    const writeCalls = vi.mocked(writeFileSync).mock.calls
    const audioWrites = writeCalls.filter(([path]) => String(path).includes('audio_'))
    expect(audioWrites).toHaveLength(0)
  })

  it('jot with 1 recording writes audio_001.m4a', () => {
    const response: JotDownloadResponse = {
      type: 'jot_download_response',
      jots: [{
        id: 1,
        text: '',
        drawing: null,
        images: [],
        recordings: [{ id: 'rec1', data: 'AQID', format: 'm4a', duration: 3000 }],
      }],
    }

    const result = writeJotFiles(response, '/tmp/test')
    expect(result.success).toBe(true)

    const writeCalls = vi.mocked(writeFileSync).mock.calls
    const audioWrites = writeCalls.filter(([path]) => String(path).includes('audio_001.m4a'))
    expect(audioWrites).toHaveLength(1)
    // Verify it was written with a Buffer from base64
    expect(Buffer.isBuffer(audioWrites[0][1])).toBe(true)
  })

  it('jot with 3 recordings writes audio_001 through audio_003', () => {
    const response: JotDownloadResponse = {
      type: 'jot_download_response',
      jots: [{
        id: 1,
        text: '',
        drawing: null,
        images: [],
        recordings: [
          { id: 'rec1', data: 'AQID', format: 'm4a', duration: 1000 },
          { id: 'rec2', data: 'BAUG', format: 'm4a', duration: 2000 },
          { id: 'rec3', data: 'BwgJ', format: 'm4a', duration: 3000 },
        ],
      }],
    }

    const result = writeJotFiles(response, '/tmp/test')
    expect(result.success).toBe(true)

    const writeCalls = vi.mocked(writeFileSync).mock.calls
    const audioWrites = writeCalls.filter(([path]) => String(path).includes('audio_'))
    expect(audioWrites).toHaveLength(3)
    expect(String(audioWrites[0][0])).toContain('audio_001.m4a')
    expect(String(audioWrites[1][0])).toContain('audio_002.m4a')
    expect(String(audioWrites[2][0])).toContain('audio_003.m4a')
  })

  it('text + images still work alongside recordings', () => {
    const response: JotDownloadResponse = {
      type: 'jot_download_response',
      jots: [{
        id: 2,
        text: 'some text',
        drawing: null,
        images: [{ id: 'img1', data: 'aW1hZ2U=', format: 'jpg' }],
        recordings: [{ id: 'rec1', data: 'AQID', format: 'm4a', duration: 1000 }],
      }],
    }

    const result = writeJotFiles(response, '/tmp/test')
    expect(result.success).toBe(true)
    expect(result.jotCount).toBe(1)

    const writeCalls = vi.mocked(writeFileSync).mock.calls
    const textWrites = writeCalls.filter(([path]) => String(path).includes('text.txt'))
    const imageWrites = writeCalls.filter(([path]) => String(path).includes('image_001.jpg'))
    const audioWrites = writeCalls.filter(([path]) => String(path).includes('audio_001.m4a'))

    expect(textWrites).toHaveLength(1)
    expect(imageWrites).toHaveLength(1)
    expect(audioWrites).toHaveLength(1)
  })

})
