import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Formatter } from './formatter'

// Default NUMBER_DISPLAY_LENGTH is 3 — most expected outputs below reflect
// that. `length` is an exact digit count, so short values are zero-padded to
// it ("2" -> "2.00") and a column of figures shares one decimal precision.

describe('Formatter.number', () => {
  it('pads zero to the requested precision, sign dropped', () => {
    expect(Formatter.number(0)).toBe('0.00')
    expect(Formatter.number('0.00')).toBe('0.00')
    expect(Formatter.number('0e0')).toBe('0.00')
    expect(Formatter.number(-0)).toBe('0.00')
    expect(Formatter.number(0, 1)).toBe('0')
  })

  it('pads small integers to the exact digit count', () => {
    expect(Formatter.number(1)).toBe('1.00')
    expect(Formatter.number(42)).toBe('42.0')
    expect(Formatter.number(999)).toBe('999')
  })

  it('never truncates the integer part to fit the digit count', () => {
    // Padding only ever adds decimals; an integer that already fills (or
    // overruns) `length` renders whole, without a trailing point.
    expect(Formatter.number(999, 2)).toBe('999')
    expect(Formatter.number(42, 1)).toBe('42')
  })

  it('honors a custom length', () => {
    expect(Formatter.number(2, 1)).toBe('2')
    expect(Formatter.number(2, 5)).toBe('2.0000')
    expect(Formatter.number(1.5, 4)).toBe('1.500')
  })

  it('scales to k / M / B suffixes at length-3 default', () => {
    expect(Formatter.number(1234)).toBe('1.23k')
    expect(Formatter.number(1_234_567)).toBe('1.23M')
    expect(Formatter.number(1_234_567_890)).toBe('1.23B')
  })

  it('pads scaled values whose fraction truncates to zero', () => {
    // 2000 -> "2k" would break the column alignment "1.23k" sets.
    expect(Formatter.number(2000)).toBe('2.00k')
    expect(Formatter.number(1_000_000)).toBe('1.00M')
    expect(Formatter.number(1_200_000_000)).toBe('1.20B')
  })

  it('preserves the sign on negative values', () => {
    expect(Formatter.number(-1234)).toBe('-1.23k')
    expect(Formatter.number(-7)).toBe('-7.00')
  })

  it('keeps the sign on short negative decimals', () => {
    // Regression: the int != '0' short-decimal branch used to drop the
    // prefix, so a negative delta rendered as a positive one.
    expect(Formatter.number(-5.2)).toBe('-5.20')
    expect(Formatter.number(-1.5)).toBe('-1.50')
  })

  it('expands scientific-notation strings before parsing', () => {
    // 1e-9 -> '0.000000001' -> still 0 at length-3 default (truncated below
    // the visible precision), so the "<0.01" rail kicks in.
    expect(Formatter.number(1e-9)).toBe('<0.01')
  })

  it('does not throw on values >= 1e21 (exponential toFixed edge)', () => {
    // Regression: Number(1e21).toFixed(9) stays "1e+21", which BigInt() can't
    // parse. These are absurd but reachable via aggregate stats.
    expect(() => Formatter.number(1e21)).not.toThrow()
    expect(() => Formatter.number(1.5e21)).not.toThrow()
    expect(Formatter.number(1e21)).toMatch(/^\d/)
  })
})

// A count is a cardinal quantity — there is no such thing as 2.00 delegators,
// so `count` never pads and never compacts. It is the formatter for things you
// count; `number` stays the formatter for things you measure.
describe('Formatter.count', () => {
  it('renders small integers whole, with no padding', () => {
    expect(Formatter.count(2)).toBe('2')
    expect(Formatter.count(0)).toBe('0')
    expect(Formatter.count(999)).toBe('999')
  })

  it('groups thousands rather than compacting to a k/M suffix', () => {
    // The exact answer exists and fits; "1.23k" would discard it.
    expect(Formatter.count(1234)).toBe('1,234')
    expect(Formatter.count(47_850)).toBe('47,850')
    expect(Formatter.count(1_234_567)).toBe('1,234,567')
  })

  it('accepts the same input types as number', () => {
    expect(Formatter.count('1234')).toBe('1,234')
    expect(Formatter.count(1234n)).toBe('1,234')
  })

  it('truncates a fractional input toward zero', () => {
    // Reaching this means the value was never a count upstream; render the
    // countable part rather than inventing a fraction of a delegator.
    expect(Formatter.count(2.7)).toBe('2')
    expect(Formatter.count(-2.7)).toBe('-2')
  })

  it('keeps the sign, but not on zero', () => {
    expect(Formatter.count(-5)).toBe('-5')
    expect(Formatter.count(-1234)).toBe('-1,234')
    expect(Formatter.count(-0)).toBe('0')
  })

  it('renders a missing count as the placeholder', () => {
    expect(Formatter.count(NaN)).toBe(Formatter.NO_VALUE)
    expect(Formatter.count(Infinity)).toBe(Formatter.NO_VALUE)
    expect(Formatter.count(undefined as never)).toBe(Formatter.NO_VALUE)
    expect(Formatter.count('abc')).toBe(Formatter.NO_VALUE)
  })

  it('does not throw on values >= 1e21 (exponential toString edge)', () => {
    expect(() => Formatter.count(1e21)).not.toThrow()
    expect(Formatter.count(1e21)).toMatch(/^\d[\d,]*$/)
  })
})

// Every formatter below is called during render with values derived from
// backend JSON. A missing field turns into NaN through arithmetic (or arrives
// as undefined outright), and the BigInt()/toISOString() calls inside these
// helpers throw on it — which unmounts the whole route. They must degrade to a
// placeholder instead of throwing; see NO_VALUE.
describe('Formatter non-finite input', () => {
  it('renders NaN as the placeholder instead of throwing', () => {
    expect(Formatter.number(NaN)).toBe(Formatter.NO_VALUE)
  })

  it('renders undefined and null as the placeholder instead of throwing', () => {
    expect(Formatter.number(undefined as never)).toBe(Formatter.NO_VALUE)
    expect(Formatter.number(null as never)).toBe(Formatter.NO_VALUE)
  })

  it('renders infinities as the placeholder instead of throwing', () => {
    expect(Formatter.number(Infinity)).toBe(Formatter.NO_VALUE)
    expect(Formatter.number(-Infinity)).toBe(Formatter.NO_VALUE)
  })

  it('renders unparseable numeric strings as the placeholder', () => {
    expect(Formatter.number('abc')).toBe(Formatter.NO_VALUE)
    expect(Formatter.number('')).toBe(Formatter.NO_VALUE)
  })

  it('returns a bare placeholder from usd, without a $ affix', () => {
    // "$—" reads as a real amount of nothing; the placeholder stands alone.
    expect(Formatter.usd(NaN)).toBe(Formatter.NO_VALUE)
  })

  it('returns a bare placeholder from percent, without a % affix', () => {
    expect(Formatter.percent(NaN)).toBe(Formatter.NO_VALUE)
  })

  it('renders invalid dates as the placeholder instead of throwing', () => {
    expect(Formatter.date(NaN)).toBe(Formatter.NO_VALUE)
    expect(Formatter.dateHuman(NaN)).toBe(Formatter.NO_VALUE)
  })

  it('still formats a genuine zero rather than treating it as missing', () => {
    // Guard against an over-eager falsy check swallowing 0.
    expect(Formatter.number(0)).toBe('0.00')
    expect(Formatter.usd(0)).toBe('$0.00')
    expect(Formatter.percent(0)).toBe('0.00%')
  })

  // These three don't throw on bad input — they render garbage, which is
  // worse in one specific way: it looks like a real answer. "NaNs" and a
  // "0 seconds ago" that actually means "no timestamp" both read as data.
  it('returns a bare placeholder from days, without a unit suffix', () => {
    expect(Formatter.days(NaN)).toBe(Formatter.NO_VALUE)
    expect(Formatter.days(Infinity)).toBe(Formatter.NO_VALUE)
  })

  it('renders a non-finite duration as the placeholder, not "NaNs"', () => {
    expect(Formatter.duration(NaN)).toBe(Formatter.NO_VALUE)
    expect(Formatter.duration(Infinity)).toBe(Formatter.NO_VALUE)
  })

  it('renders a non-finite relative date as the placeholder, not "0 seconds ago"', () => {
    // The dangerous one: a missing timestamp currently reports "just now".
    expect(Formatter.relativeDate(NaN)).toBe(Formatter.NO_VALUE)
    expect(Formatter.relativeDate(Infinity)).toBe(Formatter.NO_VALUE)
  })

  it('keeps the meaningful zero cases on the duration helpers', () => {
    // 0s / "0 seconds ago" are real answers when the input is a real 0.
    expect(Formatter.duration(0)).toBe('0s')
    expect(Formatter.days(0)).toBe('0 days')
    expect(Formatter.relativeDate(Date.now() / 1000)).toBe('0 seconds ago')
  })
})

describe('Formatter.address', () => {
  it('checksums a valid lowercase address', () => {
    const out = Formatter.address('0x' + 'a'.repeat(40))
    expect(out).toContain('...')
  })

  it('does not throw on an address with an invalid EIP-55 checksum', () => {
    // Mixed-case that fails the checksum would make getAddress throw.
    const bad = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01'
    expect(() => Formatter.address(bad)).not.toThrow()
  })
})

describe('Formatter.usd', () => {
  it('prefixes positive values with $', () => {
    expect(Formatter.usd(0)).toBe('$0.00')
    expect(Formatter.usd(42)).toBe('$42.0')
    expect(Formatter.usd(1234)).toBe('$1.23k')
  })

  it('places the sign in front of $ for negative values (not "$-…")', () => {
    expect(Formatter.usd(-136)).toBe('-$136')
    expect(Formatter.usd(-1234)).toBe('-$1.23k')
    expect(Formatter.usd('-7')).toBe('-$7.00')
  })

  it('places "<" in front of $ for sub-precision values (not "$<…")', () => {
    expect(Formatter.usd(1e-9)).toBe('<$0.01')
  })
})

describe('Formatter.percent', () => {
  it('multiplies by 100 and appends %', () => {
    // percent() spends its length budget on the ×100 shift: three digits by
    // default, so 50 gets one decimal and 100 gets none.
    expect(Formatter.percent(0)).toBe('0.00%')
    expect(Formatter.percent(0.5)).toBe('50.0%')
    expect(Formatter.percent(1)).toBe('100%')
  })

  it('adds decimals to the percentage with its length argument', () => {
    expect(Formatter.percent(0.5, 1)).toBe('50.00%')
    expect(Formatter.percent(0.9998, 1)).toBe('99.98%')
  })

  it('keeps the sign on negative percentages', () => {
    expect(Formatter.percent(-0.5)).toBe('-50.0%')
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

describe('Formatter.day', () => {
  it('renders an ISO calendar day', () => {
    expect(Formatter.day('2026-08-20')).toBe('20 Aug 2026')
    expect(Formatter.day('2026-01-02')).toBe('2 Jan 2026')
    expect(Formatter.day('2026-12-31')).toBe('31 Dec 2026')
  })

  // `new Date('2026-08-20')` is UTC midnight. Formatted in a negative-offset
  // zone without `timeZone: 'UTC'` it renders the *previous* day — a post
  // dated the 20th showing as the 19th for every reader west of Greenwich.
  // CI runs in UTC, so this assertion only bites on a developer machine that
  // is not; the guard proper is the explicit option in the implementation.
  it('does not shift the day off the end of a month', () => {
    expect(Formatter.day('2026-03-01')).toBe('1 Mar 2026')
  })

  it('returns the placeholder for anything unparseable', () => {
    expect(Formatter.day('not a date')).toBe(Formatter.NO_VALUE)
    expect(Formatter.day('')).toBe(Formatter.NO_VALUE)
    expect(Formatter.day(undefined as never)).toBe(Formatter.NO_VALUE)
    // `new Date(null)` is the epoch, not Invalid Date — without a typeof
    // guard this would render "1 Jan 1970", which looks like real data.
    expect(Formatter.day(null as never)).toBe(Formatter.NO_VALUE)
  })
})
