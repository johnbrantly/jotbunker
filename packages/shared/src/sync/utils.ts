/**
 * Phase 4 rebalance helper. Reassigns contiguous integer positions to live
 * items in array-index order; tombstones keep their stored position. Used
 * only as a fallback when the fractional midpoint logic exhausts double
 * precision, or for the multi-item-move reorder path where minimal-change
 * detection bails out.
 */
export function recomputeLivePositions<T extends { position: number; deleted?: boolean }>(items: T[]): T[] {
  let liveIdx = 1
  return items.map((item) => (item.deleted ? item : { ...item, position: liveIdx++ }))
}

/**
 * Phase 4 midpoint helper. Returns a value strictly between `a` and `b`, or
 * `null` if the gap has been exhausted by double-precision rounding (the
 * computed midpoint equals one of the endpoints). The caller is responsible
 * for triggering a slot rebalance when null is returned.
 */
export function midpointBetween(a: number, b: number): number | null {
  const mid = (a + b) / 2
  if (mid === a || mid === b) return null
  return mid
}
