// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import SpecsTooltip from './tooltip'

// The spec tables hang an info icon off a handful of row labels, and the
// explanation behind it used to live only in `data-tooltip-content` on a bare
// <div>. That is mouse-only by construction: a div is not focusable, so the
// text was unreachable by keyboard (WCAG 2.1.1) and the icon carried no text
// alternative at all (1.1.1). These tests pin the two properties that fix it —
// it is a real control, and it says what it is.

afterEach(cleanup)

describe('SpecsTooltip', () => {
  it('is a button, so keyboard users can reach it', () => {
    render(<SpecsTooltip text="Fee charged to delegators" />)

    const trigger = screen.getByRole('button')
    // Native <button>: focusable without a tabindex, and removed from the tab
    // order by nothing. An explicit tabindex="-1" would undo the whole point.
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('tabindex')).toBeNull()
    // type=button or the trigger submits the surrounding form on click.
    expect(trigger.getAttribute('type')).toBe('button')
  })

  it('exposes the tooltip text as its accessible name', () => {
    render(<SpecsTooltip text="Fee charged to delegators" />)

    // The name is the text itself rather than a generic "more info": the
    // visual tooltip is the only other place this sentence exists, and it
    // never opens for a screen-reader user.
    expect(screen.getByRole('button', { name: 'Fee charged to delegators' })).toBeTruthy()
  })

  it('keeps the react-tooltip wiring so the visual tooltip still opens', () => {
    render(<SpecsTooltip text="Fee charged to delegators" />)

    const trigger = screen.getByRole('button')
    // #tooltip is the singleton mounted in root.tsx.
    expect(trigger.getAttribute('data-tooltip-id')).toBe('tooltip')
    expect(trigger.getAttribute('data-tooltip-content')).toBe('Fee charged to delegators')
  })

  it('hides the icon from assistive tech, which the button name already covers', () => {
    const { container } = render(<SpecsTooltip text="Fee charged to delegators" />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
  })
})
