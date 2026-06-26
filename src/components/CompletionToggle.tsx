import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ConfettiBurst } from './ConfettiBurst'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './CompletionToggle.module.css'

interface CompletionToggleProps {
  onComplete: () => void
}

const CELEBRATION_MS = 700

export function CompletionToggle({ onComplete }: CompletionToggleProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCelebrating, setIsCelebrating] = useState(false)

  function handleConfirm() {
    setIsConfirming(false)
    setIsCelebrating(true)
    setTimeout(onComplete, CELEBRATION_MS)
  }

  return (
    <>
      <button
        type="button"
        className={isCelebrating ? `${styles.circle} ${styles.done}` : styles.circle}
        onClick={() => setIsConfirming(true)}
        disabled={isCelebrating}
        aria-label="Отметить цель выполненной"
      >
        <AnimatePresence>{isCelebrating && <ConfettiBurst key="confetti" />}</AnimatePresence>
        {isCelebrating ? (
          <motion.svg
            className={styles.check}
            viewBox="0 0 24 24"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.3, ease: 'backOut' }}
          >
            <path
              d="M5 12.5l4.5 4.5L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ) : (
          <span className={styles.previewDone} aria-hidden="true">
            <svg className={styles.check} viewBox="0 0 24 24">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>
      {isConfirming && (
        <ConfirmDialog
          title="Отметить цель выполненной?"
          message="Фото-визуализации этой цели удалятся без возврата, а сама цель переедет в дневник благодарностей."
          confirmLabel="Готово!"
          onCancel={() => setIsConfirming(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
