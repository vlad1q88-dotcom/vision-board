import { db } from './db'
import type { Goal } from '../types'
import { DEFAULT_CATEGORY } from './categories'

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

export async function addGoal(
  title: string,
  description: string,
  category: string = DEFAULT_CATEGORY,
): Promise<number> {
  const now = Date.now()
  const maxOrder = await db.goals.orderBy('order').last()
  return db.goals.add({
    title,
    description,
    category,
    createdAt: now,
    updatedAt: now,
    order: maxOrder ? maxOrder.order + 1 : 0,
  })
}

export async function addGoals(
  entries: { title: string; description: string; category?: string }[],
): Promise<number[]> {
  return db.transaction('rw', db.goals, async () => {
    const maxOrder = await db.goals.orderBy('order').last()
    let nextOrder = maxOrder ? maxOrder.order + 1 : 0
    const ids: number[] = []
    for (const { title, description, category } of entries) {
      const now = Date.now()
      const id = await db.goals.add({
        title,
        description,
        category: category ?? DEFAULT_CATEGORY,
        createdAt: now,
        updatedAt: now,
        order: nextOrder,
      })
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
    category: DEFAULT_CATEGORY,
    createdAt: now,
    updatedAt: now,
    order: maxOrder ? maxOrder.order + 1 : 0,
    completedAt: now,
  })
}

export async function updateGoal(
  id: number,
  title: string,
  description: string,
  category: string,
): Promise<void> {
  await db.goals.update(id, { title, description, category, updatedAt: Date.now() })
}

export async function deleteGoal(id: number): Promise<void> {
  await deleteGoals([id])
}

export async function deleteGoals(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await db.transaction('rw', db.goals, db.images, db.wishlistItems, async () => {
    await db.images.where('goalId').anyOf(ids).delete()
    await db.wishlistItems.where('goalId').anyOf(ids).delete()
    await db.goals.bulkDelete(ids)
  })
}

// Only removes active goals — completed goals keep their original category for
// reference, but they no longer surface under it (the journal shows them as "Благодарю").
export async function deleteGoalsByCategory(category: string): Promise<void> {
  const goals = await db.goals.where('category').equals(category).toArray()
  const activeIds = goals.filter((goal) => goal.completedAt === undefined).map((goal) => goal.id)
  await deleteGoals(activeIds)
}

// Same scope as deleteGoalsByCategory but across every category — completed goals are untouched.
export async function deleteAllGoals(): Promise<void> {
  const goals = await db.goals.toArray()
  const activeIds = goals.filter((goal) => goal.completedAt === undefined).map((goal) => goal.id)
  await deleteGoals(activeIds)
}

export async function completeGoal(id: number): Promise<void> {
  await completeGoals([id])
}

export async function completeGoals(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  await db.transaction('rw', db.goals, db.images, db.wishlistItems, async () => {
    await db.images.where('goalId').anyOf(ids).delete()
    await db.wishlistItems.where('goalId').anyOf(ids).delete()
    const now = Date.now()
    // Description is the pre-completion "vision" text; it gets cleared here so the
    // journal starts blank and the user writes a fresh, factual account of what happened.
    await Promise.all(ids.map((id) => db.goals.update(id, { completedAt: now, description: '' })))
  })
}

export async function updateGoalStory(id: number, story: string): Promise<void> {
  await db.goals.update(id, { story, updatedAt: Date.now() })
}

export async function updateGoalCompletedAt(id: number, completedAt: number): Promise<void> {
  await db.goals.update(id, { completedAt, updatedAt: Date.now() })
}
