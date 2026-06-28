import { useLocation } from 'react-router-dom'
import { useBackupWorker } from '../hooks/useBackupWorker'
import { snoozeBackupReminder, useBackupReminder } from '../hooks/useBackupReminder'
import { ProgressBar } from './ProgressBar'
import styles from './BackupReminderBanner.module.css'

export function BackupReminderBanner() {
  const { dueNow, isStale } = useBackupReminder()
  const { pathname } = useLocation()
  const { exportBackup, progress } = useBackupWorker()

  // The slideshow is a deliberately distraction-free, fullscreen experience (see the
  // audio-non-interrupt comment in SlideshowPage.tsx) — a backup nag has no business there.
  // When stale (30+ days), BackupStaleWarning takes over instead of this regular reminder.
  if (!dueNow || isStale || pathname === '/slideshow') return null

  return (
    <div className={styles.banner}>
      {progress ? (
        <>
          <span className={styles.text}>Экспортируется резервная копия…</span>
          <div className={styles.progress}>
            <ProgressBar processed={progress.processed} total={progress.total} />
          </div>
        </>
      ) : (
        <>
          <span className={styles.text}>Пора сделать резервную копию данных.</span>
          <div className={styles.actions}>
            <button type="button" className={styles.snooze} onClick={snoozeBackupReminder}>
              Напомнить позже
            </button>
            <button type="button" className={styles.export} onClick={() => exportBackup()}>
              Экспортировать
            </button>
          </div>
        </>
      )}
    </div>
  )
}
