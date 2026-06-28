import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_CATEGORY } from '../db/categories'
import type { TaskStatus } from '../types'

// Normalized shape covering both tasks and subtasks so the flat agenda view (the Plan page's
// date-range filter) can mix and sort them together, ignoring hierarchy entirely.
export interface FlatDeadlineRow {
  kind: 'task' | 'subtask'
  id: number
  title: string
  deadline: number
  done: boolean
  status: TaskStatus
  // Only meaningful for kind: 'task' — needed to dispatch completion the same way TaskCard
  // does (completeGoals when linked, setTaskDone otherwise).
  goalId?: number
  // Only meaningful for kind: 'task' — subtasks have no category to filter by.
  category?: string
}

// Flat agenda view used by the Plan page's date-range filter: every task AND subtask (any
// depth) with a deadline in range, regardless of hierarchy — hierarchy is intentionally ignored.
export function useFlatDeadlineItems(fromMs: number | null, toMs: number | null) {
  return useLiveQuery(
    async () => {
      if (fromMs === null || toMs === null) return []
      const [taskRows, subtaskRows, goals] = await Promise.all([
        db.tasks.where('deadline').between(fromMs, toMs, true, true).toArray(),
        db.subtasks.where('deadline').between(fromMs, toMs, true, true).toArray(),
        db.goals.toArray(),
      ])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))

      const taskItems: FlatDeadlineRow[] = taskRows.map((task) => {
        const goal = task.goalId !== undefined ? goalById.get(task.goalId) : undefined
        return {
          kind: 'task',
          id: task.id,
          title: task.goalId !== undefined ? goal?.title ?? '' : task.title ?? '',
          deadline: task.deadline as number,
          done: task.status === 'done',
          status: task.status,
          goalId: task.goalId,
          category: task.goalId !== undefined ? goal?.category || DEFAULT_CATEGORY : DEFAULT_CATEGORY,
        }
      })
      const subtaskItems: FlatDeadlineRow[] = subtaskRows.map((subtask) => ({
        kind: 'subtask',
        id: subtask.id,
        title: subtask.title,
        deadline: subtask.deadline as number,
        done: subtask.done,
        status: subtask.status,
      }))

      return [...taskItems, ...subtaskItems].sort((a, b) => a.deadline - b.deadline)
    },
    [fromMs, toMs],
    [] as FlatDeadlineRow[],
  )
}
