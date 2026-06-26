import { useState } from 'react'
import { deleteAllGoals, deleteGoalsByCategory } from '../db/goalRepo'
import { ALL_CATEGORIES } from '../db/categories'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './CategoryActionsPopover.module.css'

interface CategoryActionsPopoverProps {
  category: string
  onClose: () => void
  onDeleted: (category: string) => void
  onSelectGoals: () => void
}

export function CategoryActionsPopover({
  category,
  onClose,
  onDeleted,
  onSelectGoals,
}: CategoryActionsPopoverProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const isAll = category === ALL_CATEGORIES

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <div className={styles.popover} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            onSelectGoals()
            onClose()
          }}
        >
          Выбрать цели
        </button>
        <button type="button" className={styles.action} onClick={() => setIsConfirmingDelete(true)}>
          {isAll ? 'Удалить все цели' : 'Удалить все цели категории'}
        </button>
      </div>
      {isConfirmingDelete && (
        <ConfirmDialog
          title={isAll ? 'Удалить все цели?' : 'Удалить все цели категории?'}
          message={
            isAll
              ? 'Все цели и их фото будут удалены без возможности восстановления.'
              : `Все цели категории «${category}» и их фото будут удалены без возможности восстановления.`
          }
          onCancel={() => setIsConfirmingDelete(false)}
          onConfirm={async () => {
            await (isAll ? deleteAllGoals() : deleteGoalsByCategory(category))
            setIsConfirmingDelete(false)
            onDeleted(category)
            onClose()
          }}
        />
      )}
    </>
  )
}
