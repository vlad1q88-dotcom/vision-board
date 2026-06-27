import { useLiveQuery } from 'dexie-react-hooks'
import { getWishlist } from '../db/wishlistRepo'
import type { Wishlist } from '../types'

export function useWishlist() {
  return useLiveQuery(() => getWishlist(), [], null as Wishlist | null)
}
