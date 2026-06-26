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
