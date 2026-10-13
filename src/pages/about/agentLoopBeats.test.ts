import { describe, it, expect } from 'vitest'
import {
  BRANCHES,
  INITIAL_FRAME,
  N_STEPS,
  STILL_FRAME,
  TRUNK,
  nextFrame,
  pathOf,
  phaseOf,
  takenBranch,
  type Frame,
} from './agentLoopBeats'

// Every frame from `start` (exclusive) up to and including the next return to
// standby — i.e. exactly one incident, plus the standby that clears it.
const incidentFrom = (start: Frame): Frame[] => {
  const frames: Frame[] = []
  let f = start
  do {
    f = nextFrame(f)
    frames.push(f)
  } while (phaseOf(f) !== 'standby' && frames.length < 50)
  return frames
}

// The nth incident (1-based) from a cold start.
const incident = (n: number): Frame[] => {
  let frames = incidentFrom(INITIAL_FRAME)
  for (let i = 1; i < n; i++) frames = incidentFrom(frames[frames.length - 1] ?? INITIAL_FRAME)
  return frames
}

describe('nextFrame', () => {
  it('starts on standby, with nothing on the record', () => {
    expect(phaseOf(INITIAL_FRAME)).toBe('standby')
    expect(INITIAL_FRAME.active).toBeNull()
    expect(INITIAL_FRAME.recorded).toBe(0)
  })

  it('runs the steps in order, one at a time', () => {
    const running = incident(1).filter(f => phaseOf(f) === 'running')
    expect(running.map(f => f.active)).toEqual([0, 1, 2, 3, 4])
  })

  it('records each step the moment it finishes', () => {
    // While step k runs, exactly the k steps before it are on the record.
    for (const f of incident(1)) {
      if (f.active != null) expect(f.recorded).toBe(f.active)
    }
  })

  it('never takes a step off the record while the incident is open', () => {
    const frames = incident(1).filter(f => phaseOf(f) !== 'standby')
    for (let i = 1; i < frames.length; i++) {
      expect(frames[i]?.recorded).toBeGreaterThanOrEqual(frames[i - 1]?.recorded ?? 0)
    }
  })

  it('holds the complete record once the last step finishes', () => {
    const frames = incident(1)
    const complete = frames[frames.length - 2]
    expect(complete && phaseOf(complete)).toBe('complete')
    expect(complete?.active).toBeNull()
    expect(complete?.recorded).toBe(N_STEPS)
  })

  it('clears the record only when the next standby begins', () => {
    const last = incident(1).at(-1)
    expect(last && phaseOf(last)).toBe('standby')
    expect(last?.recorded).toBe(0)
  })

  it('opens with an incident the agent resolves on its own', () => {
    expect(incident(1).every(f => f.outcome === 'resolved')).toBe(true)
  })

  it('never takes the same path twice in a row', () => {
    // One outcome per incident, read off the frame where its record is whole.
    const outcomes: string[] = []
    let f = INITIAL_FRAME
    for (let i = 0; i < 400; i++) {
      f = nextFrame(f)
      if (phaseOf(f) === 'complete') outcomes.push(f.outcome)
    }
    expect(outcomes.length).toBeGreaterThan(10)
    for (let i = 1; i < outcomes.length; i++) expect(outcomes[i]).not.toBe(outcomes[i - 1])
  })

  it('does not change the outcome partway through an incident', () => {
    let f = INITIAL_FRAME
    for (let i = 0; i < 200; i++) {
      const next = nextFrame(f)
      if (phaseOf(f) !== 'standby') expect(next.outcome).toBe(f.outcome)
      f = next
    }
  })
})

describe('the pipeline', () => {
  it('makes every path through it N_STEPS long', () => {
    // nextFrame counts to N_STEPS whichever branch is taken; a longer path
    // would leave a stop that never fills, a shorter one a step with no stop.
    expect(pathOf('resolved')).toHaveLength(N_STEPS)
    expect(pathOf('handoff')).toHaveLength(N_STEPS)
  })

  it('shares the trunk between both outcomes', () => {
    expect(pathOf('handoff').slice(0, TRUNK.length)).toEqual(TRUNK)
    expect(pathOf('resolved').slice(0, TRUNK.length)).toEqual(TRUNK)
  })

  it('names each branch by the condition that selects it', () => {
    expect(BRANCHES.resolved.condition).not.toBe(BRANCHES.handoff.condition)
  })
})

describe('takenBranch', () => {
  it('commits to no branch while the trunk is still running', () => {
    // Lighting a branch before the agent has the alert would give the
    // outcome away before the step that decides it.
    const trunk = incident(1).filter(f => f.active != null && f.active < TRUNK.length)
    expect(trunk).toHaveLength(TRUNK.length)
    for (const f of trunk) expect(takenBranch(f)).toBeNull()
  })

  it('commits to the outcome once the trunk is on the record', () => {
    const after = incident(1).filter(f => f.recorded >= TRUNK.length)
    expect(after.length).toBeGreaterThan(0)
    for (const f of after) expect(takenBranch(f)).toBe('resolved')

    const handed = incident(2).filter(f => f.recorded >= TRUNK.length)
    expect(handed.length).toBeGreaterThan(0)
    for (const f of handed) expect(takenBranch(f)).toBe('handoff')
  })

  it('commits to no branch on standby', () => {
    expect(takenBranch(INITIAL_FRAME)).toBeNull()
    expect(takenBranch(incident(1).at(-1) ?? INITIAL_FRAME)).toBeNull()
  })
})

describe('STILL_FRAME', () => {
  it('is a complete record of an incident the agent resolved', () => {
    // What a reduced-motion visitor sees in place of the loop.
    expect(phaseOf(STILL_FRAME)).toBe('complete')
    expect(STILL_FRAME.recorded).toBe(N_STEPS)
    expect(STILL_FRAME.outcome).toBe('resolved')
  })
})
