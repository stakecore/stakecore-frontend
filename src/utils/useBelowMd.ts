import { useSyncExternalStore } from 'react'

/**
 * Exactly `t.down(md)` from `_tokens.scss`, which compiles to
 * `max-width: 768px - 0.02px`. A rounded `768px` would leave a 0.02px band
 * where the stylesheet has switched to the mobile layout and this has not.
 */
export const BELOW_MD_QUERY = '(max-width: 767.98px)'

// matchMedia is guarded the way the rest of the codebase guards it, and
// resolved per call rather than cached at module scope — a throw during module
// evaluation is the blank-page-before-React case.
const mediaQuery = () => window.matchMedia?.(BELOW_MD_QUERY) ?? null

// Module scope, so useSyncExternalStore sees a stable subscribe identity and a
// getSnapshot returning a primitive. A subscribe recreated per render causes
// resubscription churn; a snapshot returning a fresh object loops forever.
const subscribe = (onChange: () => void) => {
  const mql = mediaQuery()
  if (mql == null) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => mediaQuery()?.matches ?? false

/**
 * True below the md breakpoint.
 *
 * The hero uses this twice, because its two decorations do not share a DOM
 * position: the desktop WebGL field is an absolutely positioned background at
 * the top of the section, and the mobile mark is a band in normal flow at the
 * end of the container. Rendering one or the other — rather than branching
 * inside a single component — is also what keeps a phone from ever
 * constructing the WebGL2 context.
 */
export function useBelowMd(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
