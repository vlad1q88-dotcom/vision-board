import type { TaskStatus } from '../types'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: TaskStatus
  // Toggles between 'plan' and 'in_progress' (clicking again reverts). Omit for read-only
  // contexts (e.g. the flat deadline list) — 'done' is always read-only regardless, since
  // it's only ever set via the completion checkbox, never via this button.
  onToggle?: () => void
}

const LABELS: Record<TaskStatus, string> = {
  plan: 'План',
  in_progress: 'В работе',
  done: 'Выполнено',
}

export function StatusBadge({ status, onToggle }: StatusBadgeProps) {
  if (onToggle && status !== 'done') {
    // The 'plan' button shows a call-to-action ("В работу" = "start working"), not the
    // state name ("План") — only the 'in_progress' button reuses its state's own label,
    // since clicking it to revert reads naturally as "click the current state to undo it".
    const label = status === 'plan' ? 'В работу' : LABELS[status]
    return (
      <button
        type="button"
        className={status === 'in_progress' ? styles.progressButton : styles.advanceButton}
        onClick={onToggle}
      >
        {label}
      </button>
    )
  }

  return <span className={`${styles.badge} ${styles[status]}`}>{LABELS[status]}</span>
}
