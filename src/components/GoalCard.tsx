import { useEffect, useRef, useState } from 'react'
import { completeGoal, deleteGoal, updateGoal } from '../db/goalRepo'
import { useGoalImages } from '../hooks/useGoalImages'
import { ThumbnailStrip } from './ThumbnailStrip'
import { ConfirmDialog } from './ConfirmDialog'
import { CompletionToggle } from './CompletionToggle'
import { GoalForm } from './GoalForm'
import type { Goal } from '../types'
import styles from './GoalCard.module.css'

interface GoalCardProps {
  goal: Goal
  forceExpand: boolean
}

export function GoalCard({ goal, forceExpand }: GoalCardProps) {
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
          submitLabel="Сохранить"
          onCancel={() => setEditing(false)}
          onSubmit={async (title, description) => {
            await updateGoal(goal.id, title, description)
            setEditing(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.card} ref={cardRef} id={`goal-${goal.id}`}>
      <div className={styles.header}>
        <CompletionToggle onComplete={() => completeGoal(goal.id)} />
        <button
          type="button"
          className={styles.titleButton}
          onClick={() => setExpanded((value) => !value)}
        >
          {goal.title}
        </button>
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
