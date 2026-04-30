import { Component, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { PreloaderContent } from "~/components/ui/preloader";

const RELOAD_FLAG = 'stakecore:chunk-reload-attempted'

export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return mod
    } catch (err) {
      if (sessionStorage.getItem(RELOAD_FLAG) !== '1') {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {})
      }
      throw err
    }
  })
}

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Lazy route load failed:', error)
  }

  handleReload = () => {
    sessionStorage.removeItem(RELOAD_FLAG)
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lazy-load-error">
          <h3>Couldn't load this page</h3>
          <p>A new version may have been deployed. Reloading should fix it.</p>
          <button className="theme-btn" onClick={this.handleReload}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

const Lazy = ({ children }: { children: ReactNode }) => (
  <ChunkErrorBoundary>
    <Suspense fallback={<div className="preloader"><PreloaderContent /></div>}>
      {children}
    </Suspense>
  </ChunkErrorBoundary>
)

export default Lazy
