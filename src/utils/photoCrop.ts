// Fixed photo box for the wishlist: same footprint in the item editor's preview and in the PDF's
// "Фото" table cell, so what the user frames while editing is exactly what ends up in the export.
export const WISHLIST_PHOTO_BOX_WIDTH_MM = 32
export const WISHLIST_PHOTO_BOX_HEIGHT_MM = 28

// Shared cover+pan math used wherever a photo is shown panned/zoomed inside a fixed box — the
// wish map's own zone cells implement this inline (see WishMapZoneCell.tsx), this is the same
// formula factored out so the wishlist's photo editor and its PDF export render identical crops.
export interface PhotoCropInputs {
  naturalWidth: number
  naturalHeight: number
  boxWidth: number
  boxHeight: number
  // 0-100, 50 = centered, same convention as WishMapZoneState.photoX/photoY.
  photoX: number
  photoY: number
  photoScale: number
}

export interface PhotoCropResult {
  renderedWidth: number
  renderedHeight: number
  left: number
  top: number
}

export function computePhotoCrop(inputs: PhotoCropInputs): PhotoCropResult {
  const { naturalWidth, naturalHeight, boxWidth, boxHeight, photoX, photoY, photoScale } = inputs
  if (naturalWidth <= 0 || naturalHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
    return { renderedWidth: 0, renderedHeight: 0, left: 0, top: 0 }
  }
  const coverScale = Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight)
  const renderedWidth = naturalWidth * coverScale * photoScale
  const renderedHeight = naturalHeight * coverScale * photoScale
  const marginX = Math.max(0, (renderedWidth - boxWidth) / 2)
  const marginY = Math.max(0, (renderedHeight - boxHeight) / 2)
  const panX = ((photoX - 50) / 50) * marginX
  const panY = ((photoY - 50) / 50) * marginY
  const left = (boxWidth - renderedWidth) / 2 + panX
  const top = (boxHeight - renderedHeight) / 2 + panY
  return { renderedWidth, renderedHeight, left, top }
}
