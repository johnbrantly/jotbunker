import type {
  StateSync,
  ListItem,
} from '@jotbunker/shared'
import {
  mergeStateSync,
} from '@jotbunker/shared'
import { useVirtualListsStore } from '../stores/virtualListsStore'
import { useVirtualLockedListsStore } from '../stores/virtualLockedListsStore'
import { useVirtualScratchpadStore } from '../stores/virtualScratchpadStore'
import { useWorkbenchStore } from '../stores/workbenchStore'
import type { VirtualPhoneClient } from './VirtualPhoneClient'

export async function handleStateSync(
  ss: StateSync,
  client: VirtualPhoneClient,
): Promise<void> {
  const merged = mergeStateSync(
    {
      lists: {
        items: useVirtualListsStore.getState().items as Record<
          string,
          ListItem[]
        >,
        categories: useVirtualListsStore.getState().categories,
      },
      lockedLists: {
        items: useVirtualLockedListsStore.getState().items as Record<
          string,
          ListItem[]
        >,
        categories: useVirtualLockedListsStore.getState().categories,
      },
      scratchpad: {
        contents: useVirtualScratchpadStore.getState().contents,
        categories: useVirtualScratchpadStore.getState().categories,
      },
    },
    ss,
  )

  useVirtualListsStore.setState({
    items: merged.lists.items,
    categories: merged.lists.categories,
  })
  useVirtualLockedListsStore.setState({
    items: merged.lockedLists.items,
    categories: merged.lockedLists.categories,
  })
  useVirtualScratchpadStore.setState({
    contents: merged.scratchpad.contents,
    categories: merged.scratchpad.categories,
  })

  // Save desktop snapshot for comparison
  useWorkbenchStore.getState().setDesktopSnapshot({
    lists: ss.lists,
    lockedLists: ss.lockedLists,
    scratchpad: ss.scratchpad || {},
  })

  // Send state_sync response
  const lockedListsItems = useVirtualLockedListsStore.getState().items as Record<
    string,
    ListItem[]
  >

  const spState = useVirtualScratchpadStore.getState()

  client.sendStateSyncResponse({
    lists: useVirtualListsStore.getState().items as Record<
      string,
      ListItem[]
    >,
    lockedLists: lockedListsItems,
    listsCategories: useVirtualListsStore.getState().categories as any,
    lockedListsCategories: useVirtualLockedListsStore.getState().categories as any,
    scratchpad: spState.contents,
    scratchpadCategories: spState.categories as any,
  })
}
