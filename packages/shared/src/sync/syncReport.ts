import type { ListItem, Category } from '../types'
import type { StateSync } from './protocol'
import type { MergeStores } from './stateMerge'
import { CATEGORY_COUNT } from '../constants'

// ── Thresholds ──

const BIG_DIVERGENCE_DELETES = 5
const BIG_DIVERGENCE_TOTAL = 20

// ── Report types ──

export interface SyncReportCategoryChange {
  slot: number
  section: 'lists' | 'lockedLists' | 'scratchpad'
  oldLabel: string
  newLabel: string
}

export interface SyncReportItemAdded {
  text: string
  done: boolean
}

export interface SyncReportItemDeleted {
  text: string
}

export interface SyncReportItemModified {
  oldText: string
  newText: string
}

export interface SyncReportItemChecked {
  text: string
  nowDone: boolean
}

export interface SyncReportItemReordered {
  text: string
}

export interface SyncReportSlotChanges {
  slot: number
  section: 'lists' | 'lockedLists'
  categoryLabel: string
  added: SyncReportItemAdded[]
  deleted: SyncReportItemDeleted[]
  modified: SyncReportItemModified[]
  checked: SyncReportItemChecked[]
  reordered: SyncReportItemReordered[]
}

export interface SyncReportScratchpadChange {
  slot: number
  categoryLabel: string
  changed: boolean
}

export interface SyncSideReport {
  categoryChanges: SyncReportCategoryChange[]
  slotChanges: SyncReportSlotChanges[]
  scratchpadChanges: SyncReportScratchpadChange[]
  totalAdded: number
  totalDeleted: number
  totalModified: number
  totalChecked: number
  totalReordered: number
  isEmpty: boolean
}

export interface SyncReport {
  timestamp: number
  /** What will change on the desktop after merge */
  desktopResult: SyncSideReport
  /** Items only on the phone (phone has, desktop doesn't) */
  phoneOnly: SyncSideReport
  /** Items only on the desktop (desktop has, phone doesn't) */
  desktopOnly: SyncSideReport
  isEmpty: boolean
  isBigDivergence: boolean
}

// ── Internal helpers ──

function diffItems(fromSlot: ListItem[], toSlot: ListItem[]): Omit<SyncReportSlotChanges, 'slot' | 'section' | 'categoryLabel'> {
  const fromMap = new Map(fromSlot.map((it) => [it.id, it]))
  const toMap = new Map(toSlot.map((it) => [it.id, it]))

  const added: SyncReportItemAdded[] = []
  const deleted: SyncReportItemDeleted[] = []
  const modified: SyncReportItemModified[] = []
  const checked: SyncReportItemChecked[] = []
  const reordered: SyncReportItemReordered[] = []

  // In "to" but not "from" = added
  for (const item of toSlot) {
    if (!fromMap.has(item.id)) {
      added.push({ text: item.text, done: item.done })
    }
  }

  // In "from" but not "to" = deleted
  for (const item of fromSlot) {
    if (!toMap.has(item.id)) {
      deleted.push({ text: item.text })
    }
  }

  // In both = check for changes
  for (const item of toSlot) {
    const fromItem = fromMap.get(item.id)
    if (!fromItem) continue
    if (item.text !== fromItem.text) {
      modified.push({ oldText: fromItem.text, newText: item.text })
    }
    if (item.done !== fromItem.done) {
      checked.push({ text: item.text, nowDone: item.done })
    }
  }

  // Reorder detection: compare ID order of common items
  const fromIds = fromSlot.map((it) => it.id)
  const toIds = toSlot.map((it) => it.id)
  const commonFrom = fromIds.filter((id) => toMap.has(id))
  const commonTo = toIds.filter((id) => fromMap.has(id))
  if (commonFrom.length > 1 && commonFrom.some((id, i) => id !== commonTo[i])) {
    // Order changed — report items that moved
    for (let i = 0; i < commonTo.length; i++) {
      if (commonFrom[i] !== commonTo[i]) {
        const item = toMap.get(commonTo[i])!
        reordered.push({ text: item.text })
      }
    }
  }

  return { added, deleted, modified, checked, reordered }
}

function computeSideReport(
  fromState: MergeStores,
  toState: MergeStores,
): SyncSideReport {
  const categoryChanges: SyncReportCategoryChange[] = []
  const slotChanges: SyncReportSlotChanges[] = []
  const scratchpadChanges: SyncReportScratchpadChange[] = []

  const sections: ('lists' | 'lockedLists')[] = ['lists', 'lockedLists']

  for (const section of sections) {
    for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
      const oldLabel = fromState[section].categories[slot]?.label ?? ''
      const newLabel = toState[section].categories[slot]?.label ?? ''
      if (oldLabel !== newLabel) {
        categoryChanges.push({ slot, section, oldLabel, newLabel })
      }

      const fromSlot = fromState[section].items[slot] || []
      const toSlot = toState[section].items[slot] || []
      const diff = diffItems(fromSlot, toSlot)

      if (diff.added.length || diff.deleted.length || diff.modified.length || diff.checked.length || diff.reordered.length) {
        slotChanges.push({
          slot,
          section,
          categoryLabel: newLabel || oldLabel,
          ...diff,
        })
      }
    }
  }

  for (let slot = 0; slot < CATEGORY_COUNT; slot++) {
    const oldLabel = fromState.scratchpad.categories[slot]?.label ?? ''
    const newLabel = toState.scratchpad.categories[slot]?.label ?? ''
    if (oldLabel !== newLabel) {
      categoryChanges.push({ slot, section: 'scratchpad', oldLabel, newLabel })
    }

    const fromContent = fromState.scratchpad.contents[slot]?.content ?? ''
    const toContent = toState.scratchpad.contents[slot]?.content ?? ''
    if (fromContent !== toContent) {
      scratchpadChanges.push({ slot, categoryLabel: newLabel || oldLabel, changed: true })
    }
  }

  const totalAdded = slotChanges.reduce((s, c) => s + c.added.length, 0)
  const totalDeleted = slotChanges.reduce((s, c) => s + c.deleted.length, 0)
  const totalModified = slotChanges.reduce((s, c) => s + c.modified.length, 0)
  const totalChecked = slotChanges.reduce((s, c) => s + c.checked.length, 0)
  const totalReordered = slotChanges.reduce((s, c) => s + c.reordered.length, 0)
  const totalChanges = categoryChanges.length + totalAdded + totalDeleted + totalModified + totalChecked + totalReordered + scratchpadChanges.length

  return {
    categoryChanges,
    slotChanges,
    scratchpadChanges,
    totalAdded,
    totalDeleted,
    totalModified,
    totalChecked,
    totalReordered,
    isEmpty: totalChanges === 0,
  }
}

// ── Public API ──

function buildPhonePreState(remote: StateSync): MergeStores {
  return {
    lists: { items: remote.lists, categories: remote.listsCategories },
    lockedLists: { items: remote.lockedLists, categories: remote.lockedListsCategories },
    scratchpad: {
      contents: remote.scratchpad || Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 })),
      categories: remote.scratchpadCategories || Array.from({ length: CATEGORY_COUNT }, () => ({ label: '', section: 'scratchpad' as const, updatedAt: 0 })),
    },
  }
}

export function computeSyncReport(
  local: MergeStores,
  remote: StateSync,
  merged: MergeStores,
): SyncReport {
  const phonePre = buildPhonePreState(remote)

  // What will change on the desktop after merge
  const desktopResult = computeSideReport(local, merged)

  // Divergence: items phone has that desktop doesn't (diff desktop → phone)
  const phoneOnly = computeSideReport(local, phonePre)

  // Divergence: items desktop has that phone doesn't (diff phone → desktop)
  const desktopOnly = computeSideReport(phonePre, local)

  const isEmpty = desktopResult.isEmpty && phoneOnly.isEmpty && desktopOnly.isEmpty

  const totalDeletes = desktopResult.totalDeleted + phoneOnly.totalDeleted + desktopOnly.totalDeleted
  const totalChanges = (desktopResult.totalAdded + desktopResult.totalDeleted + desktopResult.totalModified + desktopResult.totalChecked)
    + (phoneOnly.totalAdded + phoneOnly.totalDeleted)
    + (desktopOnly.totalAdded + desktopOnly.totalDeleted)
  const isBigDivergence = totalDeletes > BIG_DIVERGENCE_DELETES || totalChanges > BIG_DIVERGENCE_TOTAL

  return {
    timestamp: Date.now(),
    desktopResult,
    phoneOnly,
    desktopOnly,
    isEmpty,
    isBigDivergence,
  }
}

// ── Formatting ──

const SECTION_LABELS: Record<string, string> = {
  lists: 'LISTS',
  lockedLists: 'LOCKED LISTS',
  scratchpad: 'SCRATCHPAD',
}

function truncate(text: string, max = 40): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function formatSide(side: SyncSideReport): string[] {
  const lines: string[] = []
  const sections = ['lists', 'lockedLists', 'scratchpad'] as const

  for (const section of sections) {
    const catChanges = side.categoryChanges.filter((c) => c.section === section)
    const slots = side.slotChanges.filter((c) => c.section === section)
    const spChanges = section === 'scratchpad' ? side.scratchpadChanges : []

    if (catChanges.length === 0 && slots.length === 0 && spChanges.length === 0) continue

    lines.push(`  ${SECTION_LABELS[section]}`)

    for (const cat of catChanges) {
      lines.push(`    ${cat.oldLabel} → ${cat.newLabel}`)
    }

    for (const ch of slots) {
      lines.push(`    [${ch.categoryLabel}]`)
      for (const item of ch.added) {
        lines.push(`      + "${truncate(item.text)}"${item.done ? ' (done)' : ''}`)
      }
      for (const item of ch.deleted) {
        lines.push(`      - "${truncate(item.text)}"`)
      }
      for (const item of ch.modified) {
        lines.push(`      ~ "${truncate(item.oldText)}" → "${truncate(item.newText)}"`)
      }
      for (const item of ch.checked) {
        lines.push(`      ${item.nowDone ? '☑' : '☐'} "${truncate(item.text)}"`)
      }
      for (const item of ch.reordered) {
        lines.push(`      ↕ "${truncate(item.text)}"`)
      }
    }

    for (const sp of spChanges) {
      lines.push(`    [${sp.categoryLabel}] content changed`)
    }
  }

  return lines
}

export function formatSyncReport(report: SyncReport): string {
  if (report.isEmpty) return 'No changes'

  const lines: string[] = []

  if (!report.phoneOnly.isEmpty) {
    lines.push('PHONE HAS (desktop does not)')
    lines.push(...formatSide(report.phoneOnly))
  }

  if (!report.desktopOnly.isEmpty) {
    if (lines.length > 0) lines.push('')
    lines.push('DESKTOP HAS (phone does not)')
    lines.push(...formatSide(report.desktopOnly))
  }

  if (!report.desktopResult.isEmpty) {
    if (lines.length > 0) lines.push('')
    lines.push('DESKTOP AFTER MERGE')
    lines.push(...formatSide(report.desktopResult))
  }

  return lines.join('\n')
}
