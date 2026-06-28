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
  // The date this photo "belongs under" elsewhere in the app — the journal's completion date
  // once the goal is done, or the goal's Plan task deadline while still active (if set).
  // Not the photo's own upload timestamp.
  relevantDate?: number
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

export type TaskStatus = 'plan' | 'in_progress' | 'done'

export interface Task {
  id: number
  // Set when this task mirrors a goal; omitted for standalone tasks added directly in Plan.
  goalId?: number
  // Only used/editable when goalId is omitted — goal-linked tasks display the goal's own
  // (live) title/description/category instead, same convention as WishlistItem.title.
  title?: string
  description?: string
  category?: string
  // Settable regardless of goalId — unlike title/description, the deadline has no Goal
  // counterpart, so it's a Plan-only field editable on every task.
  deadline?: number
  status: TaskStatus
  order: number
  createdAt: number
}

// One entity for both nesting depths. taskId is set for depth-1 rows (directly under a
// Task's checklist); parentSubtaskId is set for depth-2 rows (nested under a separated
// depth-1 row). Depth-2 rows always have separated === false — there's no further nesting.
export interface Subtask {
  id: number
  taskId?: number
  parentSubtaskId?: number
  title: string
  // Only shown/editable once separated === true (the row renders as its own card).
  description?: string
  deadline?: number
  done: boolean
  separated: boolean
  // Meaningful only once separated === true — plain checklist rows never expose the
  // "В работу" button or status badge, just a checkbox + strikethrough.
  status: TaskStatus
  order: number
  createdAt: number
}

export interface TaskWithGoal extends Task {
  displayTitle: string
  displayDescription: string
  // Goal's live category if goalId is set, else DEFAULT_CATEGORY for standalone tasks —
  // same convention as displayTitle/displayDescription (not stored, joined live).
  displayCategory: string
}

export interface SubtaskWithChildren extends Subtask {
  // Depth-2 rows nested under this subtask, if it's separated; empty otherwise.
  children: Subtask[]
}
