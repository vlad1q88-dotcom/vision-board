import { useEffect, useRef, useState } from 'react'
import { computeIntervalMs } from './intervalFormula'

export const TOTAL_DURATION_MS = 20 * 60 * 1000

function shuffle(indices: number[]): number[] {
  const result = [...indices]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Builds one random play order of every index 0..count-1 (a "shuffle bag"), so each
// photo is shown exactly once before any repeat. If the shuffle happens to start with
// the photo that just ended the previous cycle, swap it away to avoid a back-to-back repeat.
export function buildShuffledQueue(count: number, avoidLeadingRepeatOf: number | null): number[] {
  const queue = shuffle(Array.from({ length: count }, (_, i) => i))
  if (count > 1 && avoidLeadingRepeatOf !== null && queue[0] === avoidLeadingRepeatOf) {
    const swapWith = 1 + Math.floor(Math.random() * (count - 1))
    ;[queue[0], queue[swapWith]] = [queue[swapWith], queue[0]]
  }
  return queue
}

// Returns null until the first shuffled index is picked. Starting at a real index (e.g. 0)
// would flash images[0] for one frame before the shuffle effect runs — AnimatePresence
// registers that transient slide, and because its <img> mounts only after the object URL
// resolves (i.e. already inside an exiting slide), the exit animation never completes and
// the photo stays stuck in the DOM under every later slide.
export function useSlideshowSequence(count: number, onComplete: () => void): number | null {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (count < 2) return

    let queue = buildShuffledQueue(count, null)
    let lastShown = queue[0]
    setCurrentIndex(queue[0])
    queue = queue.slice(1)

    const startedAt = Date.now()
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const remaining = TOTAL_DURATION_MS - (Date.now() - startedAt)
      if (remaining <= 0) {
        onCompleteRef.current()
        return
      }
      const interval = Math.min(computeIntervalMs(count), remaining)
      timeoutId = setTimeout(() => {
        if (queue.length === 0) {
          queue = buildShuffledQueue(count, lastShown)
        }
        const next = queue.shift() as number
        lastShown = next
        setCurrentIndex(next)
        scheduleNext()
      }, interval)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [count])

  return currentIndex
}
