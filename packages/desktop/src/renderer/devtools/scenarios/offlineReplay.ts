import type { Scenario } from './types'

export const offlineReplay: Scenario = {
  id: 'offline-replay',
  name: 'Offline → Reconnect',
  description: 'Disconnect, make 10 edits, reconnect — state sync merges them on connect.',
  execute: async (ctx) => {
    const { client, stores, log, delay } = ctx

    if (client.status !== 'connected') {
      log('ERROR: Must be connected first')
      return
    }

    log('Disconnecting...')
    client.disconnect()
    await delay(500)

    log('Making 10 offline edits...')
    stores.lists.getState().setActiveCategory('temp')
    for (let i = 1; i <= 10; i++) {
      stores.lists.getState().addItem(`Offline #${i}`)
      log(`  Created offline item #${i}`)
      await delay(50)
    }

    log('Reconnecting (state_sync will merge all changes)...')
    // Get port from the workbench's port input - default to 8080
    client.connect(8080, '')
    await delay(3000)

    const items = stores.lists.getState().items['temp'] || []
    const offlineItems = items.filter((i) => i.text.startsWith('Offline #'))
    log(`Offline items in store: ${offlineItems.length}/10`)
    log('Offline → Reconnect complete. Check desktop for all 10 items.')
  },
}
