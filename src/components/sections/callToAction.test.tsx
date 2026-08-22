// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Fourth instance of the ladder-order defect fixed in queryState.tsx: this one
// checks `isLoading` before treating a missing payload as a failure, so a retry
// after a failure swapped the error panel for a spinner. Reachable only behind
// a connected wallet, which is why it outlived the others.

const swrResult = { data: undefined as unknown, error: null as unknown, isLoading: false }
vi.mock('swr', () => ({ default: () => swrResult }))
vi.mock('spinners-react', () => ({ SpinnerCircular: () => <div data-testid="spinner" /> }))
vi.mock('./proposal', () => ({ default: () => <div data-testid="proposal" /> }))

const store = { setWalletChoiceVisible: vi.fn(), walletChoiceVisible: false, walletAddress: '0xabc' }
vi.mock('~/features/wallet/store', () => ({
  useGlobalStore: (selector: (s: typeof store) => unknown) => selector(store),
}))

import CallToAction from './callToAction'

const renderCta = (state: Partial<typeof swrResult>) => {
  Object.assign(swrResult, { data: undefined, error: null, isLoading: false }, state)
  return render(<CallToAction />)
}

const errorPanel = () => document.querySelector('.error-container')

afterEach(cleanup)

describe('CallToAction error precedence', () => {
  it('shows the spinner on the very first load', () => {
    renderCta({ isLoading: true })

    expect(screen.getByTestId('spinner')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })

  it('keeps the error panel while a retry is in flight', () => {
    renderCta({ isLoading: true, error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
    expect(screen.queryByTestId('spinner')).toBeNull()
  })

  it('shows the error panel once a fetch has settled with no data', () => {
    renderCta({ error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
  })
})
