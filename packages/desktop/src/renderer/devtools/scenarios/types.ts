import type { VirtualPhoneClient } from '../client/VirtualPhoneClient'

export interface ScenarioContext {
  client: VirtualPhoneClient
  stores: {
    lists: typeof import('../stores/virtualListsStore').useVirtualListsStore
    lockedLists: typeof import('../stores/virtualLockedListsStore').useVirtualLockedListsStore
    scratchpad: typeof import('../stores/virtualScratchpadStore').useVirtualScratchpadStore
    jots: typeof import('../stores/virtualJotsStore').useVirtualJotsStore
  }
  log: (message: string) => void
  delay: (ms: number) => Promise<void>
  waitForSync: () => Promise<void>
}

export interface Scenario {
  id: string
  name: string
  description: string
  execute: (ctx: ScenarioContext) => Promise<void>
}
