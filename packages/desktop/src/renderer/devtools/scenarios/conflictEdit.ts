import type { Scenario } from './types'

export const conflictEdit: Scenario = {
  id: 'conflict-edit',
  name: 'Conflict Edit',
  description: 'Create an item, sync, then edit on virtual phone to test LWW resolution.',
  execute: async (ctx) => {
    const { stores, log, delay } = ctx

    log('Creating item on virtual phone...')
    stores.lists.getState().setActiveCategory('temp')
    stores.lists.getState().addItem('Conflict test item')

    await delay(1500)

    const items = stores.lists.getState().items['temp'] || []
    const item = items.find((i) => i.text === 'Conflict test item')
    if (!item) {
      log('ERROR: Item not found after creation')
      return
    }

    log(`Item created: id=${item.id}`)
    log('Editing item text on virtual phone...')
    stores.lists.getState().updateItemText(item.id, 'Phone wins (edited by virtual phone)')

    await delay(1500)

    const updated = (stores.lists.getState().items['temp'] || []).find(
      (i) => i.id === item.id,
    )
    log(`Final text: "${updated?.text}"`)
    log('Conflict Edit complete. Check desktop to see which version won.')
  },
}
