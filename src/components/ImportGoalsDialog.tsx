import { useMemo, useState } from 'react'
import { addGoals } from '../db/goalRepo'
import { parseGoalsText } from '../db/parseGoalsText'
import styles from './ImportGoalsDialog.module.css'

interface ImportGoalsDialogProps {
  onClose: () => void
}

export function ImportGoalsDialog({ onClose }: ImportGoalsDialogProps) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseGoalsText(text), [text])

  async function handleImport() {
    if (parsed.length === 0) return
    await addGoals(parsed)
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.title}>Импорт целей из текста</h3>
        <p className={styles.hint}>
          Одна цель на строке. Маркеры списка (-, *, 1.) необязательны. Описание необходимо указать
          через «:». Категорию — в конце строки в скобках.
        </p>
        <textarea
          className={styles.textarea}
          rows={8}
          placeholder={
            '- Путешествие в Японию: увидеть сакуру весной (Путешествия)\n- Выучить испанский'
          }
          value={text}
          onChange={(event) => setText(event.target.value)}
          autoFocus
        />
        <p className={styles.preview}>
          {parsed.length > 0
            ? `Будет добавлено целей: ${parsed.length}`
            : 'Пока не распознано ни одной цели'}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={handleImport}
            disabled={parsed.length === 0}
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  )
}
