import { Link, useRouteError } from 'react-router'

const RELOAD_FLAG = 'stakecore:chunk-reload-attempted'

// Vite's failure modes when a lazily-imported route chunk can't be fetched.
// The usual cause is a deploy replacing the hashed assets the currently-loaded
// page still points at, which a reload genuinely does fix — so this is the one
// case where telling the user to reload is honest advice.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported|unable to preload|ChunkLoadError/i

const isChunkError = (error: unknown): boolean => {
  if (error == null) return false
  if (typeof error === 'object' && (error as { name?: unknown }).name === 'ChunkLoadError') return true
  const message = error instanceof Error ? error.message : String(error)
  return CHUNK_ERROR.test(message)
}

// Route-level render boundary. Without it, anything that throws while
// rendering a route reaches React Router's built-in fallback — the unstyled
// "Unexpected Application Error!" screen — and, when mounted on the root
// route, takes the header and footer down with it. Mounted on the *child*
// routes instead, so the crash is contained to the Outlet and the site
// chrome stays usable.
export const RouteError = () => {
  const error = useRouteError()
  const chunk = isChunkError(error)

  // Kept from the previous chunk-only boundary: the underlying error is
  // otherwise swallowed, leaving no trace of a white-screened route.
  console.error('Route error:', error)

  const handleReload = () => {
    // routeLazy sets this to stop a reload loop. Clearing it means a genuine
    // chunk failure after this point still gets its one automatic retry.
    try {
      sessionStorage.removeItem(RELOAD_FLAG)
    } catch { /* storage blocked — the reload below is what matters */ }
    window.location.reload()
  }

  return (
    <section className="innerpage-single-area">
      <div className="container">
        <div className="error-container error-container--centered route-error">
          <div className="error-status">!</div>
          <div className="error-label">
            {chunk ? 'Could not load this page' : 'Something went wrong'}
          </div>
          <p className="error-desc">
            {chunk
              ? 'A new version may have been deployed. Reloading should fix it.'
              : <>This page hit an unexpected error. Reloading may help, or you can <Link to="/">return home</Link>.</>}
          </p>
          <p className="error-desc">
            <button className="theme-btn" onClick={handleReload}>Reload</button>
          </p>
        </div>
      </div>
    </section>
  )
}

export default RouteError
