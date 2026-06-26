import { DEFAULT_ASPECT_RATIO } from '../db/wishMapZones'
import type { WishMapZones } from '../types'

// React Router unmounts WishMapPage when navigating to another tab, which would normally wipe
// its local draft state. This module-level object lives for the lifetime of the page (until a
// full reload), so remounting the page can rehydrate from here instead of resetting the edit.
interface WishMapDraftCache {
  zones: WishMapZones | null
  aspectRatio: string
  isEditing: boolean
}

export const wishMapDraftCache: WishMapDraftCache = {
  zones: null,
  aspectRatio: DEFAULT_ASPECT_RATIO,
  isEditing: false,
}
