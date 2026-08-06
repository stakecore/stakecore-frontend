import { type ComponentType } from "react";
import { SpinnerCircular } from "spinners-react";
import { PAGE_COLOR_CODE } from "~/constants";
import { safeSession } from "~/utils/safeStorage";

export const RELOAD_FLAG = 'stakecore:chunk-reload-attempted'

export function routeLazy<T extends ComponentType<any>>(
  path: string,
  factory: () => Promise<{ default: T }>
) {
  return async () => {
    try {
      const mod = await factory()
      safeSession.remove(RELOAD_FLAG)
      return { Component: mod.default }
    } catch (err) {
      // Two conditions, and the second is not redundant. RELOAD_FLAG is the
      // only thing stopping a permanently broken chunk from reloading
      // forever, so the reload is conditional on having actually *recorded*
      // the attempt. Where storage is unavailable (Chrome with cookies
      // blocked) the flag can never persist, and an unconditional reload
      // would fire again on every load — an infinite loop, strictly worse
      // than the failure it was trying to paper over. Falling through to
      // RouteError instead gives the user a manual Reload button.
      if (safeSession.get(RELOAD_FLAG) !== '1' && safeSession.set(RELOAD_FLAG, '1')) {
        // The data router commits the URL only *after* lazy() resolves, so
        // the hash still points at the route being left. Reloading as-is
        // would replay that page and swallow the navigation — the user
        // clicks "Songbird FSP" from Home and lands back on Home. Point the
        // hash at where they were going before handing over to the reload.
        const url = new URL(window.location.href)
        url.hash = `#${path}`
        window.history.replaceState(null, '', url)
        window.location.reload()
        return new Promise<{ Component: T }>(() => {})
      }
      throw err
    }
  }
}

// Rendered by the data router during its initial hydration pass while the
// first-matched lazy route chunk is still loading (i.e. a deep link or
// refresh onto any non-Home route). Without it React Router logs
// "No `HydrateFallback` element provided…" and renders null, so the user
// gets a blank flash instead of a spinner.
export const RouteHydrateFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <SpinnerCircular color={PAGE_COLOR_CODE} size={100} />
  </div>
)

// The chunk-load fallback that used to live here is now RouteError, which
// covers render throws as well and tells the two apart — the old component
// blamed a deployment for every error it caught, including ones a reload
// could not fix.
