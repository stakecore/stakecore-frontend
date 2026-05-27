import { type ComponentType } from "react";
import { useRouteError } from "react-router-dom";

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
