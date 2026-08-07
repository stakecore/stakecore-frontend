import { RUNE_FILTER_REGION_HEAVY, RUNE_PATHS, RUNE_ROUGH, RUNE_STROKE_HEAVY, RUNE_VIEWBOX_BAND } from './runeMark'


// The hero's mark on phones (< md). Static: no canvas, no effects, no state.
//
// It sits in its own band below the activity feed rather than behind the
// content. Measured on the previous design at 390x844, the hero's content
// spans y 88-663 and a centred background mark spans y 286-569 — there is no
// clear space to sit behind, because the content fills 68% of the viewport.
//
// Why a filled panel with the mark cut out of it, rather than the mark on its
// own: the mark is a line drawing, and a line drawing carries little weight at
// phone size. Inverting it moves the weight into the panel and makes the mark
// negative space, where thinness stops mattering.
//
// The "cut" is the mark painted in the page background colour, applied in CSS.
// On a #000 page that is indistinguishable from a real knockout, and it avoids
// mask-composite, whose Safari support is uneven. Revisit if the light theme
// lands.
//
// The filter id is a document-wide identifier. Only one band renders at a
// time, so a constant is safe here.
const FILTER_ID = 'hero-rune-band-rough'

const HeroRuneBand = () => (
  <div className="hero-rune-band" aria-hidden>
    <svg
      className="hero-rune-band__mark"
      viewBox={RUNE_VIEWBOX_BAND}
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
    >
      <defs>
        <filter
          id={FILTER_ID}
          x={RUNE_FILTER_REGION_HEAVY.x}
          y={RUNE_FILTER_REGION_HEAVY.y}
          width={RUNE_FILTER_REGION_HEAVY.width}
          height={RUNE_FILTER_REGION_HEAVY.height}
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={RUNE_ROUGH.baseFrequency}
            numOctaves={RUNE_ROUGH.numOctaves}
            seed={RUNE_ROUGH.seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={RUNE_ROUGH.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g strokeWidth={RUNE_STROKE_HEAVY} filter={`url(#${FILTER_ID})`}>
        {RUNE_PATHS.map(d => <path key={d} d={d} />)}
      </g>
    </svg>
  </div>
)

export default HeroRuneBand
