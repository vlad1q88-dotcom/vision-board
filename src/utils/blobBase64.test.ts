import { describe, expect, it } from 'vitest'
import { blobToDataUrl, dataUrlToBlob } from './blobBase64'

describe('blobToDataUrl / dataUrlToBlob', () => {
  it('round-trips bytes and mime type through a data URL', async () => {
    const original = new Blob(['hello world'], { type: 'image/png' })

    const dataUrl = await blobToDataUrl(original)
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)

    const restored = await dataUrlToBlob(dataUrl)
    expect(restored.type).toBe('image/png')
    expect(await restored.text()).toBe('hello world')
  })

  it('handles blobs larger than one base64 chunk', async () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256)
    const original = new Blob([bytes], { type: 'application/octet-stream' })

    const restored = await dataUrlToBlob(await blobToDataUrl(original))
    const restoredBytes = new Uint8Array(await restored.arrayBuffer())

    expect(restoredBytes).toEqual(bytes)
  })
})
