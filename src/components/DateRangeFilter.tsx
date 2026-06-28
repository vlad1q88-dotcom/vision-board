import { fromDateInputValue, toDateInputValue } from '../utils/dateInput'
import styles from './DateRangeFilter.module.css'

interface DateRangeFilterProps {
  from: number | null
  to: number | null
  onChange: (from: number | null, to: number | null) => void
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const isActive = from !== null && to !== null

  return (
    <div className={styles.row}>
      <input
        type="date"
        className={styles.input}
        value={from === null ? '' : toDateInputValue(from)}
        onChange={(event) => onChange(event.target.value ? fromDateInputValue(event.target.value) : null, to)}
      />
      <span className={styles.dash}>—</span>
      <input
        type="date"
        className={styles.input}
        value={to === null ? '' : toDateInputValue(to)}
        onChange={(event) => onChange(from, event.target.value ? fromDateInputValue(event.target.value) : null)}
      />
      {isActive && (
        <button type="button" className={styles.reset} onClick={() => onChange(null, null)}>
          Сбросить
        </button>
      )}
    </div>
  )
}
