import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAllImages } from '../hooks/useAllImages'
import { ALL_CATEGORIES, GALLERY_CATEGORY_STORAGE_KEY } from '../db/categories'
import { GalleryGrid } from '../components/GalleryGrid'
import { CategoryFilter } from '../components/CategoryFilter'
import { LightboxOverlay } from '../components/LightboxOverlay'
import { NavBar } from '../components/NavBar'
import styles from './GalleryPage.module.css'

export function GalleryPage() {
  const images = useAllImages()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState(
    () => localStorage.getItem(GALLERY_CATEGORY_STORAGE_KEY) || ALL_CATEGORIES,
  )

  function selectCategory(category: string) {
    setSelectedCategory(category)
    localStorage.setItem(GALLERY_CATEGORY_STORAGE_KEY, category)
  }

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

  // A photo can be opened directly (e.g. from a goal/journal card) while a different
  // category filter is active in the gallery — fall back to the unfiltered list so the
  // deep link still resolves instead of silently failing to open.
  const lightboxId = searchParams.get('lightbox')
  const lightboxImages =
    lightboxId && !visibleImages.some((image) => String(image.id) === lightboxId) ? images : visibleImages

  function openLightbox(id: number) {
    const params = new URLSearchParams(searchParams)
    params.set('lightbox', String(id))
    setSearchParams(params)
  }

  const canStartSlideshow = visibleImages.length >= 2
  const slideshowHref =
    selectedCategory === ALL_CATEGORIES
      ? '/slideshow'
      : `/slideshow?category=${encodeURIComponent(selectedCategory)}`

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>Общая галерея</h1>
        {canStartSlideshow ? (
          <Link to={slideshowHref} className={styles.slideshowLink}>
            Запустить слайдшоу
          </Link>
        ) : (
          <span className={styles.slideshowLinkDisabled}>Запустить слайдшоу</span>
        )}
      </div>
      {categories.length > 0 && (
        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={selectCategory} />
      )}
      <GalleryGrid images={visibleImages} onOpen={openLightbox} />
      <LightboxOverlay images={lightboxImages} />
    </div>
  )
}
