import { describe, it, expect } from 'vitest'
import { mergeStateSync } from '../../src/sync/stateMerge'
import type { MergeStores } from '../../src/sync/stateMerge'
import type { StateSync } from '../../src/sync/protocol'
import type { ListItem, Category } from '../../src/types'
import { CATEGORY_COUNT } from '../../src/constants'

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
  return {
    label: 'Default',
    section: 'lists',
    updatedAt: 1000,
    ...overrides,
  }
}

/** Helper: create an empty ListItem[][] */
function emptySlots(): ListItem[][] {
  return Array.from({ length: CATEGORY_COUNT }, () => [])
}

/** Helper: create empty scratchpad contents */
function emptyScratchpad(): { content: string; updatedAt: number }[] {
  return Array.from({ length: CATEGORY_COUNT }, () => ({ content: '', updatedAt: 0 }))
}

/** Helper: create default categories array */
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

describe('mergeStateSync — lists', () => {
  it('merges lists items from remote', () => {
    const local = emptyLocal()
    const remoteLists = emptySlots()
    remoteLists[0] = [makeItem({ id: 'a', slot: 0 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'ASAP' })
    const remote = makeRemote({
      lists: remoteLists,
      listsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0]).toHaveLength(1)
    expect(result.lists.items[0][0].id).toBe('a')
    expect(result.lists.categories[0].label).toBe('ASAP')
  })

  it('LWW: remote item wins when updatedAt is higher', () => {
    const local: MergeStores = {
      ...emptyLocal(),
      lists: {
        items: (() => { const s = emptySlots(); s[0] = [makeItem({ id: 'a', text: 'local', updatedAt: 100 })]; return s })(),
        categories: defaultCats(),
      },
    }
    const remoteLists = emptySlots()
    remoteLists[0] = [makeItem({ id: 'a', text: 'remote', updatedAt: 200 })]
    const remote = makeRemote({ lists: remoteLists })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0][0].text).toBe('remote')
  })
})

describe('mergeStateSync — lockedLists', () => {
  it('always merges lockedLists items', () => {
    const local = emptyLocal()
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 's1', slot: 0, text: 'secret' })]
    const remoteCats = defaultCats('lockedLists')
    remoteCats[0] = makeCat({ label: 'Names', section: 'lockedLists' })
    const remote = makeRemote({
      lockedLists: remoteItems,
      lockedListsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote)
    expect(result.lockedLists.items[0]).toHaveLength(1)
    expect(result.lockedLists.items[0][0].text).toBe('secret')
  })

  it('merges lockedLists with LWW when both sides have data', () => {
    const localLockedItems = emptySlots()
    localLockedItems[0] = [makeItem({ id: 'local-only', text: 'mine' })]
    const localLockedCats = defaultCats('lockedLists')
    localLockedCats[0] = makeCat({ label: 'Names', section: 'lockedLists' })
    const local: MergeStores = {
      ...emptyLocal(),
      lockedLists: {
        items: localLockedItems,
        categories: localLockedCats,
      },
    }
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'remote-item', text: 'remote' })]
    const remoteCats = defaultCats('lockedLists')
    remoteCats[0] = makeCat({ label: 'REMOTE-Names' })
    const remote = makeRemote({
      lockedLists: remoteItems,
      lockedListsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote)
    // Both items should be present (merged from both sides)
    expect(result.lockedLists.items[0]).toHaveLength(2)
    expect(result.lockedLists.items[0].map((i) => i.id).sort()).toEqual(['local-only', 'remote-item'])
  })
})

describe('mergeStateSync — scratchpad', () => {
  it('merges scratchpad by LWW per slot — remote wins', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'local', updatedAt: 100 }
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: defaultCats('scratchpad'),
      },
    }
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'remote', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[0].content).toBe('remote')
    expect(result.scratchpad.contents[0].updatedAt).toBe(200)
  })

  it('merges scratchpad by LWW per slot — local wins', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'local', updatedAt: 300 }
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: defaultCats('scratchpad'),
      },
    }
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'remote', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[0].content).toBe('local')
  })

  it('adds new scratchpad slot content from remote', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'existing', updatedAt: 100 }
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: defaultCats('scratchpad'),
      },
    }
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'existing', updatedAt: 100 }
    remoteSp[1] = { content: 'new remote pad', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[1].content).toBe('new remote pad')
    expect(result.scratchpad.contents[0].content).toBe('existing')
  })

  it('preserves local scratchpad when remote has none', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'mine', updatedAt: 100 }
    const spCats = defaultCats('scratchpad')
    spCats[0] = makeCat({ label: 'Notes', section: 'scratchpad' })
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: spCats,
      },
    }
    const remote = makeRemote() // no scratchpad field

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[0].content).toBe('mine')
    expect(result.scratchpad.categories[0].label).toBe('Notes')
  })

  it('merges scratchpad categories when present', () => {
    const spCats = defaultCats('scratchpad')
    spCats[0] = makeCat({ label: 'OLD', section: 'scratchpad', updatedAt: 100 })
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: emptyScratchpad(),
        categories: spCats,
      },
    }
    const remoteSp = emptyScratchpad()
    const remoteSpCats = defaultCats('scratchpad')
    remoteSpCats[0] = makeCat({ label: 'NEW', section: 'scratchpad', updatedAt: 200 })
    const remote = makeRemote({
      scratchpad: remoteSp,
      scratchpadCategories: remoteSpCats,
    })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.categories[0].label).toBe('NEW')
  })
})

describe('mergeStateSync — conflict resolution', () => {
  it('remote wins when updatedAt is higher for both items and categories', () => {
    const localItems = emptySlots()
    localItems[0] = [makeItem({ id: 'a', text: 'local', updatedAt: 100 })]
    const localCats = defaultCats()
    localCats[0] = makeCat({ label: 'LOCAL-CAT', updatedAt: 100 })
    const local: MergeStores = {
      ...emptyLocal(),
      lists: { items: localItems, categories: localCats },
    }
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'a', text: 'remote', updatedAt: 200 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'REMOTE-CAT', updatedAt: 200 })
    const remote = makeRemote({
      lists: remoteItems,
      listsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0][0].text).toBe('remote')
    expect(result.lists.categories[0].label).toBe('REMOTE-CAT')
  })

  it('local wins when updatedAt is higher', () => {
    const localItems = emptySlots()
    localItems[0] = [makeItem({ id: 'a', text: 'local', updatedAt: 300 })]
    const local: MergeStores = {
      ...emptyLocal(),
      lists: { items: localItems, categories: defaultCats() },
    }
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'a', text: 'remote', updatedAt: 200 })]
    const remote = makeRemote({ lists: remoteItems })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0][0].text).toBe('local')
  })
})

describe('mergeStateSync — scratchpad conflict resolution', () => {
  it('remote wins scratchpad content when updatedAt is higher', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'local text', updatedAt: 100 }
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: defaultCats('scratchpad'),
      },
    }
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'remote text', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[0].content).toBe('remote text')
    expect(result.scratchpad.contents[0].updatedAt).toBe(200)
  })

  it('adds new remote scratchpad slot without conflict', () => {
    const local = emptyLocal()
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'new pad', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    expect(result.scratchpad.contents[0].content).toBe('new pad')
  })

  it('keeps local when content is identical but remote updatedAt is higher', () => {
    const spContents = emptyScratchpad()
    spContents[0] = { content: 'same text', updatedAt: 100 }
    const local: MergeStores = {
      ...emptyLocal(),
      scratchpad: {
        contents: spContents,
        categories: defaultCats('scratchpad'),
      },
    }
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'same text', updatedAt: 200 }
    const remote = makeRemote({ scratchpad: remoteSp })

    const result = mergeStateSync(local, remote)
    // Remote wins by LWW (same content but higher timestamp)
    expect(result.scratchpad.contents[0].updatedAt).toBe(200)
  })
})

describe('mergeStateSync — localSince symmetric deletion', () => {
  it('drops remote-only item when localSince indicates local deleted it', () => {
    const localItems = emptySlots()
    const localCats = defaultCats()
    localCats[0] = makeCat({ label: 'ASAP', updatedAt: 100 })
    const local: MergeStores = {
      ...emptyLocal(),
      lists: { items: localItems, categories: localCats },
    }
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'deleted', createdAt: 1000, updatedAt: 1500 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'ASAP', updatedAt: 100 })
    const remote = makeRemote({
      lists: remoteItems,
      listsCategories: remoteCats,
      since: 0,
    })

    // localSince=50000 > 1000 + 5000 -> local deleted this item
    const result = mergeStateSync(local, remote, 50000)
    expect(result.lists.items[0]).toHaveLength(0)
  })

  it('keeps remote-only item when localSince=0 (first sync)', () => {
    const local = emptyLocal()
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'a', createdAt: 50 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'ASAP', updatedAt: 100 })
    const remote = makeRemote({
      lists: remoteItems,
      listsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote, 0)
    expect(result.lists.items[0]).toHaveLength(1)
  })

  it('keeps newly created remote item even with high localSince', () => {
    const local = emptyLocal()
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'new', createdAt: 100000, updatedAt: 100000 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'ASAP', updatedAt: 100 })
    const remote = makeRemote({
      lists: remoteItems,
      listsCategories: remoteCats,
    })

    // localSince=50000. createdAt=100000. 50000 > 100000+5000? No -> kept
    const result = mergeStateSync(local, remote, 50000)
    expect(result.lists.items[0]).toHaveLength(1)
    expect(result.lists.items[0][0].id).toBe('new')
  })

  it('localSince applies to lockedLists section too', () => {
    const localLockedCats = defaultCats('lockedLists')
    localLockedCats[0] = makeCat({ label: 'Names', section: 'lockedLists', updatedAt: 100 })
    const local: MergeStores = {
      ...emptyLocal(),
      lockedLists: { items: emptySlots(), categories: localLockedCats },
    }
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'old', createdAt: 1000, updatedAt: 1500 })]
    const remoteCats = defaultCats('lockedLists')
    remoteCats[0] = makeCat({ label: 'Names', section: 'lockedLists', updatedAt: 100 })
    const remote = makeRemote({
      lockedLists: remoteItems,
      lockedListsCategories: remoteCats,
      })

    const result = mergeStateSync(local, remote, 50000)
    expect(result.lockedLists.items[0]).toHaveLength(0)
  })

  it('backward compatible: no localSince adds all remote-only items', () => {
    const local = emptyLocal()
    const remoteItems = emptySlots()
    remoteItems[0] = [makeItem({ id: 'a', createdAt: 50 })]
    const remoteCats = defaultCats()
    remoteCats[0] = makeCat({ label: 'ASAP', updatedAt: 100 })
    const remote = makeRemote({
      lists: remoteItems,
      listsCategories: remoteCats,
    })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0]).toHaveLength(1)
  })
})

describe('mergeStateSync — full integration', () => {
  it('merges all sections simultaneously', () => {
    const localListItems = emptySlots()
    localListItems[0] = [makeItem({ id: 'l1', text: 'local-list', updatedAt: 100 })]
    const localListCats = defaultCats()
    localListCats[0] = makeCat({ label: 'ASAP' })
    const localLockedItems = emptySlots()
    localLockedItems[0] = [makeItem({ id: 's1', text: 'local-secure', updatedAt: 100 })]
    const localLockedCats = defaultCats('lockedLists')
    localLockedCats[0] = makeCat({ label: 'Names', section: 'lockedLists' })
    const localSp = emptyScratchpad()
    localSp[0] = { content: 'local-sp', updatedAt: 100 }

    const local: MergeStores = {
      lists: { items: localListItems, categories: localListCats },
      lockedLists: { items: localLockedItems, categories: localLockedCats },
      scratchpad: { contents: localSp, categories: defaultCats('scratchpad') },
    }

    const remoteListItems = emptySlots()
    remoteListItems[0] = [makeItem({ id: 'l1', text: 'remote-list', updatedAt: 200 })]
    const remoteListCats = defaultCats()
    remoteListCats[0] = makeCat({ label: 'ASAP' })
    const remoteLockedItems = emptySlots()
    remoteLockedItems[0] = [makeItem({ id: 's1', text: 'remote-secure', updatedAt: 200 })]
    const remoteLockedCats = defaultCats('lockedLists')
    remoteLockedCats[0] = makeCat({ label: 'Names', section: 'lockedLists' })
    const remoteSp = emptyScratchpad()
    remoteSp[0] = { content: 'remote-sp', updatedAt: 200 }

    const remote = makeRemote({
      lists: remoteListItems,
      listsCategories: remoteListCats,
      lockedLists: remoteLockedItems,
      lockedListsCategories: remoteLockedCats,
        scratchpad: remoteSp,
      since: 0,
    })

    const result = mergeStateSync(local, remote)

    // All remote wins (higher updatedAt)
    expect(result.lists.items[0][0].text).toBe('remote-list')
    expect(result.lockedLists.items[0][0].text).toBe('remote-secure')
    expect(result.scratchpad.contents[0].content).toBe('remote-sp')
  })

  it('empty remote preserves all local state', () => {
    const localListItems = emptySlots()
    localListItems[0] = [makeItem({ id: 'l1' })]
    const localListCats = defaultCats()
    localListCats[0] = makeCat({ label: 'ASAP' })
    const localLockedItems = emptySlots()
    localLockedItems[0] = [makeItem({ id: 's1' })]
    const localLockedCats = defaultCats('lockedLists')
    localLockedCats[0] = makeCat({ label: 'Names', section: 'lockedLists' })
    const localSp = emptyScratchpad()
    localSp[0] = { content: 'mine', updatedAt: 100 }

    const local: MergeStores = {
      lists: { items: localListItems, categories: localListCats },
      lockedLists: { items: localLockedItems, categories: localLockedCats },
      scratchpad: { contents: localSp, categories: defaultCats('scratchpad') },
    }

    const remote = makeRemote({ since: 0 })

    const result = mergeStateSync(local, remote)
    expect(result.lists.items[0]).toHaveLength(1)
    expect(result.lockedLists.items[0]).toHaveLength(1)
    expect(result.scratchpad.contents[0].content).toBe('mine')
  })
})
