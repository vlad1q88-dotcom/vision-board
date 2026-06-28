interface PlusIconProps {
  size?: number
}

// A literal "+" text glyph sits off-center in most fonts (its ink isn't centered within the
// font's own line-box metrics), so circular add-buttons drawn with text never look perfectly
// centered no matter how the button itself is centered. An SVG cross is centered by
// construction (two strokes through the same viewBox midpoint), independent of font metrics.
export function PlusIcon({ size = 16 }: PlusIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}
