import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAllImages } from '../hooks/useAllImages'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { ALL_CATEGORIES } from '../db/categories'
import { CategoryFilter } from './CategoryFilter'
import { GalleryGrid } from './GalleryGrid'
import type { ImageWithGoal } from '../types'
import styles from './WishMapPhotoPicker.module.css'

interface PhotoPreviewProps {
  images: ImageWithGoal[]
  current: ImageWithGoal
  onNavigate: (image: ImageWithGoal) => void
  onClose: () => void
  onChoose: () => void
}

function PhotoPreview({ images, current, onNavigate, onClose, onChoose }: PhotoPreviewProps) {
  const url = useObjectUrl(current.blob)
  const currentIndex = images.findIndex((image) => image.id === current.id)

  const goToOffset = useCallback(
    (offset: number) => {
      if (images.length === 0) return
      const nextIndex = (currentIndex + offset + images.length) % images.length
      onNavigate(images[nextIndex])
    },
    [currentIndex, images, onNavigate],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goToOffset(-1)
      if (event.key === 'ArrowRight') goToOffset(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToOffset, onClose])

  return (
    <div className={styles.previewBackdrop} onClick={onClose}>
      <div className={styles.previewContent} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.previewClose} onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        {current.goalTitle && <p className={styles.previewCaption}>{current.goalTitle}</p>}
        {images.length > 1 && (
          <button
            type="button"
            className={styles.previewPrev}
            onClick={() => goToOffset(-1)}
            aria-label="Предыдущее фото"
          >
            <svg viewBox="0 0 24 24" className={styles.arrowIcon}>
              <path
                d="M15 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {url && <img src={url} alt="" className={styles.previewImage} />}
        {images.length > 1 && (
          <button
            type="button"
            className={styles.previewNext}
            onClick={() => goToOffset(1)}
            aria-label="Следующее фото"
          >
            <svg viewBox="0 0 24 24" className={styles.arrowIcon}>
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <button type="button" className={styles.chooseButton} onClick={onChoose}>
          Выбрать
        </button>
      </div>
    </div>
  )
}

interface WishMapPhotoPickerProps {
  onSelect: (imageId: number) => void
  onClose: () => void
}

export function WishMapPhotoPicker({ onSelect, onClose }: WishMapPhotoPickerProps) {
  const images = useAllImages()
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [openImage, setOpenImage] = useState<ImageWithGoal | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(images.map((image) => image.goalCategory))),
    [images],
  )

  const visibleImages = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? images
        : images.filter((image) => image.goalCategory === selectedCategory),
    [images, selectedCategory],
  )

  function handleChoose() {
    if (!openImage) return
    onSelect(openImage.id)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <h2 className={styles.title}>Выбор фото</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>
      <div className={styles.body}>
        {categories.length > 0 && (
          <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        )}
        <GalleryGrid
          images={visibleImages}
          onOpen={(id) => setOpenImage(visibleImages.find((image) => image.id === id) ?? null)}
        />
      </div>
      {openImage && (
        <PhotoPreview
          images={visibleImages}
          current={openImage}
          onNavigate={setOpenImage}
          onClose={() => setOpenImage(null)}
          onChoose={handleChoose}
        />
      )}
    </div>
  )
}
