import { SubtaskRow } from './SubtaskRow'
import { PlusIcon } from './PlusIcon'
import type { Subtask } from '../types'
import styles from './SubtaskChecklist.module.css'

interface SubtaskChecklistProps {
  // Either a Task's id (depth-1 rows, allowSeparate) or a separated Subtask's id (depth-2
  // rows, never allowSeparate) — the two call sites differ only in which repo functions they
  // bind to add/update/toggle/delete rows.
  rows: Subtask[]
  allowSeparate: boolean
  onAdd: () => Promise<unknown>
  onUpdate: (id: number, patch: Partial<Pick<Subtask, 'title' | 'deadline'>>) => void
  onToggleDone: (id: number) => void
  onDelete: (id: number) => void
  onSeparate?: (id: number) => void
}

export function SubtaskChecklist({ rows, allowSeparate, onAdd, onUpdate, onToggleDone, onDelete, onSeparate }: SubtaskChecklistProps) {
  return (
    <div className={styles.checklist}>
      {rows.map((row) => (
        <SubtaskRow
          key={row.id}
          subtask={row}
          allowSeparate={allowSeparate}
          onUpdate={(patch) => onUpdate(row.id, patch)}
          onToggleDone={() => onToggleDone(row.id)}
          onDelete={() => onDelete(row.id)}
          onSeparate={onSeparate ? () => onSeparate(row.id) : undefined}
        />
      ))}
      <button type="button" className={styles.addButton} onClick={() => onAdd()} title="Добавить подзадачу">
        <PlusIcon size={14} />
      </button>
    </div>
  )
}
