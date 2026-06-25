import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./thumbnails', () => ({
  createThumbnail: vi.fn(async (blob: Blob) => blob),
}))

import { db } from './db'
import { addGoal, completeGoal, listActiveGoals, listCompletedGoals } from './goalRepo'
import { addImageToGoal } from './imageRepo'

beforeEach(async () => {
  await db.images.clear()
  await db.goals.clear()
})

describe('completeGoal', () => {
  it('deletes the goal photos, sets completedAt, and clears the old vision description', async () => {
    const goalId = await addGoal('Marathon', 'Run a marathon')
    await addImageToGoal(goalId, new Blob(['x'], { type: 'image/png' }))
    await addImageToGoal(goalId, new Blob(['y'], { type: 'image/png' }))

    await completeGoal(goalId)

    const remainingImages = await db.images.where('goalId').equals(goalId).count()
    expect(remainingImages).toBe(0)

    const goal = await db.goals.get(goalId)
    expect(goal?.completedAt).toBeTypeOf('number')
    expect(goal?.description).toBe('')
  })
})

describe('listActiveGoals / listCompletedGoals', () => {
  it('partitions goals by completion status', async () => {
    const activeId = await addGoal('Active goal', '')
    const completedId = await addGoal('Completed goal', '')
    await completeGoal(completedId)

    const active = await listActiveGoals()
    const completed = await listCompletedGoals()

    expect(active.map((g) => g.id)).toEqual([activeId])
    expect(completed.map((g) => g.id)).toEqual([completedId])
  })

  it('sorts completed goals by most recently completed first', async () => {
    const firstId = await addGoal('First', '')
    const secondId = await addGoal('Second', '')
    await completeGoal(firstId)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await completeGoal(secondId)

    const completed = await listCompletedGoals()
    expect(completed.map((g) => g.id)).toEqual([secondId, firstId])
  })
})
