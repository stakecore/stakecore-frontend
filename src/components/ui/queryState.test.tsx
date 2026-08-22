// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// spinners-react ships UMD with no `exports` map, so Vitest resolves it to
// `undefined` and the loading branch throws before it can be asserted on.
// Stubbing it also keeps these tests off the vendor's SVG internals — what
// matters here is which branch of the ladder rendered, not what a spinner
// looks like.
vi.mock('spinners-react', () => ({
  SpinnerCircular: () => <div data-testid="spinner" />,
}))

import QueryState from './queryState'

// SWR 2.x sets `isLoading` to true whenever a request is in flight and no
// `data` has ever loaded — which is exactly the state a failed fetch leaves
// behind. So every retry after a failure re-enters the loading branch, and a
// ladder that checks `isLoading` first tears the error panel down and rebuilds
// it on each one. Traced in the browser against a dead backend:
//
//     9986ms  -[error-container]  +[]
//     9986ms  -[]  +[mt-30 mb-30]      <- spinner
//     9993ms  -[mt-30 mb-30]  +[]
//     9993ms  -[]  +[error-container]
//
// The gap is however long the fetch takes to fail, so on a real hanging
// connection it is a visible flash rather than the 7ms an aborted request
// gives. These tests pin the precedence that fixes it.

const renderState = (props: Partial<Parameters<typeof QueryState>[0]> = {}) =>
  render(
    <QueryState isLoading={false} error={null} data={undefined} {...props}>
      {(d: { name: string }) => <p>loaded {d.name}</p>}
    </QueryState>,
  )

const spinner = () => screen.queryByTestId('spinner')

afterEach(cleanup)

describe('QueryState precedence', () => {
  it('shows the spinner on the very first load', () => {
    renderState({ isLoading: true })

    expect(spinner()).toBeTruthy()
    expect(document.querySelector('.error-container')).toBeNull()
  })

  it('keeps the error panel while a retry is in flight', () => {
    // The state SWR reports on every retry after a failure: request pending,
    // no data, previous error still set.
    renderState({ isLoading: true, error: new Error('Failed to fetch') })

    expect(document.querySelector('.error-container')).toBeTruthy()
    expect(spinner()).toBeNull()
  })

  it('keeps rendering loaded data when a background refresh fails', () => {
    // A transient blip must not blank a page that is already good — the data
    // on screen is still the last thing the server actually said.
    renderState({ data: { name: 'x' }, error: new Error('Failed to fetch') })

    expect(screen.getByText('loaded x')).toBeTruthy()
    expect(document.querySelector('.error-container')).toBeNull()
  })

  it('keeps rendering loaded data while a refresh is in flight', () => {
    renderState({ data: { name: 'x' }, isLoading: true })

    expect(screen.getByText('loaded x')).toBeTruthy()
    expect(spinner()).toBeNull()
  })

  it('still shows the error panel when there is nothing else to show', () => {
    renderState({ error: new Error('Failed to fetch') })

    expect(document.querySelector('.error-container')).toBeTruthy()
  })

  it('still distinguishes a successful empty response from a failure', () => {
    renderState({ data: null, emptyTitle: 'Nothing here' })

    expect(screen.getByText('Nothing here')).toBeTruthy()
    expect(document.querySelector('.error-container')).toBeNull()
  })
})
