import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useObjectUrl } from '../hooks/useObjectUrl'
import type { ImageWithGoal } from '../types'
import styles from './LightboxOverlay.module.css'

interface LightboxOverlayProps {
  images: ImageWithGoal[]
}

export function LightboxOverlay({ images }: LightboxOverlayProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const lightboxId = searchParams.get('lightbox')
  const currentIndex = images.findIndex((image) => String(image.id) === lightboxId)
  const current = currentIndex >= 0 ? images[currentIndex] : undefined
  const url = useObjectUrl(current?.blob)

  const close = useCallback(() => navigate(-1), [navigate])

  const goToOffset = useCallback(
    (offset: number) => {
      if (images.length === 0) return
      const nextIndex = (currentIndex + offset + images.length) % images.length
      const next = images[nextIndex]
      const params = new URLSearchParams(searchParams)
      params.set('lightbox', String(next.id))
      setSearchParams(params, { replace: true })
    },
    [currentIndex, images, searchParams, setSearchParams],
  )

  useEffect(() => {
    if (!current) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') goToOffset(-1)
      if (event.key === 'ArrowRight') goToOffset(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, close, goToOffset])

  if (!current) return null

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.content} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={close} aria-label="Закрыть">
          ×
        </button>
        {images.length > 1 && (
          <button
            type="button"
            className={styles.prev}
            onClick={() => goToOffset(-1)}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>
        )}
        {url && <img src={url} alt="" className={styles.image} />}
        {images.length > 1 && (
          <button
            type="button"
            className={styles.next}
            onClick={() => goToOffset(1)}
            aria-label="Следующее фото"
          >
            ›
          </button>
        )}
        <button
          type="button"
          className={styles.caption}
          onClick={() =>
            navigate(
              current.goalCompletedAt !== undefined
                ? `/journal?expand=${current.goalId}`
                : `/?expand=${current.goalId}`,
            )
          }
        >
          {current.goalTitle}
        </button>
      </div>
    </div>
  )
}
