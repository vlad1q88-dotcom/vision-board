import { db } from './db'
import { DEFAULT_CATEGORY } from './categories'
import type { Subtask, Task, TaskStatus } from '../types'

export async function listTasks(): Promise<Task[]> {
  return db.tasks.orderBy('order').toArray()
}

export async function listSubtasks(): Promise<Subtask[]> {
  return db.subtasks.toArray()
}

// Mirrors a newly created goal into Plan. Called from goalRepo.addGoal/addGoals, inside
// the same transaction as the goal insert — not exported for direct use by UI.
export async function createTaskForGoal(goalId: number): Promise<number> {
  const maxOrder = await db.tasks.orderBy('order').last()
  return db.tasks.add({
    goalId,
    status: 'plan',
    order: maxOrder ? maxOrder.order + 1 : 0,
    createdAt: Date.now(),
  })
}

export async function addStandaloneTask(
  title: string,
  description = '',
  category: string = DEFAULT_CATEGORY,
): Promise<number> {
  const maxOrder = await db.tasks.orderBy('order').last()
  return db.tasks.add({
    title,
    description,
    category,
    status: 'plan',
    order: maxOrder ? maxOrder.order + 1 : 0,
    createdAt: Date.now(),
  })
}

export async function updateStandaloneTask(
  id: number,
  patch: Partial<Pick<Task, 'title' | 'description' | 'category'>>,
): Promise<void> {
  await db.tasks.update(id, patch)
}

// Unlike title/description, the deadline has no Goal counterpart, so it's editable on any
// task regardless of goalId — not restricted to standalone tasks.
export async function updateTaskDeadline(id: number, deadline: number | undefined): Promise<void> {
  await db.tasks.update(id, { deadline })
}

export async function deleteStandaloneTask(id: number): Promise<void> {
  await db.transaction('rw', db.tasks, db.subtasks, async () => {
    await deleteSubtasksForTasks([id])
    await db.tasks.delete(id)
  })
}

// Standalone-task completion (no goal involved — goal-linked completion is dispatched by
// the UI directly to goalRepo.completeGoals, see TaskCard).
export async function setTaskDone(id: number): Promise<void> {
  await db.tasks.update(id, { status: 'done' })
}

export async function reorderTasks(orderedIds: number[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => db.tasks.update(id, { order: index })))
}

async function nextOrder(rows: { order: number }[]): Promise<number> {
  return rows.length === 0 ? 0 : Math.max(...rows.map((row) => row.order)) + 1
}

// Depth-1 subtasks (under a Task's checklist).
export async function addSubtask(taskId: number, title = ''): Promise<number> {
  const siblings = await db.subtasks.where('taskId').equals(taskId).toArray()
  return db.subtasks.add({
    taskId,
    title,
    done: false,
    separated: false,
    status: 'plan',
    order: await nextOrder(siblings),
    createdAt: Date.now(),
  })
}

export async function updateSubtask(
  id: number,
  patch: Partial<Pick<Subtask, 'title' | 'description' | 'deadline'>>,
): Promise<void> {
  await db.subtasks.update(id, patch)
}

export async function toggleSubtaskDone(id: number): Promise<void> {
  const row = await db.subtasks.get(id)
  if (!row) return
  const done = !row.done
  // Checking always forces status to 'done'; unchecking always resets to the neutral 'plan'
  // state (showing the "В работу" button again) — it doesn't try to restore whatever
  // intermediate status existed before checking, since that's no longer available once the
  // 'done' write overwrote it (and isn't tracked anywhere else).
  await db.subtasks.update(id, row.separated ? { done, status: done ? 'done' : 'plan' } : { done })
}

export async function deleteSubtask(id: number): Promise<void> {
  await db.transaction('rw', db.subtasks, async () => {
    await db.subtasks.where('parentSubtaskId').equals(id).delete()
    await db.subtasks.delete(id)
  })
}

export async function separateSubtask(id: number): Promise<void> {
  const row = await db.subtasks.get(id)
  if (!row || row.taskId === undefined) return
  const separatedSiblings = await db.subtasks
    .where('taskId')
    .equals(row.taskId)
    .filter((s) => s.separated)
    .toArray()
  await db.subtasks.update(id, { separated: true, order: await nextOrder(separatedSiblings) })
}

export async function setSubtaskStatus(id: number, status: TaskStatus): Promise<void> {
  await db.subtasks.update(id, { status })
}

export async function reorderSubtasks(orderedIds: number[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => db.subtasks.update(id, { order: index })))
}

// Depth-2 rows (nested under a separated depth-1 subtask). No separate()/status setter —
// a second level of separation is not allowed.
export async function addNestedSubtask(parentSubtaskId: number, title = ''): Promise<number> {
  const siblings = await db.subtasks.where('parentSubtaskId').equals(parentSubtaskId).toArray()
  return db.subtasks.add({
    parentSubtaskId,
    title,
    done: false,
    separated: false,
    status: 'plan',
    order: await nextOrder(siblings),
    createdAt: Date.now(),
  })
}

export const updateNestedSubtask = updateSubtask
export const toggleNestedSubtaskDone = toggleSubtaskDone
export const deleteNestedSubtask = deleteSubtask

// Two-level cascade: every depth-1 row under these tasks, plus every depth-2 row nested
// under any of those depth-1 rows. Exported for goalRepo's deleteGoals/completeGoals.
export async function deleteSubtasksForTasks(taskIds: number[]): Promise<void> {
  if (taskIds.length === 0) return
  const depth1Ids = await db.subtasks.where('taskId').anyOf(taskIds).primaryKeys()
  if (depth1Ids.length > 0) {
    await db.subtasks.where('parentSubtaskId').anyOf(depth1Ids).delete()
  }
  await db.subtasks.where('taskId').anyOf(taskIds).delete()
}

// Binds SubtaskChecklist's generic add/update/toggle/delete/separate callbacks to a
// specific task's depth-1 rows.
export function depth1ChecklistHandlers(taskId: number) {
  return {
    onAdd: () => addSubtask(taskId),
    onUpdate: updateSubtask,
    onToggleDone: toggleSubtaskDone,
    onDelete: deleteSubtask,
    onSeparate: separateSubtask,
  }
}

// Same, for a separated subtask's depth-2 rows — no onSeparate (no second level).
export function depth2ChecklistHandlers(parentSubtaskId: number) {
  return {
    onAdd: () => addNestedSubtask(parentSubtaskId),
    onUpdate: updateNestedSubtask,
    onToggleDone: toggleNestedSubtaskDone,
    onDelete: deleteNestedSubtask,
  }
}
