import { useEffect, useRef, useState } from 'react'
import { saveWishMap, deleteWishMap } from '../db/wishMapRepo'
import { ASPECT_RATIO_OPTIONS, createEmptyZones, DEFAULT_ASPECT_RATIO } from '../db/wishMapZones'
import { useWishMap } from '../hooks/useWishMap'
import { useAllImages } from '../hooks/useAllImages'
import { wishMapDraftCache } from '../hooks/wishMapDraftCache'
import { WishMapGrid } from '../components/WishMapGrid'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NavBar } from '../components/NavBar'
import { WishMapExportPreview } from '../components/WishMapExportPreview'
import { downloadBlob, exportWishMapImage } from '../utils/exportWishMapImage'
import type { WishMapZoneState, WishMapZones } from '../types'
import styles from './WishMapPage.module.css'

export function WishMapPage() {
  const wishMap = useWishMap()
  const images = useAllImages()
  const gridRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(wishMapDraftCache.isEditing)
  const [draftZones, setDraftZones] = useState<WishMapZones | null>(wishMapDraftCache.zones)
  const [draftAspectRatio, setDraftAspectRatio] = useState(wishMapDraftCache.aspectRatio)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportPreview, setExportPreview] = useState<{ blob: Blob; url: string } | null>(null)

  useEffect(() => {
    if (wishMap && draftZones === null) {
      setDraftZones(wishMap.zones)
      setDraftAspectRatio(wishMap.aspectRatio)
      setIsEditing(!wishMap.isSaved)
    }
  }, [wishMap, draftZones])

  // Persist the in-progress edit outside component state so switching tabs and back
  // (which unmounts and remounts this page) restores exactly where the user left off.
  useEffect(() => {
    if (draftZones) {
      wishMapDraftCache.zones = draftZones
      wishMapDraftCache.aspectRatio = draftAspectRatio
      wishMapDraftCache.isEditing = isEditing
    }
  }, [draftZones, draftAspectRatio, isEditing])

  function updateZone(key: string, patch: Partial<WishMapZoneState>) {
    setDraftZones((current) => (current ? { ...current, [key]: { ...current[key], ...patch } } : current))
  }

  async function handleSave() {
    if (!draftZones) return
    await saveWishMap(draftZones, draftAspectRatio)
    setIsEditing(false)
  }

  function handleCancelEdit() {
    if (wishMap) {
      setDraftZones(wishMap.zones)
      setDraftAspectRatio(wishMap.aspectRatio)
    }
    setIsEditing(false)
  }

  async function handleExport() {
    if (!gridRef.current) return
    setIsExporting(true)
    try {
      const blob = await exportWishMapImage(gridRef.current)
      setExportPreview({ blob, url: URL.createObjectURL(blob) })
    } finally {
      setIsExporting(false)
    }
  }

  function closeExportPreview() {
    if (exportPreview) URL.revokeObjectURL(exportPreview.url)
    setExportPreview(null)
  }

  function confirmDownload() {
    if (!exportPreview) return
    downloadBlob(exportPreview.blob, 'карта-желаний.png')
    closeExportPreview()
  }

  async function handleDelete() {
    await deleteWishMap()
    setDraftZones(createEmptyZones())
    setDraftAspectRatio(DEFAULT_ASPECT_RATIO)
    setIsEditing(true)
    setIsConfirmingDelete(false)
  }

  if (!wishMap || !draftZones) {
    return (
      <div className={styles.page}>
        <NavBar />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>Карта желаний</h1>
        <div className={styles.headerActions}>
          {isEditing ? (
            <>
              <select
                className={styles.formatSelect}
                value={draftAspectRatio}
                onChange={(event) => setDraftAspectRatio(event.target.value)}
              >
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {wishMap.isSaved && (
                <button type="button" className={styles.cancel} onClick={handleCancelEdit}>
                  Отмена
                </button>
              )}
              <button type="button" className={styles.save} onClick={handleSave}>
                Сохранить
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.export} onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Сохранение…' : 'Скачать как обои'}
              </button>
              <button type="button" className={styles.edit} onClick={() => setIsEditing(true)}>
                Изменить
              </button>
              <button type="button" className={styles.delete} onClick={() => setIsConfirmingDelete(true)}>
                Удалить
              </button>
            </>
          )}
        </div>
      </div>
      <WishMapGrid
        ref={gridRef}
        zones={draftZones}
        isEditing={isEditing}
        aspectRatio={draftAspectRatio}
        images={images}
        onUpdateZone={updateZone}
      />
      {isConfirmingDelete && (
        <ConfirmDialog
          title="Удалить карту желаний?"
          message="Карта будет удалена без возможности восстановления. Можно собрать новую с нуля."
          onCancel={() => setIsConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      )}
      {exportPreview && (
        <WishMapExportPreview
          imageUrl={exportPreview.url}
          onDownload={confirmDownload}
          onClose={closeExportPreview}
        />
      )}
    </div>
  )
}
