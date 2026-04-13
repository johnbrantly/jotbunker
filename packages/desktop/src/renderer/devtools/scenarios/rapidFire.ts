import type { Scenario } from './types'

export const rapidFire: Scenario = {
  id: 'rapid-fire',
  name: 'Rapid Fire',
  description: 'Create 50 list items at 10ms intervals to stress-test sync throughput.',
  execute: async (ctx) => {
    const { stores, log, delay } = ctx

    log('Starting rapid fire: 50 items at 10ms intervals')
    stores.lists.getState().setActiveCategory('temp')

    for (let i = 1; i <= 50; i++) {
      stores.lists.getState().addItem(`Rapid #${i} (${Date.now()})`)
      if (i % 10 === 0) log(`Created ${i}/50 items`)
      await delay(10)
    }

    log('All 50 items created. Waiting for sync...')
    await delay(2000)

    const items = stores.lists.getState().items['temp'] || []
    log(`Final count in temp category: ${items.length} items`)
    log('Rapid Fire complete')
  },
}
