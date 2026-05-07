import type { AncestorSnapshot } from '../stores/createAncestorSlice'
import type { StoreItem } from '../stores/createItemSlice'
import type { Category } from '../types'

// Phase 5: pure-function three-way merge.
//
// Inputs: ancestor (post-last-sync snapshot, possibly null on first sync) +
// phone snapshot + desktop snapshot. Both phone and desktop may have diverged
// from the ancestor since last sync.
//
// Output: a merged snapshot plus a list of "ties" - case-9 same-field cases
// where both sides changed to different values with equal `updatedAt`. The
// caller (Phase 5.5 cutover) surfaces ties to the user via the existing SYNC
// PREVIEW dialog. Phase 5 ships shadow mode only; ties are observed, not
// applied.
//
// Pure function. No I/O. No store reads. Tests in
// `packages/shared/__tests__/sync/threeWayMerge.{cases,scenario}.test.ts`.

export type MergeSection =
  | 'lists'
  | 'lockedLists'
  | 'scratchpad'
  | 'listsCategories'
  | 'lockedListsCategories'
  | 'scratchpadCategories'

export interface MergeTie {
  section: MergeSection
  slot: number
  itemId?: string
  field: string
  /** Phase 5.5: phone-side value at this tied field, for dialog rendering. */
  phoneValue: unknown
  /** Phase 5.5: desktop-side value at this tied field, for dialog rendering. */
  desktopValue: unknown
  /**
   * Phase 5.5: human-readable context for tie identification in the dialog.
   * For items: a snippet of the item's text. For scratchpad: empty (slot index
   * carries the meaning). For categories: empty (slot index identifies).
   */
  itemContext?: string
}

/**
 * Phase 5.5 merge summary. Each item / category / scratchpad-slot lands in
 * exactly one bucket so counts sum cleanly. Drives the post-cutover
 * `[merge] applied ...` log line and the new Sync History detail panel.
 */
export interface MergeReport {
  counts: {
    /** Case 4: phone-only adds, kept in result. */
    addedFromPhone: number
    /** Case 5: desktop-only adds, kept in result. */
    addedFromDesktop: number
    /** Case 7/8/9-different-fields: field-level merge applied without LWW. */
    editedField: number
    /** Case 9 same-field: LWW resolved by `updatedAt`. */
    editedLWW: number
    /** Result item ended up tombstoned (deleted: false -> true). */
    tombstoned: number
    /** Case 9 same-field equal-updatedAt: tie surfaced for dialog. */
    ties: number
  }
}

export interface MergedResult {
  snapshot: AncestorSnapshot
  ties: MergeTie[]
  /** Phase 5.5: aggregate counts for the post-cutover applied-result log line. */
  summary: MergeReport
}

function emptyReport(): MergeReport {
  return {
    counts: {
      addedFromPhone: 0,
      addedFromDesktop: 0,
      editedField: 0,
      editedLWW: 0,
      tombstoned: 0,
      ties: 0,
    },
  }
}

/**
 * Phase 5.5 helper: render a MergeReport's counts as a single human-readable
 * summary line. Used in the post-cutover Sync History list and the applied-
 * result `[merge]` log line. Returns "No changes" when the merge produced
 * nothing observable (all counts zero).
 */
export function formatMergeSummary(r: MergeReport): string {
  const c = r.counts
  const parts: string[] = []
  if (c.addedFromPhone) parts.push(`+${c.addedFromPhone} phone`)
  if (c.addedFromDesktop) parts.push(`+${c.addedFromDesktop} desktop`)
  if (c.editedField) parts.push(`${c.editedField} edit${c.editedField === 1 ? '' : 's'}`)
  if (c.editedLWW) parts.push(`${c.editedLWW} LWW`)
  if (c.tombstoned) parts.push(`${c.tombstoned} deleted`)
  if (c.ties) parts.push(`${c.ties} tie${c.ties === 1 ? '' : 's'}`)
  return parts.join(', ') || 'No changes'
}

/**
 * Phase 5.5 helper: returns true if the merge produced at least one change.
 * Used to gate Sync History entry creation - empty syncs (where every count
 * is zero) don't get logged, mirroring the pre-cutover behavior.
 */
export function isMergeReportEmpty(r: MergeReport): boolean {
  const c = r.counts
  return c.addedFromPhone === 0
    && c.addedFromDesktop === 0
    && c.editedField === 0
    && c.editedLWW === 0
    && c.tombstoned === 0
    && c.ties === 0
}

/**
 * Phase 5.5 post-cutover log line. Replaces the Phase 5 shadow `[merge]
 * <classification> ...` line. The maintainer reads these on every real
 * sync to confirm expected behavior - serves the "psychological intuition"
 * function the shadow bake skipped.
 *
 * Format:
 *   [merge] applied lists:N/locked:M/scratchpad:K addedPhone:X addedDesktop:Y
 *   editedField:Z editedLWW:W tombstoned:T ties:R
 *
 * Privacy: counts only, no item text. Same posture as Phase 2 / 3 / 5.
 */
export function formatAppliedLogLine(snapshot: AncestorSnapshot, report: MergeReport): string {
  const liveCount = (slots: AncestorSnapshot['lists']): number => {
    let n = 0
    for (const slot of slots) for (const it of slot) if (!it.deleted) n++
    return n
  }
  const scratchpadFilled = snapshot.scratchpad.filter((s) => s.content.length > 0).length
  const c = report.counts
  return `[merge] applied lists:${liveCount(snapshot.lists)}/locked:${liveCount(snapshot.lockedLists)}/scratchpad:${scratchpadFilled} addedPhone:${c.addedFromPhone} addedDesktop:${c.addedFromDesktop} editedField:${c.editedField} editedLWW:${c.editedLWW} tombstoned:${c.tombstoned} ties:${c.ties}`
}

// Item fields we reconcile field-by-field. `id` and `createdAt` are immutable.
const ITEM_FIELDS = ['text', 'done', 'position', 'deleted', 'deletedAt'] as const
type ItemField = (typeof ITEM_FIELDS)[number]

function valEqual(a: unknown, b: unknown): boolean {
  // Treat undefined / null tombstone fields as the same canonical "absent"
  // value so a record without `deleted` and one with `deleted: false` are
  // considered equal at the field level.
  if (a === undefined) a = null
  if (b === undefined) b = null
  return a === b
}

/**
 * Merge a single item id across (ancestor, phone, desktop) using field-level
 * diff against the ancestor. Cases 6/7/8 fall out naturally; case 9 splits:
 *
 * - Different fields changed -> apply both.
 * - Same field changed to same value -> trivial.
 * - Same field changed to different values:
 *   - LWW by `updatedAt`. Newer wins.
 *   - Equal `updatedAt` -> record a tie; deterministic placeholder takes
 *     phone's value so the caller can re-resolve via the dialog.
 *
 * Returns the merged StoreItem. `updatedAt` becomes max(p, d).
 */
type ItemMergeClassification = 'identical' | 'editedField' | 'editedLWW' | 'tied' | 'tombstoned'

function mergeItemFields(
  section: 'lists' | 'lockedLists',
  slot: number,
  ancestorItem: StoreItem,
  phoneItem: StoreItem,
  desktopItem: StoreItem,
  ties: MergeTie[],
): { item: StoreItem; classification: ItemMergeClassification } {
  const result: StoreItem = { ...ancestorItem }
  let anyChange = false
  let anyLWW = false
  let anyTie = false

  for (const field of ITEM_FIELDS) {
    const a = (ancestorItem as Record<string, unknown>)[field]
    const p = (phoneItem as Record<string, unknown>)[field]
    const d = (desktopItem as Record<string, unknown>)[field]

    const phoneChanged = !valEqual(a, p)
    const desktopChanged = !valEqual(a, d)

    if (phoneChanged && !desktopChanged) {
      ;(result as Record<string, unknown>)[field] = p
      anyChange = true
    } else if (!phoneChanged && desktopChanged) {
      ;(result as Record<string, unknown>)[field] = d
      anyChange = true
    } else if (phoneChanged && desktopChanged) {
      if (valEqual(p, d)) {
        ;(result as Record<string, unknown>)[field] = p
        anyChange = true
      } else {
        // Same-field conflict. LWW by updatedAt, with the equal-timestamp
        // case surfaced as a tie for dialog resolution.
        if (phoneItem.updatedAt > desktopItem.updatedAt) {
          ;(result as Record<string, unknown>)[field] = p
          anyLWW = true
        } else if (desktopItem.updatedAt > phoneItem.updatedAt) {
          ;(result as Record<string, unknown>)[field] = d
          anyLWW = true
        } else {
          ties.push({
            section,
            slot,
            itemId: ancestorItem.id,
            field,
            phoneValue: p,
            desktopValue: d,
            itemContext: typeof phoneItem.text === 'string' ? phoneItem.text : '',
          })
          ;(result as Record<string, unknown>)[field] = p
          anyTie = true
        }
      }
    }
    // else: neither side changed; result keeps ancestor's value.
  }

  // Merged item carries the timestamp of the more-recent edit.
  result.updatedAt = Math.max(phoneItem.updatedAt, desktopItem.updatedAt)

  // Classify the item into exactly one summary bucket. Tombstone subsumes
  // other classifications - if the item ended up deleted, that's the headline
  // event regardless of what other fields shifted.
  const wasLive = !ancestorItem.deleted
  const isNowDeleted = result.deleted === true
  let classification: ItemMergeClassification
  if (wasLive && isNowDeleted) classification = 'tombstoned'
  else if (anyTie) classification = 'tied'
  else if (anyLWW) classification = 'editedLWW'
  else if (anyChange) classification = 'editedField'
  else classification = 'identical'

  return { item: result, classification }
}

/**
 * Item slot merge. Walks the union of ids across ancestor, phone, desktop and
 * applies the case-table per item.
 */
function mergeItemSlot(
  section: 'lists' | 'lockedLists',
  slot: number,
  ancestorSlot: StoreItem[],
  phoneSlot: StoreItem[],
  desktopSlot: StoreItem[],
  ties: MergeTie[],
  report: MergeReport,
): StoreItem[] {
  const ancestorMap = new Map(ancestorSlot.map((i) => [i.id, i]))
  const phoneMap = new Map(phoneSlot.map((i) => [i.id, i]))
  const desktopMap = new Map(desktopSlot.map((i) => [i.id, i]))

  const allIds = new Set<string>([
    ...ancestorMap.keys(),
    ...phoneMap.keys(),
    ...desktopMap.keys(),
  ])

  const out: StoreItem[] = []
  for (const id of allIds) {
    const a = ancestorMap.get(id)
    const p = phoneMap.get(id)
    const d = desktopMap.get(id)

    // Case 1: ancestor only, both sides spliced (or both never had it).
    if (a && !p && !d) continue
    // Case 2: desktop spliced; honor the absence.
    if (a && p && !d) continue
    // Case 3: phone spliced; honor the absence.
    if (a && !p && d) continue
    // Case 4: phone added.
    if (!a && p && !d) {
      out.push({ ...p })
      // Skip counting tombstoned-on-arrival entries (rare; phone added an
      // already-tombstoned item).
      if (!p.deleted) report.counts.addedFromPhone++
      continue
    }
    // Case 5: desktop added.
    if (!a && !p && d) {
      out.push({ ...d })
      if (!d.deleted) report.counts.addedFromDesktop++
      continue
    }
    // Both sides have it; no ancestor (null-ancestor case where both
    // independently created the same id - rare but well-defined). Treat
    // ancestor as phone so desktop's view drives any field deltas.
    if (!a && p && d) {
      const merged = mergeItemFields(section, slot, p, p, d, ties)
      out.push(merged.item)
      // No ancestor so this is genuinely a parallel add. Account once.
      if (!merged.item.deleted) report.counts.addedFromPhone++
      continue
    }
    // Cases 6/7/8/9: all three present. Field-level merge handles all.
    if (a && p && d) {
      const merged = mergeItemFields(section, slot, a, p, d, ties)
      out.push(merged.item)
      switch (merged.classification) {
        case 'identical': break
        case 'editedField': report.counts.editedField++; break
        case 'editedLWW': report.counts.editedLWW++; break
        case 'tied': report.counts.ties++; break
        case 'tombstoned': report.counts.tombstoned++; break
      }
      continue
    }
  }
  return out
}

/**
 * Per-slot LWW for category labels. Same shape as item field merge but for a
 * single string field with its own `updatedAt`.
 */
function mergeCategorySlot(
  section: 'listsCategories' | 'lockedListsCategories' | 'scratchpadCategories',
  slot: number,
  a: Category,
  p: Category,
  d: Category,
  ties: MergeTie[],
  report: MergeReport,
): Category {
  const phoneChanged = a.label !== p.label
  const desktopChanged = a.label !== d.label

  let label = a.label
  if (phoneChanged && !desktopChanged) label = p.label
  else if (!phoneChanged && desktopChanged) label = d.label
  else if (phoneChanged && desktopChanged) {
    if (p.label === d.label) label = p.label
    else if (p.updatedAt > d.updatedAt) label = p.label
    else if (d.updatedAt > p.updatedAt) label = d.label
    else {
      ties.push({
        section,
        slot,
        field: 'label',
        phoneValue: p.label,
        desktopValue: d.label,
      })
      label = p.label
      report.counts.ties++
    }
  }

  return {
    label,
    section: a.section,
    updatedAt: Math.max(p.updatedAt, d.updatedAt),
  }
}

/**
 * Per-slot LWW for scratchpad content.
 */
function mergeScratchpadSlot(
  slot: number,
  a: { content: string; updatedAt: number },
  p: { content: string; updatedAt: number },
  d: { content: string; updatedAt: number },
  ties: MergeTie[],
  report: MergeReport,
): { content: string; updatedAt: number } {
  const phoneChanged = a.content !== p.content
  const desktopChanged = a.content !== d.content

  let content = a.content
  const updatedAt = Math.max(p.updatedAt, d.updatedAt)

  if (phoneChanged && !desktopChanged) content = p.content
  else if (!phoneChanged && desktopChanged) content = d.content
  else if (phoneChanged && desktopChanged) {
    if (p.content === d.content) content = p.content
    else if (p.updatedAt > d.updatedAt) content = p.content
    else if (d.updatedAt > p.updatedAt) content = d.content
    else {
      ties.push({
        section: 'scratchpad',
        slot,
        field: 'content',
        phoneValue: p.content,
        desktopValue: d.content,
      })
      content = p.content
      report.counts.ties++
    }
  }

  return { content, updatedAt }
}

/**
 * Three-way merge entry point. Pure function; no I/O.
 *
 * @param ancestor   Post-last-sync snapshot. Null = first sync ever; merge
 *                   degrades to two-way (treat all items as added on their
 *                   respective sides).
 * @param phone      Phone-side snapshot at sync time.
 * @param desktop    Desktop-side snapshot at sync time.
 * @returns          Merged snapshot + tie list for caller-side surfacing.
 */
export function mergeThreeWay(
  ancestor: AncestorSnapshot | null,
  phone: AncestorSnapshot,
  desktop: AncestorSnapshot,
): MergedResult {
  const ties: MergeTie[] = []
  const summary = emptyReport()

  const ancestorLists = ancestor?.lists ?? phone.lists.map(() => [])
  const ancestorLockedLists = ancestor?.lockedLists ?? phone.lockedLists.map(() => [])
  const ancestorListsCategories = ancestor?.listsCategories ?? phone.listsCategories
  const ancestorLockedListsCategories = ancestor?.lockedListsCategories ?? phone.lockedListsCategories
  const ancestorScratchpad = ancestor?.scratchpad ?? phone.scratchpad
  const ancestorScratchpadCategories = ancestor?.scratchpadCategories ?? phone.scratchpadCategories

  const lists = phone.lists.map((_, slot) =>
    mergeItemSlot('lists', slot, ancestorLists[slot] ?? [], phone.lists[slot], desktop.lists[slot], ties, summary),
  )
  const lockedLists = phone.lockedLists.map((_, slot) =>
    mergeItemSlot('lockedLists', slot, ancestorLockedLists[slot] ?? [], phone.lockedLists[slot], desktop.lockedLists[slot], ties, summary),
  )
  const listsCategories = phone.listsCategories.map((_, slot) =>
    mergeCategorySlot('listsCategories', slot, ancestorListsCategories[slot], phone.listsCategories[slot], desktop.listsCategories[slot], ties, summary),
  )
  const lockedListsCategories = phone.lockedListsCategories.map((_, slot) =>
    mergeCategorySlot('lockedListsCategories', slot, ancestorLockedListsCategories[slot], phone.lockedListsCategories[slot], desktop.lockedListsCategories[slot], ties, summary),
  )
  const scratchpad = phone.scratchpad.map((_, slot) =>
    mergeScratchpadSlot(slot, ancestorScratchpad[slot], phone.scratchpad[slot], desktop.scratchpad[slot], ties, summary),
  )
  // Scratchpad categories follow the same rules as list categories.
  const scratchpadCategories = phone.scratchpadCategories.map((_, slot) =>
    mergeCategorySlot('scratchpadCategories', slot, ancestorScratchpadCategories[slot], phone.scratchpadCategories[slot], desktop.scratchpadCategories[slot], ties, summary),
  )

  return {
    snapshot: {
      lists,
      lockedLists,
      listsCategories,
      lockedListsCategories,
      scratchpad,
      scratchpadCategories,
    },
    ties,
    summary,
  }
}
