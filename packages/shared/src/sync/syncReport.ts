// Phase 5.5 cutover: this file held the pre-cutover "PHONE HAS / DESKTOP HAS"
// diff functions (computeSyncReport, formatSyncReport) plus the MergeStores
// shape they consumed. All of that was removed in Commit 8 once the new
// merge took authority.
//
// The TYPE definitions stay because pre-cutover Sync History entries were
// persisted under the legacy SyncReport shape and the desktop's SyncLogDialog
// still renders them via the legacy detail-panel branch. Once the rolling-10
// history naturally rotates out the last legacy entry, this file can be
// deleted entirely.

// ── Report types (legacy SyncHistoryEntry shape) ──

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
  /** Items only on the phone (phone has, desktop doesn't) */
  phoneOnly: SyncSideReport
  /** Items only on the desktop (desktop has, phone doesn't) */
  desktopOnly: SyncSideReport
  isEmpty: boolean
}
