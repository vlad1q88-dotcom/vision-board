import { useEffect, useRef, useState } from 'react'
import { deleteGoal, updateGoalCompletedAt, updateGoalStory } from '../db/goalRepo'
import { useGoalImages } from '../hooks/useGoalImages'
import { ThumbnailStrip } from './ThumbnailStrip'
import { ConfirmDialog } from './ConfirmDialog'
import { fromDateInputValue, toDateInputValue } from '../utils/dateInput'
import { DEFAULT_CATEGORY } from '../db/categories'
import type { Goal } from '../types'
import styles from './JournalEntryCard.module.css'

interface JournalEntryCardProps {
  goal: Goal
  forceExpand: boolean
}

function formatCompletedDate(completedAt: number | undefined): string {
  if (completedAt === undefined) return ''
  return new Date(completedAt).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function JournalEntryCard({ goal, forceExpand }: JournalEntryCardProps) {
  const images = useGoalImages(goal.id)
  const [expanded, setExpanded] = useState(false)
  const [isEditingStory, setIsEditingStory] = useState(false)
  const [story, setStory] = useState(goal.story ?? '')
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(() => toDateInputValue(goal.completedAt))
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (forceExpand) {
      setExpanded(true)
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [forceExpand])

  async function handleSaveStory() {
    await updateGoalStory(goal.id, story.trim())
    setIsEditingStory(false)
  }

  async function handleSaveDate() {
    if (!dateValue) return
    await updateGoalCompletedAt(goal.id, fromDateInputValue(dateValue))
    setIsEditingDate(false)
  }

  return (
    <div className={styles.card} ref={cardRef}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.titleButton}
          onClick={() => setExpanded((value) => !value)}
        >
          {goal.title}
        </button>
        <span className={styles.category}>{goal.category || DEFAULT_CATEGORY}</span>
        <div className={styles.headerActions}>
          {isEditingDate ? (
            <div className={styles.dateForm}>
              <input
                type="date"
                className={styles.dateInput}
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                autoFocus
              />
              <button type="button" className={styles.dateSave} onClick={handleSaveDate}>
                ОК
              </button>
              <button
                type="button"
                className={styles.dateCancel}
                onClick={() => {
                  setDateValue(toDateInputValue(goal.completedAt))
                  setIsEditingDate(false)
                }}
              >
                Отмена
              </button>
            </div>
          ) : (
            <button type="button" className={styles.date} onClick={() => setIsEditingDate(true)}>
              {formatCompletedDate(goal.completedAt)}
            </button>
          )}
          <button type="button" className={styles.deleteButton} onClick={() => setConfirmingDelete(true)}>
            Удал.
          </button>
        </div>
      </div>
      {expanded && (
        <>
          {isEditingStory ? (
            <div className={styles.storyForm}>
              <textarea
                className={styles.storyTextarea}
                rows={4}
                value={story}
                onChange={(event) => setStory(event.target.value)}
                placeholder="Расскажи, как ты этого достиг и что почувствовал…"
                autoFocus
              />
              <div className={styles.storyActions}>
                <button type="button" className={styles.cancel} onClick={() => setIsEditingStory(false)}>
                  Отмена
                </button>
                <button type="button" className={styles.save} onClick={handleSaveStory}>
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.storyButton} onClick={() => setIsEditingStory(true)}>
              {goal.story ? goal.story : 'Расскажи, как ты этого достиг и что почувствовал… (нажми, чтобы написать)'}
            </button>
          )}

          <ThumbnailStrip goalId={goal.id} images={images} />
        </>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Удалить запись из дневника?"
          message="Цель, рассказ и все её фото будут удалены без возможности восстановления."
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
