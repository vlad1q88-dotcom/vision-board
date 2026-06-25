import { db } from './db'
import { createThumbnail } from './thumbnails'
import type { ImageCategory } from '../types'

export const MAX_IMAGES_PER_GOAL = 8

export class GoalImageLimitError extends Error {
  constructor() {
    super(`A goal cannot have more than ${MAX_IMAGES_PER_GOAL} images`)
  }
}

export async function addImageToGoal(
  goalId: number,
  file: Blob,
  category: ImageCategory = 'goal',
): Promise<number> {
  const thumbBlob = await createThumbnail(file)

  return db.transaction('rw', db.images, async () => {
    const count = await db.images.where('goalId').equals(goalId).count()
    if (count >= MAX_IMAGES_PER_GOAL) {
      throw new GoalImageLimitError()
    }

    return db.images.add({
      goalId,
      blob: file,
      thumbBlob,
      category,
      order: count,
      createdAt: Date.now(),
    })
  })
}

export async function deleteImage(id: number): Promise<void> {
  await db.images.delete(id)
}

export async function reorderImages(ids: number[]): Promise<void> {
  await db.transaction('rw', db.images, async () => {
    await Promise.all(ids.map((id, order) => db.images.update(id, { order })))
  })
}
