import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addGratitudeEntry } from '../db/goalRepo'
import { useCompletedGoals } from '../hooks/useCompletedGoals'
import { JournalEntryCard } from '../components/JournalEntryCard'
import { NavBar } from '../components/NavBar'
import styles from './JournalPage.module.css'

interface GratitudeQuickAddFormProps {
  onSubmit: (title: string) => void
  onCancel: () => void
}

function GratitudeQuickAddForm({ onSubmit, onCancel }: GratitudeQuickAddFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit(trimmed)
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
        />
      </div>
      {isAdding && (
        <GratitudeQuickAddForm
          onCancel={() => setIsAdding(false)}
          onSubmit={async (title) => {
            await addGratitudeEntry(title)
            setIsAdding(false)
          }}
        />
      )}
      <div className={styles.list}>
        {completedGoals.map((goal) => (
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
