import styles from './WishlistExportStyleDialog.module.css'

interface WishlistExportStyleDialogProps {
  onChoose: (theme: 'light' | 'dark') => void
  onCancel: () => void
}

export function WishlistExportStyleDialog({ onChoose, onCancel }: WishlistExportStyleDialogProps) {
  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.title}>Стиль PDF</h3>
        <p className={styles.message}>Выберите цветовое оформление для сохранённого файла.</p>
        <div className={styles.options}>
          <button type="button" className={styles.lightOption} onClick={() => onChoose('light')}>
            Светлый
          </button>
          <button type="button" className={styles.darkOption} onClick={() => onChoose('dark')}>
            Тёмный
          </button>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
