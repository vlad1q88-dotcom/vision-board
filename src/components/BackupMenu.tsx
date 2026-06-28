import { useRef, useState, type ChangeEvent } from 'react'
import { useBackupWorker } from '../hooks/useBackupWorker'
import { setReminderInterval, useBackupReminder, type ReminderInterval } from '../hooks/useBackupReminder'
import { ConfirmDialog } from './ConfirmDialog'
import { ProgressBar } from './ProgressBar'
import styles from './BackupMenu.module.css'

const INTERVAL_OPTIONS: { value: ReminderInterval; label: string }[] = [
  { value: 0, label: 'Выкл.' },
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '60 мин' },
]

export function BackupMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { intervalMinutes } = useBackupReminder()
  const { exportBackup, importBackup, progress } = useBackupWorker()

  async function handleExport() {
    await exportBackup()
    setIsOpen(false)
  }

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) setPendingFile(file)
  }

  async function handleConfirmImport() {
    if (!pendingFile) return
    const file = pendingFile
    setPendingFile(null)
    await importBackup(file)
    setIsOpen(false)
  }

  return (
    <div className={styles.field}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Резервная копия"
        title="Резервная копия"
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path
            d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
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
          <div className={styles.scrim} onClick={() => setIsOpen(false)} />
          <div className={styles.menu}>
            {progress ? (
              <div className={styles.progressRow}>
                <ProgressBar processed={progress.processed} total={progress.total} />
              </div>
            ) : (
              <>
                <p className={styles.infoText}>
                  Все данные (цели, фото, план, дневник, вишлист, карта желаний) хранятся только в этом
                  браузере на этом устройстве — без сервера и облака, без синхронизации между устройствами.
                  Если очистить данные сайта, переустановить браузер или сменить устройство — всё будет
                  потеряно без возврата. Экспорт — единственный способ сохранить данные.
                </p>
                <button type="button" className={styles.action} onClick={handleExport}>
                  Экспорт
                </button>
                <button type="button" className={styles.action} onClick={() => fileInputRef.current?.click()}>
                  Импорт
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.json,application/zip,application/json"
                  className={styles.hiddenInput}
                  onChange={handleFileChosen}
                />
                <div className={styles.reminderRow}>
                  <span className={styles.reminderLabel}>Напоминание</span>
                  <select
                    className={styles.reminderSelect}
                    value={intervalMinutes}
                    onChange={(event) => setReminderInterval(Number(event.target.value) as ReminderInterval)}
                  >
                    {INTERVAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {pendingFile && (
        <ConfirmDialog
          title="Импортировать резервную копию?"
          message="Все текущие данные приложения (цели, фото, задачи, дневник, вишлист, карта желаний) будут заменены содержимым файла. Отменить это действие нельзя."
          confirmLabel="Импортировать"
          onCancel={() => setPendingFile(null)}
          onConfirm={handleConfirmImport}
        />
      )}
    </div>
  )
}
