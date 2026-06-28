import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addGoal, completeGoal, deleteGoal } from './goalRepo'
import {
  addNestedSubtask,
  addStandaloneTask,
  addSubtask,
  deleteStandaloneTask,
  deleteSubtask,
  listTasks,
  reorderSubtasks,
  reorderTasks,
  separateSubtask,
  setTaskDone,
  toggleSubtaskDone,
  updateStandaloneTask,
  updateTaskDeadline,
} from './taskRepo'

beforeEach(async () => {
  await db.goals.clear()
  await db.images.clear()
  await db.wishlistItems.clear()
  await db.tasks.clear()
  await db.subtasks.clear()
})

describe('addGoal mirrors a task', () => {
  it('creates a goal-linked task with status plan and no stored title/description', async () => {
    const goalId = await addGoal('Marathon', 'Run a marathon')

    const tasks = await listTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].goalId).toBe(goalId)
    expect(tasks[0].status).toBe('plan')
    expect(tasks[0].title).toBeUndefined()
  })
})

describe('addStandaloneTask / updateStandaloneTask', () => {
  it('creates a task with no goalId, editable title/description', async () => {
    const id = await addStandaloneTask('Read a book', 'Finish the novel')
    await updateStandaloneTask(id, { title: 'Read two books' })

    const task = await db.tasks.get(id)
    expect(task?.goalId).toBeUndefined()
    expect(task?.title).toBe('Read two books')
    expect(task?.description).toBe('Finish the novel')
  })

  it('defaults category to "Общие" and allows setting/updating it', async () => {
    const id = await addStandaloneTask('Read a book')
    expect((await db.tasks.get(id))?.category).toBe('Общие')

    const withCategory = await addStandaloneTask('Run', '', 'Здоровье')
    expect((await db.tasks.get(withCategory))?.category).toBe('Здоровье')

    await updateStandaloneTask(withCategory, { category: 'Работа' })
    expect((await db.tasks.get(withCategory))?.category).toBe('Работа')
  })
})

describe('setTaskDone', () => {
  it('flips status to done without touching goalId', async () => {
    const id = await addStandaloneTask('Task')
    await setTaskDone(id)
    expect((await db.tasks.get(id))?.status).toBe('done')
  })
})

describe('updateTaskDeadline', () => {
  it('sets the deadline on any task, including goal-linked ones', async () => {
    const goalId = await addGoal('Marathon', '')
    const [task] = await listTasks()
    const deadline = Date.UTC(2026, 0, 15)

    await updateTaskDeadline(task.id, deadline)
    expect((await db.tasks.get(task.id))?.deadline).toBe(deadline)
    expect((await db.tasks.get(task.id))?.goalId).toBe(goalId)

    await updateTaskDeadline(task.id, undefined)
    expect((await db.tasks.get(task.id))?.deadline).toBeUndefined()
  })
})

describe('reorderTasks', () => {
  it('persists the new order for each id', async () => {
    const a = await addStandaloneTask('A')
    const b = await addStandaloneTask('B')
    const c = await addStandaloneTask('C')

    await reorderTasks([c, a, b])

    const tasks = await listTasks()
    expect(tasks.map((t) => t.id)).toEqual([c, a, b])
  })
})

describe('subtask checklist', () => {
  it('adds depth-1 rows with increasing order, toggles done, and deletes', async () => {
    const taskId = await addStandaloneTask('Task')
    const rowA = await addSubtask(taskId, 'Step 1')
    const rowB = await addSubtask(taskId, 'Step 2')

    const rows = await db.subtasks.where('taskId').equals(taskId).toArray()
    expect(rows.map((r) => r.order)).toEqual([0, 1])

    await toggleSubtaskDone(rowA)
    expect((await db.subtasks.get(rowA))?.done).toBe(true)

    await deleteSubtask(rowB)
    expect(await db.subtasks.get(rowB)).toBeUndefined()
  })

  it('separating a row makes it a card and syncs status to done when checked, back to plan when unchecked', async () => {
    const taskId = await addStandaloneTask('Task')
    const rowId = await addSubtask(taskId, 'Step 1')

    await separateSubtask(rowId)
    expect((await db.subtasks.get(rowId))?.separated).toBe(true)

    await toggleSubtaskDone(rowId)
    let row = await db.subtasks.get(rowId)
    expect(row?.done).toBe(true)
    expect(row?.status).toBe('done')

    await toggleSubtaskDone(rowId)
    row = await db.subtasks.get(rowId)
    expect(row?.done).toBe(false)
    expect(row?.status).toBe('plan')
  })

  it('supports nested depth-2 rows under a separated subtask, reordered independently', async () => {
    const taskId = await addStandaloneTask('Task')
    const parentRowId = await addSubtask(taskId, 'Step 1')
    await separateSubtask(parentRowId)

    const nestedA = await addNestedSubtask(parentRowId, 'Nested A')
    const nestedB = await addNestedSubtask(parentRowId, 'Nested B')

    const nestedRows = await db.subtasks.where('parentSubtaskId').equals(parentRowId).toArray()
    expect(nestedRows.map((r) => r.id)).toEqual([nestedA, nestedB])

    await reorderSubtasks([nestedB, nestedA])
    const reordered = await db.subtasks.where('parentSubtaskId').equals(parentRowId).toArray()
    expect(reordered.find((r) => r.id === nestedB)?.order).toBe(0)
    expect(reordered.find((r) => r.id === nestedA)?.order).toBe(1)
  })
})

describe('deleteStandaloneTask', () => {
  it('cascades both subtask depths', async () => {
    const taskId = await addStandaloneTask('Task')
    const rowId = await addSubtask(taskId, 'Step 1')
    await separateSubtask(rowId)
    const nestedId = await addNestedSubtask(rowId, 'Nested')

    await deleteStandaloneTask(taskId)

    expect(await db.tasks.get(taskId)).toBeUndefined()
    expect(await db.subtasks.get(rowId)).toBeUndefined()
    expect(await db.subtasks.get(nestedId)).toBeUndefined()
  })
})

describe('cascade removal from goalRepo', () => {
  it('removes the mirrored task and all its subtasks (both depths) when the goal is deleted', async () => {
    const goalId = await addGoal('Cascade me', '')
    const [task] = await listTasks()
    const rowId = await addSubtask(task.id, 'Step 1')
    await separateSubtask(rowId)
    const nestedId = await addNestedSubtask(rowId, 'Nested')

    await deleteGoal(goalId)

    expect(await db.tasks.get(task.id)).toBeUndefined()
    expect(await db.subtasks.get(rowId)).toBeUndefined()
    expect(await db.subtasks.get(nestedId)).toBeUndefined()
  })

  it('removes the mirrored task and all its subtasks (both depths) when the goal is completed', async () => {
    const goalId = await addGoal('Complete me', '')
    const [task] = await listTasks()
    const rowId = await addSubtask(task.id, 'Step 1')
    await separateSubtask(rowId)
    const nestedId = await addNestedSubtask(rowId, 'Nested')

    await completeGoal(goalId)

    expect(await db.tasks.get(task.id)).toBeUndefined()
    expect(await db.subtasks.get(rowId)).toBeUndefined()
    expect(await db.subtasks.get(nestedId)).toBeUndefined()
    const goal = await db.goals.get(goalId)
    expect(goal?.completedAt).toBeTypeOf('number')
  })

  it('leaves standalone tasks untouched by goal completion/deletion', async () => {
    const standaloneId = await addStandaloneTask('Stays')
    const goalId = await addGoal('Unrelated', '')

    await completeGoal(goalId)
    expect(await db.tasks.get(standaloneId)).toBeDefined()

    const goalId2 = await addGoal('Unrelated 2', '')
    await deleteGoal(goalId2)
    expect(await db.tasks.get(standaloneId)).toBeDefined()
  })
})
