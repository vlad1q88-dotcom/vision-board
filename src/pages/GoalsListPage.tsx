import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { addGoal, completeGoals, deleteGoals } from '../db/goalRepo'
import { ALL_CATEGORIES, DEFAULT_CATEGORY } from '../db/categories'
import { useGoals } from '../hooks/useGoals'
import { GoalCard } from '../components/GoalCard'
import { GoalForm } from '../components/GoalForm'
import { CategoryFilter } from '../components/CategoryFilter'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ImportGoalsDialog } from '../components/ImportGoalsDialog'
import { NavBar } from '../components/NavBar'
import styles from './GoalsListPage.module.css'

export function GoalsListPage() {
  const goals = useGoals()
  const [searchParams] = useSearchParams()
  const expandId = searchParams.get('expand')
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false)
  const [isConfirmingBulkComplete, setIsConfirmingBulkComplete] = useState(false)

  function toggleSelect(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelection() {
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    goals.forEach((goal) => set.add(goal.category || DEFAULT_CATEGORY))
    return Array.from(set)
  }, [goals])

  const visibleGoals = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? goals
        : goals.filter((goal) => (goal.category || DEFAULT_CATEGORY) === selectedCategory),
    [goals, selectedCategory],
  )

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>Цели</h1>
        <div className={styles.headerActions}>
          <button type="button" className={styles.importButton} onClick={() => setIsImporting(true)}>
            Импорт из текста
          </button>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setIsAddingGoal(true)}
            aria-label="Добавить цель"
          />
        </div>
      </div>
      {goals.length > 0 && (
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onCategoryDeleted={(category) => {
            if (selectedCategory === category) setSelectedCategory(ALL_CATEGORIES)
          }}
          onSelectGoals={() => setIsSelecting(true)}
        />
      )}
      {isSelecting && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>Выбрано: {selectedIds.size}</span>
          <div className={styles.selectionActions}>
            <button type="button" className={styles.selectionCancel} onClick={exitSelection}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.selectionAction}
              disabled={selectedIds.size === 0}
              onClick={() => setIsConfirmingBulkComplete(true)}
            >
              Отметить выполненными
            </button>
            <button
              type="button"
              className={styles.selectionAction}
              disabled={selectedIds.size === 0}
              onClick={() => setIsConfirmingBulkDelete(true)}
            >
              Удалить выбранные
            </button>
          </div>
        </div>
      )}
      {isConfirmingBulkDelete && (
        <ConfirmDialog
          title="Удалить выбранные цели?"
          message={`Выбранные цели (${selectedIds.size}) и их фото будут удалены без возможности восстановления.`}
          onCancel={() => setIsConfirmingBulkDelete(false)}
          onConfirm={async () => {
            await deleteGoals(Array.from(selectedIds))
            setIsConfirmingBulkDelete(false)
            exitSelection()
          }}
        />
      )}
      {isConfirmingBulkComplete && (
        <ConfirmDialog
          title="Отметить выбранные цели выполненными?"
          message={`Фото-визуализации выбранных целей (${selectedIds.size}) удалятся без возврата, а сами цели переедут в дневник благодарностей.`}
          confirmLabel="Готово!"
          onCancel={() => setIsConfirmingBulkComplete(false)}
          onConfirm={async () => {
            await completeGoals(Array.from(selectedIds))
            setIsConfirmingBulkComplete(false)
            exitSelection()
          }}
        />
      )}
      {isAddingGoal && (
        <GoalForm
          submitLabel="Добавить цель"
          categories={categories}
          onCancel={() => setIsAddingGoal(false)}
          onSubmit={async (title, description, category) => {
            await addGoal(title, description, category)
            setIsAddingGoal(false)
          }}
        />
      )}
      {isImporting && <ImportGoalsDialog onClose={() => setIsImporting(false)} />}
      <div className={styles.list}>
        <AnimatePresence initial={false}>
          {visibleGoals.map((goal) => (
            <motion.div
              key={goal.id}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <GoalCard
                goal={goal}
                categories={categories}
                forceExpand={String(goal.id) === expandId}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(goal.id)}
                onToggleSelect={toggleSelect}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {goals.length === 0 && <p className={styles.empty}>Добавьте первую цель, чтобы начать.</p>}
      {goals.length > 0 && visibleGoals.length === 0 && (
        <p className={styles.empty}>В этой категории пока нет целей.</p>
      )}
    </div>
  )
}
