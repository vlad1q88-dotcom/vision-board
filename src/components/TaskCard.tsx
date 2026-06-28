import { useState } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import { completeGoals } from '../db/goalRepo'
import {
  deleteStandaloneTask,
  depth1ChecklistHandlers,
  reorderSubtasks,
  setTaskDone,
  updateStandaloneTask,
  updateTaskDeadline,
} from '../db/taskRepo'
import { CompletionToggle } from './CompletionToggle'
import { ConfirmDialog } from './ConfirmDialog'
import { ProgressRing } from './ProgressRing'
import { SubtaskCard } from './SubtaskCard'
import { SubtaskChecklist } from './SubtaskChecklist'
import type { StatusFilterValue } from './StatusFilterPills'
import { matchesStatusFilter } from '../utils/taskStatusFilter'
import { fromDateInputValue, toDateInputValue } from '../utils/dateInput'
import type { SubtaskWithChildren, TaskWithGoal } from '../types'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: TaskWithGoal
  subtasks: SubtaskWithChildren[]
  statusFilter: StatusFilterValue
}

export function TaskCard({ task, subtasks, statusFilter }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title ?? '')
  const [descriptionDraft, setDescriptionDraft] = useState(task.description ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const dragControls = useDragControls()
  const isStandalone = task.goalId === undefined
  const checklistRows = subtasks.filter((s) => !s.separated)
  const allSeparated = subtasks.filter((s) => s.separated)
  // Filtered for rendering only — the ring below always reflects the task's full, unfiltered
  // progress, since the status-pill filter controls visibility, not the progress itself.
  const separatedSubtasks = allSeparated.filter((s) => matchesStatusFilter(s.status, statusFilter))
  const totalChildren = checklistRows.length + allSeparated.length
  const completedChildren = checklistRows.filter((s) => s.done).length + allSeparated.filter((s) => s.done).length
  const checklistHandlers = depth1ChecklistHandlers(task.id)

  function handleComplete() {
    if (task.goalId !== undefined) {
      completeGoals([task.goalId])
    } else {
      setTaskDone(task.id)
    }
  }

  return (
    <Reorder.Item value={task} as="div" dragListener={false} dragControls={dragControls} className={styles.cardWrap}>
      <div className={styles.card}>
        <ProgressRing total={totalChildren} completed={completedChildren} />
        <div className={styles.header}>
          <div className={styles.dragHandle} onPointerDown={(event) => dragControls.start(event)}>
            <span className={styles.dragGrip} />
          </div>
          <CompletionToggle onComplete={handleComplete} confirmCopy={isStandalone ? null : undefined} />
          <button type="button" className={styles.titleButton} onClick={() => setExpanded((value) => !value)}>
            {task.displayTitle || 'Без названия'}
          </button>
          <span className={styles.category}>{task.displayCategory}</span>
          <input
            type="date"
            className={styles.dateInput}
            value={task.deadline === undefined ? '' : toDateInputValue(task.deadline)}
            onChange={(event) =>
              updateTaskDeadline(task.id, event.target.value ? fromDateInputValue(event.target.value) : undefined)
            }
          />
          {isStandalone && (
            <button type="button" className={styles.iconButton} onClick={() => setConfirmingDelete(true)}>
              Удал.
            </button>
          )}
        </div>
        {expanded && (
          <div className={styles.body}>
            {isStandalone ? (
              <>
                <input
                  type="text"
                  className={styles.titleInput}
                  value={titleDraft}
                  placeholder="Название задачи"
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={() => updateStandaloneTask(task.id, { title: titleDraft.trim() })}
                />
                <textarea
                  className={styles.descriptionInput}
                  rows={3}
                  value={descriptionDraft}
                  placeholder="Описание"
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onBlur={() => updateStandaloneTask(task.id, { description: descriptionDraft })}
                />
              </>
            ) : (
              task.displayDescription && <p className={styles.description}>{task.displayDescription}</p>
            )}
            <SubtaskChecklist rows={checklistRows} allowSeparate {...checklistHandlers} />
          </div>
        )}
      </div>
      {separatedSubtasks.length > 0 && (
        // Sibling of .card, not nested inside it — separated subtasks must read as their own
        // independent cards connected to the task only by the branch connector lines, not as
        // content boxed inside the task's own bordered/surface-colored frame. Also intentionally
        // NOT gated by `expanded` — a "full-fledged" separated card stays visible even while the
        // parent task itself is collapsed; only the inline (non-separated) checklist and
        // description live inside the collapsible .body below.
        <Reorder.Group
          as="div"
          axis="y"
          values={separatedSubtasks}
          onReorder={(next) => reorderSubtasks(next.map((s) => s.id))}
          className={styles.separatedList}
        >
          {separatedSubtasks.map((subtask) => (
            <SubtaskCard key={subtask.id} subtask={subtask} />
          ))}
        </Reorder.Group>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Удалить задачу?"
          message="Задача и весь её чек-лист подзадач будут удалены без возможности восстановления."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteStandaloneTask(task.id)
            setConfirmingDelete(false)
          }}
        />
      )}
    </Reorder.Item>
  )
}
