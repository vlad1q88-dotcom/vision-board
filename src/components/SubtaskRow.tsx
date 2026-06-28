import { useState } from 'react'
import { SelectionToggle } from './SelectionToggle'
import { fromDateInputValue, toDateInputValue } from '../utils/dateInput'
import type { Subtask } from '../types'
import styles from './SubtaskRow.module.css'

const DONE_LABELS = { selected: 'Снять отметку выполнения', unselected: 'Отметить выполненной' }

interface SubtaskRowProps {
  subtask: Subtask
  allowSeparate: boolean
  onUpdate: (patch: Partial<Pick<Subtask, 'title' | 'deadline'>>) => void
  onToggleDone: () => void
  onDelete: () => void
  onSeparate?: () => void
}

export function SubtaskRow({ subtask, allowSeparate, onUpdate, onToggleDone, onDelete, onSeparate }: SubtaskRowProps) {
  const [titleDraft, setTitleDraft] = useState(subtask.title)

  return (
    <div className={styles.row}>
      <SelectionToggle isSelected={subtask.done} onToggle={onToggleDone} ariaLabel={DONE_LABELS} />
      <input
        type="text"
        className={subtask.done ? `${styles.titleInput} ${styles.done}` : styles.titleInput}
        value={titleDraft}
        placeholder="Подзадача"
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={() => onUpdate({ title: titleDraft.trim() })}
      />
      <input
        type="date"
        className={styles.dateInput}
        value={subtask.deadline === undefined ? '' : toDateInputValue(subtask.deadline)}
        onChange={(event) =>
          onUpdate({ deadline: event.target.value ? fromDateInputValue(event.target.value) : undefined })
        }
      />
      <button type="button" className={styles.actionButton} onClick={onDelete}>
        Удалить
      </button>
      {allowSeparate && onSeparate && (
        <button type="button" className={styles.actionButton} onClick={onSeparate}>
          Отделить
        </button>
      )}
    </div>
  )
}
