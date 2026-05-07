import type { Category } from '../types'
import type { StoreItem } from './createItemSlice'

// Phase 3: per-device ancestor snapshot. Written after every successful sync
// on both phone and desktop. Phase 5 will read this as the third party in
// three-way merge. Write-only this phase - no production code reads it.

export interface AncestorScratchpadEntry {
  content: string
  updatedAt: number
}

/**
 * The post-sync state surface. Mirrors what `state_sync` carries on the wire
 * (packages/shared/src/sync/protocol.ts:73-84) minus the `since` field
 * (informational only) and the optional `notes` / `jotTexts` (jots are not
 * under merge work).
 *
 * Items are stored RAW including tombstones - Phase 5's merge needs to know
 * which items existed at last sync, including those tombstoned at that point.
 */
export interface AncestorSnapshot {
  lists: StoreItem[][]
  lockedLists: StoreItem[][]
  listsCategories: Category[]
  lockedListsCategories: Category[]
  scratchpad: AncestorScratchpadEntry[]
  scratchpadCategories: Category[]
}

export interface AncestorRecord {
  committedAt: number
  snapshot: AncestorSnapshot
}

export interface AncestorSliceState {
  record: AncestorRecord | null
  commit: (snapshot: AncestorSnapshot) => void
}

export interface AncestorSliceConfig {
  /**
   * INFO-level event when commit succeeds. Payload is counts plus a content
   * hash - never any item text. Locked Lists carry secrets and the desktop
   * logger persists.
   */
  onAncestorWritten?: (info: {
    committedAt: number
    counts: { lists: number; lockedLists: number; scratchpad: number }
    contentHash: string
  }) => void
  /**
   * WARN-level event when commit-side serialisation throws. Storage-layer
   * write failures are not caught here (zustand persist swallows them); that
   * gap is documented in the Phase 3 investigation as a known limitation.
   */
  onAncestorWriteFailed?: (info: { error: string }) => void
}

type AncestorSliceSet = (partial: Partial<AncestorSliceState> | ((s: AncestorSliceState) => Partial<AncestorSliceState> | AncestorSliceState)) => void
type AncestorSliceGet = () => AncestorSliceState

export function createAncestorSlice(config: AncestorSliceConfig) {
  return (set: AncestorSliceSet, _get: AncestorSliceGet): AncestorSliceState => ({
    record: null,
    commit: (snapshot) => {
      try {
        const committedAt = Date.now()
        // Deep-clone via JSON round-trip so subsequent mutations of the
        // source state cannot bleed into the persisted record. Phase 5 will
        // read the ancestor expecting it to be a frozen point-in-time copy.
        const cloned: AncestorSnapshot = JSON.parse(JSON.stringify(snapshot))
        const record: AncestorRecord = { committedAt, snapshot: cloned }
        set({ record })

        const info = {
          committedAt,
          counts: {
            lists: countItems(cloned.lists),
            lockedLists: countItems(cloned.lockedLists),
            scratchpad: cloned.scratchpad.length,
          },
          contentHash: canonicalHash(cloned),
        }
        if (config.onAncestorWritten) config.onAncestorWritten(info)
        else console.log('[ancestor]', info)
      } catch (err) {
        const info = { error: err instanceof Error ? err.message : String(err) }
        if (config.onAncestorWriteFailed) config.onAncestorWriteFailed(info)
        else console.warn('[ancestor]', info)
      }
    },
  })
}

function countItems(slots: StoreItem[][]): number {
  let n = 0
  for (const slot of slots) n += slot.length
  return n
}

/**
 * Deterministic JSON canonicalisation: recursively sort object keys before
 * serialising. Cross-device hash equality requires this; native JSON.stringify
 * preserves insertion order and our snapshots may have keys assembled in
 * different orders on phone vs. desktop.
 */
function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalStringify).join(',') + ']'
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}'
}

/**
 * 32-bit FNV-1a content fingerprint, hex output. Not cryptographic - just a
 * deterministic, cross-platform-safe collision-resistant fingerprint for
 * cross-device log comparison. Avoids pulling crypto deps into shared. The
 * maintainer reads matching hashes on phone and desktop to confirm both
 * ancestors converged to the same content after a sync.
 *
 * **Phase 5 hash-strength decision: this is observational only.** The
 * three-way merge (`packages/shared/src/sync/threeWayMerge.ts`) runs on the
 * local device using its own local ancestor; it never compares
 * cross-device hashes for correctness. 32-bit FNV is plenty for log-line
 * eyeball comparison and trivially survives the small space of post-sync
 * states a single user has. Do not upgrade to sha256 just for log lines.
 */
export function canonicalHash(snapshot: AncestorSnapshot): string {
  const s = canonicalStringify(snapshot)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
