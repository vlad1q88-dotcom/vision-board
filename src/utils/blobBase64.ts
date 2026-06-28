// Avoids FileReader.readAsDataURL on purpose: jsdom's FileReader does a strict brand-check on
// its `blob` argument, which fails for Blobs that round-tripped through fake-indexeddb in tests
// (they come back as Node's native Blob, not jsdom's). Working off blob.arrayBuffer() + btoa/atob
// sidesteps that check entirely and behaves identically in real browsers and under jsdom.
const CHUNK_SIZE = 0x8000 // keeps String.fromCharCode's argument count safely below engine limits

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE))
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return `data:${blob.type};base64,${bytesToBase64(bytes)}`
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [header, base64] = dataUrl.split(',')
  const type = header.slice(header.indexOf(':') + 1, header.indexOf(';'))
  return new Blob([base64ToBytes(base64).buffer as ArrayBuffer], { type })
}
