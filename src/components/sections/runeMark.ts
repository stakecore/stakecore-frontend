// The StakeCore mark, defined once.
//
// Two components render it, and they render it differently: heroRuneCanvas
// rasterizes it from an SVG data URI into a WebGL texture, heroRuneBand draws
// it as JSX. Both read their geometry from here. This module replaced an
// imported profile.svg for exactly that reason — an asset plus a set of inline
// paths is two definitions of one mark, and they drift silently.

/** viewBox of the mark as originally drawn. */
export const RUNE_VIEWBOX = '170 180 340 380'

/** Width / height of that viewBox. Used to size the rune texture. */
export const RUNE_ASPECT = 340 / 380

/** Stroke weight as drawn. Correct wherever the mark is a positive shape. */
export const RUNE_STROKE_NATIVE = 38

/**
 * Heavier weight, used only where the mark is a *cut* rather than a stroke —
 * there, heavier means a wider aperture. As a positive shape this overshoots:
 * the two curves merge into each other.
 */
export const RUNE_STROKE_HEAVY = 72

/** A bar across the top, and two mirrored curves sweeping in and back out. */
export const RUNE_PATHS = [
  'M 200 208 L 410 208',
  'M 200 208 C 340 295, 340 445, 200 530',
  'M 480 208 C 340 295, 340 445, 480 530',
]

/**
 * Rough-edge displacement. Load-bearing rather than decorative: without it the
 * curves go slick and the mark loses the hand-cut quality it was drawn with.
 */
export const RUNE_ROUGH = {
  baseFrequency: 0.06,
  numOctaves: 3,
  seed: 7,
  scale: 10,
}

/**
 * A complete standalone SVG document for the mark, white on transparent.
 * heroRuneCanvas encodes this into a data URI and rasterizes it; the alpha
 * channel becomes its rune mask.
 */
export function runeSvgMarkup(strokeWidth: number): string {
  return (
    `<svg viewBox="${RUNE_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs>` +
    `<filter id="r" x="-5%" y="-5%" width="110%" height="110%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${RUNE_ROUGH.baseFrequency}"` +
    ` numOctaves="${RUNE_ROUGH.numOctaves}" seed="${RUNE_ROUGH.seed}" result="noise"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${RUNE_ROUGH.scale}"` +
    ` xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>` +
    `</defs>` +
    `<g fill="none" stroke="#FFFFFF" stroke-width="${strokeWidth}"` +
    ` stroke-linecap="round" filter="url(#r)">` +
    RUNE_PATHS.map(d => `<path d="${d}"/>`).join('') +
    `</g></svg>`
  )
}
