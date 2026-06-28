import { Unzip, UnzipPassThrough, Zip, ZipPassThrough } from 'fflate'
import { db } from './db'
import { dataUrlToBlob } from '../utils/blobBase64'
import type {
  Goal,
  ImageRecord,
  Subtask,
  Task,
  WishMap,
  WishMapZoneState,
  WishMapZones,
  Wishlist,
  WishlistItem,
} from '../types'

export interface BackupProgress {
  processed: number
  total: number
}

export type ProgressCallback = (progress: BackupProgress) => void

interface ResolvedBackupRows {
  goals: Goal[]
  images: ImageRecord[]
  wishMap: WishMap[]
  wishlist: Wishlist[]
  wishlistItems: WishlistItem[]
  tasks: Task[]
  subtasks: Subtask[]
}

async function applyResolvedRows(rows: ResolvedBackupRows): Promise<void> {
  await db.transaction(
    'rw',
    [db.goals, db.images, db.wishMap, db.wishlist, db.wishlistItems, db.tasks, db.subtasks],
    async () => {
      await Promise.all([
        db.goals.clear(),
        db.images.clear(),
        db.wishMap.clear(),
        db.wishlist.clear(),
        db.wishlistItems.clear(),
        db.tasks.clear(),
        db.subtasks.clear(),
      ])
      await Promise.all([
        db.goals.bulkAdd(rows.goals),
        db.images.bulkAdd(rows.images),
        db.wishMap.bulkAdd(rows.wishMap),
        db.wishlist.bulkAdd(rows.wishlist),
        db.wishlistItems.bulkAdd(rows.wishlistItems),
        db.tasks.bulkAdd(rows.tasks),
        db.subtasks.bulkAdd(rows.subtasks),
      ])
    },
  )
}

// ============================================================================
// v1 — legacy inline-base64 JSON format. No longer produced by exportBackupZip,
// kept only so backups made before the zip format existed still import correctly.
// ============================================================================

const LEGACY_VERSION = 1

type LegacySerializedImage = Omit<ImageRecord, 'blob' | 'thumbBlob'> & { blob: string; thumbBlob?: string }
type LegacySerializedZone = Omit<WishMapZoneState, 'customBlob'> & { customBlob?: string }
type LegacySerializedWishMap = Omit<WishMap, 'zones'> & { zones: Record<string, LegacySerializedZone> }
type LegacySerializedWishlistItem = Omit<WishlistItem, 'customBlob'> & { customBlob?: string }

interface LegacyBackupFile {
  version: number
  goals: Goal[]
  images: LegacySerializedImage[]
  wishMap: LegacySerializedWishMap[]
  wishlist: Wishlist[]
  wishlistItems: LegacySerializedWishlistItem[]
  tasks: Task[]
  subtasks: Subtask[]
}

async function deserializeLegacyZones(zones: Record<string, LegacySerializedZone>): Promise<WishMapZones> {
  const entries = await Promise.all(
    Object.entries(zones).map(async ([key, zone]) => {
      const { customBlob, ...rest } = zone
      const deserialized: WishMapZoneState = { ...rest }
      if (customBlob) deserialized.customBlob = await dataUrlToBlob(customBlob)
      return [key, deserialized] as const
    }),
  )
  return Object.fromEntries(entries)
}

async function importBackupLegacyJson(file: File): Promise<void> {
  const backup = JSON.parse(await file.text()) as LegacyBackupFile
  if (backup.version !== LEGACY_VERSION) {
    throw new Error('Файл резервной копии несовместим с текущей версией приложения')
  }

  const images: ImageRecord[] = await Promise.all(
    backup.images.map(async ({ blob, thumbBlob, ...rest }) => ({
      ...rest,
      blob: await dataUrlToBlob(blob),
      thumbBlob: thumbBlob ? await dataUrlToBlob(thumbBlob) : undefined,
    })),
  )

  const wishMaps: WishMap[] = await Promise.all(
    backup.wishMap.map(async (map) => ({ ...map, zones: await deserializeLegacyZones(map.zones) })),
  )

  const wishlistItems: WishlistItem[] = await Promise.all(
    backup.wishlistItems.map(async ({ customBlob, ...rest }) => ({
      ...rest,
      customBlob: customBlob ? await dataUrlToBlob(customBlob) : undefined,
    })),
  )

  await applyResolvedRows({
    goals: backup.goals,
    images,
    wishMap: wishMaps,
    wishlist: backup.wishlist,
    wishlistItems,
    tasks: backup.tasks,
    subtasks: backup.subtasks,
  })
}

// ============================================================================
// v2 — streaming ZIP format. Blob fields are filenames inside the archive (plus
// a sibling *Type field carrying the original mime, since a zip entry's bytes
// carry no mime metadata of their own) instead of inline base64.
// ============================================================================

const ZIP_VERSION = 2
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04] // "PK\x03\x04"

type ManifestImage = Omit<ImageRecord, 'blob' | 'thumbBlob'> & {
  blob: string
  blobType: string
  thumbBlob?: string
  thumbBlobType?: string
}
type ManifestZone = Omit<WishMapZoneState, 'customBlob'> & { customBlob?: string; customBlobType?: string }
type ManifestWishMap = Omit<WishMap, 'zones'> & { zones: Record<string, ManifestZone> }
type ManifestWishlistItem = Omit<WishlistItem, 'customBlob'> & { customBlob?: string; customBlobType?: string }

interface Manifest {
  version: number
  exportedAt: number
  blobUnitCount: number
  goals: Goal[]
  images: ManifestImage[]
  wishMap: ManifestWishMap[]
  wishlist: Wishlist[]
  wishlistItems: ManifestWishlistItem[]
  tasks: Task[]
  subtasks: Subtask[]
}

interface BlobUnit {
  filename: string
  blob: Blob
}

function buildManifest(
  goals: Goal[],
  images: ImageRecord[],
  wishMaps: WishMap[],
  wishlist: Wishlist[],
  wishlistItems: WishlistItem[],
  tasks: Task[],
  subtasks: Subtask[],
): { manifest: Manifest; blobUnits: BlobUnit[] } {
  const blobUnits: BlobUnit[] = []

  const manifestImages: ManifestImage[] = images.map((image) => {
    const { blob, thumbBlob, ...rest } = image
    const blobFilename = `images/${image.id}.bin`
    blobUnits.push({ filename: blobFilename, blob })
    let thumbFilename: string | undefined
    if (thumbBlob) {
      thumbFilename = `images/${image.id}-thumb.bin`
      blobUnits.push({ filename: thumbFilename, blob: thumbBlob })
    }
    return {
      ...rest,
      blob: blobFilename,
      blobType: blob.type,
      thumbBlob: thumbFilename,
      thumbBlobType: thumbBlob?.type,
    }
  })

  const manifestWishMap: ManifestWishMap[] = wishMaps.map((map) => {
    const zones: Record<string, ManifestZone> = {}
    for (const [key, zone] of Object.entries(map.zones)) {
      const { customBlob, ...zoneRest } = zone
      if (customBlob) {
        const filename = `wishmap/${map.id}-${key}.bin`
        blobUnits.push({ filename, blob: customBlob })
        zones[key] = { ...zoneRest, customBlob: filename, customBlobType: customBlob.type }
      } else {
        zones[key] = { ...zoneRest }
      }
    }
    return { ...map, zones }
  })

  const manifestWishlistItems: ManifestWishlistItem[] = wishlistItems.map((item) => {
    const { customBlob, ...rest } = item
    if (!customBlob) return { ...rest }
    const filename = `wishlist/${item.id}.bin`
    blobUnits.push({ filename, blob: customBlob })
    return { ...rest, customBlob: filename, customBlobType: customBlob.type }
  })

  const manifest: Manifest = {
    version: ZIP_VERSION,
    exportedAt: Date.now(),
    blobUnitCount: blobUnits.length,
    goals,
    images: manifestImages,
    wishMap: manifestWishMap,
    wishlist,
    wishlistItems: manifestWishlistItems,
    tasks,
    subtasks,
  }

  return { manifest, blobUnits }
}

export async function exportBackupZip(onProgress?: ProgressCallback): Promise<Blob> {
  const [goals, images, wishMaps, wishlist, wishlistItems, tasks, subtasks] = await Promise.all([
    db.goals.toArray(),
    db.images.toArray(),
    db.wishMap.toArray(),
    db.wishlist.toArray(),
    db.wishlistItems.toArray(),
    db.tasks.toArray(),
    db.subtasks.toArray(),
  ])

  const { manifest, blobUnits } = buildManifest(goals, images, wishMaps, wishlist, wishlistItems, tasks, subtasks)

  const chunks: Uint8Array[] = []
  const zip = new Zip((err, chunk) => {
    if (err) throw err
    chunks.push(chunk)
  })

  // manifest.json goes first so the importer knows blobUnitCount before it has to process
  // a single photo entry — that's what makes import-side progress reporting possible.
  const manifestEntry = new ZipPassThrough('manifest.json')
  zip.add(manifestEntry)
  manifestEntry.push(new TextEncoder().encode(JSON.stringify(manifest)), true)

  const total = blobUnits.length
  onProgress?.({ processed: 0, total })
  for (let i = 0; i < total; i++) {
    const { filename, blob } = blobUnits[i]
    const entry = new ZipPassThrough(filename) // store, no recompression — photos are already JPEG/HEIC
    zip.add(entry)
    entry.push(new Uint8Array(await blob.arrayBuffer()), true)
    onProgress?.({ processed: i + 1, total })
  }

  zip.end()
  return new Blob(chunks as BlobPart[])
}

function concatChunks(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(size)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

async function* readFileChunks(file: File, chunkSize = 1 << 20): AsyncGenerator<Uint8Array> {
  if (typeof file.stream === 'function') {
    const reader = file.stream().getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      yield value
    }
  } else {
    // jsdom's Blob/File doesn't implement .stream() (real browsers always do) — fall back to
    // reading the whole file at once and re-chunking it. This path only runs under tests, where
    // fixture files are tiny, so it doesn't compromise the streaming behavior production relies on.
    const buffer = new Uint8Array(await file.arrayBuffer())
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      yield buffer.subarray(offset, offset + chunkSize)
    }
  }
}

async function readZipEntries(
  file: File,
  onProgress?: ProgressCallback,
): Promise<{ manifest: Manifest; blobsByFilename: Map<string, Blob> }> {
  const blobsByFilename = new Map<string, Blob>()
  let manifest: Manifest | undefined
  let total = 0
  let processed = 0

  const unzipper = new Unzip()
  unzipper.register(UnzipPassThrough)

  unzipper.onfile = (entry) => {
    const parts: Uint8Array[] = []
    entry.ondata = (err, chunk, final) => {
      if (err) throw err
      parts.push(chunk)
      if (!final) return
      if (entry.name === 'manifest.json') {
        const parsed = JSON.parse(new TextDecoder().decode(concatChunks(parts))) as Manifest
        if (parsed.version !== ZIP_VERSION) {
          throw new Error('Файл резервной копии несовместим с текущей версией приложения')
        }
        manifest = parsed
        total = manifest.blobUnitCount
        onProgress?.({ processed, total })
      } else {
        blobsByFilename.set(entry.name, new Blob(parts as BlobPart[]))
        processed += 1
        onProgress?.({ processed, total })
      }
    }
    entry.start()
  }

  for await (const chunk of readFileChunks(file)) {
    unzipper.push(chunk, false)
  }
  unzipper.push(new Uint8Array(0), true)

  if (!manifest) throw new Error('Файл резервной копии повреждён: отсутствует manifest.json')
  return { manifest, blobsByFilename }
}

function resolveManifestBlob(
  blobsByFilename: Map<string, Blob>,
  filename: string | undefined,
  type: string | undefined,
): Blob | undefined {
  if (!filename) return undefined
  const raw = blobsByFilename.get(filename)
  if (!raw) throw new Error(`Файл резервной копии повреждён: отсутствует запись ${filename}`)
  return type ? new Blob([raw], { type }) : raw
}

async function importBackupZip(file: File, onProgress?: ProgressCallback): Promise<void> {
  const { manifest, blobsByFilename } = await readZipEntries(file, onProgress)

  const images: ImageRecord[] = manifest.images.map((image) => {
    const { blob, blobType, thumbBlob, thumbBlobType, ...rest } = image
    return {
      ...rest,
      blob: resolveManifestBlob(blobsByFilename, blob, blobType)!,
      thumbBlob: resolveManifestBlob(blobsByFilename, thumbBlob, thumbBlobType),
    }
  })

  const wishMaps: WishMap[] = manifest.wishMap.map((map) => {
    const zones: WishMapZones = {}
    for (const [key, zone] of Object.entries(map.zones)) {
      const { customBlob, customBlobType, ...zoneRest } = zone
      zones[key] = { ...zoneRest, customBlob: resolveManifestBlob(blobsByFilename, customBlob, customBlobType) }
    }
    return { ...map, zones }
  })

  const wishlistItems: WishlistItem[] = manifest.wishlistItems.map((item) => {
    const { customBlob, customBlobType, ...rest } = item
    return { ...rest, customBlob: resolveManifestBlob(blobsByFilename, customBlob, customBlobType) }
  })

  await applyResolvedRows({
    goals: manifest.goals,
    images,
    wishMap: wishMaps,
    wishlist: manifest.wishlist,
    wishlistItems,
    tasks: manifest.tasks,
    subtasks: manifest.subtasks,
  })
}

async function looksLikeZip(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, ZIP_SIGNATURE.length).arrayBuffer())
  return ZIP_SIGNATURE.every((byte, index) => head[index] === byte)
}

export async function importBackupAny(file: File, onProgress?: ProgressCallback): Promise<void> {
  if (await looksLikeZip(file)) {
    await importBackupZip(file, onProgress)
  } else {
    await importBackupLegacyJson(file)
  }
}
