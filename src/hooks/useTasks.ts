import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { listTasks } from '../db/taskRepo'
import { compareByDeadlineThenOrder } from '../utils/deadlineSort'
import { DEFAULT_CATEGORY } from '../db/categories'
import type { TaskWithGoal } from '../types'

export function useTasks() {
  return useLiveQuery(
    async () => {
      const [tasks, goals] = await Promise.all([listTasks(), db.goals.toArray()])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))
      return tasks
        // Belt-and-suspenders: completeGoals/deleteGoals already delete the task row itself
        // inside the same transaction, so this should never actually filter anything out.
        .filter((task) => task.goalId === undefined || goalById.has(task.goalId))
        .map((task) => {
          const goal = task.goalId !== undefined ? goalById.get(task.goalId) : undefined
          return {
            ...task,
            displayTitle: task.goalId !== undefined ? goal?.title ?? '' : task.title ?? '',
            displayDescription: task.goalId !== undefined ? goal?.description ?? '' : task.description ?? '',
            displayCategory:
              task.goalId !== undefined ? goal?.category || DEFAULT_CATEGORY : task.category || DEFAULT_CATEGORY,
          } satisfies TaskWithGoal
        })
        .sort(compareByDeadlineThenOrder)
    },
    [],
    [] as TaskWithGoal[],
  )
}
