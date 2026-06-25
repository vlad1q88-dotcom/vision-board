import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
