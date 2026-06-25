import { db } from './db'
import type { Goal } from '../types'

export async function listActiveGoals(): Promise<Goal[]> {
  const goals = await db.goals.orderBy('order').toArray()
  return goals.filter((goal) => goal.completedAt === undefined)
}

export async function listCompletedGoals(): Promise<Goal[]> {
  const goals = await db.goals.toArray()
  return goals
    .filter((goal) => goal.completedAt !== undefined)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
}

export async function addGoal(title: string, description: string): Promise<number> {
  const now = Date.now()
  const maxOrder = await db.goals.orderBy('order').last()
  return db.goals.add({
    title,
    description,
    createdAt: now,
    updatedAt: now,
    order: maxOrder ? maxOrder.order + 1 : 0,
  })
}

export async function addGoals(entries: { title: string; description: string }[]): Promise<number[]> {
  return db.transaction('rw', db.goals, async () => {
    const maxOrder = await db.goals.orderBy('order').last()
    let nextOrder = maxOrder ? maxOrder.order + 1 : 0
    const ids: number[] = []
    for (const { title, description } of entries) {
      const now = Date.now()
      const id = await db.goals.add({ title, description, createdAt: now, updatedAt: now, order: nextOrder })
      ids.push(id)
      nextOrder += 1
    }
    return ids
  })
}

export async function addGratitudeEntry(title: string): Promise<number> {
  const now = Date.now()
  const maxOrder = await db.goals.orderBy('order').last()
  return db.goals.add({
    title,
    description: '',
    story: '',
    createdAt: now,
    updatedAt: now,
    order: maxOrder ? maxOrder.order + 1 : 0,
    completedAt: now,
  })
}

export async function updateGoal(id: number, title: string, description: string): Promise<void> {
  await db.goals.update(id, { title, description, updatedAt: Date.now() })
}

export async function deleteGoal(id: number): Promise<void> {
  await db.transaction('rw', db.goals, db.images, async () => {
    await db.images.where('goalId').equals(id).delete()
    await db.goals.delete(id)
  })
}

export async function completeGoal(id: number): Promise<void> {
  await db.transaction('rw', db.goals, db.images, async () => {
    await db.images.where('goalId').equals(id).delete()
    // Description is the pre-completion "vision" text; it gets cleared here so the
    // journal starts blank and the user writes a fresh, factual account of what happened.
    await db.goals.update(id, { completedAt: Date.now(), description: '' })
  })
}

export async function updateGoalStory(id: number, story: string): Promise<void> {
  await db.goals.update(id, { story, updatedAt: Date.now() })
}

export async function updateGoalCompletedAt(id: number, completedAt: number): Promise<void> {
  await db.goals.update(id, { completedAt, updatedAt: Date.now() })
}
