import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addImageToGoal, deleteImage, GoalImageLimitError, MAX_IMAGES_PER_GOAL } from '../db/imageRepo'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { ConfirmDialog } from './ConfirmDialog'
import type { ImageRecord } from '../types'
import styles from './ThumbnailStrip.module.css'

interface ThumbnailProps {
  image: ImageRecord
  onOpen: () => void
  onDelete: () => void
}

function Thumbnail({ image, onOpen, onDelete }: ThumbnailProps) {
  const url = useObjectUrl(image.thumbBlob ?? image.blob)

  return (
    <div className={styles.thumb}>
      <button type="button" className={styles.thumbButton} onClick={onOpen} aria-label="Открыть фото">
        {url && <img src={url} alt="" className={styles.thumbImg} />}
      </button>
      <button
        type="button"
        className={styles.thumbDelete}
        onClick={onDelete}
        aria-label="Удалить фото"
      >
        ×
      </button>
    </div>
  )
}

interface ThumbnailStripProps {
  goalId: number
  images: ImageRecord[]
}

export function ThumbnailStrip({ goalId, images }: ThumbnailStripProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setError(null)
    let addedCount = 0
    for (const file of files) {
      try {
        await addImageToGoal(goalId, file)
        addedCount += 1
      } catch (err) {
        if (err instanceof GoalImageLimitError) {
          setError(
            files.length > 1
              ? `Добавлено ${addedCount} из ${files.length}: у цели не может быть больше ${MAX_IMAGES_PER_GOAL} фото.`
              : err.message,
          )
          return
        }
        throw err
      }
    }
  }

  return (
    <div className={styles.strip}>
      {images.map((image) => (
        <Thumbnail
          key={image.id}
          image={image}
          onOpen={() => navigate(`/gallery?lightbox=${image.id}`)}
          onDelete={() => setPendingDeleteId(image.id ?? null)}
        />
      ))}
      {images.length < MAX_IMAGES_PER_GOAL && (
        <button
          type="button"
          className={styles.addButton}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Добавить фото"
        >
          +
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
      {error && <p className={styles.error}>{error}</p>}
      {pendingDeleteId !== null && (
        <ConfirmDialog
          title="Удалить фото?"
          message="Это действие нельзя отменить."
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={async () => {
            await deleteImage(pendingDeleteId)
            setPendingDeleteId(null)
          }}
        />
      )}
    </div>
  )
}
