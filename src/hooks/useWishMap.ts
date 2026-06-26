import { useLiveQuery } from 'dexie-react-hooks'
import { getWishMap } from '../db/wishMapRepo'
import type { WishMap } from '../types'

export function useWishMap() {
  return useLiveQuery(() => getWishMap(), [], null as WishMap | null)
}
