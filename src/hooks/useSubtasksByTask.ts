import { useLiveQuery } from 'dexie-react-hooks'
import { listSubtasks } from '../db/taskRepo'
import { compareByDeadlineThenOrder } from '../utils/deadlineSort'
import type { Subtask, SubtaskWithChildren } from '../types'

// One live query covering the whole Plan page's checklist needs — depth-1 rows for every
// task, each with its own depth-2 children (if separated) attached and sorted by `order`.
export function useSubtasksByTask() {
  return useLiveQuery(
    async () => {
      const all = await listSubtasks()
      const childrenByParent = new Map<number, Subtask[]>()
      for (const row of all) {
        if (row.parentSubtaskId === undefined) continue
        const list = childrenByParent.get(row.parentSubtaskId) ?? []
        list.push(row)
        childrenByParent.set(row.parentSubtaskId, list)
      }
      const result = new Map<number, SubtaskWithChildren[]>()
      for (const row of all) {
        if (row.taskId === undefined) continue
        const list = result.get(row.taskId) ?? []
        list.push({
          ...row,
          children: (childrenByParent.get(row.id) ?? []).sort(compareByDeadlineThenOrder),
        })
        result.set(row.taskId, list)
      }
      for (const list of result.values()) list.sort(compareByDeadlineThenOrder)
      return result
    },
    [],
    new Map<number, SubtaskWithChildren[]>(),
  )
}
