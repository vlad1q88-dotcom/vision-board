import { useState } from 'react'
import { ALL_CATEGORIES } from '../db/categories'
import { CategoryActionsPopover } from './CategoryActionsPopover'
import styles from './CategoryFilter.module.css'

interface CategoryFilterProps {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
  onCategoryDeleted?: (category: string) => void
  onSelectGoals?: () => void
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
  onCategoryDeleted,
  onSelectGoals,
}: CategoryFilterProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  function handleClick(category: string) {
    if (category === selected) {
      if (!onCategoryDeleted) return
      setOpenCategory((current) => (current === category ? null : category))
    } else {
      onSelect(category)
      setOpenCategory(null)
    }
  }

  return (
    <div className={styles.row}>
      {[ALL_CATEGORIES, ...categories].map((category) => (
        <div className={styles.pillWrap} key={category}>
          <button
            type="button"
            className={selected === category ? styles.pillActive : styles.pill}
            onClick={() => handleClick(category)}
          >
            {category}
          </button>
          {openCategory === category && onCategoryDeleted && onSelectGoals && (
            <CategoryActionsPopover
              category={category}
              onClose={() => setOpenCategory(null)}
              onDeleted={onCategoryDeleted}
              onSelectGoals={onSelectGoals}
            />
          )}
        </div>
      ))}
    </div>
  )
}
