// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { BELOW_MD_QUERY, useBelowMd } from './useBelowMd'

type Listener = () => void

// Replace window.matchMedia with a controllable fake. defineProperty with a
// saved descriptor, not vi.spyOn: the storage suites in this repo document
// spies silently ceasing to apply once another test has touched the same
// global, which turns a broken implementation green.
const installMatchMedia = (initial: boolean) => {
  let matches = initial
  // One instance per matchMedia() call, each with its own listener set. A
  // subscribe that re-resolves the query for its cleanup then removes from a
  // different object than it added to, and the total below stays non-zero.
  const instances: { listeners: Set<Listener> }[] = []
  const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => {
      const listeners = new Set<Listener>()
      const instance = {
        listeners,
        get matches() { return matches },
        addEventListener: (_type: string, listener: Listener) => { listeners.add(listener) },
        removeEventListener: (_type: string, listener: Listener) => { listeners.delete(listener) },
      }
      instances.push(instance)
      return instance
    }),
  })
  return {
    set(next: boolean) {
      matches = next
      for (const i of instances) for (const l of i.listeners) l()
    },
    listenerCount: () => instances.reduce((n, i) => n + i.listeners.size, 0),
    restore() {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
      else delete (window as { matchMedia?: unknown }).matchMedia
    },
  }
}

let mm: ReturnType<typeof installMatchMedia> | null = null

// No global setup file, so RTL's auto-cleanup does not run.
afterEach(() => {
  cleanup()
  mm?.restore()
  mm = null
})

const Probe = () => <span data-testid="v">{String(useBelowMd())}</span>
const value = () => screen.getByTestId('v').textContent

describe('useBelowMd', () => {
  it('is true below the md breakpoint', () => {
    mm = installMatchMedia(true)
    render(<Probe />)
    expect(value()).toBe('true')
  })

  it('is false at and above the md breakpoint', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(value()).toBe('false')
  })

  it('queries exactly t.down(md), not a rounded 768px', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(BELOW_MD_QUERY).toBe('(max-width: 767.98px)')
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767.98px)')
  })

  it('re-renders when the viewport crosses the breakpoint', () => {
    mm = installMatchMedia(false)
    render(<Probe />)
    expect(value()).toBe('false')
    act(() => mm?.set(true))
    expect(value()).toBe('true')
  })

  it('unsubscribes on unmount', () => {
    mm = installMatchMedia(false)
    const { unmount } = render(<Probe />)
    expect(mm.listenerCount()).toBe(1)
    unmount()
    expect(mm.listenerCount()).toBe(0)
  })

  it('reports desktop when matchMedia is unavailable', () => {
    const saved = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    // @ts-expect-error deliberately removing a DOM global to model old Safari
    delete window.matchMedia
    try {
      render(<Probe />)
      expect(value()).toBe('false')
    } finally {
      if (saved) Object.defineProperty(window, 'matchMedia', saved)
    }
  })
})
