import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { updateWishlistItem } from '../db/wishlistRepo'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { DEFAULT_PHOTO_POSITION, DEFAULT_PHOTO_SCALE, MAX_PHOTO_SCALE, MIN_PHOTO_SCALE } from '../db/wishMapZones'
import { computePhotoCrop } from '../utils/photoCrop'
import { WishMapPhotoPicker } from './WishMapPhotoPicker'
import type { ImageWithGoal, WishlistItemWithGoal } from '../types'
import styles from './WishlistItemEditor.module.css'

interface WishlistItemEditorProps {
  item: WishlistItemWithGoal
  images: ImageWithGoal[]
  onClose: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Pointermove/wheel can fire far faster than the display can repaint, so forwarding every event
// straight into React state causes a render-storm cursor flicker — see WishMapZoneCell.tsx for
// the original writeup of this. Capping to one update per animation frame keeps it smooth.
function throttleToFrame<T extends (...args: never[]) => void>(fn: T): T {
  let frame: number | null = null
  let lastArgs: Parameters<T> | null = null
  return ((...args: Parameters<T>) => {
    lastArgs = args
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      if (lastArgs) fn(...lastArgs)
    })
  }) as T
}

export function WishlistItemEditor({ item, images, onClose }: WishlistItemEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoBoxRef = useRef<HTMLDivElement>(null)
  const pendingWheelDelta = useRef(0)
  const wheelFrameRef = useRef<number | null>(null)
  const [isPickingPhoto, setIsPickingPhoto] = useState(false)
  const [titleDraft, setTitleDraft] = useState(item.title ?? '')
  const [descriptionDraft, setDescriptionDraft] = useState(item.description ?? '')
  const [linkDraft, setLinkDraft] = useState(item.link ?? '')
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const linkedImage = images.find((image) => image.id === item.imageId)
  const photoUrl = useObjectUrl(item.customBlob ?? linkedImage?.blob)
  const photoX = item.photoX ?? DEFAULT_PHOTO_POSITION.x
  const photoY = item.photoY ?? DEFAULT_PHOTO_POSITION.y
  const photoScale = item.photoScale ?? DEFAULT_PHOTO_SCALE

  useEffect(() => {
    const box = photoBoxRef.current
    if (!box) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBoxSize({ width, height })
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  // Reset so a stale size from a previous photo can't be used for a frame before onLoad fires.
  useEffect(() => {
    setNaturalSize({ width: 0, height: 0 })
  }, [photoUrl])

  const hasNaturalSize = naturalSize.width > 0 && naturalSize.height > 0
  const crop = hasNaturalSize
    ? computePhotoCrop({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        boxWidth: boxSize.width,
        boxHeight: boxSize.height,
        photoX,
        photoY,
        photoScale,
      })
    : null
  const photoMarginX = crop ? Math.max(0, (crop.renderedWidth - boxSize.width) / 2) : 0
  const photoMarginY = crop ? Math.max(0, (crop.renderedHeight - boxSize.height) / 2) : 0

  function startPhotoPan(event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (photoMarginX <= 0 && photoMarginY <= 0) return
    const startX = event.clientX
    const startY = event.clientY
    const startPhotoX = photoX
    const startPhotoY = photoY

    const handleMove = throttleToFrame((moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      const nextX = photoMarginX > 0 ? clamp(startPhotoX + (dx / photoMarginX) * 50, 0, 100) : startPhotoX
      const nextY = photoMarginY > 0 ? clamp(startPhotoY + (dy / photoMarginY) * 50, 0, 100) : startPhotoY
      updateWishlistItem(item.id, { photoX: nextX, photoY: nextY })
    })
    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  function handlePhotoWheel(event: React.WheelEvent) {
    event.preventDefault()
    pendingWheelDelta.current += event.deltaY
    if (wheelFrameRef.current !== null) return
    wheelFrameRef.current = requestAnimationFrame(() => {
      wheelFrameRef.current = null
      const delta = pendingWheelDelta.current
      pendingWheelDelta.current = 0
      updateWishlistItem(item.id, {
        photoScale: clamp(photoScale - delta * 0.0015, MIN_PHOTO_SCALE, MAX_PHOTO_SCALE),
      })
    })
  }

  function startDragHandle(event: React.PointerEvent) {
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const startOffset = offset

    const handleMove = throttleToFrame((moveEvent: PointerEvent) => {
      setOffset({
        x: startOffset.x + (moveEvent.clientX - startX),
        y: startOffset.y + (moveEvent.clientY - startY),
      })
    })
    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  function resetPhotoFraming() {
    return { photoX: DEFAULT_PHOTO_POSITION.x, photoY: DEFAULT_PHOTO_POSITION.y, photoScale: DEFAULT_PHOTO_SCALE }
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    updateWishlistItem(item.id, { customBlob: file, imageId: undefined, ...resetPhotoFraming() })
  }

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div
        className={styles.editor}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.dragHandle} onPointerDown={startDragHandle}>
          <span className={styles.dragGrip} />
        </div>
        {item.goalId === undefined ? (
          <input
            className={styles.titleInput}
            type="text"
            placeholder="Название желания"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={() => updateWishlistItem(item.id, { title: titleDraft.trim() })}
          />
        ) : (
          <p className={styles.goalTitle}>{item.displayTitle}</p>
        )}
        <div className={styles.photo} ref={photoBoxRef}>
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt=""
                draggable={false}
                className={styles.photoImg}
                style={
                  crop
                    ? {
                        width: `${crop.renderedWidth}px`,
                        height: `${crop.renderedHeight}px`,
                        left: `${crop.left}px`,
                        top: `${crop.top}px`,
                      }
                    : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
                }
                onLoad={(event) => {
                  const target = event.currentTarget
                  setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight })
                }}
                onPointerDown={startPhotoPan}
                onWheel={handlePhotoWheel}
                onDragStart={(event) => event.preventDefault()}
              />
              <button
                type="button"
                className={styles.deletePhotoButton}
                onClick={() => updateWishlistItem(item.id, { customBlob: undefined, imageId: undefined })}
              >
                Удалить фото
              </button>
            </>
          ) : (
            <div className={styles.pickButtons}>
              <button type="button" className={styles.pickButton} onClick={() => setIsPickingPhoto(true)}>
                Из галереи
              </button>
              <button type="button" className={styles.pickButton} onClick={() => fileInputRef.current?.click()}>
                С компьютера
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelected}
              />
            </div>
          )}
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Описание"
          rows={3}
          value={descriptionDraft}
          onChange={(event) => setDescriptionDraft(event.target.value)}
          onBlur={() => updateWishlistItem(item.id, { description: descriptionDraft.trim() })}
        />
        <input
          className={styles.linkInput}
          type="url"
          placeholder="Ссылка"
          value={linkDraft}
          onChange={(event) => setLinkDraft(event.target.value)}
          onBlur={() => updateWishlistItem(item.id, { link: linkDraft.trim() })}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.close} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
      {isPickingPhoto && (
        <WishMapPhotoPicker
          onSelect={(imageId) => updateWishlistItem(item.id, { imageId, customBlob: undefined, ...resetPhotoFraming() })}
          onClose={() => setIsPickingPhoto(false)}
        />
      )}
    </div>
  )
}
