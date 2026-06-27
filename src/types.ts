export interface Goal {
  id: number
  title: string
  description: string
  category: string
  createdAt: number
  updatedAt: number
  order: number
  completedAt?: number
  story?: string
}

export type ImageCategory = 'goal' | 'gratitude'

export interface ImageRecord {
  id: number
  goalId: number
  blob: Blob
  thumbBlob?: Blob
  category: ImageCategory
  order: number
  createdAt: number
  width?: number
  height?: number
}

export interface ImageWithGoal extends ImageRecord {
  goalTitle: string
  goalCompletedAt?: number
  goalCategory: string
}

export interface WishMapZoneState {
  imageId?: number
  customBlob?: Blob
  text: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  opacity: number
  x: number
  y: number
  photoX: number
  photoY: number
  photoScale: number
}

export type WishMapZones = Record<string, WishMapZoneState>

export interface WishMap {
  id: number
  isSaved: boolean
  aspectRatio: string
  zones: WishMapZones
}

export interface Wishlist {
  id: number
  name: string
}

export interface WishlistItem {
  id: number
  // Omitted for items added directly in the wishlist (not picked from an existing goal).
  goalId?: number
  // Only used/editable when goalId is omitted — goal-linked items display the goal's own
  // (live) title instead, so renaming the goal elsewhere stays in sync automatically.
  title?: string
  customBlob?: Blob
  imageId?: number
  // Pan/zoom state for the photo, same convention as WishMapZoneState (50/50/1 = centered,
  // unscaled). Optional since items predating this feature (or with no photo yet) won't have it.
  photoX?: number
  photoY?: number
  photoScale?: number
  description?: string
  link?: string
  order: number
  createdAt: number
}

export interface WishlistItemWithGoal extends WishlistItem {
  // Goal's live title if goalId is set, else item.title.
  displayTitle: string
}
