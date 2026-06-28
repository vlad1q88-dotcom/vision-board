import { useState, type FormEvent } from 'react'
import { DEFAULT_CATEGORY } from '../db/categories'
import { CategoryPicker } from './CategoryPicker'
import styles from './GoalForm.module.css'

interface GoalFormProps {
  initialTitle?: string
  initialDescription?: string
  initialCategory?: string
  categories: string[]
  submitLabel: string
  onSubmit: (title: string, description: string, category: string) => void
  onCancel?: () => void
}

export function GoalForm({
  initialTitle = '',
  initialDescription = '',
  initialCategory = '',
  categories,
  submitLabel,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [category, setCategory] = useState(initialCategory)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    onSubmit(trimmedTitle, description.trim(), category.trim() || DEFAULT_CATEGORY)
    if (!initialTitle) {
      setTitle('')
      setDescription('')
      setCategory('')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Название цели"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />
      <CategoryPicker value={category} onChange={setCategory} categories={categories} />
      <textarea
        className={styles.textarea}
        placeholder="Описание"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
      />
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" className={styles.submit}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
