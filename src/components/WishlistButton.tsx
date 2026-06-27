import { useState } from 'react'
import { WishlistEditorOverlay } from './WishlistEditorOverlay'
import styles from './WishlistButton.module.css'

export function WishlistButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsOpen(true)}
        aria-label="Вишлист"
        title="Вишлист"
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <rect x="4" y="10" width="16" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth={1.8} />
          <rect x="2.5" y="6.5" width="19" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth={1.8} />
          <line x1="12" y1="6.5" x2="12" y2="20" stroke="currentColor" strokeWidth={1.8} />
          <path
            d="M12 6.5C12 6.5 9 6.5 9 4.2C9 2.8 11 2.5 12 4C13 2.5 15 2.8 15 4.2C15 6.5 12 6.5 12 6.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && <WishlistEditorOverlay onClose={() => setIsOpen(false)} />}
    </>
  )
}
