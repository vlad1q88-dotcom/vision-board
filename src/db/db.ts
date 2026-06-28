import Dexie, { type EntityTable } from 'dexie'
import type { Goal, ImageRecord, Subtask, Task, WishMap, Wishlist, WishlistItem } from '../types'
import { DEFAULT_CATEGORY } from './categories'
import { DEFAULT_ASPECT_RATIO, DEFAULT_FONT_SIZE } from './wishMapZones'

export const db = new Dexie('vision-board') as Dexie & {
  goals: EntityTable<Goal, 'id'>
  images: EntityTable<ImageRecord, 'id'>
  wishMap: EntityTable<WishMap, 'id'>
  wishlist: EntityTable<Wishlist, 'id'>
  wishlistItems: EntityTable<WishlistItem, 'id'>
  tasks: EntityTable<Task, 'id'>
  subtasks: EntityTable<Subtask, 'id'>
}

db.version(1).stores({
  goals: '++id, order, createdAt',
  images: '++id, goalId, category, order, createdAt',
})

db.version(2)
  .stores({
    goals: '++id, order, createdAt, category',
    images: '++id, goalId, category, order, createdAt',
  })
  .upgrade(async (tx) => {
    await tx.table('goals').toCollection().modify((goal) => {
      if (!goal.category) goal.category = DEFAULT_CATEGORY
    })
  })

db.version(3).stores({
  goals: '++id, order, createdAt, category',
  images: '++id, goalId, category, order, createdAt',
  wishMap: 'id',
})

// Zones dropped the goalId link (text now comes from the chosen photo's goal title
// instead) and gained a fontSize; the map itself gained an aspectRatio.
db.version(4)
  .stores({
    goals: '++id, order, createdAt, category',
    images: '++id, goalId, category, order, createdAt',
    wishMap: 'id',
  })
  .upgrade(async (tx) => {
    await tx.table('wishMap').toCollection().modify((map) => {
      if (!map.aspectRatio) map.aspectRatio = DEFAULT_ASPECT_RATIO
      for (const key of Object.keys(map.zones ?? {})) {
        if (map.zones[key].fontSize === undefined) map.zones[key].fontSize = DEFAULT_FONT_SIZE
      }
    })
  })

db.version(5).stores({
  goals: '++id, order, createdAt, category',
  images: '++id, goalId, category, order, createdAt',
  wishMap: 'id',
  wishlist: 'id',
  wishlistItems: '++id, goalId, order, createdAt',
})

db.version(6).stores({
  goals: '++id, order, createdAt, category',
  images: '++id, goalId, category, order, createdAt',
  wishMap: 'id',
  wishlist: 'id',
  wishlistItems: '++id, goalId, order, createdAt',
  tasks: '++id, goalId, order, createdAt, status',
  subtasks: '++id, taskId, parentSubtaskId, deadline, order, createdAt',
})

db.version(7).stores({
  goals: '++id, order, createdAt, category',
  images: '++id, goalId, category, order, createdAt',
  wishMap: 'id',
  wishlist: 'id',
  wishlistItems: '++id, goalId, order, createdAt',
  tasks: '++id, goalId, order, createdAt, status, deadline',
  subtasks: '++id, taskId, parentSubtaskId, deadline, order, createdAt',
})
