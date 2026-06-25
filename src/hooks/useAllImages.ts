import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ImageWithGoal } from '../types'

export function useAllImages() {
  return useLiveQuery(
    async () => {
      const [images, goals] = await Promise.all([
        db.images.orderBy('order').toArray(),
        db.goals.toArray(),
      ])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))
      return images.map((image) => ({
        ...image,
        goalTitle: goalById.get(image.goalId)?.title ?? '',
        goalCompletedAt: goalById.get(image.goalId)?.completedAt,
      }))
    },
    [],
    [] as ImageWithGoal[],
  )
}
