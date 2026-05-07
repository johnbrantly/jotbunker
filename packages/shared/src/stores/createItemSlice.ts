import type { Category } from '../types'
import { CATEGORY_COUNT, MAX_ITEMS_PER_CATEGORY } from '../constants'
import { recomputeLivePositions, midpointBetween } from '../sync/utils'

export interface StoreItem {
  id: string
  text: string
  done: boolean
  position: number
  createdAt: number
  updatedAt: number
  // Phase 2 tombstone fields. Optional so legacy persisted records and
  // wire payloads without them deserialise cleanly. addItem stamps defaults.
  deleted?: boolean
  deletedAt?: number | null
}

export interface ItemSliceState {
  items: StoreItem[][]
  categories: Category[]
  activeSlot: number
  setActiveSlot: (slot: number) => void
  addItem: (text: string) => void
  toggleItem: (itemId: string) => void
  deleteItem: (itemId: string) => void
  updateItemText: (itemId: string, text: string) => void
  // reorderItems receives the LIVE subset of a slot in its new order. The
  // slice rebuilds the slot as [...reorderedLive, ...untouchedTombstones].
  reorderItems: (slot: number, items: StoreItem[]) => void
  moveItemToCategory: (itemId: string, fromSlot: number, toSlot: number) => void
  updateCategories: (categories: Category[]) => void
  getUncheckedCount: (slot: number) => number
  /** UI consumers read items via this selector; tombstones are filtered out and items are sorted by position ascending. */
  getLiveItems: (slot: number) => StoreItem[]
  /**
   * Phase 5 tombstone GC. Drops tombstones from the live store that have
   * already been committed to the local ancestor (meaning the deletion has
   * propagated through ≥1 successful sync; both devices' ancestors carry
   * it). Caller passes the ancestor's slot array for THIS slice's section
   * - lists for listsStore, lockedLists for lockedListsStore.
   *
   * Tombstone is GC'd iff: ancestor has the same id AND ancestor's version
   * is also tombstoned. If ancestor has it as live, or doesn't have it at
   * all, the tombstone stays - the deletion hasn't fully propagated.
   */
  gcTombstonesAgainst: (ancestorSlots: StoreItem[][]) => void
}

export interface ItemSliceConfig {
  defaultCategories: Category[]
  generateUUID: () => string
  /**
   * Called when deleteItem creates a new tombstone. INFO-level event.
   * Payload is `{id, slot, deletedAt}` only — no text, ever, since
   * Locked Lists carry secrets and the desktop logs persist to disk.
   * If unset, the slice falls back to console.log with the same payload.
   */
  onTombstoneCreated?: (info: { id: string; slot: number; deletedAt: number }) => void
  /**
   * Called when toggleItem / updateItemText / moveItemToCategory is invoked
   * on a tombstoned id. WARN-level event. Payload is `{op, id, slot}` only.
   * If unset, the slice falls back to console.warn.
   */
  onTombstoneViolation?: (info: { op: 'toggleItem' | 'updateItemText' | 'moveItemToCategory'; id: string; slot: number }) => void
  /**
   * Called from gcTombstonesAgainst when one or more tombstones are physically
   * dropped. INFO-level event. `section` is the slice's logical section so
   * desktop wrappers can label log lines (`lists` vs `lockedLists`).
   * If unset, falls back to console.log.
   */
  onTombstoneGC?: (info: { droppedCount: number }) => void
}

function emptySlots(): StoreItem[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

function minLivePosition(items: StoreItem[]): number | null {
  let min: number | null = null
  for (const item of items) {
    if (item.deleted) continue
    if (min === null || item.position < min) min = item.position
  }
  return min
}

/**
 * Longest-common-subsequence by id. Used to detect single-item moves in
 * reorderItems. Items present in the LCS kept their relative ordering across
 * old and new; items outside the LCS are the ones that "moved." For the
 * common single-drag case, LCS length is N-1 and exactly one item is
 * outside, so we can assign it a midpoint instead of reassigning all.
 *
 * Tie-break: when dp[i-1][j] == dp[i][j-1], we step `j--` (skip the new-array
 * pointer) so the LCS prefers items appearing later in the OLD array. This
 * matters for the prepend-then-drag pattern: addItem puts a new item at the
 * smallest-position slot of oldLiveSorted; when the user immediately reorders
 * to place it in the middle, both `{newItem, anchor}` and `{anchor, anchor}`
 * are length-2 LCSs. Picking the latter (anchors stay) treats the freshly
 * added item as the "moved" one and assigns it a midpoint — anchor positions
 * stay stable, fractional positions emerge as expected.
 */
function lcsByIdSet(oldArr: { id: string }[], newArr: { id: string }[]): Set<string> {
  const m = oldArr.length
  const n = newArr.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldArr[i - 1].id === newArr[j - 1].id) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const lcs = new Set<string>()
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (oldArr[i - 1].id === newArr[j - 1].id) {
      lcs.add(oldArr[i - 1].id)
      i--
      j--
    } else if (dp[i][j - 1] >= dp[i - 1][j]) {
      j--
    } else {
      i--
    }
  }
  return lcs
}

type ItemSliceSet = (partial: Partial<ItemSliceState> | ((state: ItemSliceState) => Partial<ItemSliceState> | ItemSliceState)) => void
type ItemSliceGet = () => ItemSliceState

export function createItemSlice(config: ItemSliceConfig) {
  return (set: ItemSliceSet, get: ItemSliceGet): ItemSliceState => ({
    items: emptySlots(),
    categories: config.defaultCategories,
    activeSlot: 0,

    setActiveSlot: (slot) => set({ activeSlot: slot }),

    /**
     * Phase 4: assigns the new item a position strictly less than every
     * live item's position. New item ends up at the top of the sorted view
     * (smallest position renders first). Existing items' positions are NOT
     * touched - the false-positive "every neighbor changed" cascade from
     * the old recomputeLivePositions path is gone.
     */
    addItem: (text) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        // Cap on LIVE count (per Phase 2 risk note). Tombstones don't count
        // against the user-visible cap.
        const liveCount = existing.filter((i) => !i.deleted).length
        if (liveCount >= MAX_ITEMS_PER_CATEGORY) return state
        const now = Date.now()
        const minLive = minLivePosition(existing)
        const newPosition = minLive === null ? 1 : minLive - 1
        const newItem: StoreItem = {
          id: config.generateUUID(),
          text,
          done: false,
          position: newPosition,
          createdAt: now,
          updatedAt: now,
          deleted: false,
          deletedAt: null,
        }
        const newItems = [...state.items]
        // Prepend in the array. Live items remain in array-prefix sort order
        // because the new item has the smallest position.
        newItems[slot] = [newItem, ...existing]
        return { items: newItems }
      }),

    toggleItem: (itemId) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const target = existing.find((item) => item.id === itemId)
        if (target?.deleted) {
          const info = { op: 'toggleItem' as const, id: itemId, slot }
          if (config.onTombstoneViolation) config.onTombstoneViolation(info)
          else console.warn('[tombstone]', info)
          return state
        }
        const newItems = [...state.items]
        newItems[slot] = existing.map((item) =>
          item.id === itemId
            ? { ...item, done: !item.done, updatedAt: Date.now() }
            : item,
        )
        return { items: newItems }
      }),

    /**
     * Phase 4: tombstones in place. **Does not** touch other items'
     * positions. Live items keep whatever positions they had; the array
     * prefix of live items remains sorted because removing one item from a
     * sorted sequence still leaves it sorted.
     */
    deleteItem: (itemId) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const target = existing.find((item) => item.id === itemId)
        if (!target || target.deleted) return state // not found or already tombstoned: no-op
        const now = Date.now()
        const info = { id: itemId, slot, deletedAt: now }
        if (config.onTombstoneCreated) config.onTombstoneCreated(info)
        else console.log('[tombstone]', info)
        const newItems = [...state.items]
        newItems[slot] = existing.map((item) =>
          item.id === itemId
            ? { ...item, deleted: true, deletedAt: now, updatedAt: now }
            : item,
        )
        return { items: newItems }
      }),

    updateItemText: (itemId, text) =>
      set((state: ItemSliceState) => {
        const slot = state.activeSlot
        const existing = state.items[slot] || []
        const target = existing.find((item) => item.id === itemId)
        if (target?.deleted) {
          const info = { op: 'updateItemText' as const, id: itemId, slot }
          if (config.onTombstoneViolation) config.onTombstoneViolation(info)
          else console.warn('[tombstone]', info)
          return state
        }
        const newItems = [...state.items]
        newItems[slot] = existing.map((item) =>
          item.id === itemId
            ? { ...item, text, updatedAt: Date.now() }
            : item,
        )
        return { items: newItems }
      }),

    /**
     * Phase 4: minimal-change reorder. Detects which item moved by computing
     * an id-based LCS against the prior live order. If exactly one item is
     * outside the LCS (the common single-drag case), assigns it a midpoint
     * between its new neighbors and leaves all other items untouched. If
     * multiple items moved (e.g. a full reverse), falls back to integer
     * reassignment via recomputeLivePositions.
     *
     * Phase 2 contract still holds: callers pass the LIVE subset of the slot
     * in its new order; the slice rebuilds the full slot as
     *   [...reorderedLive, ...preservedTombstones]
     * Live items in the array remain in position-sort order so syncReport's
     * array-order diff continues to see them correctly without needing
     * tombstone-aware sort.
     *
     * Do NOT revert to the pre-Phase-2 "pass the full slot" calling
     * convention. The UI no longer sees tombstones; passing the full slot
     * would either drop tombstones or require the caller to know about them.
     * The Phase 1 reorderItems id-stability test still applies: every live
     * item's id survives this operation unchanged.
     */
    reorderItems: (slot, newLive) =>
      set((state: ItemSliceState) => {
        const now = Date.now()
        const existing = state.items[slot] || []
        const tombstones = existing.filter((i) => i.deleted)
        const oldLiveSorted = existing
          .filter((i) => !i.deleted)
          .slice()
          .sort((a, b) => a.position - b.position)

        const lcsIds = lcsByIdSet(oldLiveSorted, newLive)
        const movedItems = newLive.filter((it) => !lcsIds.has(it.id))

        let reordered: StoreItem[]

        if (movedItems.length === 0) {
          // No-op: spread to give callers fresh references but keep positions.
          reordered = newLive.map((it) => ({ ...it }))
        } else if (movedItems.length === 1) {
          const moved = movedItems[0]
          const movedIdx = newLive.findIndex((it) => it.id === moved.id)
          const leftItem = movedIdx > 0 ? newLive[movedIdx - 1] : null
          const rightItem = movedIdx < newLive.length - 1 ? newLive[movedIdx + 1] : null
          let newPos: number | null
          if (leftItem === null && rightItem === null) {
            newPos = 1
          } else if (leftItem === null) {
            newPos = rightItem!.position - 1
          } else if (rightItem === null) {
            newPos = leftItem!.position + 1
          } else {
            newPos = midpointBetween(leftItem.position, rightItem.position)
          }
          if (newPos === null) {
            // Precision exhausted: midpointBetween returned null because the
            // gap between the two new neighbors collapsed to a value
            // representable as one of the endpoints under double precision.
            // Per-slot rebalance: reassign live items to integer positions
            // 1..N in their current sort order, then carry on. Tombstones
            // keep their stored positions. INFO-level log so the maintainer
            // can spot rebalances during real-device testing.
            console.log(`[POS] rebalanced slot ${slot} (live items: ${newLive.length})`)
            reordered = recomputeLivePositions(
              newLive.map((it) => ({ ...it, updatedAt: now })),
            )
          } else {
            const finalNewPos = newPos
            reordered = newLive.map((it) =>
              it.id === moved.id
                ? { ...it, position: finalNewPos, updatedAt: now }
                : { ...it },
            )
          }
        } else {
          // Multiple items moved. No clean minimal-change path; reassign.
          reordered = recomputeLivePositions(
            newLive.map((it) => ({ ...it, updatedAt: now })),
          )
        }

        const newItems = [...state.items]
        newItems[slot] = [...reordered, ...tombstones]
        return { items: newItems }
      }),

    /**
     * Phase 4: drops the moved item from the source slot without touching
     * other items' positions; prepends to target with a position strictly
     * less than the target's existing minimum live position.
     */
    moveItemToCategory: (itemId, fromSlot, toSlot) =>
      set((state: ItemSliceState) => {
        const sourceItems = state.items[fromSlot] || []
        const item = sourceItems.find((i) => i.id === itemId)
        if (!item) return state
        if (item.deleted) {
          const info = { op: 'moveItemToCategory' as const, id: itemId, slot: fromSlot }
          if (config.onTombstoneViolation) config.onTombstoneViolation(info)
          else console.warn('[tombstone]', info)
          return state
        }
        const targetItems = state.items[toSlot] || []
        const now = Date.now()
        const targetMin = minLivePosition(targetItems)
        const newPosition = targetMin === null ? 1 : targetMin - 1
        const newItems = [...state.items]
        // Source: drop the moved item; tombstones stay; remaining live items
        // keep their positions.
        newItems[fromSlot] = sourceItems.filter((i) => i.id !== itemId)
        // Target: prepend with smallest position so it sorts to the top.
        newItems[toSlot] = [
          { ...item, position: newPosition, updatedAt: now },
          ...targetItems,
        ]
        return { items: newItems }
      }),

    updateCategories: (categories) => set({ categories }),

    getUncheckedCount: (slot) => {
      const items = get().items[slot] || []
      return items.filter((item: StoreItem) => !item.deleted && !item.done).length
    },

    /**
     * Phase 4: filters tombstones AND sorts by position ascending.
     * Phase 5: secondary sort by `id` lexicographic when positions are equal.
     * The id tiebreak handles the concurrent-insert case where phone and
     * desktop both add an item at the same fractional position - the merge
     * keeps both items, the comparator deterministically orders them across
     * devices without needing perturbation or coordination.
     */
    getLiveItems: (slot) => {
      const items = get().items[slot] || []
      return items
        .filter((item: StoreItem) => !item.deleted)
        .slice()
        .sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
        })
    },

    gcTombstonesAgainst: (ancestorSlots) =>
      set((state: ItemSliceState) => {
        let droppedCount = 0
        const newItems = state.items.map((slot, slotIdx) => {
          const ancestorSlot = ancestorSlots[slotIdx] ?? []
          return slot.filter((item) => {
            if (!item.deleted) return true // keep live
            const ancestorItem = ancestorSlot.find((a) => a.id === item.id)
            if (!ancestorItem) return true // ancestor doesn't have it; deletion hasn't propagated
            if (!ancestorItem.deleted) return true // ancestor has it as live; don't GC
            droppedCount++
            return false // ancestor has same tombstone; safe to drop
          })
        })
        if (droppedCount > 0) {
          // INFO: rare event; counts only, no item text. Same privacy posture
          // as Phase 2 / Phase 3. Desktop wrappers route this to desktop-sync.log
          // via onTombstoneGC; mobile leaves the callback unwired and falls
          // back to console.log (Metro/logcat).
          if (config.onTombstoneGC) config.onTombstoneGC({ droppedCount })
          else console.log(`[gc] dropped ${droppedCount} tombstones`)
        }
        return { items: newItems }
      }),
  })
}
