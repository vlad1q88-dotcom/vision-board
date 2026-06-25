import { useLiveQuery } from 'dexie-react-hooks'
import { listActiveGoals } from '../db/goalRepo'
import type { Goal } from '../types'

export function useGoals() {
  return useLiveQuery(() => listActiveGoals(), [], [] as Goal[])
}
