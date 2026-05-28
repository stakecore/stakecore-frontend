// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { changeOpacity } from './dom'

// changeOpacity mutates a fixed #overlay element. The test stages one in
// document.body before each call and cleans up after.

let overlay: HTMLDivElement
beforeEach(() => {
  overlay = document.createElement('div')
  overlay.id = 'overlay'
  // Start "hidden" so we can observe both visibility + opacity flipping.
  overlay.style.visibility = 'hidden'
  overlay.style.opacity = '0'
  document.body.appendChild(overlay)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  overlay.remove()
})

describe('changeOpacity(add=true)', () => {
  it('makes the overlay visible at 0.8 opacity immediately', () => {
    changeOpacity(true)
    expect(overlay.style.visibility).toBe('visible')
    expect(overlay.style.opacity).toBe('0.8')
  })
})

describe('changeOpacity(add=false)', () => {
  it('zeros the opacity synchronously (the visual fade)', () => {
    overlay.style.visibility = 'visible'
    overlay.style.opacity = '0.8'
    changeOpacity(false)
    expect(overlay.style.opacity).toBe('0')
    // Visibility stays "visible" until the 500ms timer fires.
    expect(overlay.style.visibility).toBe('visible')
  })

  it('flips visibility to hidden after the 500ms fade-out delay', async () => {
    overlay.style.visibility = 'visible'
    overlay.style.opacity = '0.8'
    changeOpacity(false)
    // Before the timer: still visible.
    expect(overlay.style.visibility).toBe('visible')
    // Advance the deferred setTimeout that sleep(500) awaits.
    await vi.advanceTimersByTimeAsync(500)
    expect(overlay.style.visibility).toBe('hidden')
  })
})
