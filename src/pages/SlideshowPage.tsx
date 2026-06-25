// Must never render <audio>/<video> or use the Web Audio API / navigator.mediaSession here:
// any of those would let the browser treat this page as a media session and pause the
// user's background music. Keep this page strictly visual.
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { useAllImages } from '../hooks/useAllImages'
import { useSlideshowSequence } from '../slideshow/useSlideshowSequence'
import { computeIntervalMs } from '../slideshow/intervalFormula'
import { SlideshowImage } from '../slideshow/SlideshowImage'
import styles from './SlideshowPage.module.css'

export function SlideshowPage() {
  const images = useAllImages()
  const navigate = useNavigate()
  const exit = useCallback(() => navigate('/gallery', { replace: true }), [navigate])
  const count = images.length
  const currentIndex = useSlideshowSequence(count, exit)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') exit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [exit])

  if (count < 2) {
    return (
      <div className={styles.page} onClick={exit}>
        <p className={styles.message}>Недостаточно фото для слайдшоу.</p>
      </div>
    )
  }

  const current = images[currentIndex]
  const durationMs = computeIntervalMs(count)

  return (
    <div className={styles.page} onClick={exit}>
      <AnimatePresence mode="sync">
        <SlideshowImage key={current.id} image={current} durationMs={durationMs} />
      </AnimatePresence>
    </div>
  )
}
