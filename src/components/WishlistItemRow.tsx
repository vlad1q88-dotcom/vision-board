import { useState } from 'react'
import { deleteWishlistItem } from '../db/wishlistRepo'
import { ConfirmDialog } from './ConfirmDialog'
import type { WishlistItemWithGoal } from '../types'
import styles from './WishlistItemRow.module.css'

interface WishlistItemRowProps {
  item: WishlistItemWithGoal
  onEdit: () => void
}

export function WishlistItemRow({ item, onEdit }: WishlistItemRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className={styles.row}>
      <button type="button" className={styles.titleButton} onClick={onEdit}>
        {item.displayTitle}
      </button>
      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} onClick={onEdit}>
          Изм.
        </button>
        <button type="button" className={styles.iconButton} onClick={() => setConfirmingDelete(true)}>
          Удал.
        </button>
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title="Убрать из вишлиста?"
          message="Пункт будет убран из вишлиста. Сама цель не удаляется."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteWishlistItem(item.id)
            setConfirmingDelete(false)
          }}
        />
      )}
    </div>
  )
}
