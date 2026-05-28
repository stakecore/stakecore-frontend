// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Module-level mocks ----------------------------------------------
//
// The picker pulls in a few helpers we don't want to exercise here:
// - changeOpacity mutates a separate #overlay DOM element; we don't
//   care about its side effect in these a11y tests.
// - requestAccounts / switchNetworkIfNecessary touch a fake provider's
//   RPC surface; not under test here either.
//
// We mock both so the focus-management assertions stay focused.

vi.mock('~/utils/dom', () => ({
  changeOpacity: vi.fn(),
}))
vi.mock('./eip1193', () => ({
  requestAccounts: vi.fn().mockResolvedValue([]),
  switchNetworkIfNecessary: vi.fn().mockResolvedValue(false),
}))
vi.mock('./discover', () => ({
  useExternalStore: () => ({
    walletProviders: [
      { info: { uuid: 'metamask', name: 'MetaMask', icon: 'data:,', rdns: 'io.metamask' }, provider: {} },
      { info: { uuid: 'rabby',    name: 'Rabby',    icon: 'data:,', rdns: 'io.rabby'    }, provider: {} },
    ],
  }),
}))

import Eip6963 from './picker'
import { useGlobalStore } from './store'

// --- Setup -----------------------------------------------------------

beforeEach(() => {
  // The portal target the SUT createPortal()s into. Real index.html has
  // <div id="eip6963"></div>; in tests we stage one per test.
  const portal = document.createElement('div')
  portal.id = 'eip6963'
  document.body.appendChild(portal)
  // Open the picker for each test (the component returns null when
  // walletChoiceVisible is false).
  useGlobalStore.setState({ walletChoiceVisible: true, walletProvider: null, walletAddress: null, chain: null })
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  useGlobalStore.setState({ walletChoiceVisible: false })
  vi.clearAllMocks()
})

// --- Tests -----------------------------------------------------------

describe('Wallet picker — render shape', () => {
  it('renders a dialog with the wallet provider buttons inside', () => {
    render(<Eip6963 />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBe('wallet-modal-title')
    expect(screen.getByText('MetaMask')).toBeTruthy()
    expect(screen.getByText('Rabby')).toBeTruthy()
  })

  it('returns null when the store says the picker should be hidden', () => {
    useGlobalStore.setState({ walletChoiceVisible: false })
    const { container } = render(<Eip6963 />)
    // Nothing rendered into the portal.
    expect(document.getElementById('eip6963')!.innerHTML).toBe('')
    // Component itself returns null.
    expect(container.innerHTML).toBe('')
  })
})

describe('Wallet picker — keyboard a11y', () => {
  it('moves focus into the dialog (first focusable) on open', () => {
    render(<Eip6963 />)
    // The first focusable inside the dialog is the first provider button.
    const firstProviderBtn = screen.getByText('MetaMask').closest('button')
    expect(document.activeElement).toBe(firstProviderBtn)
  })

  it('closes on Escape — flips walletChoiceVisible to false', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(true)
    await user.keyboard('{Escape}')
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(false)
  })

  it('traps Tab — focus does not escape the dialog at the last focusable', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)

    const dialog = screen.getByRole('dialog')
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    // Start at first (initial autofocus).
    expect(document.activeElement).toBe(first)
    // Tab through to the last focusable.
    for (let i = 0; i < focusables.length - 1; i++) await user.tab()
    expect(document.activeElement).toBe(last)
    // One more Tab wraps back to the first instead of leaving the dialog.
    await user.tab()
    expect(document.activeElement).toBe(first)
  })

  it('traps Shift+Tab — focus wraps from first to last instead of leaving', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)
    const dialog = screen.getByRole('dialog')
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    expect(document.activeElement).toBe(first)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(last)
  })
})

describe('Wallet picker — backdrop and close', () => {
  it('closes when the backdrop (wallet-container) is clicked', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)
    const backdrop = document.querySelector('.wallet-container')!
    await user.click(backdrop as Element)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(false)
  })

  it('does NOT close when a click lands inside the dialog (stopPropagation on the panel)', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(true)
  })

  it('closes when the dedicated close button is clicked', async () => {
    const user = userEvent.setup()
    render(<Eip6963 />)
    const closeBtn = screen.getByLabelText('Close wallet picker')
    await user.click(closeBtn)
    expect(useGlobalStore.getState().walletChoiceVisible).toBe(false)
  })
})
