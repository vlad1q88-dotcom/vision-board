import { useEffect, useMemo, useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { useWishlistItems } from '../hooks/useWishlistItems'
import { useAllImages } from '../hooks/useAllImages'
import {
  addCustomWishlistItem,
  addWishlistItems,
  clearWishlistItems,
  saveWishlistName,
} from '../db/wishlistRepo'
import { exportWishlistPdf, type WishlistPdfTheme } from '../utils/exportWishlistPdf'
import { downloadBlob } from '../utils/exportWishMapImage'
import { WishlistGoalPicker } from './WishlistGoalPicker'
import { WishlistItemRow } from './WishlistItemRow'
import { WishlistItemEditor } from './WishlistItemEditor'
import { WishlistExportStyleDialog } from './WishlistExportStyleDialog'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './WishlistEditorOverlay.module.css'

interface WishlistEditorOverlayProps {
  onClose: () => void
}

export function WishlistEditorOverlay({ onClose }: WishlistEditorOverlayProps) {
  const wishlist = useWishlist()
  const items = useWishlistItems()
  const images = useAllImages()

  const [step, setStep] = useState<'editor' | 'picker'>('editor')
  // Looked up live from `items` below (rather than storing the matched object itself) so the
  // editor always reflects fresh Dexie data as the user edits photo/description/link — a stored
  // snapshot would go stale the moment useWishlistItems() re-resolves after the first write.
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [nameDraft, setNameDraft] = useState(wishlist?.name ?? '')
  const [isChoosingPdfStyle, setIsChoosingPdfStyle] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  // useWishlist() starts out null until its Dexie query resolves, so the useState above almost
  // always seeds from an empty name on first render — sync once the real name arrives, otherwise
  // an unrelated blur (e.g. clicking the close button) saves that stale '' over the real name.
  useEffect(() => {
    if (wishlist) setNameDraft(wishlist.name)
  }, [wishlist])

  const excludeGoalIds = useMemo(
    () => new Set(items.filter((item) => item.goalId !== undefined).map((item) => item.goalId as number)),
    [items],
  )
  const editingItem = items.find((item) => item.id === editingItemId) ?? null

  async function handleConfirmPicker(goalIds: number[]) {
    await addWishlistItems(goalIds)
    setStep('editor')
  }

  async function handleAddCustom() {
    const title = customTitle.trim()
    if (!title) return
    await addCustomWishlistItem(title)
    setCustomTitle('')
    setIsAddingCustom(false)
  }

  async function handleSaveAsPdf(theme: WishlistPdfTheme) {
    setIsChoosingPdfStyle(false)
    setIsExporting(true)
    try {
      const blob = await exportWishlistPdf(wishlist?.name ?? '', items, images, theme)
      downloadBlob(blob, `${wishlist?.name || 'вишлист'}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Вишлист</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>
      <div className={styles.body}>
        {step === 'picker' ? (
          <WishlistGoalPicker
            excludeGoalIds={excludeGoalIds}
            onConfirm={handleConfirmPicker}
            onCancel={() => setStep('editor')}
          />
        ) : (
          <>
            <input
              className={styles.nameInput}
              type="text"
              placeholder="Название вишлиста"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => saveWishlistName(nameDraft.trim())}
            />
            <div className={styles.toolbar}>
              <button type="button" className={styles.toolbarButton} onClick={() => setStep('picker')}>
                Выбрать желание
              </button>
              {isAddingCustom ? (
                <div className={styles.customForm}>
                  <input
                    className={styles.customInput}
                    type="text"
                    placeholder="Название желания"
                    value={customTitle}
                    onChange={(event) => setCustomTitle(event.target.value)}
                    autoFocus
                  />
                  <button type="button" className={styles.toolbarButton} onClick={handleAddCustom}>
                    Добавить
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarButton}
                    onClick={() => {
                      setIsAddingCustom(false)
                      setCustomTitle('')
                    }}
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button type="button" className={styles.toolbarButton} onClick={() => setIsAddingCustom(true)}>
                  Добавить своё
                </button>
              )}
              <button
                type="button"
                className={styles.toolbarButton}
                disabled={items.length === 0}
                onClick={() => setIsConfirmingClear(true)}
              >
                Очистить всё
              </button>
            </div>
            <div className={styles.list}>
              {items.map((item) => (
                <WishlistItemRow key={item.id} item={item} onEdit={() => setEditingItemId(item.id)} />
              ))}
              {items.length === 0 && <p className={styles.empty}>Вишлист пока пуст.</p>}
            </div>
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.saveButton}
                onClick={() => setIsChoosingPdfStyle(true)}
                disabled={isExporting}
              >
                {isExporting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </div>
      {editingItem && (
        <WishlistItemEditor item={editingItem} images={images} onClose={() => setEditingItemId(null)} />
      )}
      {isChoosingPdfStyle && (
        <WishlistExportStyleDialog onChoose={handleSaveAsPdf} onCancel={() => setIsChoosingPdfStyle(false)} />
      )}
      {isConfirmingClear && (
        <ConfirmDialog
          title="Очистить весь вишлист?"
          message="Все пункты вишлиста будут удалены без возможности восстановления. Сами цели не удаляются."
          onCancel={() => setIsConfirmingClear(false)}
          onConfirm={async () => {
            await clearWishlistItems()
            setIsConfirmingClear(false)
          }}
        />
      )}
    </div>
  )
}
