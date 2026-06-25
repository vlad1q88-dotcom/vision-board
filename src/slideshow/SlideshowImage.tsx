import { motion } from 'motion/react'
import { useObjectUrl } from '../hooks/useObjectUrl'
import type { ImageWithGoal } from '../types'
import styles from './SlideshowImage.module.css'

interface SlideshowImageProps {
  image: ImageWithGoal
  durationMs: number
}

const KEN_BURNS_END_SCALE = 1.08

export function SlideshowImage({ image, durationMs }: SlideshowImageProps) {
  const url = useObjectUrl(image.blob)
  if (!url) return null

  return (
    <motion.img
      key={image.id}
      src={url}
      alt=""
      className={styles.image}
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: KEN_BURNS_END_SCALE }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 1.2, ease: 'easeInOut' },
        scale: { duration: durationMs / 1000, ease: 'linear' },
      }}
    />
  )
}
