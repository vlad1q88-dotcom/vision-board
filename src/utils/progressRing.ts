// Perimeter of a rounded rectangle: straight edges (2*(w+h)) minus the 2*radius cut off each
// of the 4 corners, plus the 4 quarter-circle arcs replacing them (2*pi*radius total).
export function computeRingPerimeter(width: number, height: number, radius: number): number {
  if (width <= 0 || height <= 0) return 0
  return 2 * (width + height) - 8 * radius + 2 * Math.PI * radius
}

export function computeRingFraction(total: number, completed: number): number {
  if (total <= 0) return 0
  return Math.min(Math.max(completed, 0), total) / total
}

// Distance (px) along the rect's path, from its native start point (just after the top-left
// corner's curve, at x = radius) to the horizontal midpoint of the top edge (x = width / 2).
export function computeTopMidOffset(width: number, radius: number): number {
  return Math.max(width / 2 - radius, 0)
}
