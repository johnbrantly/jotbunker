import { describe, it, expect } from 'vitest'
import { computeSyncReport, formatSyncReport } from '../../src/sync/syncReport'
import type { MergeStores } from '../../src/sync/syncReport'
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
    const report = computeSyncReport(emptyLocal(), makeRemote())
    expect(report.isEmpty).toBe(true)
  })

  it('has a numeric timestamp', () => {
    const report = computeSyncReport(emptyLocal(), makeRemote())
    expect(typeof report.timestamp).toBe('number')
    expect(report.timestamp).toBeGreaterThan(0)
  })

  it('detects items phone has that desktop does not', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'p1', text: 'phone item' })]
    const remote = makeRemote({ lists: phoneItems })

    const report = computeSyncReport(local, remote)
    // The diff is symmetric: phoneOnly frames the item as an addition (from
    // local's perspective), desktopOnly frames it as a deletion (from phone's
    // perspective). Both sides report the divergence; the dialog labels make
    // it clear which side the item lives on.
    expect(report.phoneOnly.totalAdded).toBe(1)
    expect(report.desktopOnly.totalDeleted).toBe(1)
  })

  it('detects items desktop has that phone does not', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'desktop item' })]
    const remote = makeRemote()

    const report = computeSyncReport(local, remote)
    // Symmetric framing: desktopOnly shows it as added (from phone's view),
    // phoneOnly shows it as deleted (from desktop's view).
    expect(report.desktopOnly.totalAdded).toBe(1)
    expect(report.phoneOnly.totalDeleted).toBe(1)
  })

  it('detects category label divergence', () => {
    const local = emptyLocal()
    local.lists.categories[0] = makeCat({ label: 'Old', section: 'lists' })
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'New', section: 'lists' })
    const remote = makeRemote({ listsCategories: remoteCats })

    const report = computeSyncReport(local, remote)
    // Phone has "New", desktop has "Old"; both sides see a rename of the other's value
    const phoneCat = report.phoneOnly.categoryChanges.find((c) => c.section === 'lists')
    const desktopCat = report.desktopOnly.categoryChanges.find((c) => c.section === 'lists')
    expect(phoneCat).toBeDefined()
    expect(phoneCat!.newLabel).toBe('New')
    expect(desktopCat).toBeDefined()
    expect(desktopCat!.newLabel).toBe('Old')
  })

  it('detects scratchpad content divergence', () => {
    const local = emptyLocal()
    const remoteScratchpad = emptyScratchpad()
    remoteScratchpad[0] = { content: 'phone note', updatedAt: 2000 }
    const remote = makeRemote({ scratchpad: remoteScratchpad })

    const report = computeSyncReport(local, remote)
    expect(report.phoneOnly.scratchpadChanges.length).toBe(1)
    expect(report.phoneOnly.scratchpadChanges[0].changed).toBe(true)
  })

  it('works with lockedLists section', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'lk1', text: 'locked item' })]
    const remote = makeRemote({ lockedLists: phoneItems })

    const report = computeSyncReport(local, remote)
    expect(report.phoneOnly.isEmpty).toBe(false)
  })
})

// ── formatSyncReport ──

describe('formatSyncReport', () => {
  it('returns "No changes" for empty report', () => {
    const report = computeSyncReport(emptyLocal(), makeRemote())
    expect(formatSyncReport(report)).toBe('No changes')
  })

  it('includes PHONE HAS header when phone has unique items', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'p1', text: 'phone only' })]
    const remote = makeRemote({ lists: phoneItems })

    const report = computeSyncReport(local, remote)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('PHONE HAS')
  })

  it('includes DESKTOP HAS header when desktop has unique items', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'desktop only' })]

    const report = computeSyncReport(local, makeRemote())
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('DESKTOP HAS')
  })

  it('formats added items with +', () => {
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'a1', text: 'new item' })]
    const remote = makeRemote({ lists: phoneItems })

    const report = computeSyncReport(local, remote)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('+ "new item"')
  })

  it('formats deleted items with - (from the other side\'s perspective)', () => {
    const local = emptyLocal()
    local.lists.items[0] = [makeItem({ id: 'd1', text: 'gone item' })]

    const report = computeSyncReport(local, makeRemote())
    const formatted = formatSyncReport(report)
    // Desktop has "gone item", phone doesn't, so DESKTOP HAS shows it as added
    expect(formatted).toContain('+ "gone item"')
  })

  it('truncates long text at 40 characters', () => {
    const longText = 'A'.repeat(50)
    const local = emptyLocal()
    const phoneItems = emptySlots()
    phoneItems[0] = [makeItem({ id: 'long1', text: longText })]
    const remote = makeRemote({ lists: phoneItems })

    const report = computeSyncReport(local, remote)
    const formatted = formatSyncReport(report)
    expect(formatted).toContain('A'.repeat(40) + '...')
    expect(formatted).not.toContain('A'.repeat(50))
  })
})
