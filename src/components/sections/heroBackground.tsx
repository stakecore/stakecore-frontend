import { useSyncExternalStore } from 'react'
import HeroRuneCanvas from './heroRuneCanvas'
import HeroRuneShimmer from './heroRuneShimmer'


// Exactly t.down(md) from _tokens.scss. A rounded 768px would leave a 0.02px
// band where the stylesheet has switched to the mobile layout and this has not.
const MOBILE_QUERY = '(max-width: 767.98px)'

// matchMedia is guarded the same way the rest of the codebase guards it, and
// resolved per call rather than cached at module scope — a throw during module
// evaluation is the blank-page-before-React case.
const mediaQuery = () => window.matchMedia?.(MOBILE_QUERY) ?? null

const subscribe = (onChange: () => void) => {
  const mql = mediaQuery()
  if (mql == null) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const isMobile = () => mediaQuery()?.matches ?? false

/**
 * Picks the hero background by breakpoint.
 *
 * Mounting one or the other, rather than branching inside a single component,
 * is the whole point: a phone must never construct the WebGL2 context. Context
 * creation, two shader compiles, a program link and a glyph-atlas rasterization
 * are a fixed cost that no amount of per-frame tuning removes — and below md
 * they buy a field that is unreadable anyway.
 */
const HeroBackground = () => {
  const mobile = useSyncExternalStore(subscribe, isMobile)
  return mobile ? <HeroRuneShimmer /> : <HeroRuneCanvas />
}

export default HeroBackground
