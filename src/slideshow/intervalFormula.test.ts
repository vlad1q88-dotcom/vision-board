import { describe, expect, it } from 'vitest'
import { BASE_MS, MAX_MS, MIN_MS, SLOPE_MS, computeIntervalMs } from './intervalFormula'

describe('computeIntervalMs', () => {
  it('returns MAX_MS when there are no photos to space out', () => {
    expect(computeIntervalMs(0)).toBe(MAX_MS)
  })

  it('clamps to MIN_MS once the raw interval drops below the floor', () => {
    const hugeCount = Math.ceil((BASE_MS - MIN_MS) / SLOPE_MS) + 10
    expect(computeIntervalMs(hugeCount)).toBe(MIN_MS)
  })

  it('decreases as the photo count grows', () => {
    expect(computeIntervalMs(40)).toBeLessThan(computeIntervalMs(3))
  })
})
