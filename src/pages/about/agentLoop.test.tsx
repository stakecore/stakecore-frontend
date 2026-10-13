// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import AgentLoop from './agentLoop'
import {
  BRANCHES,
  DWELL_MS,
  N_STEPS,
  STATUS,
  TRUNK,
  pathOf,
  type Outcome,
} from './agentLoopBeats'

const setReducedMotion = (reduce: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

const setHidden = (hidden: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

// One frame per act: each timeout is armed by the render the last one caused,
// so a single jump of the clock would only fire the first.
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

// Standby, then every step of one incident, leaving its record on screen.
const runIncident = () => {
  advance(DWELL_MS.standby)
  for (let i = 0; i < N_STEPS; i++) advance(DWELL_MS.step)
}

const statesIn = (container: HTMLElement, scope: string) =>
  [...container.querySelectorAll<HTMLElement>(`${scope} .agent-loop-step`)].map(el => el.dataset.state)

const trunk = (c: HTMLElement) => statesIn(c, '.agent-loop-trunk')
const branch = (c: HTMLElement, outcome: Outcome) => statesIn(c, `[data-branch="${outcome}"]`)

const text = (i: number, outcome: Outcome = 'resolved') => pathOf(outcome)[i]?.text ?? 'missing step'

beforeEach(() => {
  vi.useFakeTimers()
  setReducedMotion(false)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete (document as unknown as Record<string, unknown>).hidden
})

describe('AgentLoop', () => {
  it('describes both outcomes to assistive tech', () => {
    render(<AgentLoop />)
    const label = screen.getByRole('img').getAttribute('aria-label') ?? ''
    // The loop itself is invisible to a screen reader, so the label has to
    // carry the whole story — including the branch where the agent hands off.
    expect(label).toMatch(/agent/i)
    expect(label).toMatch(/moves/i)
    expect(label).toMatch(/engineer/i)
  })

  it('opens on standby with an empty record', () => {
    const { container } = render(<AgentLoop />)
    expect(screen.getByText(STATUS.standby)).toBeTruthy()
    expect(trunk(container)).toEqual(['pending', 'pending', 'pending'])
    expect(branch(container, 'resolved')).toEqual(['pending', 'pending'])
    expect(branch(container, 'handoff')).toEqual(['pending', 'pending'])
    expect(screen.queryByText(text(0))).toBeNull()
  })

  it('shows both outcomes as named branches before anything has run', () => {
    render(<AgentLoop />)
    for (const outcome of ['resolved', 'handoff'] as const) {
      expect(screen.getByText(BRANCHES[outcome].condition)).toBeTruthy()
      for (const step of BRANCHES[outcome].steps) expect(screen.getByText(step.stage)).toBeTruthy()
    }
    for (const step of TRUNK) expect(screen.getByText(step.stage)).toBeTruthy()
  })

  it('writes a step when it starts and keeps it once it has finished', () => {
    const { container } = render(<AgentLoop />)

    advance(DWELL_MS.standby)
    expect(trunk(container)).toEqual(['active', 'pending', 'pending'])
    expect(screen.getByText(text(0))).toBeTruthy()
    expect(screen.queryByText(text(1))).toBeNull()

    advance(DWELL_MS.step)
    expect(trunk(container)).toEqual(['recorded', 'active', 'pending'])
    // The finished step is still on screen beside the one now running.
    expect(screen.getByText(text(0))).toBeTruthy()
    expect(screen.getByText(text(1))).toBeTruthy()
  })

  it('commits to neither branch until the trunk is on the record', () => {
    const { container } = render(<AgentLoop />)
    advance(DWELL_MS.standby)
    advance(DWELL_MS.step)
    advance(DWELL_MS.step)

    expect(trunk(container)).toEqual(['recorded', 'recorded', 'active'])
    expect(branch(container, 'resolved')).toEqual(['pending', 'pending'])
    expect(branch(container, 'handoff')).toEqual(['pending', 'pending'])
  })

  it('records the branch it takes and marks the other as skipped', () => {
    const { container } = render(<AgentLoop />)
    runIncident()

    expect(trunk(container)).toEqual(['recorded', 'recorded', 'recorded'])
    expect(branch(container, 'resolved')).toEqual(['recorded', 'recorded'])
    expect(branch(container, 'handoff')).toEqual(['skipped', 'skipped'])
    expect(screen.getByText(STATUS.resolved)).toBeTruthy()
    for (let i = 0; i < N_STEPS; i++) expect(screen.getByText(text(i))).toBeTruthy()
    // Nothing is written at a stop the incident never reached.
    expect(screen.queryByText(text(3, 'handoff'))).toBeNull()
  })

  it('takes the other branch on the very next incident', () => {
    const { container } = render(<AgentLoop />)
    runIncident()
    advance(DWELL_MS.complete)
    runIncident()

    expect(branch(container, 'handoff')).toEqual(['recorded', 'recorded'])
    expect(branch(container, 'resolved')).toEqual(['skipped', 'skipped'])
    expect(screen.getByText(STATUS.handoff)).toBeTruthy()
    expect(screen.getByText(text(3, 'handoff'))).toBeTruthy()
  })

  it('holds one complete record for reduced-motion visitors', () => {
    setReducedMotion(true)
    const { container } = render(<AgentLoop />)
    const still = () => [...trunk(container), ...branch(container, 'resolved')]
    expect(still()).toEqual(Array(N_STEPS).fill('recorded'))

    advance(60_000)
    expect(still()).toEqual(Array(N_STEPS).fill('recorded'))
    expect(screen.getByText(STATUS.resolved)).toBeTruthy()
  })

  it('stops stepping while the tab is hidden, and resumes when it returns', () => {
    const { container } = render(<AgentLoop />)
    act(() => setHidden(true))

    advance(60_000)
    expect(trunk(container)[0]).toBe('pending')

    act(() => setHidden(false))
    advance(DWELL_MS.standby)
    expect(trunk(container)[0]).toBe('active')
  })
})
