import { FONT_OPTIONS } from '../db/wishMapZones'
import styles from './FontPopover.module.css'

interface FontPopoverProps {
  fontFamily: string
  opacity: number
  onChangeFont: (font: string) => void
  onChangeOpacity: (opacity: number) => void
}

export function FontPopover({ fontFamily, opacity, onChangeFont, onChangeOpacity }: FontPopoverProps) {
  return (
    <div className={styles.popover} onClick={(event) => event.stopPropagation()}>
      <div className={styles.optionList}>
        {FONT_OPTIONS.map((font) => (
          <button
            key={font.value}
            type="button"
            className={font.value === fontFamily ? styles.optionActive : styles.option}
            style={{ fontFamily: font.value }}
            onClick={() => onChangeFont(font.value)}
          >
            {font.label}
          </button>
        ))}
      </div>
      <div className={styles.opacityRow}>
        <span className={styles.opacityLabel}>Прозрачность</span>
        <input
          type="range"
          className={styles.opacitySlider}
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          style={{ opacity }}
          onChange={(event) => onChangeOpacity(Number(event.target.value))}
        />
      </div>
    </div>
  )
}
