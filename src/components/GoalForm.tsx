import { useState, type FormEvent } from 'react'
import { DEFAULT_CATEGORY } from '../db/categories'
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
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)

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
      <div className={styles.categoryField}>
        <input
          className={styles.input}
          type="text"
          placeholder={`Категория (по умолчанию «${DEFAULT_CATEGORY}»)`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <button
          type="button"
          className={styles.categoryToggle}
          onClick={() => setIsCategoryMenuOpen((open) => !open)}
          aria-label="Выбрать категорию"
          title="Выбрать категорию"
        >
          <svg viewBox="0 0 24 24" className={styles.categoryToggleIcon}>
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {isCategoryMenuOpen && (
          <>
            <div className={styles.categoryScrim} onClick={() => setIsCategoryMenuOpen(false)} />
            <div className={styles.categoryMenu}>
              {categories.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={styles.categoryOption}
                  onClick={() => {
                    setCategory(option)
                    setIsCategoryMenuOpen(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
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
