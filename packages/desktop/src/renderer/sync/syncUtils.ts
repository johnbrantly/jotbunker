import type { ListItem } from '@jotbunker/shared'

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s
}

export function countSyncItems(items: ListItem[][]): number {
  let total = 0
  for (const arr of items) total += arr.length
  return total
}

export function summarizeItems(items: ListItem[][]): string {
  return items.map((arr, i) => `${i}:${arr.length}`).join(',')
}
