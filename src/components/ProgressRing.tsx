import { useEffect, useRef, useState } from 'react'
import { computeRingFraction, computeRingPerimeter, computeTopMidOffset } from '../utils/progressRing'
import styles from './ProgressRing.module.css'

// Matches var(--radius-md), the border-radius used by both TaskCard's and SubtaskCard's .card.
const RADIUS = 6

interface ProgressRingProps {
  total: number
  completed: number
}

export function ProgressRing({ total, completed }: ProgressRingProps) {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // No early return for total <= 0 — computeRingFraction already yields 0 in that case, which
  // zeroes the dash out naturally (invisible ring). Returning null here instead would unmount
  // the <svg>, and since the ResizeObserver effect above only runs once (on mount, via the `[]`
  // dependency array — matching this codebase's existing ResizeObserver convention in
  // WishMapZoneCell.tsx/WishlistItemEditor.tsx), a card that starts at total=0 and later gains
  // subtasks would never get its ref re-attached once the <svg> finally appears.
  const perimeter = computeRingPerimeter(size.width, size.height, RADIUS)
  const fraction = computeRingFraction(total, completed)
  const dash = fraction * perimeter
  const offset = computeTopMidOffset(size.width, RADIUS)

  return (
    <svg ref={ref} className={styles.ring} aria-hidden="true">
      <rect
        x="1"
        y="1"
        width={Math.max(size.width - 2, 0)}
        height={Math.max(size.height - 2, 0)}
        rx={RADIUS}
        ry={RADIUS}
        className={styles.track}
        style={{ strokeDasharray: `${dash} ${Math.max(perimeter - dash, 0)}`, strokeDashoffset: -offset }}
      />
    </svg>
  )
}
