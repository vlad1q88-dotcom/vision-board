import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
// jsPDF's built-in fonts (Helvetica etc.) only cover WinAnsi/Latin glyphs — Cyrillic text comes
// out as mojibake unless a Unicode-capable font is embedded. Inter's bundled variable font (also
// used by the wish map) includes full Cyrillic coverage and renders correctly once registered.
import interFontUrl from '../assets/fonts/Inter-VariableFont_opsz,wght.ttf'
import { DEFAULT_PHOTO_POSITION, DEFAULT_PHOTO_SCALE } from '../db/wishMapZones'
import { computePhotoCrop, WISHLIST_PHOTO_BOX_HEIGHT_MM, WISHLIST_PHOTO_BOX_WIDTH_MM } from './photoCrop'
import type { ImageWithGoal, WishlistItemWithGoal } from '../types'

export type WishlistPdfTheme = 'light' | 'dark'

const PDF_FONT = 'Inter'
const PHOTO_CELL_PAD_MM = 1

// Render at a resolution proportional to the fixed photo box rather than the source photo's own
// size — every item's photo ends up the exact same pixel footprint before going into the PDF.
const RENDER_WIDTH_PX = 480
const RENDER_HEIGHT_PX = Math.round(RENDER_WIDTH_PX * (WISHLIST_PHOTO_BOX_HEIGHT_MM / WISHLIST_PHOTO_BOX_WIDTH_MM))

type Rgb = [number, number, number]

// Mirrors src/styles/variables.css — the PDF reuses the same two palettes the app itself uses
// for light/dark mode, rather than inventing separate colors just for the export.
const PDF_PALETTES: Record<WishlistPdfTheme, { bg: Rgb; surface: Rgb; text: Rgb; border: Rgb; add: Rgb }> = {
  light: {
    bg: [255, 255, 255],
    surface: [247, 247, 245],
    text: [55, 53, 47],
    border: [233, 233, 231],
    add: [201, 124, 67],
  },
  dark: {
    bg: [25, 25, 25],
    surface: [32, 32, 32],
    text: [233, 233, 231],
    border: [47, 47, 47],
    add: [209, 143, 92],
  },
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function registerCyrillicFont(doc: jsPDF): Promise<void> {
  const response = await fetch(interFontUrl)
  const buffer = await response.arrayBuffer()
  const base64 = arrayBufferToBase64(buffer)
  doc.addFileToVFS('Inter-Regular.ttf', base64)
  doc.addFont('Inter-Regular.ttf', PDF_FONT, 'normal')
  doc.setFont(PDF_FONT)
}

// Crops/pans the photo exactly like the wishlist item editor's live preview (same math, see
// photoCrop.ts) so the framing the user chose is what ends up in the PDF — not a plain center crop.
async function renderCroppedPhotoDataUrl(
  blob: Blob,
  photoX: number,
  photoY: number,
  photoScale: number,
): Promise<string> {
  const bitmap = await createImageBitmap(blob)
  const crop = computePhotoCrop({
    naturalWidth: bitmap.width,
    naturalHeight: bitmap.height,
    boxWidth: RENDER_WIDTH_PX,
    boxHeight: RENDER_HEIGHT_PX,
    photoX,
    photoY,
    photoScale,
  })

  const canvas = document.createElement('canvas')
  canvas.width = RENDER_WIDTH_PX
  canvas.height = RENDER_HEIGHT_PX
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  // Canvas clips anything outside [0,width]x[0,height] automatically, same as the editor's
  // overflow:hidden box — drawing the whole bitmap at its computed rendered size/offset crops it.
  ctx.drawImage(bitmap, crop.left, crop.top, crop.renderedWidth, crop.renderedHeight)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', 0.85)
}

function descriptionWithLink(description: string | undefined, link: string | undefined): string {
  const text = description?.trim() ?? ''
  if (!link) return text
  return text ? `${text}. Ссылка: ${link}` : `Ссылка: ${link}`
}

export async function exportWishlistPdf(
  wishlistName: string,
  items: WishlistItemWithGoal[],
  images: ImageWithGoal[],
  theme: WishlistPdfTheme,
): Promise<Blob> {
  const palette = PDF_PALETTES[theme]
  const doc = new jsPDF()
  await registerCyrillicFont(doc)

  // jsPDF pages default to a plain white background — for the dark palette that has to be
  // painted in explicitly, and repainted on every later page autoTable adds for a long wishlist.
  // autoTable's willDrawPage hook fires before that page's own content, so painting there (and
  // re-painting the title on page 1) keeps the fill from ever covering up content drawn on top.
  function paintPage(pageNumber: number) {
    if (theme === 'dark') {
      doc.setFillColor(...palette.bg)
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F')
    }
    doc.setTextColor(...palette.text)
    if (pageNumber === 1 && wishlistName) doc.text(wishlistName, 14, 15)
  }

  paintPage(1)

  const titleHeader = 'Желание'
  // autoTable's default cellPadding (~1.76mm/side) plus a small safety margin — measuring the
  // header word itself at the same font/size autoTable renders it with (rather than a hardcoded
  // mm guess) keeps the floor correct even if the label, font, or font size ever changes.
  doc.setFont(PDF_FONT, 'normal')
  doc.setFontSize(10)
  const titleColumnMinWidth = doc.getTextWidth(titleHeader) + 4

  // autoTable's didDrawCell hook is synchronous, so every photo must already be a dataURL
  // before the table is built — resolve them all up front, indexed by row.
  const photos = await Promise.all(
    items.map(async (item) => {
      const blob = item.customBlob ?? images.find((image) => image.id === item.imageId)?.blob
      if (!blob) return null
      return renderCroppedPhotoDataUrl(
        blob,
        item.photoX ?? DEFAULT_PHOTO_POSITION.x,
        item.photoY ?? DEFAULT_PHOTO_POSITION.y,
        item.photoScale ?? DEFAULT_PHOTO_SCALE,
      )
    }),
  )

  autoTable(doc, {
    startY: wishlistName ? 22 : 14,
    head: [[titleHeader, 'Фото', 'Описание и ссылка']],
    body: items.map((item) => [item.displayTitle, '', descriptionWithLink(item.description, item.link)]),
    theme: 'plain',
    // Only the "normal" style of the Cyrillic font is registered — force every cell (including
    // the head row, which autoTable bolds by default) to stick to it instead of falling back to
    // a built-in bold font that can't render Cyrillic. Colors reuse the app's own light/dark
    // tokens (see PDF_PALETTES) rather than autoTable's default blue theme.
    styles: {
      font: PDF_FONT,
      fontStyle: 'normal',
      fontSize: 10,
      textColor: palette.text,
      lineColor: palette.border,
      lineWidth: 0.1,
    },
    headStyles: { font: PDF_FONT, fontStyle: 'normal', fillColor: palette.add, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: palette.surface },
    // "Желание" auto-sizes to its content but never shrinks narrower than the header word itself.
    // "Фото" is a hard fixed size — every photo ends up the exact same footprint regardless of
    // its source resolution/aspect. "Описание и ссылка" absorbs whatever width is left over.
    columnStyles: {
      0: { cellWidth: 'auto', minCellWidth: titleColumnMinWidth },
      1: { cellWidth: WISHLIST_PHOTO_BOX_WIDTH_MM, minCellHeight: WISHLIST_PHOTO_BOX_HEIGHT_MM },
      2: { cellWidth: 'auto' },
    },
    willDrawPage: (data) => paintPage(data.pageNumber),
    didDrawCell: (data) => {
      if (data.section !== 'body') return
      if (data.column.index === 1) {
        const dataUrl = photos[data.row.index]
        if (!dataUrl) return
        // Fixed draw size (not data.cell.width/height) — if the row grew taller than the photo
        // box because of a long description, the photo still renders at its normal size, top-
        // aligned in the cell, rather than stretching to fill the extra height.
        doc.addImage(
          dataUrl,
          'JPEG',
          data.cell.x + PHOTO_CELL_PAD_MM,
          data.cell.y + PHOTO_CELL_PAD_MM,
          WISHLIST_PHOTO_BOX_WIDTH_MM - PHOTO_CELL_PAD_MM * 2,
          WISHLIST_PHOTO_BOX_HEIGHT_MM - PHOTO_CELL_PAD_MM * 2,
        )
      }
      if (data.column.index === 2) {
        // The cell only ever contains plain text (no rich runs), so there's no per-character
        // position to target precisely — linking the whole cell is what keeps the link reliably
        // clickable without trying to re-measure where "Ссылка: …" happens to wrap to.
        const item = items[data.row.index]
        if (item.link) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: item.link })
      }
    },
  })

  return doc.output('blob')
}
