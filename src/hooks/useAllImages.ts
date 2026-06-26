import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_CATEGORY, GRATITUDE_CATEGORY } from '../db/categories'
import type { ImageWithGoal } from '../types'

export function useAllImages() {
  return useLiveQuery(
    async () => {
      const [images, goals] = await Promise.all([
        db.images.orderBy('order').toArray(),
        db.goals.toArray(),
      ])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))
      return images.map((image) => {
        const goal = goalById.get(image.goalId)
        return {
          ...image,
          goalTitle: goal?.title ?? '',
          goalCompletedAt: goal?.completedAt,
          goalCategory: goal?.completedAt !== undefined ? GRATITUDE_CATEGORY : goal?.category ?? DEFAULT_CATEGORY,
        }
      })
    },
    [],
    [] as ImageWithGoal[],
  )
}
