import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { addGoal } from '../db/goalRepo'
import { useGoals } from '../hooks/useGoals'
import { GoalCard } from '../components/GoalCard'
import { GoalForm } from '../components/GoalForm'
import { ImportGoalsDialog } from '../components/ImportGoalsDialog'
import { NavBar } from '../components/NavBar'
import styles from './GoalsListPage.module.css'

export function GoalsListPage() {
  const goals = useGoals()
  const [searchParams] = useSearchParams()
  const expandId = searchParams.get('expand')
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

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
      {isAddingGoal && (
        <GoalForm
          submitLabel="Добавить цель"
          onCancel={() => setIsAddingGoal(false)}
          onSubmit={async (title, description) => {
            await addGoal(title, description)
            setIsAddingGoal(false)
          }}
        />
      )}
      {isImporting && <ImportGoalsDialog onClose={() => setIsImporting(false)} />}
      <div className={styles.list}>
        <AnimatePresence initial={false}>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <GoalCard goal={goal} forceExpand={String(goal.id) === expandId} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {goals.length === 0 && <p className={styles.empty}>Добавьте первую цель, чтобы начать.</p>}
    </div>
  )
}
