// @vitest-environment happy-dom

import { Suspense } from 'react'
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazyRetry } from './lazyRetry'

// No global setup file, so RTL's auto-cleanup does not run.
afterEach(cleanup)

// React logs every boundary-caught error itself, and the boundary logs one of
// its own on purpose. Both are noise here.
beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { vi.restoreAllMocks() })

const Chart = ({ label }: { label: string }) => <div>chart: {label}</div>

// attempts: 0 — the cache-busted retry path is retryImport's own test. What
// matters here is what happens once the attempts are spent.
const noRetries = { retry: { attempts: 0 } }

const mount = (ui: React.ReactNode) =>
  render(<div><p>sibling content</p><Suspense fallback={<p>loading</p>}>{ui}</Suspense></div>)

describe('lazyRetry', () => {
  it('renders the loaded component with its props', async () => {
    const Lazy = lazyRetry(async () => ({ default: Chart }), noRetries)
    mount(<Lazy label="APY" />)

    expect(await screen.findByText('chart: APY')).toBeTruthy()
  })

  // The regression. A 503 on the fsp-stats chunk reached the route's
  // errorElement and replaced the whole page — heading, provider data and the
  // delegate widget — over a below-the-fold chart. The failure must not leave
  // this subtree.
  it('contains a failed import instead of letting it reach the route boundary', async () => {
    const Lazy = lazyRetry<{ label: string }>(
      async () => { throw new TypeError('Failed to fetch dynamically imported module: https://x.dev/a.js') },
      { ...noRetries, title: 'Statistics unavailable' },
    )
    mount(<Lazy label="APY" />)

    expect(await screen.findByText('Statistics unavailable')).toBeTruthy()
    expect(screen.getByText('sibling content')).toBeTruthy()
  })

  it('reloads the chunk when the fallback’s retry is used', async () => {
    let fail = true
    const Lazy = lazyRetry<{ label: string }>(
      async () => {
        if (fail) throw new TypeError('Failed to fetch dynamically imported module: https://x.dev/a.js')
        return { default: Chart }
      },
      noRetries,
    )
    mount(<Lazy label="APY" />)

    const button = await screen.findByRole('button', { name: /retry/i })
    fail = false
    await userEvent.click(button)

    await waitFor(() => { expect(screen.getByText('chart: APY')).toBeTruthy() })
  })

  // Toasts, tooltips and the wallet picker have no visible surface until the
  // user acts, so a notice where they failed to load would be noise about
  // something the user never asked for.
  it('renders nothing on failure when silent', async () => {
    const Lazy = lazyRetry(
      async () => { throw new TypeError('Failed to fetch dynamically imported module: https://x.dev/a.js') },
      { ...noRetries, silent: true },
    )
    const { container } = render(<Suspense fallback={<p>loading</p>}><Lazy /></Suspense>)

    await waitFor(() => { expect(container.textContent).toBe('') })
  })

  it('logs the error rather than swallowing it', async () => {
    const Lazy = lazyRetry(
      async () => { throw new TypeError('Failed to fetch dynamically imported module: https://x.dev/a.js') },
      { ...noRetries, silent: true },
    )
    render(<Suspense fallback={null}><Lazy /></Suspense>)

    await waitFor(() => {
      expect(vi.mocked(console.error).mock.calls.some(c => String(c[0]).includes('Lazy chunk failed'))).toBe(true)
    })
  })
})
