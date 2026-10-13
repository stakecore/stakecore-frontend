import { useEffect, useState } from 'react'
import {
  BRANCHES,
  INITIAL_FRAME,
  STATUS,
  STILL_FRAME,
  TRUNK,
  dwellOf,
  nextFrame,
  statusOf,
  takenBranch,
  type Frame,
  type Outcome,
  type Step,
  type Tone,
} from './agentLoopBeats'
import './agentLoop.scss'

// Incident pipeline: what happens when the cluster raises an alert.
//
// A rail read top to bottom like a job log. Three stops form a trunk — the
// error, the alert, the agent picking it up — and then the rail forks into two
// branches drawn side by side: the agent fixing it, and the agent handing it
// to an engineer. Both branches are always on screen and always named, so the
// picture shows both outcomes whichever one the current incident takes.
//
// Every stop carries its stage name from the start; that is the map. What an
// incident adds is the record: each step's sentence is written as the step
// begins and stays once it has finished, its marker fills in, and the rail is
// drawn through to the next stop. Nothing on the record changes again. At the
// fork the incident commits to one branch and the other is marked skipped.
// The finished record holds for a moment, then clears for the next standby.
//
// agentLoopBeats.ts owns the sequence and the copy.

type StopState = 'pending' | 'active' | 'recorded' | 'skipped'

// Left to right as drawn. The agent's own fix comes first.
const OUTCOMES: readonly Outcome[] = ['resolved', 'handoff']

// A check for a step that went as intended, a bang for the failure itself.
const GLYPHS: Record<Tone, string> = {
  bad: 'M6 2.6v4.2M6 9.3v.1',
  neutral: 'M2.6 6.4 5 8.8l4.4-5.4',
  good: 'M2.6 6.4 5 8.8l4.4-5.4',
}

// `index` is the step's position in the incident, trunk and branch together.
const stateAt = (frame: Frame, index: number): StopState =>
  index < frame.recorded ? 'recorded' : index === frame.active ? 'active' : 'pending'

const slotOf = (index: number) => String(index + 1).padStart(2, '0')

const Stop = ({ index, step, state, link }: {
  index: number
  step: Step
  state: StopState
  // Whether a link runs from this stop down to the next one in its list.
  link: boolean
}) => {
  // The sentence is not rendered until the step starts, rather than rendered
  // and faded in: text at partial opacity is text below contrast, and the axe
  // scan can land on any frame of the loop.
  const written = state === 'active' || state === 'recorded'
  return (
    <li className="agent-loop-step" data-state={state} data-tone={step.tone}>
      <span className="agent-loop-marker">
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d={GLYPHS[step.tone]} />
        </svg>
      </span>
      {link && <span className="agent-loop-link" />}
      <div className="agent-loop-step-body">
        <div className="agent-loop-step-head">
          <span className="agent-loop-step-index">{slotOf(index)}</span>
          <span className="agent-loop-step-stage">{step.stage}</span>
        </div>
        {written && <p className="agent-loop-step-text">{step.text}</p>}
      </div>
    </li>
  )
}

const AgentLoop = () => {
  // Reduced motion gets one finished record and no timer at all. There is
  // nothing focusable in here to pause the loop with, so this is its only off
  // switch — the same trade the stack carousels make (see useMarquee.ts).
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  const [frame, setFrame] = useState(reduced ? STILL_FRAME : INITIAL_FRAME)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // One timeout per frame rather than an interval: phases hold for different
  // lengths, and a backgrounded tab should stop mid-incident and pick up from
  // the same step when it returns.
  useEffect(() => {
    if (reduced || hidden) return
    const timer = setTimeout(() => setFrame(nextFrame), dwellOf(frame))
    return () => clearTimeout(timer)
  }, [frame, reduced, hidden])

  const status = statusOf(frame)
  const taken = takenBranch(frame)

  return (
    <div
      className="agent-loop"
      role="img"
      aria-label="Incident handling, shown as a pipeline that forks. An unexpected error takes a job down, Grafana posts the alert to a Telegram channel, and an AI agent watching that channel picks it up. From there one of two things happens. If its permissions allow, the agent moves the job to a healthy node and the job runs again. If they do not, it says so in the channel and an engineer takes over."
    >
      <p className="agent-loop-status" data-status={status}>
        <span className="agent-loop-status-dot" />
        {STATUS[status]}
      </p>

      <div className="agent-loop-pipeline">
        <ol className="agent-loop-trunk">
          {TRUNK.map((step, i) => (
            // Every trunk stop links onward: the last one runs into the fork.
            <Stop key={step.stage} index={i} step={step} state={stateAt(frame, i)} link />
          ))}
        </ol>

        <div className="agent-loop-fork" data-taken={taken ?? 'none'}>
          <span className="agent-loop-split" />
          {OUTCOMES.map(outcome => {
            const { condition, steps } = BRANCHES[outcome]
            return (
              <div
                key={outcome}
                className="agent-loop-branch"
                data-branch={outcome}
                data-taken={taken === outcome}
              >
                <span className="agent-loop-drop" />
                <p className="agent-loop-condition">{condition}</p>
                <ol>
                  {steps.map((step, j) => {
                    const index = TRUNK.length + j
                    // Once the incident has committed to a branch, the other
                    // one's stops are skipped rather than merely not yet run.
                    const state: StopState =
                      taken === outcome ? stateAt(frame, index) : taken == null ? 'pending' : 'skipped'
                    return (
                      <Stop
                        key={step.stage}
                        index={index}
                        step={step}
                        state={state}
                        link={j < steps.length - 1}
                      />
                    )
                  })}
                </ol>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AgentLoop
