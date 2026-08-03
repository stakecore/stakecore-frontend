import { useEffect, useState } from 'react'

/**
 * Returns false on the first render, then true once the browser is idle.
 *
 * For chrome that has to exist but doesn't have to exist *yet* — toasts, the
 * tooltip singleton, the wallet picker. Rendering them in the first commit put
 * ~79 kB of JS on the critical path for markup nobody can see until they
 * interact, on a page whose LCP is already gated on script execution.
 *
 * The 2s timeout is the escape hatch: a busy main thread can starve idle
 * callbacks indefinitely, and the wallet picker has to be mounted before the
 * user gets around to clicking "Connect Wallet". requestIdleCallback is
 * missing on older Safari, hence the setTimeout fallback.
 */
export function useAfterIdle(enabled = true): boolean {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    // Callers deferring work that only becomes relevant later (a list that
    // needs its data first) pass `enabled` so the clock starts then. Without
    // it the callback fires during the initial empty render and the deferral
    // is already lifted by the time there's anything to defer.
    if (!enabled) return
    if (typeof window.requestIdleCallback !== 'function') {
      const timer = setTimeout(() => setIdle(true), 200)
      return () => clearTimeout(timer)
    }
    const handle = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 })
    return () => window.cancelIdleCallback(handle)
  }, [enabled])

  return idle
}
