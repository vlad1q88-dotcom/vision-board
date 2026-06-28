import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../utils/exportWishMapImage'
import { markBackupExported } from './useBackupReminder'
import type { BackupProgress } from '../db/backupRepo'

type WorkerResponse =
  | ({ type: 'progress' } & BackupProgress)
  | { type: 'export-done'; blob: Blob }
  | { type: 'import-done' }
  | { type: 'error'; message: string }

function backupFilename(): string {
  return `vision-board-backup-${new Date().toISOString().slice(0, 10)}.zip`
}

// One worker per in-flight operation: created lazily on first export/import, terminated once
// it reports done/error. These run infrequently (manual, or on a 15-60 min reminder), so the
// spin-up cost of a fresh worker each time is unnoticeable — simpler than managing idle
// worker lifecycle across component remounts.
export function useBackupWorker() {
  const [progress, setProgress] = useState<BackupProgress | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // If the component unmounts mid-operation (e.g. the menu closes), stop the worker rather
  // than letting it keep running — its result would have nowhere to go anyway.
  useEffect(() => () => workerRef.current?.terminate(), [])

  const runRequest = useCallback(
    (request: { type: 'export' } | { type: 'import'; file: File }) =>
      new Promise<Blob | undefined>((resolve, reject) => {
        const worker = new Worker(new URL('../workers/backupWorker.ts', import.meta.url), { type: 'module' })
        workerRef.current = worker
        setProgress({ processed: 0, total: 0 })

        function finish() {
          worker.terminate()
          workerRef.current = null
          setProgress(null)
        }

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data
          if (message.type === 'progress') {
            setProgress({ processed: message.processed, total: message.total })
          } else if (message.type === 'export-done') {
            finish()
            resolve(message.blob)
          } else if (message.type === 'import-done') {
            finish()
            resolve(undefined)
          } else {
            finish()
            reject(new Error(message.message))
          }
        }
        worker.postMessage(request)
      }),
    [],
  )

  const exportBackup = useCallback(async () => {
    const blob = await runRequest({ type: 'export' })
    downloadBlob(blob!, backupFilename())
    markBackupExported()
  }, [runRequest])

  const importBackup = useCallback(
    async (file: File) => {
      await runRequest({ type: 'import', file })
    },
    [runRequest],
  )

  return { exportBackup, importBackup, progress }
}
