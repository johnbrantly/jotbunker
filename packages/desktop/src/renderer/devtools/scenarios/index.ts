import type { Scenario } from './types'
import { rapidFire } from './rapidFire'
import { conflictEdit } from './conflictEdit'
import { offlineReplay } from './offlineReplay'
import { largeState } from './largeState'

export const scenarios: Scenario[] = [
  rapidFire,
  conflictEdit,
  offlineReplay,
  largeState,
]

export type { Scenario, ScenarioContext } from './types'
