import { useObjectUrl } from '../hooks/useObjectUrl'
import type { ImageWithGoal } from '../types'
import styles from './GalleryGrid.module.css'

interface GridThumbProps {
  image: ImageWithGoal
  onOpen: () => void
}

function GridThumb({ image, onOpen }: GridThumbProps) {
  const url = useObjectUrl(image.thumbBlob ?? image.blob)

  return (
    <button type="button" className={styles.cell} onClick={onOpen} aria-label={image.goalTitle}>
      {url && <img src={url} alt={image.goalTitle} className={styles.img} />}
    </button>
  )
}

interface GalleryGridProps {
  images: ImageWithGoal[]
  onOpen: (id: number) => void
}

export function GalleryGrid({ images, onOpen }: GalleryGridProps) {
  if (images.length === 0) {
    return <p className={styles.empty}>Пока нет ни одной фотографии. Добавьте фото на странице целей.</p>
  }

  return (
    <div className={styles.grid}>
      {images.map((image) => (
        <GridThumb key={image.id} image={image} onOpen={() => onOpen(image.id)} />
      ))}
    </div>
  )
}
