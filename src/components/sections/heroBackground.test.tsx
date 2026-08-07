// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'

// Both canvases are stubbed out. The chooser's job is picking one, and
// neither real component can paint anything under happy-dom, which has no 2D
// or WebGL context.
vi.mock('./heroRuneCanvas', () => ({ default: () => <div data-testid="webgl-canvas" /> }))
vi.mock('./heroRuneShimmer', () => ({ default: () => <div data-testid="shimmer-canvas" /> }))

import HeroBackground from './heroBackground'

type Listener = () => void

// Replace window.matchMedia with a controllable fake. defineProperty and a
// saved descriptor, not vi.spyOn: the storage suites in this repo document
// spies silently ceasing to apply once another test has touched the same
// global, which turns a broken implementation green.
const installMatchMedia = (initial: boolean) => {
  let matches = initial
  const listeners = new Set<Listener>()
  const mql = {
    get matches() { return matches },
    addEventListener: (_type: string, listener: Listener) => { listeners.add(listener) },
    removeEventListener: (_type: string, listener: Listener) => { listeners.delete(listener) },
  }
  const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => mql),
  })
  return {
    /** Flip the query result and notify subscribers, as a real MQL would. */
    set(next: boolean) {
      matches = next
      listeners.forEach(listener => listener())
    },
    listenerCount: () => listeners.size,
    restore() {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
      else delete (window as { matchMedia?: unknown }).matchMedia
    },
  }
}

let mm: ReturnType<typeof installMatchMedia> | null = null

// No global setup file, so RTL's auto-cleanup does not run and a second
// render would match elements left behind by the first.
afterEach(() => {
  cleanup()
  mm?.restore()
  mm = null
})

describe('HeroBackground', () => {
  it('renders the shimmer below the md breakpoint', () => {
    mm = installMatchMedia(true)
    render(<HeroBackground />)
    expect(screen.getByTestId('shimmer-canvas')).toBeTruthy()
    expect(screen.queryByTestId('webgl-canvas')).toBeNull()
  })

  it('renders the WebGL field at and above the md breakpoint', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(screen.getByTestId('webgl-canvas')).toBeTruthy()
    expect(screen.queryByTestId('shimmer-canvas')).toBeNull()
  })

  it('queries exactly t.down(md), not a rounded 768px', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767.98px)')
  })

  it('swaps canvases when the viewport crosses the breakpoint', () => {
    mm = installMatchMedia(false)
    render(<HeroBackground />)
    expect(screen.getByTestId('webgl-canvas')).toBeTruthy()

    act(() => mm?.set(true))

    expect(screen.getByTestId('shimmer-canvas')).toBeTruthy()
    expect(screen.queryByTestId('webgl-canvas')).toBeNull()
  })

  it('unsubscribes from the media query on unmount', () => {
    mm = installMatchMedia(false)
    const { unmount } = render(<HeroBackground />)
    expect(mm.listenerCount()).toBe(1)
    unmount()
    expect(mm.listenerCount()).toBe(0)
  })

  it('falls back to the desktop field when matchMedia is unavailable', () => {
    const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    // @ts-expect-error deliberately removing a DOM global to model old Safari
    delete window.matchMedia
    try {
      render(<HeroBackground />)
      expect(screen.getByTestId('webgl-canvas')).toBeTruthy()
    } finally {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
    }
  })
})
