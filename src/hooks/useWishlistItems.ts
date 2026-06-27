import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { listWishlistItems } from '../db/wishlistRepo'
import type { WishlistItemWithGoal } from '../types'

export function useWishlistItems() {
  return useLiveQuery(
    async () => {
      const [items, goals] = await Promise.all([listWishlistItems(), db.goals.toArray()])
      const goalById = new Map(goals.map((goal) => [goal.id, goal]))
      return items.map((item) => ({
        ...item,
        displayTitle: item.goalId !== undefined ? goalById.get(item.goalId)?.title ?? '' : item.title ?? '',
      }))
    },
    [],
    [] as WishlistItemWithGoal[],
  )
}
