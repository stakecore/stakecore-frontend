import { Component, createElement, lazy, useReducer, type ComponentType, type ReactNode } from 'react'
import { RiSignalWifiErrorLine } from '@remixicon/react'
import { retryImport, type RetryImportOptions } from '~/utils/retryImport'
import './lazyRetry.scss'

// Why this exists, and why <Suspense> is not enough.
//
// Suspense handles a lazy chunk that is *pending*. It does nothing for one
// that *rejects* — that propagates as a render error to the nearest error
// boundary, and this app's only boundaries are React Router's per-route
// `errorElement`. So a below-the-fold chart failing to download took the
// entire route with it: on /#/flare/fsp a 503 on the 6 kB fsp-stats chunk
// left the page with no <h1>, no provider data (already fetched and fine) and
// no delegate widget, showing "A new version may have been deployed" —
// which was not true; the chunk was present and returned 200 minutes later.
//
// Two failures, so two parts. `retryImport` handles the transient one (the
// chunk is there, the CDN blinked). The boundary here handles the rest by
// keeping the damage inside the subtree that failed, so an optional section
// can never again cost the page its primary content.

interface ChunkBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

// Remounted by the caller via `key` rather than resetting itself, so the
// retried chunk gets a genuinely fresh subtree — React.lazy caches a
// rejection permanently against the object it was created on, so reusing one
// after a failure replays the error without re-running the factory.
class ChunkBoundary extends Component<ChunkBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  // In componentDidCatch, not in render: RouteError logs from its render body
  // and consequently prints twice for every error it catches. This runs once.
  componentDidCatch(error: unknown) {
    console.error('Lazy chunk failed:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

const LazyFallback = ({ title, description, onRetry }: {
  title: string
  description: string
  onRetry: () => void
}) => (
  // role="status" rather than "alert": this is a section of the page that
  // could not draw, not something the user needs interrupting for.
  <div className="lazy-fallback" role="status">
    <RiSignalWifiErrorLine size={40} className="lazy-fallback-icon" aria-hidden="true" />
    <div className="lazy-fallback-title">{title}</div>
    <p className="lazy-fallback-desc">{description}</p>
    <button type="button" className="theme-btn lazy-fallback-retry" onClick={onRetry}>Retry</button>
  </div>
)

export interface LazyRetryOptions {
  title?: string
  description?: string
  /**
   * Render nothing at all on failure. For chunks with no visible surface
   * until the user acts (toasts, tooltips, the wallet picker) a notice would
   * announce the absence of something nobody asked for yet.
   */
  silent?: boolean
  retry?: RetryImportOptions
}

/**
 * Drop-in replacement for `React.lazy` for chunks that are *part* of a page
 * rather than the page itself. Same call signature, same need for a
 * `<Suspense>` above it — every current call site already has one.
 *
 * Route chunks keep using `routeLazy` instead: when the thing that failed
 * *is* the page there is no subtree left to contain the failure to, and a
 * reload onto the target route is the honest recovery.
 */
export function lazyRetry<P extends object = Record<string, never>>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  options: LazyRetryOptions = {},
): ComponentType<P> {
  const {
    title = 'Section unavailable',
    description = "This part of the page couldn't be loaded, usually a temporary network problem.",
    silent = false,
    retry,
  } = options

  // Both of these live here, per call site, and **not** in component state.
  //
  // That is the whole trick, and getting it wrong is spectacular. A lazy()
  // that suspends on its first render never commits, so React throws the
  // pending subtree away and builds it again when the promise settles — which
  // re-runs any useState initializer inside it. Minting a fresh lazy() there
  // means the rejection is never the *same* lazy twice, so it is never
  // replayed as a throw the boundary can catch: the chunk is re-requested
  // instead, forever. Measured against a chunk held at 503, that was 3,786
  // requests in 30 seconds and no error UI at all.
  //
  // Held here, the rejection is cached on one object. React replays it as a
  // synchronous throw on the retry render, ChunkBoundary catches it, and the
  // subtree settles — exactly how a module-scope React.lazy already behaves.
  let load = lazy(() => retryImport(factory, retry))
  // Re-keys the boundary out of its failed state, and survives the remounts
  // above for the same reason `load` has to.
  let generation = 0

  const LazyChunk = (props: P) => {
    const [, rerender] = useReducer((n: number) => n + 1, 0)

    return (
      <ChunkBoundary
        key={generation}
        fallback={silent ? null : (
          <LazyFallback
            title={title}
            description={description}
            onRetry={() => {
              load = lazy(() => retryImport(factory, retry))
              generation += 1
              rerender()
            }}
          />
        )}
      >
        {createElement(load, props)}
      </ChunkBoundary>
    )
  }
  LazyChunk.displayName = 'LazyChunk'
  return LazyChunk
}

export default lazyRetry
