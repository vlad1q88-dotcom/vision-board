import { exportBackupZip, importBackupAny } from '../db/backupRepo'
import type { BackupProgress } from '../db/backupRepo'

interface ExportRequest {
  type: 'export'
}

interface ImportRequest {
  type: 'import'
  file: File
}

type WorkerRequest = ExportRequest | ImportRequest

type WorkerResponse =
  | ({ type: 'progress' } & BackupProgress)
  | { type: 'export-done'; blob: Blob }
  | { type: 'import-done' }
  | { type: 'error'; message: string }

// This file runs inside a Web Worker, not a browser window — the project's tsconfig sets
// `lib: ["DOM"]` for all of src (so the ambient `self` resolves to the Window flavor), and TS
// doesn't allow mixing in `lib: ["WebWorker"]` for just this one file. Declaring only the slice
// of the worker global scope actually used here sidesteps that conflict without a separate
// tsconfig project. `MessageEvent` itself comes from the DOM lib, which already covers it.
declare const self: {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (message: WorkerResponse) => void
}

function reportProgress(progress: BackupProgress) {
  self.postMessage({ type: 'progress', ...progress })
}

self.onmessage = async (event) => {
  const request = event.data
  try {
    if (request.type === 'export') {
      const blob = await exportBackupZip(reportProgress)
      self.postMessage({ type: 'export-done', blob })
    } else {
      await importBackupAny(request.file, reportProgress)
      self.postMessage({ type: 'import-done' })
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
