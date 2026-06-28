import styles from './SelectionToggle.module.css'

interface SelectionToggleProps {
  isSelected: boolean
  onToggle: () => void
  ariaLabel?: { selected: string; unselected: string }
}

const DEFAULT_LABELS = { selected: 'Снять выбор цели', unselected: 'Выбрать цель' }

export function SelectionToggle({ isSelected, onToggle, ariaLabel = DEFAULT_LABELS }: SelectionToggleProps) {
  return (
    <button
      type="button"
      className={isSelected ? `${styles.circle} ${styles.selected}` : styles.circle}
      onClick={onToggle}
      aria-label={isSelected ? ariaLabel.selected : ariaLabel.unselected}
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
