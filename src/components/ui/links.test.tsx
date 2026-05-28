// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CopyPasteButton, HashLink } from './links'

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

// navigator.clipboard is a getter in happy-dom; assignment doesn't take.
// Use Object.defineProperty once for the whole file.
const clipboardWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: clipboardWriteText },
  writable: true,
  configurable: true,
})

beforeEach(() => {
  clipboardWriteText.mockClear()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

// --- CopyPasteButton --------------------------------------------------

describe('CopyPasteButton', () => {
  // react-router-dom's Link intercepts the synthetic click; userEvent's
  // simulated chain doesn't reach the onClick prop reliably here. Use
  // fireEvent.click — it dispatches a synthetic React event that goes
  // straight through the Link's preventDefault path.

  it('writes the supplied text to the clipboard on click', () => {
    renderWithRouter(<CopyPasteButton text="0xdeadbeef" />)
    const btn = screen.getByRole('link')
    fireEvent.click(btn)
    expect(clipboardWriteText).toHaveBeenCalledWith('0xdeadbeef')
  })

  it('schedules a 2 s timer to reset the "copied" state after the click', () => {
    // The icon swap itself is too RemixIcon-internal to assert reliably
    // (the color prop is forwarded to a fill, not an outer attribute).
    // The observable contract is: click schedules a 2 s timer. We can
    // assert the timer count grows by one after click.
    vi.useFakeTimers()
    renderWithRouter(<CopyPasteButton text="0xabc" />)
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.click(screen.getByRole('link'))
    expect(vi.getTimerCount()).toBe(1)
  })
})

// --- HashLink ---------------------------------------------------------

describe('HashLink', () => {
  it('renders a truncated hash as the link text, opening url in a new tab safely', () => {
    const hash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    renderWithRouter(<HashLink address={hash} url="https://explorer.example/tx/0x123" />)
    const anchor = screen.getByRole('link', { name: /0x/ })
    expect(anchor.getAttribute('href')).toBe('https://explorer.example/tx/0x123')
    expect(anchor.getAttribute('target')).toBe('_blank')
    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('uses Formatter.address with the default length (10)', () => {
    const hash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    renderWithRouter(<HashLink address={hash} url="https://explorer.example/" />)
    // EIP-55 checksummed by Formatter; head + tail both 10 chars long.
    const anchor = screen.getByRole('link', { name: /0x/ })
    // 0x + 10 + ... + 10 = 24 visible chars
    const match = anchor.textContent!.match(/^(0x.{10})\.\.\.(.{10})$/)
    expect(match).not.toBeNull()
  })

  it('renders the copy button by default, hidden when copy={false}', () => {
    const hash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    const { rerender } = renderWithRouter(
      <HashLink address={hash} url="https://x.com/" />,
    )
    // 2 links: the anchor + the CopyPasteButton (which is a <Link>).
    expect(screen.getAllByRole('link')).toHaveLength(2)
    rerender(
      <MemoryRouter>
        <HashLink address={hash} url="https://x.com/" copy={false} />
      </MemoryRouter>,
    )
    // Only the anchor now.
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
