import Dexie, { type EntityTable } from 'dexie'
import type { Goal, ImageRecord } from '../types'

export const db = new Dexie('vision-board') as Dexie & {
  goals: EntityTable<Goal, 'id'>
  images: EntityTable<ImageRecord, 'id'>
}

db.version(1).stores({
  goals: '++id, order, createdAt',
  images: '++id, goalId, category, order, createdAt',
})
