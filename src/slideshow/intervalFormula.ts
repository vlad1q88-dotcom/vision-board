export const BASE_MS = 8000
export const SLOPE_MS = 150
export const MIN_MS = 1500
export const MAX_MS = 8000

export function computeIntervalMs(count: number): number {
  const raw = BASE_MS - count * SLOPE_MS
  return Math.min(MAX_MS, Math.max(MIN_MS, raw))
}
