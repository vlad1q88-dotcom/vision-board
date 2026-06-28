import { useState } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import {
  deleteSubtask,
  depth2ChecklistHandlers,
  setSubtaskStatus,
  toggleSubtaskDone,
  updateSubtask,
} from '../db/taskRepo'
import { SelectionToggle } from './SelectionToggle'
import { StatusBadge } from './StatusBadge'
import { ConfirmDialog } from './ConfirmDialog'
import { ProgressRing } from './ProgressRing'
import { SubtaskChecklist } from './SubtaskChecklist'
import { fromDateInputValue, toDateInputValue } from '../utils/dateInput'
import type { SubtaskWithChildren } from '../types'
import styles from './SubtaskCard.module.css'

const DONE_LABELS = { selected: 'Снять отметку выполнения', unselected: 'Отметить выполненной' }

interface SubtaskCardProps {
  subtask: SubtaskWithChildren
}

export function SubtaskCard({ subtask }: SubtaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const childHandlers = depth2ChecklistHandlers(subtask.id)
  const dragControls = useDragControls()

  return (
    <Reorder.Item value={subtask} as="div" dragListener={false} dragControls={dragControls} className={styles.card}>
      <ProgressRing total={subtask.children.length} completed={subtask.children.filter((child) => child.done).length} />
      <div className={styles.header}>
        <div className={styles.dragHandle} onPointerDown={(event) => dragControls.start(event)}>
          <span className={styles.dragGrip} />
        </div>
        <SelectionToggle isSelected={subtask.done} onToggle={() => toggleSubtaskDone(subtask.id)} ariaLabel={DONE_LABELS} />
        <button
          type="button"
          className={subtask.done ? `${styles.titleButton} ${styles.done}` : styles.titleButton}
          onClick={() => setExpanded((value) => !value)}
        >
          {subtask.title || 'Без названия'}
        </button>
        <StatusBadge
          status={subtask.status}
          onToggle={() => setSubtaskStatus(subtask.id, subtask.status === 'plan' ? 'in_progress' : 'plan')}
        />
        <input
          type="date"
          className={styles.dateInput}
          value={subtask.deadline === undefined ? '' : toDateInputValue(subtask.deadline)}
          onChange={(event) =>
            updateSubtask(subtask.id, { deadline: event.target.value ? fromDateInputValue(event.target.value) : undefined })
          }
        />
        <button type="button" className={styles.iconButton} onClick={() => setConfirmingDelete(true)}>
          Удал.
        </button>
      </div>
      {expanded && (
        <div className={styles.body}>
          <SubtaskChecklist rows={subtask.children} allowSeparate={false} {...childHandlers} />
        </div>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Удалить подзадачу?"
          message="Подзадача и весь её вложенный чек-лист будут удалены без возможности восстановления."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteSubtask(subtask.id)
            setConfirmingDelete(false)
          }}
        />
      )}
    </Reorder.Item>
  )
}
