import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Formatter } from './formatter'

// Default NUMBER_DISPLAY_LENGTH is 3 — most expected outputs below reflect that.

describe('Formatter.number', () => {
  it('renders zero as a bare "0" regardless of decimal padding', () => {
    expect(Formatter.number(0)).toBe('0')
    expect(Formatter.number('0.00')).toBe('0')
    expect(Formatter.number('0e0')).toBe('0')
  })

  it('keeps small integers unscaled', () => {
    expect(Formatter.number(1)).toBe('1')
    expect(Formatter.number(42)).toBe('42')
    expect(Formatter.number(999)).toBe('999')
  })

  it('scales to k / M / B suffixes at length-3 default', () => {
    expect(Formatter.number(1234)).toBe('1.23k')
    expect(Formatter.number(1_234_567)).toBe('1.23M')
    expect(Formatter.number(1_234_567_890)).toBe('1.23B')
  })

  it('preserves the sign on negative values', () => {
    expect(Formatter.number(-1234)).toBe('-1.23k')
    expect(Formatter.number(-7)).toBe('-7')
  })

  it('expands scientific-notation strings before parsing', () => {
    // 1e-9 -> '0.000000001' -> still 0 at length-3 default (truncated below
    // the visible precision), so the "<0.01" rail kicks in.
    expect(Formatter.number(1e-9)).toBe('<0.01')
  })
})

describe('Formatter.usd', () => {
  it('prefixes positive values with $', () => {
    expect(Formatter.usd(0)).toBe('$0')
    expect(Formatter.usd(42)).toBe('$42')
    expect(Formatter.usd(1234)).toBe('$1.23k')
  })

  it('places the sign in front of $ for negative values (not "$-…")', () => {
    expect(Formatter.usd(-136)).toBe('-$136')
    expect(Formatter.usd(-1234)).toBe('-$1.23k')
    expect(Formatter.usd('-7')).toBe('-$7')
  })

  it('places "<" in front of $ for sub-precision values (not "$<…")', () => {
    expect(Formatter.usd(1e-9)).toBe('<$0.01')
  })
})

describe('Formatter.percent', () => {
  it('multiplies by 100 and appends %', () => {
    expect(Formatter.percent(0)).toBe('0%')
    expect(Formatter.percent(0.5)).toBe('50%')
    expect(Formatter.percent(1)).toBe('100%')
  })

  it('keeps the sign on negative percentages', () => {
    expect(Formatter.percent(-0.5)).toBe('-50%')
  })
})

describe('Formatter.address', () => {
  it('checksums and truncates 0x EVM addresses with 5 chars each side by default', () => {
    // getAddress() emits EIP-55 mixed-case checksum, so the truncated
    // form keeps the same casing as a full canonical address.
    const raw = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    expect(Formatter.address(raw)).toBe('0xABcdE...FabCD')
  })

  it('truncates non-EVM strings without checksumming them', () => {
    const addr = 'flare1zxcvbnmasdfghjklqwertyuiop1234567890'
    // Start cut is `substring(0, 2 + num)` regardless of prefix shape,
    // so a 7-char head is taken from a bech32 input.
    expect(Formatter.address(addr)).toBe('flare1z...67890')
  })

  it('honors a custom side length', () => {
    const raw = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    expect(Formatter.address(raw, 3)).toBe('0xABc...bCD')
  })
})

describe('Formatter.duration', () => {
  it('returns "0s" for zero or negative ms', () => {
    expect(Formatter.duration(0)).toBe('0s')
    expect(Formatter.duration(-500)).toBe('0s')
  })

  it('formats sub-minute durations in seconds only', () => {
    expect(Formatter.duration(45_000)).toBe('45s')
  })

  it('composes days / hours / minutes / seconds in order, skipping zero parts', () => {
    // 1 day + 2 hours + 3 minutes + 4 seconds = 93_784_000 ms
    expect(Formatter.duration(93_784_000)).toBe('1d 2h 3m 4s')
    // 0 days, 5 hours, 0 minutes, 30 seconds -> '5h 30s'
    expect(Formatter.duration(5 * 3_600_000 + 30_000)).toBe('5h 30s')
  })
})

describe('Formatter.relativeDate', () => {
  // Date.now() is non-deterministic; pin it for these assertions.
  const NOW_MS = new Date('2026-05-28T12:00:00Z').getTime()
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(NOW_MS) })
  afterAll(() => { vi.useRealTimers() })

  it('returns "0 seconds ago" for "now" inputs (sub-second gap)', () => {
    const unix = Math.floor(NOW_MS / 1000)
    expect(Formatter.relativeDate(unix)).toBe('0 seconds ago')
  })

  it('reports a coarse single-unit by default', () => {
    const fiveMinAgo = Math.floor((NOW_MS - 5 * 60_000) / 1000)
    expect(Formatter.relativeDate(fiveMinAgo)).toBe('5 minutes ago')
    const twoHoursAgo = Math.floor((NOW_MS - 2 * 3_600_000) / 1000)
    expect(Formatter.relativeDate(twoHoursAgo)).toBe('2 hours ago')
  })

  it('respects the units cap (n) for finer-grained output', () => {
    // 1 day + 2 hours ago
    const at = Math.floor((NOW_MS - (86_400_000 + 2 * 3_600_000)) / 1000)
    expect(Formatter.relativeDate(at, 2)).toBe('1 day 2 hours ago')
  })

  it('pluralizes correctly for single vs many units', () => {
    const oneMinAgo = Math.floor((NOW_MS - 60_000) / 1000)
    expect(Formatter.relativeDate(oneMinAgo)).toBe('1 minute ago')
  })
})

describe('Formatter.error', () => {
  it('extracts a user-rejection action label from ethers error strings', () => {
    const msg = 'user rejected action (action="eth_sendTransaction", reason=...)'
    expect(Formatter.error(msg)).toBe('user rejected action "eth_sendTransaction"')
  })

  it('passes unrelated error strings through unchanged', () => {
    expect(Formatter.error('insufficient funds for transfer')).toBe('insufficient funds for transfer')
  })
})
