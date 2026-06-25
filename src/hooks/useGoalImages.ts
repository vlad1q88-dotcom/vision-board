import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ImageRecord } from '../types'

export function useGoalImages(goalId: number | undefined) {
  return useLiveQuery(
    async () => {
      if (goalId === undefined) return [] as ImageRecord[]
      return db.images.where('goalId').equals(goalId).sortBy('order')
    },
    [goalId],
    [] as ImageRecord[],
  )
}
