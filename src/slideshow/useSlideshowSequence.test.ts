import { describe, expect, it } from 'vitest'
import { buildShuffledQueue } from './useSlideshowSequence'

describe('buildShuffledQueue', () => {
  it('contains every index exactly once', () => {
    const queue = buildShuffledQueue(5, null)
    expect(queue).toHaveLength(5)
    expect([...queue].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
  })

  it('never starts with the index that just finished the previous cycle', () => {
    for (let i = 0; i < 200; i++) {
      const queue = buildShuffledQueue(5, 2)
      expect(queue[0]).not.toBe(2)
    }
  })

  it('keeps repeats out until a full cycle has played, across many shuffles', () => {
    let lastShown: number | null = null
    for (let cycle = 0; cycle < 50; cycle++) {
      const queue = buildShuffledQueue(5, lastShown)
      const seen = new Set<number>()
      for (const index of queue) {
        expect(seen.has(index)).toBe(false)
        seen.add(index)
      }
      lastShown = queue[queue.length - 1]
    }
  })
})
