import { Link, useSearchParams } from 'react-router-dom'
import { useAllImages } from '../hooks/useAllImages'
import { GalleryGrid } from '../components/GalleryGrid'
import { LightboxOverlay } from '../components/LightboxOverlay'
import { NavBar } from '../components/NavBar'
import styles from './GalleryPage.module.css'

export function GalleryPage() {
  const images = useAllImages()
  const [searchParams, setSearchParams] = useSearchParams()

  function openLightbox(id: number) {
    const params = new URLSearchParams(searchParams)
    params.set('lightbox', String(id))
    setSearchParams(params)
  }

  const canStartSlideshow = images.length >= 2

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>Общая галерея</h1>
        {canStartSlideshow ? (
          <Link to="/slideshow" className={styles.slideshowLink}>
            Запустить слайдшоу
          </Link>
        ) : (
          <span className={styles.slideshowLinkDisabled}>Запустить слайдшоу</span>
        )}
      </div>
      <GalleryGrid images={images} onOpen={openLightbox} />
      <LightboxOverlay images={images} />
    </div>
  )
}
