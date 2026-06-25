import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./thumbnails', () => ({
  createThumbnail: vi.fn(async (blob: Blob) => blob),
}))

import { db } from './db'
import { addGoal } from './goalRepo'
import { GoalImageLimitError, MAX_IMAGES_PER_GOAL, addImageToGoal } from './imageRepo'

beforeEach(async () => {
  await db.images.clear()
  await db.goals.clear()
})

describe('addImageToGoal', () => {
  it('rejects a 9th image and leaves exactly 8 rows', async () => {
    const goalId = await addGoal('Test goal', '')
    const blob = new Blob(['x'], { type: 'image/png' })

    for (let i = 0; i < MAX_IMAGES_PER_GOAL; i++) {
      await addImageToGoal(goalId, blob)
    }

    await expect(addImageToGoal(goalId, blob)).rejects.toBeInstanceOf(GoalImageLimitError)

    const count = await db.images.where('goalId').equals(goalId).count()
    expect(count).toBe(MAX_IMAGES_PER_GOAL)
  })
})
