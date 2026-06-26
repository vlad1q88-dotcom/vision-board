import type { WishMapZoneState, WishMapZones } from '../types'

export interface ZoneDefinition {
  key: string
  label: string
  allowDirectUpload?: boolean
}

// 3x3 layout, row by row (top-left → bottom-right).
export const WISH_MAP_ZONES: ZoneDefinition[] = [
  { key: 'creativity', label: 'Дети / Творчество' },
  { key: 'self', label: 'Я / состояние' },
  { key: 'health', label: 'Здоровье и тело' },
  { key: 'environment', label: 'Окружение и влияние' },
  { key: 'center', label: 'Фото себя', allowDirectUpload: true },
  { key: 'career', label: 'Деньги и карьера' },
  { key: 'family', label: 'Отношения / семья' },
  { key: 'leisure', label: 'Отдых и впечатления' },
  { key: 'knowledge', label: 'Знания / саморазвитие' },
]

export interface FontOption {
  value: string
  label: string
}

// Web-safe stacks plus the designer fonts registered in src/styles/wishMapFonts.css. To add
// another: drop the file in src/assets/fonts, register its @font-face there, and add an entry
// here — the picker needs no other changes.
export const FONT_OPTIONS: FontOption[] = [
  { value: 'var(--font-sans)', label: 'Обычный' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Классический' },
  { value: '"Brush Script MT", cursive', label: 'Рукописный' },
  { value: '"Anonymous Pro", monospace', label: 'Anonymous Pro' },
  { value: '"Detstvo", sans-serif', label: 'Detstvo' },
  { value: '"Dikoe Disko", sans-serif', label: 'Dikoe Disko' },
  { value: '"Dudka", sans-serif', label: 'Dudka' },
  { value: '"Dudka Thin", sans-serif', label: 'Dudka Thin' },
  { value: '"Ekaterina Velikaya Two", cursive', label: 'Ekaterina Velikaya Two' },
  { value: '"Felidae", sans-serif', label: 'Felidae' },
  { value: '"Horovod", sans-serif', label: 'Horovod' },
  { value: '"Inter", sans-serif', label: 'Inter' },
  { value: '"Inter Italic", sans-serif', label: 'Inter Italic' },
  { value: '"Kosmos129", sans-serif', label: 'Kosmos129' },
  { value: '"Kosolapa Script", cursive', label: 'Kosolapa Script' },
  { value: '"LUNNA", sans-serif', label: 'LUNNA' },
  { value: '"Lena", cursive', label: 'Lena' },
  { value: '"Lionelofparis", cursive', label: 'Lionelofparis' },
  { value: '"Manrope", sans-serif', label: 'Manrope' },
  { value: '"Optima Cyr", sans-serif', label: 'Optima Cyr' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"Playfair Display Italic", serif', label: 'Playfair Display Italic' },
  { value: '"Playfair Display Variable", serif', label: 'Playfair Display Variable' },
  {
    value: '"Playfair Display Italic Variable", serif',
    label: 'Playfair Display Italic Variable',
  },
  { value: '"Pribambas", sans-serif', label: 'Pribambas' },
  { value: '"Risha Neo", cursive', label: 'Risha Neo' },
  { value: '"Singfried", sans-serif', label: 'Singfried' },
  { value: '"TikTok Sans", sans-serif', label: 'TikTok Sans' },
  { value: '"Wimsic Mudreza 1", cursive', label: 'Wimsic Mudreza 1' },
  { value: '"Young Love ES", cursive', label: 'Young Love ES' },
  { value: '"Denistina EN", cursive', label: 'Denistina EN' },
]

export interface AspectRatioOption {
  value: string
  label: string
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { value: '16/9', label: '16:9 (Full HD)' },
  { value: '16/10', label: '16:10' },
  { value: '21/9', label: '21:9 (Ultrawide)' },
  { value: '4/3', label: '4:3' },
  { value: '9/16', label: '9:16 (вертикальный)' },
]

export const DEFAULT_ASPECT_RATIO = ASPECT_RATIO_OPTIONS[0].value
export const DEFAULT_FONT = FONT_OPTIONS[0].value
export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 72
export const DEFAULT_FONT_SIZE = MIN_FONT_SIZE
export const MIN_LINE_HEIGHT = 1
export const MAX_LINE_HEIGHT = 3.6
// Decorative/script fonts can have tall ascenders or flourishes that a tighter line-height would
// clip off (see WishMapZoneCell.module.css), so default a bit looser than typical body text.
export const DEFAULT_LINE_HEIGHT = 2.6
export const DEFAULT_OPACITY = 1
export const DEFAULT_POSITION = { x: 50, y: 50 }
export const MIN_PHOTO_SCALE = 1
export const MAX_PHOTO_SCALE = 3
export const DEFAULT_PHOTO_POSITION = { x: 50, y: 50 }
// object-fit: cover leaves zero crop slack in whichever axis already matches the cell exactly —
// at scale 1 that axis can't be panned at all. Starting slightly zoomed in guarantees some
// pannable room on both axes regardless of the uploaded photo's aspect ratio.
export const DEFAULT_PHOTO_SCALE = 1.2

function createEmptyZoneState(): WishMapZoneState {
  return {
    text: '',
    fontFamily: DEFAULT_FONT,
    fontSize: DEFAULT_FONT_SIZE,
    lineHeight: DEFAULT_LINE_HEIGHT,
    opacity: DEFAULT_OPACITY,
    x: DEFAULT_POSITION.x,
    y: DEFAULT_POSITION.y,
    photoX: DEFAULT_PHOTO_POSITION.x,
    photoY: DEFAULT_PHOTO_POSITION.y,
    photoScale: DEFAULT_PHOTO_SCALE,
  }
}

export function createEmptyZones(): WishMapZones {
  const zones: WishMapZones = {}
  for (const zone of WISH_MAP_ZONES) {
    zones[zone.key] = createEmptyZoneState()
  }
  return zones
}
