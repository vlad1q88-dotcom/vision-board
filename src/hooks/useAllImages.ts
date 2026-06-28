import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_CATEGORY, GRATITUDE_CATEGORY } from '../db/categories'
import type { ImageWithGoal } from '../types'

export function useAllImages() {
  return useLiveQuery(
    async () => {
      const [images, goals, tasks] = await Promise.all([
        db.images.orderBy('order').toArray(),
        db.goals.toArray(),
        db.tasks.toArray(),
      ])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))
      const taskByGoalId = new Map(
        tasks.filter((task) => task.goalId !== undefined).map((task) => [task.goalId as number, task]),
      )
      return images.map((image) => {
        const goal = goalById.get(image.goalId)
        // Mirrors the date the photo "belongs under" elsewhere in the app: the journal's
        // completion date once the goal is done, or the goal's Plan task deadline while it's
        // still active (if one was set) — not the photo's own upload timestamp.
        const relevantDate = goal?.completedAt ?? taskByGoalId.get(image.goalId)?.deadline
        return {
          ...image,
          goalTitle: goal?.title ?? '',
          goalCompletedAt: goal?.completedAt,
          goalCategory: goal?.completedAt !== undefined ? GRATITUDE_CATEGORY : goal?.category ?? DEFAULT_CATEGORY,
          relevantDate,
        }
      })
    },
    [],
    [] as ImageWithGoal[],
  )
}
