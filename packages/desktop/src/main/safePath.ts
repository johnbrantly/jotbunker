import { resolve, sep } from 'path'

export function safePath(root: string, ...segments: string[]): string {
  const resolved = resolve(root, ...segments)
  if (!resolved.startsWith(root + sep) && resolved !== root) {
    throw new Error(`Path traversal blocked: ${segments.join('/')}`)
  }
  return resolved
}
