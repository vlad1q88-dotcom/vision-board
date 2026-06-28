import type { TaskStatus } from '../types'
import styles from './StatusFilterPills.module.css'

export type StatusFilterValue = 'all' | TaskStatus

interface StatusFilterPillsProps {
  selected: StatusFilterValue
  onSelect: (value: StatusFilterValue) => void
}

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'plan', label: 'План' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполнено' },
]

export function StatusFilterPills({ selected, onSelect }: StatusFilterPillsProps) {
  return (
    <div className={styles.row}>
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={selected === value ? styles.pillActive : styles.pill}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
