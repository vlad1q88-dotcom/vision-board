import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
  DEFAULT_PHOTO_POSITION,
  DEFAULT_PHOTO_SCALE,
  MAX_FONT_SIZE,
  MAX_LINE_HEIGHT,
  MAX_PHOTO_SCALE,
  MIN_FONT_SIZE,
  MIN_LINE_HEIGHT,
  MIN_PHOTO_SCALE,
} from '../db/wishMapZones'
import { WishMapPhotoPicker } from './WishMapPhotoPicker'
import { FontPopover } from './FontPopover'
import { ConfirmDialog } from './ConfirmDialog'
import type { ImageWithGoal, WishMapZoneState } from '../types'
import styles from './WishMapZoneCell.module.css'

interface WishMapZoneCellProps {
  label: string
  state: WishMapZoneState
  isEditing: boolean
  images: ImageWithGoal[]
  allowDirectUpload?: boolean
  onUpdate: (patch: Partial<WishMapZoneState>) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Pointermove can fire far faster than the display can repaint (high-poll-rate mice report at
// 500Hz+). Forwarding every event straight into React state forces a re-render per event, and
// that render storm is what makes the cursor visibly flicker mid-drag. Capping updates to one per
// animation frame keeps the drag perfectly smooth while letting the browser repaint normally.
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

export function WishMapZoneCell({ label, state, isEditing, images, allowDirectUpload, onUpdate }: WishMapZoneCellProps) {
  const cellRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingWheelDelta = useRef(0)
  const wheelFrameRef = useRef<number | null>(null)
  const [isPickingPhoto, setIsPickingPhoto] = useState(false)
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false)
  const [isPickingFont, setIsPickingFont] = useState(false)
  const [isConfirmingDeletePhoto, setIsConfirmingDeletePhoto] = useState(false)
  const [textDraft, setTextDraft] = useState(state.text)
  const [cellSize, setCellSize] = useState({ width: 0, height: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const linkedImage = images.find((image) => image.id === state.imageId)
  // Use the full-resolution blob, not the gallery grid's thumbnail (capped at 320px) — the wish
  // map renders photos at zone size (often much larger than a thumbnail), so a thumbnail here
  // would look visibly blurry/pixelated once scaled up.
  const photoUrl = useObjectUrl(state.customBlob ?? linkedImage?.blob)

  useEffect(() => {
    const cell = cellRef.current
    if (!cell) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCellSize({ width, height })
    })
    observer.observe(cell)
    return () => observer.disconnect()
  }, [])

  // Reset so a stale size from the previous photo can't be used for a frame before onLoad fires.
  useEffect(() => {
    setNaturalSize({ width: 0, height: 0 })
  }, [photoUrl])

  // object-fit: cover decides its crop relative to the element's own box, which always has the
  // cell's aspect ratio — so the axis that ratio already matches gets zero crop slack no matter
  // how much that box is later scaled, and panning it can never reach past that fixed crop. To
  // actually reach every edge of the source photo, size the img from its own natural dimensions
  // (cover-fit computed here, not by the browser) and pan it with a plain pixel translate.
  const hasNaturalSize = naturalSize.width > 0 && naturalSize.height > 0
  const coverScale = hasNaturalSize
    ? Math.max(cellSize.width / naturalSize.width, cellSize.height / naturalSize.height)
    : 0
  const renderedWidth = naturalSize.width * coverScale * state.photoScale
  const renderedHeight = naturalSize.height * coverScale * state.photoScale
  const photoMarginX = Math.max(0, (renderedWidth - cellSize.width) / 2)
  const photoMarginY = Math.max(0, (renderedHeight - cellSize.height) / 2)
  const photoPanX = ((state.photoX - 50) / 50) * photoMarginX
  const photoPanY = ((state.photoY - 50) / 50) * photoMarginY

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    onUpdate({
      customBlob: file,
      imageId: undefined,
      photoX: DEFAULT_PHOTO_POSITION.x,
      photoY: DEFAULT_PHOTO_POSITION.y,
      photoScale: DEFAULT_PHOTO_SCALE,
    })
  }

  function openTextEditor() {
    setTextDraft(state.text)
    setIsPickingFont(false)
    setIsTextEditorOpen(true)
  }

  function saveText() {
    onUpdate({ text: textDraft.trim() })
    setIsPickingFont(false)
    setIsTextEditorOpen(false)
  }

  function startMove(event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    const cell = cellRef.current
    if (!cell) return
    const rect = cell.getBoundingClientRect()

    const handleMove = throttleToFrame((moveEvent: PointerEvent) => {
      const x = clamp(((moveEvent.clientX - rect.left) / rect.width) * 100, 0, 100)
      const y = clamp(((moveEvent.clientY - rect.top) / rect.height) * 100, 0, 100)
      onUpdate({ x, y })
    })
    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  function startResize(event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startSize = state.fontSize

    const handleMove = throttleToFrame((moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX
      onUpdate({ fontSize: clamp(startSize + delta * 0.3, MIN_FONT_SIZE, MAX_FONT_SIZE) })
    })
    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  function startPhotoPan(event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (photoMarginX <= 0 && photoMarginY <= 0) return
    const startX = event.clientX
    const startY = event.clientY
    const startPhotoX = state.photoX
    const startPhotoY = state.photoY

    const handleMove = throttleToFrame((moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      // photoX/Y store the pan as 0-100 (50 = centered), each half-range spanning the available
      // margin — so converting a pixel delta to that scale means dividing by the margin, not the
      // cell size. A bigger margin (more zoom) needs more drag to cover the same 0-100 distance.
      const photoX = photoMarginX > 0 ? clamp(startPhotoX + (dx / photoMarginX) * 50, 0, 100) : startPhotoX
      const photoY = photoMarginY > 0 ? clamp(startPhotoY + (dy / photoMarginY) * 50, 0, 100) : startPhotoY
      onUpdate({ photoX, photoY })
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
    // Trackpads and wheels can fire many events per frame during a continuous scroll gesture.
    // Accumulate the deltas and apply them once per animation frame, same as the drag handlers,
    // so this doesn't cause the same render-storm cursor flicker.
    pendingWheelDelta.current += event.deltaY
    if (wheelFrameRef.current !== null) return
    wheelFrameRef.current = requestAnimationFrame(() => {
      wheelFrameRef.current = null
      const delta = pendingWheelDelta.current
      pendingWheelDelta.current = 0
      onUpdate({ photoScale: clamp(state.photoScale - delta * 0.0015, MIN_PHOTO_SCALE, MAX_PHOTO_SCALE) })
    })
  }

  return (
    <div className={styles.cell} ref={cellRef}>
      <div className={styles.photo}>
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            draggable={false}
            className={isEditing ? `${styles.photoImg} ${styles.photoImgEditable}` : styles.photoImg}
            style={
              hasNaturalSize
                ? {
                    width: `${renderedWidth}px`,
                    height: `${renderedHeight}px`,
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${photoPanX}px), calc(-50% + ${photoPanY}px))`,
                  }
                : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
            }
            onLoad={(event) => {
              const target = event.currentTarget
              setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight })
            }}
            onPointerDown={isEditing ? startPhotoPan : undefined}
            onWheel={isEditing ? handlePhotoWheel : undefined}
            onDragStart={(event) => event.preventDefault()}
          />
        )}
        {!photoUrl && (
          <div className={styles.emptyState}>
            <span className={styles.zoneLabel}>{label}</span>
            <button
              type="button"
              className={styles.pickButton}
              onClick={() => (allowDirectUpload ? fileInputRef.current?.click() : setIsPickingPhoto(true))}
            >
              Выбрать фото
            </button>
            {allowDirectUpload && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelected}
              />
            )}
          </div>
        )}
        {photoUrl && isEditing && (
          <button
            type="button"
            className={styles.deletePhotoButton}
            onClick={() => setIsConfirmingDeletePhoto(true)}
          >
            Удалить
          </button>
        )}
        {photoUrl && state.text && (
          <div
            className={styles.textWrap}
            style={{ left: `${state.x}%`, top: `${state.y}%` }}
          >
            {isEditing && (
              <>
                <button
                  type="button"
                  className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
                  onPointerDown={startResize}
                  aria-label="Изменить размер текста"
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
                <button
                  type="button"
                  className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
                  onPointerDown={startResize}
                  aria-label="Изменить размер текста"
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
                <button
                  type="button"
                  className={styles.deleteHandle}
                  onClick={() => onUpdate({ text: '' })}
                  aria-label="Удалить описание"
                >
                  <svg viewBox="0 0 24 24" className={styles.arrowIcon}>
                    <path
                      d="M7 7l10 10M17 7l-10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
            <span
              className={isEditing ? `${styles.text} ${styles.textEditable}` : styles.text}
              style={{
                fontFamily: state.fontFamily,
                fontSize: `${state.fontSize}px`,
                lineHeight: state.lineHeight,
                opacity: state.opacity,
                // Some fonts have swashes/flourishes that extend sideways past their own advance
                // width and get clipped by this box's overflow:hidden — same cause as the
                // vertical clipping the line-height fixes, just on the other axis. Reusing the
                // same "Интервал" slider for both means turning it up reserves room on every side.
                paddingInline: `${(state.lineHeight - MIN_LINE_HEIGHT) * state.fontSize * 0.25}px`,
              }}
              onPointerDown={isEditing ? startMove : undefined}
              onDoubleClick={isEditing ? openTextEditor : undefined}
            >
              {state.text}
            </span>
          </div>
        )}
        {photoUrl && !state.text && isEditing && (
          <button type="button" className={styles.addDescriptionButton} onClick={openTextEditor}>
            Добавить описание
          </button>
        )}
        {isTextEditorOpen && (
          <div className={styles.editorScrim} onClick={saveText}>
            <div className={styles.textEditor} onClick={(event) => event.stopPropagation()}>
              <input
                className={styles.textInput}
                type="text"
                placeholder="Текст на фото"
                value={textDraft}
                onChange={(event) => setTextDraft(event.target.value)}
                autoFocus
              />
              <div className={styles.textEditorActions}>
                <div className={styles.fontButtonWrap}>
                  <button
                    type="button"
                    className={styles.fontButton}
                    onClick={() => setIsPickingFont((open) => !open)}
                  >
                    Шрифт
                  </button>
                  {isPickingFont && (
                    <FontPopover
                      fontFamily={state.fontFamily}
                      opacity={state.opacity}
                      onChangeFont={(fontFamily) => onUpdate({ fontFamily })}
                      onChangeOpacity={(opacity) => onUpdate({ opacity })}
                    />
                  )}
                </div>
                <div className={styles.lineHeightRow}>
                  <span className={styles.lineHeightLabel}>Интервал</span>
                  <input
                    type="range"
                    className={styles.lineHeightSlider}
                    min={MIN_LINE_HEIGHT}
                    max={MAX_LINE_HEIGHT}
                    step={0.1}
                    value={state.lineHeight}
                    onChange={(event) => onUpdate({ lineHeight: Number(event.target.value) })}
                  />
                </div>
                <button type="button" className={styles.saveTextButton} onClick={saveText}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isPickingPhoto && (
        <WishMapPhotoPicker
          onSelect={(imageId) => {
            const picked = images.find((image) => image.id === imageId)
            onUpdate({
              imageId,
              customBlob: undefined,
              text: picked?.goalTitle ?? '',
              photoX: DEFAULT_PHOTO_POSITION.x,
              photoY: DEFAULT_PHOTO_POSITION.y,
              photoScale: DEFAULT_PHOTO_SCALE,
            })
          }}
          onClose={() => setIsPickingPhoto(false)}
        />
      )}
      {isConfirmingDeletePhoto && (
        <ConfirmDialog
          title="Удалить фото?"
          message="Фото и текст на нём в этой зоне будут удалены без возможности восстановления."
          onCancel={() => setIsConfirmingDeletePhoto(false)}
          onConfirm={() => {
            onUpdate({ imageId: undefined, customBlob: undefined, text: '' })
            setIsConfirmingDeletePhoto(false)
          }}
        />
      )}
    </div>
  )
}
