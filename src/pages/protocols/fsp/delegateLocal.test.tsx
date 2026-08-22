// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Chain } from '~/enums'

// Same ladder-order defect as queryState.tsx / hero.tsx / callToAction.tsx.
// This one polls every 10s (REFRESH_QUERY_FAST_MS), so once it is in an error
// state the panel was rebuilt on a fixed 10s cadence for as long as the user
// left the page open.

const swrResult = { data: undefined as unknown, error: null as unknown, isLoading: false }
vi.mock('swr', () => ({ default: () => swrResult, useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock('spinners-react', () => ({ SpinnerCircular: () => <div data-testid="spinner" /> }))
vi.mock('~/pages/protocols/fspLocalDelegate', () => ({ default: () => <div data-testid="delegate" /> }))

const store = { setWalletChoiceVisible: vi.fn(), walletChoiceVisible: false, walletAddress: '0xabc' }
vi.mock('~/features/wallet/store', () => ({
  useGlobalStore: (selector: (s: typeof store) => unknown) => selector(store),
}))

import FspLocalDelegateComponent from './delegateLocal'

const renderDelegate = (state: Partial<typeof swrResult>) => {
  Object.assign(swrResult, { data: undefined, error: null, isLoading: false }, state)
  return render(
    <FspLocalDelegateComponent
      config={{ chain: Chain.FLARE, loadContracts: vi.fn() as never }}
    />,
  )
}

const errorPanel = () => document.querySelector('.error-container')

afterEach(cleanup)

describe('FspLocalDelegateComponent error precedence', () => {
  it('shows the spinner on the very first load', () => {
    renderDelegate({ isLoading: true })

    expect(screen.getByTestId('spinner')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })

  it('keeps the error panel while a retry is in flight', () => {
    renderDelegate({ isLoading: true, error: new Error('Failed to fetch') })

    expect(errorPanel()).toBeTruthy()
    expect(screen.queryByTestId('spinner')).toBeNull()
  })

  it('keeps the delegate form on screen when a background refresh fails', () => {
    renderDelegate({ data: { balances: {} }, error: new Error('Failed to fetch') })

    expect(screen.getByTestId('delegate')).toBeTruthy()
    expect(errorPanel()).toBeNull()
  })
})
