import styles from './SelectionToggle.module.css'

interface SelectionToggleProps {
  isSelected: boolean
  onToggle: () => void
}

export function SelectionToggle({ isSelected, onToggle }: SelectionToggleProps) {
  return (
    <button
      type="button"
      className={isSelected ? `${styles.circle} ${styles.selected}` : styles.circle}
      onClick={onToggle}
      aria-label={isSelected ? 'Снять выбор цели' : 'Выбрать цель'}
    >
      {isSelected && (
        <svg className={styles.check} viewBox="0 0 24 24">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
