import { useEffect, useRef, useState } from 'react'
import { completeGoal, deleteGoal, updateGoal } from '../db/goalRepo'
import { useGoalImages } from '../hooks/useGoalImages'
import { ThumbnailStrip } from './ThumbnailStrip'
import { ConfirmDialog } from './ConfirmDialog'
import { CompletionToggle } from './CompletionToggle'
import { SelectionToggle } from './SelectionToggle'
import { GoalForm } from './GoalForm'
import type { Goal } from '../types'
import styles from './GoalCard.module.css'

interface GoalCardProps {
  goal: Goal
  categories: string[]
  forceExpand: boolean
  isSelecting: boolean
  isSelected: boolean
  onToggleSelect: (id: number) => void
}

export function GoalCard({
  goal,
  categories,
  forceExpand,
  isSelecting,
  isSelected,
  onToggleSelect,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const images = useGoalImages(goal.id)

  useEffect(() => {
    if (forceExpand) {
      setExpanded(true)
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [forceExpand])

  if (editing) {
    return (
      <div className={styles.card} ref={cardRef} id={`goal-${goal.id}`}>
        <GoalForm
          initialTitle={goal.title}
          initialDescription={goal.description}
          initialCategory={goal.category}
          categories={categories}
          submitLabel="Сохранить"
          onCancel={() => setEditing(false)}
          onSubmit={async (title, description, category) => {
            await updateGoal(goal.id, title, description, category)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.card} ref={cardRef} id={`goal-${goal.id}`}>
      <div className={styles.header}>
        {isSelecting ? (
          <SelectionToggle isSelected={isSelected} onToggle={() => onToggleSelect(goal.id)} />
        ) : (
          <CompletionToggle onComplete={() => completeGoal(goal.id)} />
        )}
        <button
          type="button"
          className={styles.titleButton}
          onClick={() => setExpanded((value) => !value)}
        >
          {goal.title}
        </button>
        <span className={styles.category}>{goal.category}</span>
        <div className={styles.headerActions}>
          <button type="button" className={styles.iconButton} onClick={() => setEditing(true)}>
            Изм.
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setConfirmingDelete(true)}
          >
            Удал.
          </button>
        </div>
      </div>
      {expanded && goal.description && <p className={styles.description}>{goal.description}</p>}
      {expanded && <ThumbnailStrip goalId={goal.id} images={images} />}
      {confirmingDelete && (
        <ConfirmDialog
          title="Удалить цель?"
          message="Все фото этой цели будут удалены без возможности восстановления."
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await deleteGoal(goal.id)
            setConfirmingDelete(false)
          }}
        />
      )}
    </div>
  )
}
