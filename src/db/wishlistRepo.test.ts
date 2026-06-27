import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addGoal, completeGoal, deleteGoal } from './goalRepo'
import {
  addCustomWishlistItem,
  addWishlistItems,
  deleteWishlistItem,
  getWishlist,
  listWishlistItems,
  saveWishlistName,
  updateWishlistItem,
} from './wishlistRepo'

beforeEach(async () => {
  await db.goals.clear()
  await db.images.clear()
  await db.wishlist.clear()
  await db.wishlistItems.clear()
})

describe('getWishlist / saveWishlistName', () => {
  it('returns an empty default before anything is saved, then persists the name', async () => {
    expect(await getWishlist()).toEqual({ id: 1, name: '' })

    await saveWishlistName('Новый год')
    expect(await getWishlist()).toEqual({ id: 1, name: 'Новый год' })
  })
})

describe('addWishlistItems / addCustomWishlistItem', () => {
  it('adds goal-linked items with increasing order, then a custom item continues the sequence', async () => {
    const goalA = await addGoal('A', '')
    const goalB = await addGoal('B', '')

    const [itemA, itemB] = await addWishlistItems([goalA, goalB])
    const customId = await addCustomWishlistItem('Своё желание')

    const items = await listWishlistItems()
    expect(items.map((item) => item.id)).toEqual([itemA, itemB, customId])
    expect(items.map((item) => item.order)).toEqual([0, 1, 2])
    expect(items[2].goalId).toBeUndefined()
    expect(items[2].title).toBe('Своё желание')
  })
})

describe('updateWishlistItem', () => {
  it('patches only the provided fields', async () => {
    const id = await addCustomWishlistItem('Title')
    await updateWishlistItem(id, { description: 'desc', link: 'https://example.com' })

    const item = await db.wishlistItems.get(id)
    expect(item?.description).toBe('desc')
    expect(item?.link).toBe('https://example.com')
    expect(item?.title).toBe('Title')
  })
})

describe('deleteWishlistItem', () => {
  it('removes the item', async () => {
    const id = await addCustomWishlistItem('Title')
    await deleteWishlistItem(id)
    expect(await db.wishlistItems.get(id)).toBeUndefined()
  })
})

describe('cascade removal from goalRepo', () => {
  it('removes goal-linked wishlist items when the goal is deleted, leaving custom items untouched', async () => {
    const goalId = await addGoal('Cascade me', '')
    const [linkedItemId] = await addWishlistItems([goalId])
    const customItemId = await addCustomWishlistItem('Stays')

    await deleteGoal(goalId)

    expect(await db.wishlistItems.get(linkedItemId)).toBeUndefined()
    expect(await db.wishlistItems.get(customItemId)).toBeDefined()
  })

  it('removes goal-linked wishlist items when the goal is completed, leaving custom items untouched', async () => {
    const goalId = await addGoal('Complete me', '')
    const [linkedItemId] = await addWishlistItems([goalId])
    const customItemId = await addCustomWishlistItem('Stays')

    await completeGoal(goalId)

    expect(await db.wishlistItems.get(linkedItemId)).toBeUndefined()
    expect(await db.wishlistItems.get(customItemId)).toBeDefined()
  })
})
