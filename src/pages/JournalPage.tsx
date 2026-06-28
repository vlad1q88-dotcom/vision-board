import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addGratitudeEntry } from '../db/goalRepo'
import { ALL_CATEGORIES, DEFAULT_CATEGORY } from '../db/categories'
import { useCompletedGoals } from '../hooks/useCompletedGoals'
import { JournalEntryCard } from '../components/JournalEntryCard'
import { NavBar } from '../components/NavBar'
import { PlusIcon } from '../components/PlusIcon'
import { CategoryPicker } from '../components/CategoryPicker'
import { CategoryFilter } from '../components/CategoryFilter'
import { DateRangeFilter } from '../components/DateRangeFilter'
import styles from './JournalPage.module.css'

interface GratitudeQuickAddFormProps {
  categories: string[]
  onSubmit: (title: string, category: string) => void
  onCancel: () => void
}

function GratitudeQuickAddForm({ categories, onSubmit, onCancel }: GratitudeQuickAddFormProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit(trimmed, category.trim() || DEFAULT_CATEGORY)
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <input
        className={styles.addInput}
        type="text"
        placeholder="Название благодарности"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
        required
      />
      <CategoryPicker value={category} onChange={setCategory} categories={categories} />
      <div className={styles.addActions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className={styles.submit}>
          Добавить
        </button>
      </div>
    </form>
  )
}

export function JournalPage() {
  const completedGoals = useCompletedGoals()
  const [isAdding, setIsAdding] = useState(false)
  const [searchParams] = useSearchParams()
  const expandId = searchParams.get('expand')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [dateFrom, setDateFrom] = useState<number | null>(null)
  const [dateTo, setDateTo] = useState<number | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    completedGoals.forEach((goal) => set.add(goal.category || DEFAULT_CATEGORY))
    return Array.from(set)
  }, [completedGoals])

  const visibleGoals = useMemo(
    () =>
      completedGoals
        .filter((goal) => selectedCategory === ALL_CATEGORIES || (goal.category || DEFAULT_CATEGORY) === selectedCategory)
        .filter((goal) => {
          if (dateFrom === null || dateTo === null) return true
          const completedAt = goal.completedAt ?? 0
          return completedAt >= dateFrom && completedAt <= dateTo
        }),
    [completedGoals, selectedCategory, dateFrom, dateTo],
  )

  return (
    <div className={styles.page}>
      <NavBar />
      <div className={styles.header}>
        <h1 className={styles.title}>Дневник благодарностей</h1>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsAdding(true)}
          aria-label="Добавить благодарность"
        >
          <PlusIcon size={18} />
        </button>
      </div>
      {isAdding && (
        <GratitudeQuickAddForm
          categories={categories}
          onCancel={() => setIsAdding(false)}
          onSubmit={async (title, category) => {
            await addGratitudeEntry(title, category)
            setIsAdding(false)
          }}
        />
      )}
      <DateRangeFilter from={dateFrom} to={dateTo} onChange={(from, to) => { setDateFrom(from); setDateTo(to) }} />
      {completedGoals.length > 0 && (
        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      )}
      <div className={styles.list}>
        {visibleGoals.map((goal) => (
          <JournalEntryCard key={goal.id} goal={goal} forceExpand={String(goal.id) === expandId} />
        ))}
      </div>
      {completedGoals.length === 0 && (
        <p className={styles.empty}>
          Пока нет завершённых целей. Отметь цель выполненной на вкладке «Цели» — она появится здесь.
          Или нажми + и напиши за что ты сегодня благодарен.
        </p>
      )}
    </div>
  )
}
