import { type ComponentType } from "react";
import { useRouteError } from "react-router-dom";
import { SpinnerCircular } from "spinners-react";
import { PAGE_COLOR_CODE } from "~/constants";
import "./lazy.scss";

const RELOAD_FLAG = 'stakecore:chunk-reload-attempted'

export function routeLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return { Component: mod.default }
    } catch (err) {
      if (sessionStorage.getItem(RELOAD_FLAG) !== '1') {
        sessionStorage.setItem(RELOAD_FLAG, '1')
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

export const ChunkLoadError = () => {
  const error = useRouteError()
  console.error('Lazy route load failed:', error)

  const handleReload = () => {
    sessionStorage.removeItem(RELOAD_FLAG)
    window.location.reload()
  }

  return (
    <div className="lazy-load-error">
      <h3>Couldn't load this page</h3>
      <p>A new version may have been deployed. Reloading should fix it.</p>
      <button className="theme-btn" onClick={handleReload}>Reload</button>
    </div>
  )
}
