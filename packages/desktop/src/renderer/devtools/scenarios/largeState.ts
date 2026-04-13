import type { Scenario } from './types'

export const largeState: Scenario = {
  id: 'large-state',
  name: 'Large State',
  description: 'Populate 200+ items across categories, trigger state sync, report timing.',
  execute: async (ctx) => {
    const { stores, log, delay } = ctx

    const categories = stores.lists.getState().categories
    const perCat = Math.ceil(200 / categories.length)

    log(`Populating ${perCat} items x ${categories.length} categories = ${perCat * categories.length} total`)

    const start = performance.now()

    for (const cat of categories) {
      stores.lists.getState().setActiveCategory(cat.id)
      for (let i = 1; i <= perCat; i++) {
        stores.lists.getState().addItem(`${cat.label} item #${i}`)
      }
      log(`  ${cat.label}: ${perCat} items added`)
    }

    const populateMs = (performance.now() - start).toFixed(0)
    log(`Population complete in ${populateMs}ms`)

    log('Waiting for sync events to propagate...')
    await delay(3000)

    let total = 0
    const items = stores.lists.getState().items
    for (const catId of Object.keys(items)) {
      total += items[catId].length
    }
    log(`Total items in virtual store: ${total}`)
    log('Large State complete')
  },
}
