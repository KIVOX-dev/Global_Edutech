import type { CSSProperties } from 'react'

const FADE = 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 0%, black 90%, transparent 97%)'

// Makes a picture with its own off-white backdrop sit cleanly on a white card.
// The grey-dotted Global Academy graphic also gets its cut-off edges faded out.
export function blendStyle(src: string): CSSProperties {
  const style: CSSProperties = { mixBlendMode: 'multiply', filter: 'brightness(1.06) contrast(1.1)' }
  if (src.includes('globalacademy-all')) {
    Object.assign(style, { WebkitMaskImage: FADE, maskImage: FADE, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' })
  }
  return style
}
