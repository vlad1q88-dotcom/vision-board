import html2canvas from 'html2canvas'

// Desktop/phone wallpapers are commonly sold by their longer edge (e.g. 4K = 3840px) regardless
// of orientation, so size the export off whichever edge is longer rather than a fixed width/height.
const TARGET_LONG_EDGE = 3840

export async function exportWishMapImage(element: HTMLElement): Promise<Blob> {
  await document.fonts.ready
  const rect = element.getBoundingClientRect()
  const scale = rect.width >= rect.height ? TARGET_LONG_EDGE / rect.width : TARGET_LONG_EDGE / rect.height
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#000000',
    useCORS: true,
    // Empty zones still show their "pick a photo" placeholder UI on screen — that's editor
    // chrome, not part of the finished map, so it shouldn't end up baked into the wallpaper.
    ignoreElements: (el) => el.hasAttribute('data-wishmap-export-ignore'),
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Не удалось сформировать изображение'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
