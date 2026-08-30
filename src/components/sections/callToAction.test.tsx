// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

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
import { FLR_SYMBOL } from '~/constants'

// Enough for getProposalData to emit one chain card, which is what puts the
// component into its Proposal state.
const PROPOSAL_DATA = {
  apys: [],
  balances: [{ token: FLR_SYMBOL, amount: 100 }],
  prices: { flr: 1, sgb: 1, avax: 1 },
}

const renderCta = (state: Partial<typeof swrResult>) => {
  Object.assign(swrResult, { data: undefined, error: null, isLoading: false }, state)
  return render(<MemoryRouter><CallToAction /></MemoryRouter>)
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

// The panel is a persistent frame: the heading and the "talk to us" prop
// bracket a slot that swaps between the connect button, the spinner, the
// error panel, the Proposal cards and the no-balance line. Before this it was
// the *whole section* that swapped — Proposal replaced it outright, and the
// heading was suppressed on error — so the second value proposition was
// invisible to exactly the connected holders it is aimed at.
describe('CallToAction persistent frame', () => {
  it('keeps the heading in every state, including the Proposal one', () => {
    renderCta({ data: PROPOSAL_DATA })

    expect(screen.getByTestId('proposal')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Use your crypto' })).toBeTruthy()
  })

  it('keeps the heading when the fetch has failed', () => {
    renderCta({ error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Use your crypto' })).toBeTruthy()
  })

  it('renders the talk-to-us prop by default', () => {
    renderCta({})

    expect(screen.getByRole('link', { name: /talk to us/i })).toBeTruthy()
  })

  // /contact sets this, so the prop does not offer a door to the page the
  // visitor is already standing in.
  it('drops the talk-to-us prop when hideContactPrompt is set', () => {
    Object.assign(swrResult, { data: undefined, error: null, isLoading: false })
    render(<MemoryRouter><CallToAction hideContactPrompt /></MemoryRouter>)

    expect(screen.queryByRole('link', { name: /talk to us/i })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Use your crypto' })).toBeTruthy()
  })
})
