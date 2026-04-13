import { describe, it, expect } from 'vitest'
import { safePath } from '../../src/main/safePath'
import { resolve } from 'path'

describe('safePath', () => {
  const root = resolve('/tmp/store')

  it('returns resolved path for normal segments', () => {
    const result = safePath(root, 'lists', 'abc.json')
    expect(result).toBe(resolve(root, 'lists', 'abc.json'))
  })

  it('blocks ../ traversal', () => {
    expect(() => safePath(root, '..', 'etc', 'passwd')).toThrow('Path traversal blocked')
  })

  it('blocks ../../ multi-level traversal', () => {
    expect(() => safePath(root, '..', '..', 'etc', 'passwd')).toThrow('Path traversal blocked')
  })

  it('blocks absolute path segment that escapes root', () => {
    expect(() => safePath(root, '/etc/passwd')).toThrow('Path traversal blocked')
  })

  it('allows nested subdirectories within root', () => {
    const result = safePath(root, 'a', 'b', 'c.json')
    expect(result).toBe(resolve(root, 'a', 'b', 'c.json'))
  })

  it('blocks traversal hidden in middle segments', () => {
    expect(() => safePath(root, 'valid', '..', '..', '..', 'etc')).toThrow(
      'Path traversal blocked',
    )
  })

  it('blocks sibling directory with matching prefix', () => {
    expect(() => safePath(root, '..', 'storemalicious', 'file')).toThrow(
      'Path traversal blocked',
    )
  })

  it('allows root directory itself', () => {
    expect(safePath(root)).toBe(root)
  })
})
