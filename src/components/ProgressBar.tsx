import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  processed: number
  total: number
}

export function ProgressBar({ processed, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>{percent}%</span>
    </div>
  )
}
