import { db } from './db'
import type { Wishlist, WishlistItem } from '../types'

const WISHLIST_ID = 1

export async function getWishlist(): Promise<Wishlist> {
  const existing = await db.wishlist.get(WISHLIST_ID)
  return existing ?? { id: WISHLIST_ID, name: '' }
}

export async function saveWishlistName(name: string): Promise<void> {
  await db.wishlist.put({ id: WISHLIST_ID, name })
}

export async function listWishlistItems(): Promise<WishlistItem[]> {
  return db.wishlistItems.orderBy('order').toArray()
}

export async function addWishlistItems(goalIds: number[]): Promise<number[]> {
  if (goalIds.length === 0) return []
  return db.transaction('rw', db.wishlistItems, async () => {
    const maxOrder = await db.wishlistItems.orderBy('order').last()
    let nextOrder = maxOrder ? maxOrder.order + 1 : 0
    const ids: number[] = []
    for (const goalId of goalIds) {
      const id = await db.wishlistItems.add({ goalId, order: nextOrder, createdAt: Date.now() })
      ids.push(id)
      nextOrder += 1
    }
    return ids
  })
}

export async function addCustomWishlistItem(title: string): Promise<number> {
  const maxOrder = await db.wishlistItems.orderBy('order').last()
  return db.wishlistItems.add({
    title,
    order: maxOrder ? maxOrder.order + 1 : 0,
    createdAt: Date.now(),
  })
}

export async function updateWishlistItem(
  id: number,
  patch: Partial<
    Pick<
      WishlistItem,
      'title' | 'customBlob' | 'imageId' | 'photoX' | 'photoY' | 'photoScale' | 'description' | 'link'
    >
  >,
): Promise<void> {
  await db.wishlistItems.update(id, patch)
}

export async function deleteWishlistItem(id: number): Promise<void> {
  await db.wishlistItems.delete(id)
}

export async function clearWishlistItems(): Promise<void> {
  await db.wishlistItems.clear()
}
