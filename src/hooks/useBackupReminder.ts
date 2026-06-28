import { useEffect, useState } from 'react'

export type ReminderInterval = 0 | 15 | 30 | 60

const INTERVAL_KEY = 'vision-board-backup-interval-minutes'
const LAST_EXPORT_KEY = 'vision-board-last-export-at'
// Baseline for the 30-day staleness check when the user has never exported at all — without
// this, "no export yet" would read as epoch 1970 (infinitely overdue) and the warning would
// fire on the very first load instead of waiting out a real 30 days.
const FIRST_USED_KEY = 'vision-board-first-used-at'
const STALE_DISMISSED_DATE_KEY = 'vision-board-backup-stale-dismissed-date'
// The native `storage` event only fires in *other* tabs, not the one making the change —
// this custom event is how the NavBar settings panel and the reminder banner (separate
// hook instances, no shared component tree) stay in sync within the same tab.
const SYNC_EVENT = 'vision-board-backup-settings-changed'
const CHECK_TICK_MS = 30_000
const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000

function readInterval(): ReminderInterval {
  const stored = Number(localStorage.getItem(INTERVAL_KEY))
  return stored === 15 || stored === 30 || stored === 60 ? stored : 0
}

function readLastExportAt(): number {
  return Number(localStorage.getItem(LAST_EXPORT_KEY)) || 0
}

function readFirstUsedAt(): number {
  const stored = Number(localStorage.getItem(FIRST_USED_KEY))
  if (stored) return stored
  const now = Date.now()
  localStorage.setItem(FIRST_USED_KEY, String(now))
  return now
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function readStaleDismissedDate(): string {
  return localStorage.getItem(STALE_DISMISSED_DATE_KEY) ?? ''
}

function writeLastExportAt(value: number) {
  localStorage.setItem(LAST_EXPORT_KEY, String(value))
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function setReminderInterval(value: ReminderInterval): void {
  localStorage.setItem(INTERVAL_KEY, String(value))
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function markBackupExported(): void {
  writeLastExportAt(Date.now())
}

// Pushes the deadline forward by one full interval without actually exporting, so dismissing
// the banner doesn't make it reappear on the very next 30s check tick.
export function snoozeBackupReminder(): void {
  writeLastExportAt(Date.now())
}

// Hides today's instance of the 30-day staleness warning only — it returns tomorrow if the
// user still hasn't exported. Does not affect `isStale` itself (which keeps suppressing the
// regular interval-based reminder until a real export happens).
export function dismissStaleWarningForToday(): void {
  localStorage.setItem(STALE_DISMISSED_DATE_KEY, todayString())
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function useBackupReminder() {
  const [intervalMinutes, setIntervalMinutes] = useState<ReminderInterval>(readInterval)
  const [dueNow, setDueNow] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [showStaleWarning, setShowStaleWarning] = useState(false)

  useEffect(() => {
    function sync() {
      const interval = readInterval()
      const lastExportAt = readLastExportAt()
      setIntervalMinutes(interval)
      setDueNow(interval > 0 && Date.now() - lastExportAt >= interval * 60_000)

      const staleBaseline = lastExportAt || readFirstUsedAt()
      const stale = Date.now() - staleBaseline >= STALE_THRESHOLD_MS
      setIsStale(stale)
      setShowStaleWarning(stale && readStaleDismissedDate() !== todayString())
    }
    sync()
    const timer = setInterval(sync, CHECK_TICK_MS)
    window.addEventListener(SYNC_EVENT, sync)
    return () => {
      clearInterval(timer)
      window.removeEventListener(SYNC_EVENT, sync)
    }
  }, [])

  return { intervalMinutes, dueNow, isStale, showStaleWarning }
}
