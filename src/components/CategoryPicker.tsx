import { useState } from 'react'
import { DEFAULT_CATEGORY } from '../db/categories'
import styles from './CategoryPicker.module.css'

interface CategoryPickerProps {
  value: string
  onChange: (value: string) => void
  categories: string[]
}

export function CategoryPicker({ value, onChange, categories }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={styles.categoryField}>
      <input
        className={styles.input}
        type="text"
        placeholder={`Категория (по умолчанию «${DEFAULT_CATEGORY}»)`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className={styles.categoryToggle}
        onClick={() => setIsOpen((open) => !open)}
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
      {isOpen && (
        <>
          <div className={styles.categoryScrim} onClick={() => setIsOpen(false)} />
          <div className={styles.categoryMenu}>
            {categories.map((option) => (
              <button
                type="button"
                key={option}
                className={styles.categoryOption}
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
