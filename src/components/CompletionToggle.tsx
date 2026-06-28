import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ConfettiBurst } from './ConfettiBurst'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './CompletionToggle.module.css'

interface ConfirmCopy {
  title: string
  message: string
  confirmLabel?: string
}

interface CompletionToggleProps {
  onComplete: () => void
  // Override the default goal-completion confirm-dialog copy, or skip the dialog entirely
  // (pass null) for low-stakes completions that don't destroy anything (e.g. a standalone
  // Plan task with no linked goal — just a status flip, nothing to warn about).
  confirmCopy?: ConfirmCopy | null
  ariaLabel?: string
}

const CELEBRATION_MS = 700

const DEFAULT_CONFIRM_COPY: ConfirmCopy = {
  title: 'Отметить цель выполненной?',
  message: 'Фото-визуализации этой цели удалятся без возврата, а сама цель переедет в дневник благодарностей.',
  confirmLabel: 'Готово!',
}

export function CompletionToggle({
  onComplete,
  confirmCopy = DEFAULT_CONFIRM_COPY,
  ariaLabel = 'Отметить цель выполненной',
}: CompletionToggleProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCelebrating, setIsCelebrating] = useState(false)

  function handleConfirm() {
    setIsConfirming(false)
    setIsCelebrating(true)
    setTimeout(onComplete, CELEBRATION_MS)
  }

  function handleClick() {
    if (confirmCopy === null) {
      handleConfirm()
    } else {
      setIsConfirming(true)
    }
  }

  return (
    <>
      <button
        type="button"
        className={isCelebrating ? `${styles.circle} ${styles.done}` : styles.circle}
        onClick={handleClick}
        disabled={isCelebrating}
        aria-label={ariaLabel}
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
      {isConfirming && confirmCopy && (
        <ConfirmDialog
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel ?? 'Готово!'}
          onCancel={() => setIsConfirming(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
