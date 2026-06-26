import { db } from './db'
import { createEmptyZones, DEFAULT_ASPECT_RATIO } from './wishMapZones'
import type { WishMap, WishMapZones } from '../types'

const WISH_MAP_ID = 1

export async function getWishMap(): Promise<WishMap> {
  const existing = await db.wishMap.get(WISH_MAP_ID)
  if (!existing) {
    return { id: WISH_MAP_ID, isSaved: false, aspectRatio: DEFAULT_ASPECT_RATIO, zones: createEmptyZones() }
  }
  // Fill in defaults for any zone keys or zone fields gained since this map was saved.
  const defaults = createEmptyZones()
  const zones: WishMapZones = {}
  for (const key of Object.keys(defaults)) {
    zones[key] = { ...defaults[key], ...existing.zones[key] }
  }
  return { ...existing, zones }
}

export async function saveWishMap(zones: WishMapZones, aspectRatio: string): Promise<void> {
  await db.wishMap.put({ id: WISH_MAP_ID, isSaved: true, aspectRatio, zones })
}

export async function deleteWishMap(): Promise<void> {
  await db.wishMap.delete(WISH_MAP_ID)
}
