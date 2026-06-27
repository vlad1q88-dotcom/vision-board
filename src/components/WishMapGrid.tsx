import { forwardRef } from 'react'
import { WISH_MAP_ZONES } from '../db/wishMapZones'
import { WishMapZoneCell } from './WishMapZoneCell'
import type { ImageWithGoal, WishMapZoneState, WishMapZones } from '../types'
import styles from './WishMapGrid.module.css'

interface WishMapGridProps {
  zones: WishMapZones
  isEditing: boolean
  aspectRatio: string
  images: ImageWithGoal[]
  onUpdateZone: (key: string, patch: Partial<WishMapZoneState>) => void
}

export const WishMapGrid = forwardRef<HTMLDivElement, WishMapGridProps>(function WishMapGrid(
  { zones, isEditing, aspectRatio, images, onUpdateZone },
  ref,
) {
  return (
    <div className={styles.grid} style={{ aspectRatio }} ref={ref}>
      {WISH_MAP_ZONES.map((zone) => (
        <WishMapZoneCell
          key={zone.key}
          label={zone.label}
          state={zones[zone.key]}
          isEditing={isEditing}
          images={images}
          onUpdate={(patch) => onUpdateZone(zone.key, patch)}
        />
      ))}
    </div>
  )
})
