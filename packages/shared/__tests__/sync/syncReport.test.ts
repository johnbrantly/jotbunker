import { describe, it, expect } from 'vitest'
import { computeSyncReport, formatSyncReport } from '../../src/sync/syncReport'
import type { MergeStores } from '../../src/sync/stateMerge'
import type { StateSync } from '../../src/sync/protocol'
import type { ListItem, Category } from '../../src/types'
import { CATEGORY_COUNT } from '../../src/constants'

// ── Helpers ──

function makeItem(overrides: Partial<ListItem> & { id: string }): ListItem {
  return {
    text: 'item',
    done: false,
    position: 0,
    slot: 0,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

function makeCat(overrides: Partial<Category> = {}): Category {
  return { label: '', section: 'lists', updatedAt: 0, ...overrides }
}

function emptySlots(): ListItem[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

function emptyScratchpad(): { content: string; updatedAt: number }[] {
  return Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 }))
}

function defaultCats(section: 'lists' | 'lockedLists' | 'scratchpad' = 'lists'): Category[] {
  return Array.from({ length: CATEGORY_COUNT }, () => ({ label: '', section, updatedAt: 0 }))
}

function emptyLocal(): MergeStores {
  return {
    lists: { items: emptySlots(), categories: defaultCats() },
    lockedLists: { items: emptySlots(), categories: defaultCats('lockedLists') },
    scratchpad: { contents: emptyScratchpad(), categories: defaultCats('scratchpad') },
  }
}

function makeRemote(overrides: Partial<StateSync> = {}): StateSync {
  return {
    type: 'state_sync',
    lists: emptySlots(),
    lockedLists: emptySlots(),
    listsCategories: defaultCats(),
    lockedListsCategories: defaultCats('lockedLists'),
    since: 0,
    ...overrides,
  }
}

// ── computeSyncReport ──

describe('computeSyncReport', () => {
  it('returns isEmpty: true when both sides are identical', () => {
    const local = emptyLocal()
    const remote = makeRemote()
    const merged = emptyLocal()
    const report = computeSyncReport(local, remote, merged)
    expect(report.isEmpty).toBe(true)
    expect(report.isBigDivergence).toBe(false)
  })

  it('has a numeric timestamp', () => {
    const report = computeSyncReport(emptyLocal(), makeRemote(), emptyLocal())
    expect(typeof report.timestamp).toBe('number')
    expect(report.timestamp).toBeGreaterThan(0)
  })

  it('detects items phone has that desktop does not', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'p1', text: 'phone item' })]
    const remote = makeRemote({ lists: phoneItems })
    const merged = emptyLocal()

    const report = computeSyncReport(local, remote, merged)
    expect(report.phoneOnly.isEmpty).toBe(false)
    expect(report.phoneOnly.totalAdded).toBeGreaterThan(0)
  })

  it('detects items desktop has that phone does not', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'desktop item' })]
    const remote = makeRemote()
    const merged = emptyLocal()

    const report = computeSyncReport(local, remote, merged)
    expect(report.desktopOnly.isEmpty).toBe(false)
    expect(report.desktopOnly.totalAdded).toBeGreaterThan(0)
  })

  it('detects merge result changes on desktop', () => {
    const local = emptyLocal()
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'new1', text: 'merged in' })]

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.isEmpty).toBe(false)
    expect(report.desktopResult.totalAdded).toBe(1)
  })

  it('detects item text modification', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'a', text: 'old text' })]
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'a', text: 'new text' })]

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.totalModified).toBe(1)
  })

  it('detects item checked/unchecked toggle', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'a', text: 'task', done: false })]
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'a', text: 'task', done: true })]

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.totalChecked).toBe(1)
  })

  it('detects item reorder', () => {
    const local = emptyLocal()
    local.lists.items[0] = [
      makeItem({ id: 'a', text: 'first', position: 0 }),
      makeItem({ id: 'b', text: 'second', position: 1 }),
    ]
    const merged = emptyLocal()
    merged.lists.items[0] = [
      makeItem({ id: 'b', text: 'second', position: 0 }),
      makeItem({ id: 'a', text: 'first', position: 1 }),
    ]

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.totalReordered).toBeGreaterThan(0)
  })

  it('detects category label changes in lists', () => {
    const local = emptyLocal()
    local.lists.categories[0] = makeCat({ label: 'Old', section: 'lists' })
    const merged = emptyLocal()
    merged.lists.categories[0] = makeCat({ label: 'New', section: 'lists' })

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.categoryChanges.length).toBeGreaterThan(0)
    expect(report.desktopResult.categoryChanges[0].oldLabel).toBe('Old')
    expect(report.desktopResult.categoryChanges[0].newLabel).toBe('New')
  })

  it('detects scratchpad content changes', () => {
    const local = emptyLocal()
    const merged = emptyLocal()
    merged.scratchpad.contents[0] = { content: 'new note', updatedAt: 2000 }

    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.desktopResult.scratchpadChanges.length).toBe(1)
    expect(report.desktopResult.scratchpadChanges[0].changed).toBe(true)
  })

  it('detects scratchpad category label changes', () => {
    const local = emptyLocal()
    local.scratchpad.categories[0] = makeCat({ label: 'Notes', section: 'scratchpad' })
    const merged = emptyLocal()
    merged.scratchpad.categories[0] = makeCat({ label: 'Ideas', section: 'scratchpad' })

    const report = computeSyncReport(local, makeRemote(), merged)
    const catChange = report.desktopResult.categoryChanges.find((c) => c.section === 'scratchpad')
    expect(catChange).toBeDefined()
    expect(catChange!.oldLabel).toBe('Notes')
    expect(catChange!.newLabel).toBe('Ideas')
  })

  it('flags isBigDivergence when >5 deletes', () => {
    const local = emptyLocal()
    // Put 6 items on desktop that phone doesn't have — phone "deleted" them
    local.lists.items[0] = Array.from({ length: 6 }, (_, i) =>
      makeItem({ id: `d${i}`, text: `item ${i}`, position: i }),
    )
    const merged = emptyLocal()
    // Merged also lost them
    const report = computeSyncReport(local, makeRemote(), merged)
    expect(report.isBigDivergence).toBe(true)
  })

  it('flags isBigDivergence when >20 total changes', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    // 21 items on phone that desktop doesn't have
    phoneItems[0] = Array.from({ length: 21 }, (_, i) =>
      makeItem({ id: `p${i}`, text: `phone item ${i}`, position: i }),
    )
    const remote = makeRemote({ lists: phoneItems })
    const merged = emptyLocal()

    const report = computeSyncReport(local, remote, merged)
    expect(report.isBigDivergence).toBe(true)
  })

  it('works with lockedLists section', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'lk1', text: 'locked item' })]
    const remote = makeRemote({ lockedLists: phoneItems })
    const merged = emptyLocal()

    const report = computeSyncReport(local, remote, merged)
    expect(report.phoneOnly.isEmpty).toBe(false)
  })
})

// ── formatSyncReport ──

describe('formatSyncReport', () => {
  it('returns "No changes" for empty report', () => {
    const report = computeSyncReport(emptyLocal(), makeRemote(), emptyLocal())
    expect(formatSyncReport(report)).toBe('No changes')
  })

  it('includes PHONE HAS header when phone has unique items', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'p1', text: 'phone only' })]
    const remote = makeRemote({ lists: phoneItems })

    const report = computeSyncReport(local, remote, emptyLocal())
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('PHONE HAS')
  })

  it('includes DESKTOP HAS header when desktop has unique items', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'desktop only' })]

    const report = computeSyncReport(local, makeRemote(), emptyLocal())
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('DESKTOP HAS')
  })

  it('includes DESKTOP AFTER MERGE header when merge produces changes', () => {
    const local = emptyLocal()
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'new1', text: 'merged' })]

    const report = computeSyncReport(local, makeRemote(), merged)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('DESKTOP AFTER MERGE')
  })

  it('formats added items with +', () => {
    const local = emptyLocal()
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'a1', text: 'new item' })]

    const report = computeSyncReport(local, makeRemote(), merged)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('+ "new item"')
  })

  it('formats deleted items with -', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'gone item' })]
    const merged = emptyLocal()

    const report = computeSyncReport(local, makeRemote(), merged)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('- "gone item"')
  })

  it('formats modified items with ~', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'm1', text: 'old text' })]
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'm1', text: 'new text' })]

    const report = computeSyncReport(local, makeRemote(), merged)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('~ "old text" → "new text"')
  })

  it('truncates long text at 40 characters', () => {
    const longText = 'A'.repeat(50)
    const local = emptyLocal()
    const merged = emptyLocal()
    merged.lists.items[0] = [makeItem({ id: 'long1', text: longText })]

    const report = computeSyncReport(local, makeRemote(), merged)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('A'.repeat(40) + '...')
    expect(formatted).not.toContain('A'.repeat(50))
  })
})
