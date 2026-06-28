import { completeGoals } from '../db/goalRepo'
import { setTaskDone, toggleSubtaskDone } from '../db/taskRepo'
import { CompletionToggle } from './CompletionToggle'
import { SelectionToggle } from './SelectionToggle'
import { StatusBadge } from './StatusBadge'
import type { FlatDeadlineRow } from '../hooks/useFlatDeadlineItems'
import styles from './FlatDeadlineList.module.css'

const DONE_LABELS = { selected: 'Снять отметку выполнения', unselected: 'Отметить выполненной' }

function formatDeadline(deadline: number): string {
  return new Date(deadline).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface FlatDeadlineListProps {
  rows: FlatDeadlineRow[]
}

export function FlatDeadlineList({ rows }: FlatDeadlineListProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>В выбранном периоде нет задач или подзадач с дедлайном.</p>
  }

  return (
    <div className={styles.list}>
      {rows.map((row) => (
        <div key={`${row.kind}-${row.id}`} className={styles.row}>
          {row.kind === 'task' ? (
            <CompletionToggle
              onComplete={() => (row.goalId !== undefined ? completeGoals([row.goalId]) : setTaskDone(row.id))}
              confirmCopy={row.goalId !== undefined ? undefined : null}
            />
          ) : (
            <SelectionToggle isSelected={row.done} onToggle={() => toggleSubtaskDone(row.id)} ariaLabel={DONE_LABELS} />
          )}
          <span className={row.done ? `${styles.title} ${styles.done}` : styles.title}>{row.title || 'Без названия'}</span>
          <span className={styles.date}>{formatDeadline(row.deadline)}</span>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  )
}
