import { beforeEach, describe, expect, it, vi } from 'vitest'
// This app's tsconfig deliberately has no Node types (it's browser-only code) — node:buffer
// itself resolves fine at runtime under Vitest's Node-based test runner, TS just can't see it.
// @ts-expect-error -- no ambient types for 'node:buffer' under this project's browser-only tsconfig
import { Blob as NodeBlob } from 'node:buffer'

vi.mock('./thumbnails', () => ({
  createThumbnail: vi.fn(async (blob: Blob) => blob),
}))

import { db } from './db'
import { addGoal } from './goalRepo'
import { addImageToGoal } from './imageRepo'
import { addStandaloneTask, addSubtask, separateSubtask } from './taskRepo'
import { addCustomWishlistItem, saveWishlistName, updateWishlistItem } from './wishlistRepo'
import { saveWishMap } from './wishMapRepo'
import { createEmptyZones } from './wishMapZones'
import { blobToDataUrl } from '../utils/blobBase64'
import { exportBackupZip, importBackupAny, type BackupProgress } from './backupRepo'

// fake-indexeddb clones stored values with Node's structuredClone, which only recognizes
// Node's own Blob class — not jsdom's separate Blob implementation that the bare `Blob` global
// resolves to under vitest's jsdom environment. Using node:buffer's Blob for fixtures here
// keeps blob content intact through the db round-trip; production code (running in a real
// browser, where there's only one Blob class) is unaffected.
function testBlob(content: string, type: string): Blob {
  return new NodeBlob([content], { type }) as unknown as Blob
}

beforeEach(async () => {
  await db.goals.clear()
  await db.images.clear()
  await db.wishMap.clear()
  await db.wishlist.clear()
  await db.wishlistItems.clear()
  await db.tasks.clear()
  await db.subtasks.clear()
  localStorage.clear()
})

async function seedFullLibrary() {
  const goalId = await addGoal('Marathon', 'Run it')
  await addImageToGoal(goalId, testBlob('photo-bytes', 'image/png'))

  const taskId = await addStandaloneTask('Plan trip', 'desc')
  const subtaskId = await addSubtask(taskId, 'Book flights')
  await separateSubtask(subtaskId)

  await saveWishlistName('Holiday list')
  const itemId = await addCustomWishlistItem('Custom wish')
  await updateWishlistItem(itemId, { customBlob: testBlob('wish-bytes', 'image/png') })

  await saveWishMap(createEmptyZones(), '4:5')

  return { goalId, taskId, subtaskId, itemId }
}

describe('exportBackupZip', () => {
  it('produces a zip Blob and reports progress up to the blob-unit count', async () => {
    await seedFullLibrary()

    const progressEvents: BackupProgress[] = []
    const blob = await exportBackupZip((progress) => progressEvents.push(progress))

    expect(blob.size).toBeGreaterThan(0)
    const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
    expect([...head]).toEqual([0x50, 0x4b, 0x03, 0x04]) // "PK\x03\x04" zip signature

    // One image (blob + mocked thumbBlob) + one wishlist item customBlob = 3 blob units.
    expect(progressEvents.length).toBeGreaterThan(0)
    const last = progressEvents[progressEvents.length - 1]
    expect(last.total).toBe(3)
    expect(last.processed).toBe(3)
  })
})

describe('importBackupAny (zip format)', () => {
  it('replaces existing data and restores goals, images, tasks, subtasks, wishlist and wish map', async () => {
    const { goalId, taskId, itemId } = await seedFullLibrary()

    const zipBlob = await exportBackupZip()
    const file = new File([zipBlob], 'backup.zip', { type: 'application/zip' })

    // Simulate a different/dirty state on the device before restoring — import must replace it.
    await db.goals.clear()
    await addGoal('Should be wiped out', '')

    const progressEvents: BackupProgress[] = []
    await importBackupAny(file, (progress) => progressEvents.push(progress))

    expect(progressEvents[progressEvents.length - 1]).toEqual({ processed: 3, total: 3 })

    const goals = await db.goals.toArray()
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBe(goalId)
    expect(goals[0].title).toBe('Marathon')

    // Not asserting on the restored blob's content/type here: fake-indexeddb clones stored
    // values with Node's structuredClone, which degrades a *jsdom* Blob (what resolveManifestBlob
    // constructs) into an empty placeholder on read-back — a test-environment-only quirk (see the
    // testBlob() comment above), not something that happens with real browser IndexedDB.
    const images = await db.images.toArray()
    expect(images).toHaveLength(1)
    expect(images[0].goalId).toBe(goalId)

    // addGoal mirrors itself into a goal-linked task (see taskRepo.createTaskForGoal), so two
    // task rows are expected here: the goal's own mirror plus the standalone task added below.
    const tasks = await db.tasks.toArray()
    expect(tasks).toHaveLength(2)
    expect(tasks.map((t) => t.id)).toEqual(expect.arrayContaining([taskId]))

    const subtasks = await db.subtasks.toArray()
    expect(subtasks).toHaveLength(1)
    expect(subtasks[0].taskId).toBe(taskId)
    expect(subtasks[0].separated).toBe(true)

    const wishlist = await db.wishlist.toArray()
    expect(wishlist[0].name).toBe('Holiday list')

    const wishlistItems = await db.wishlistItems.toArray()
    expect(wishlistItems).toHaveLength(1)
    expect(wishlistItems[0].id).toBe(itemId)

    const wishMaps = await db.wishMap.toArray()
    expect(wishMaps).toHaveLength(1)
    expect(wishMaps[0].aspectRatio).toBe('4:5')
  })

  it('rejects a zip whose manifest version is incompatible', async () => {
    const { Zip, ZipPassThrough } = await import('fflate')
    const chunks: Uint8Array[] = []
    const zip = new Zip((err, chunk) => {
      if (err) throw err
      chunks.push(chunk)
    })
    const entry = new ZipPassThrough('manifest.json')
    zip.add(entry)
    entry.push(new TextEncoder().encode(JSON.stringify({ version: 999, blobUnitCount: 0 })), true)
    zip.end()

    const file = new File(chunks as BlobPart[], 'backup.zip', { type: 'application/zip' })
    await expect(importBackupAny(file)).rejects.toThrow()
  })
})

describe('importBackupAny (legacy inline-base64 JSON fallback)', () => {
  it('still imports a pre-zip (version 1) backup file', async () => {
    const goalId = await addGoal('Old format goal', 'desc')
    await addImageToGoal(goalId, testBlob('legacy-photo', 'image/png'))

    // Hand-build a v1 backup the way the old exportBackup() used to, before the zip format —
    // confirms backups made before this change still restore correctly.
    const images = await db.images.toArray()
    const legacyBackup = {
      version: 1,
      goals: await db.goals.toArray(),
      images: await Promise.all(
        images.map(async ({ blob, thumbBlob, ...rest }) => ({
          ...rest,
          blob: await blobToDataUrl(blob),
          thumbBlob: thumbBlob ? await blobToDataUrl(thumbBlob) : undefined,
        })),
      ),
      wishMap: [],
      wishlist: [],
      wishlistItems: [],
      tasks: await db.tasks.toArray(),
      subtasks: [],
    }
    const file = new File([JSON.stringify(legacyBackup)], 'backup.json', { type: 'application/json' })

    await db.goals.clear()
    await addGoal('Should be wiped out', '')

    await importBackupAny(file)

    const goals = await db.goals.toArray()
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBe(goalId)
    expect(goals[0].title).toBe('Old format goal')

    const restoredImages = await db.images.toArray()
    expect(restoredImages).toHaveLength(1)
    expect(restoredImages[0].goalId).toBe(goalId)
  })

  it('rejects a legacy file with an incompatible version', async () => {
    const file = new File([JSON.stringify({ version: 999 })], 'backup.json', { type: 'application/json' })
    await expect(importBackupAny(file)).rejects.toThrow()
  })
})
