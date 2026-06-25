import { useState, type FormEvent } from 'react'
import styles from './GoalForm.module.css'

interface GoalFormProps {
  initialTitle?: string
  initialDescription?: string
  submitLabel: string
  onSubmit: (title: string, description: string) => void
  onCancel?: () => void
}

export function GoalForm({
  initialTitle = '',
  initialDescription = '',
  submitLabel,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    onSubmit(trimmedTitle, description.trim())
    if (!initialTitle) {
      setTitle('')
      setDescription('')
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
