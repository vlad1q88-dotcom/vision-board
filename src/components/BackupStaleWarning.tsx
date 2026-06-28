import { useLocation } from 'react-router-dom'
import { useBackupWorker } from '../hooks/useBackupWorker'
import { dismissStaleWarningForToday, useBackupReminder } from '../hooks/useBackupReminder'
import { ProgressBar } from './ProgressBar'
import styles from './BackupStaleWarning.module.css'

export function BackupStaleWarning() {
  const { showStaleWarning } = useBackupReminder()
  const { pathname } = useLocation()
  const { exportBackup, progress } = useBackupWorker()

  // The slideshow is a deliberately distraction-free, fullscreen experience (see the
  // audio-non-interrupt comment in SlideshowPage.tsx) — a backup nag has no business there.
  if (!showStaleWarning || pathname === '/slideshow') return null

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
          <span className={styles.text}>
            ⚠ Резервная копия не делалась больше 30 дней. Данные хранятся только в этом браузере —
            есть риск потерять их без возврата.
          </span>
          <div className={styles.actions}>
            <button type="button" className={styles.dismiss} onClick={dismissStaleWarningForToday}>
              Скрыть на сегодня
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
