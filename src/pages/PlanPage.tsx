import { useMemo, useState } from 'react'
import { Reorder } from 'motion/react'
import { useTasks } from '../hooks/useTasks'
import { useSubtasksByTask } from '../hooks/useSubtasksByTask'
import { useFlatDeadlineItems } from '../hooks/useFlatDeadlineItems'
import { addStandaloneTask, reorderTasks } from '../db/taskRepo'
import { ALL_CATEGORIES } from '../db/categories'
import { NavBar } from '../components/NavBar'
import { TaskCard } from '../components/TaskCard'
import { GoalForm } from '../components/GoalForm'
import { FlatDeadlineList } from '../components/FlatDeadlineList'
import { StatusFilterPills, type StatusFilterValue } from '../components/StatusFilterPills'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { CategoryFilter } from '../components/CategoryFilter'
import { PlusIcon } from '../components/PlusIcon'
import { matchesStatusFilter } from '../utils/taskStatusFilter'
import type { FlatDeadlineRow } from '../hooks/useFlatDeadlineItems'
import styles from './PlanPage.module.css'

const EMPTY_MESSAGES: Partial<Record<StatusFilterValue, string>> = {
  in_progress: 'Пока нет задач в работе.',
  done: 'Пока нет выполненных задач.',
}

const DEFAULT_EMPTY_MESSAGE =
  'Пока нет задач. Они появляются здесь автоматически при создании цели на вкладке «Цели», либо нажми + и добавь задачу прямо здесь.'

function matchesFlatStatus(row: FlatDeadlineRow, filter: StatusFilterValue): boolean {
  if (filter === 'all') return true
  if (filter === 'done') return row.done || row.status === 'done'
  return !row.done && row.status === filter
}

// Subtask-kind rows have no category at all, so they only ever show under "Все категории" —
// there's no host-task rescue logic here (unlike the status filter) since a subtask matching
// a category makes no sense, only its parent task can have one.
function matchesCategoryFilter(category: string | undefined, filter: string): boolean {
  return filter === ALL_CATEGORIES || category === filter
}

export function PlanPage() {
  const tasks = useTasks()
  const subtasksByTask = useSubtasksByTask()
  const [isAdding, setIsAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [dateFrom, setDateFrom] = useState<number | null>(null)
  const [dateTo, setDateTo] = useState<number | null>(null)
  const isDateFilterActive = dateFrom !== null && dateTo !== null
  const flatItems = useFlatDeadlineItems(dateFrom, dateTo)

  const categories = useMemo(() => {
    const set = new Set<string>()
    tasks.forEach((task) => set.add(task.displayCategory))
    return Array.from(set)
  }, [tasks])

  // A task stays visible if it matches the filter itself, OR if it hosts at least one
  // separated subtask that matches — otherwise an otherwise-matching subtask would become
  // unreachable just because its parent task's own status differs.
  const visibleTasks = tasks
    .filter((task) => {
      if (matchesStatusFilter(task.status, statusFilter)) return true
      const ownSubtasks = subtasksByTask.get(task.id) ?? []
      return ownSubtasks.some((subtask) => subtask.separated && matchesStatusFilter(subtask.status, statusFilter))
    })
    .filter((task) => matchesCategoryFilter(task.displayCategory, categoryFilter))
  const visibleFlatItems = flatItems
    .filter((row) => matchesFlatStatus(row, statusFilter))
    .filter((row) => matchesCategoryFilter(row.category, categoryFilter))

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>План</h1>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsAdding(true)}
          aria-label="Добавить задачу"
        >
          <PlusIcon size={18} />
        </button>
      </div>
      {isAdding && (
        <GoalForm
          submitLabel="Добавить"
          titlePlaceholder="Название задачи"
          categories={categories}
          onCancel={() => setIsAdding(false)}
          onSubmit={async (title, description, category) => {
            await addStandaloneTask(title, description, category)
            setIsAdding(false)
          }}
        />
      )}
      <div className={styles.filters}>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to) }} />
        <StatusFilterPills selected={statusFilter} onSelect={setStatusFilter} />
      </div>
      <CategoryFilter categories={categories} selected={categoryFilter} onSelect={setCategoryFilter} />
      {isDateFilterActive ? (
        <FlatDeadlineList rows={visibleFlatItems} />
      ) : (
        <>
          <Reorder.Group
            as="div"
            axis="y"
            values={visibleTasks}
            onReorder={(next) => reorderTasks(next.map((task) => task.id))}
            className={styles.list}
          >
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={subtasksByTask.get(task.id) ?? []}
                statusFilter={statusFilter}
                categories={categories}
              />
            ))}
          </Reorder.Group>
          {visibleTasks.length === 0 && (
            <p className={styles.empty}>{EMPTY_MESSAGES[statusFilter] ?? DEFAULT_EMPTY_MESSAGE}</p>
          )}
        </>
      )}
    </div>
  )
}
