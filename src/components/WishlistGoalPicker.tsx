import { useMemo, useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { ALL_CATEGORIES, DEFAULT_CATEGORY } from '../db/categories'
import { CategoryFilter } from './CategoryFilter'
import { SelectionToggle } from './SelectionToggle'
import styles from './WishlistGoalPicker.module.css'

interface WishlistGoalPickerProps {
  excludeGoalIds: Set<number>
  onConfirm: (goalIds: number[]) => void
  onCancel: () => void
}

export function WishlistGoalPicker({ excludeGoalIds, onConfirm, onCancel }: WishlistGoalPickerProps) {
  const goals = useGoals()
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const pickableGoals = useMemo(
    () => goals.filter((goal) => !excludeGoalIds.has(goal.id)),
    [goals, excludeGoalIds],
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    pickableGoals.forEach((goal) => set.add(goal.category || DEFAULT_CATEGORY))
    return Array.from(set)
  }, [pickableGoals])

  const visibleGoals = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? pickableGoals
        : pickableGoals.filter((goal) => (goal.category || DEFAULT_CATEGORY) === selectedCategory),
    [pickableGoals, selectedCategory],
  )

  function toggleSelect(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={styles.picker}>
      <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className={styles.list}>
        {visibleGoals.map((goal) => (
          <div key={goal.id} className={styles.row}>
            <SelectionToggle isSelected={selectedIds.has(goal.id)} onToggle={() => toggleSelect(goal.id)} />
            <span className={styles.title}>{goal.title}</span>
            <span className={styles.category}>{goal.category || DEFAULT_CATEGORY}</span>
          </div>
        ))}
        {visibleGoals.length === 0 && <p className={styles.empty}>Нет целей для выбора в этой категории.</p>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.confirm}
          disabled={selectedIds.size === 0}
          onClick={() => onConfirm(Array.from(selectedIds))}
        >
          Выбрать
        </button>
      </div>
    </div>
  )
}
