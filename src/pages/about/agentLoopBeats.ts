// The incident loop behind agentLoop.tsx, as a pure step function.
//
// The pipeline is a trunk that forks. Every incident runs the trunk, then one
// of two branches, and the picture draws both branches at all times so both
// outcomes are on screen whichever one an incident takes:
//
//   Error → Alert → Agent ─┬─ Fix ────── Resolved     (within its permissions)
//                          └─ Hand-off ─ Engineer     (outside them)
//
// An incident is always N_STEPS steps long, run strictly in order. A step is
// written when it starts and stays on the record when it finishes, so the
// picture accumulates and is only cleared when the next standby begins:
//
//   standby → step 0 → step 1 → … → step 4 → complete → standby → …
//             (each step joins the record as the next one starts)
//
// Incidents alternate between the two branches, starting with the agent's own
// fix, so the same path never runs twice in a row and a visitor has seen both
// within two incidents. The alternation is a storytelling choice, NOT a
// measured rate.
//
// Nothing here draws a random number, so the sequence can be asserted exactly
// and the picture does the same thing on every visit.

export type Outcome = 'resolved' | 'handoff'
export type Phase = 'standby' | 'running' | 'complete'
export type Tone = 'bad' | 'neutral' | 'good'

export interface Step {
  stage: string
  text: string
  // Colours the step's marker once it is on the record.
  tone: Tone
}

export interface Frame {
  // Incidents started so far; 0 before the first.
  incident: number
  // How the current incident ends. Fixed when it starts.
  outcome: Outcome
  // Index of the step in progress, or null on standby and once complete.
  active: number | null
  // How many steps have finished. They stay on the record until standby.
  recorded: number
}

export const N_STEPS = 5

// What both outcomes have in common: everything up to the agent holding the
// alert. The fork comes after it, at the point where the agent either can act
// or cannot.
export const TRUNK: readonly Step[] = [
  { stage: 'Error', text: 'An unexpected error takes a job down.', tone: 'bad' },
  { stage: 'Alert', text: 'Grafana posts it to the Telegram channel.', tone: 'neutral' },
  { stage: 'Agent', text: 'The AI agent watching the channel picks it up.', tone: 'neutral' },
]

// Branch copy is short on purpose. The two branches sit side by side, so each
// has half the width a trunk step has — about 17 characters a line on a phone.
// The condition above each branch carries the "why", which is what lets the
// hand-off step say only what the agent does.
export const BRANCHES: Record<Outcome, { condition: string; steps: readonly Step[] }> = {
  resolved: {
    condition: 'Permitted',
    steps: [
      { stage: 'Fix', text: 'It moves the job to a healthy node.', tone: 'neutral' },
      { stage: 'Resolved', text: 'The job is running again.', tone: 'good' },
    ],
  },
  handoff: {
    condition: 'Not permitted',
    steps: [
      { stage: 'Hand-off', text: 'It says so in the channel.', tone: 'neutral' },
      { stage: 'Engineer', text: 'An engineer takes over.', tone: 'neutral' },
    ],
  },
}

// The steps an incident with this outcome runs, in order.
export const pathOf = (outcome: Outcome): readonly Step[] => [...TRUNK, ...BRANCHES[outcome].steps]

export const INITIAL_FRAME: Frame = {
  incident: 0,
  outcome: 'resolved',
  active: null,
  recorded: 0,
}

export function phaseOf(frame: Frame): Phase {
  if (frame.active != null) return 'running'
  return frame.recorded >= N_STEPS ? 'complete' : 'standby'
}

// The branch this frame has committed to, or null while the fork has not been
// reached. Nothing lights a branch before the trunk is on the record: doing so
// would give the outcome away ahead of the step that decides it.
export function takenBranch(frame: Frame): Outcome | null {
  return frame.recorded >= TRUNK.length ? frame.outcome : null
}

// How long each phase holds. A finished record stays up longest: it is the
// frame that says what happened, and the one worth reading.
export const DWELL_MS: Record<'standby' | 'step' | 'complete', number> = {
  standby: 2400,
  step: 1500,
  complete: 3600,
}

export function dwellOf(frame: Frame): number {
  const phase = phaseOf(frame)
  return phase === 'running' ? DWELL_MS.step : DWELL_MS[phase]
}

// The line above the pipeline. A finished incident is named by its outcome.
export const STATUS: Record<'standby' | 'running' | Outcome, string> = {
  standby: 'Agent on standby',
  running: 'Incident in progress',
  resolved: 'Resolved by the agent',
  handoff: 'Handed to an engineer',
}

export function statusOf(frame: Frame): keyof typeof STATUS {
  const phase = phaseOf(frame)
  return phase === 'complete' ? frame.outcome : phase
}

export function nextFrame(frame: Frame): Frame {
  switch (phaseOf(frame)) {
    case 'standby': {
      const incident = frame.incident + 1
      const outcome: Outcome = incident % 2 === 1 ? 'resolved' : 'handoff'
      return { incident, outcome, active: 0, recorded: 0 }
    }
    case 'running': {
      const finished = (frame.active ?? 0) + 1
      return { ...frame, active: finished < N_STEPS ? finished : null, recorded: finished }
    }
    case 'complete':
      return { ...frame, active: null, recorded: 0 }
  }
}

// What a reduced-motion visitor sees instead of the loop: the first incident
// with every step on the record.
export const STILL_FRAME: Frame = (() => {
  let frame = nextFrame(INITIAL_FRAME)
  for (let i = 0; i < 20 && phaseOf(frame) !== 'complete'; i++) frame = nextFrame(frame)
  return frame
})()
