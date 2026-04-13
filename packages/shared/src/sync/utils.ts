/**
 * Recompute position fields to match array index order.
 */
export function recomputePositions<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, position: i }))
}
