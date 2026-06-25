export interface Goal {
  id: number
  title: string
  description: string
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
}
