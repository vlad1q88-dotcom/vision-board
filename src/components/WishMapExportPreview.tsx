import { useEffect } from 'react'
import styles from './WishMapExportPreview.module.css'

interface WishMapExportPreviewProps {
  imageUrl: string
  onDownload: () => void
  onClose: () => void
}

export function WishMapExportPreview({ imageUrl, onDownload, onClose }: WishMapExportPreviewProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.content} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <img src={imageUrl} alt="Предпросмотр обоев" className={styles.image} />
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Закрыть
          </button>
          <button type="button" className={styles.download} onClick={onDownload}>
            Скачать
          </button>
        </div>
      </div>
    </div>
  )
}
