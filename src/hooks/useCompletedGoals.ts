import { useLiveQuery } from 'dexie-react-hooks'
import { listCompletedGoals } from '../db/goalRepo'
import type { Goal } from '../types'

export function useCompletedGoals() {
  return useLiveQuery(() => listCompletedGoals(), [], [] as Goal[])
}
