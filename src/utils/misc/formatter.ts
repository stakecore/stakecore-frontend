import { getAddress } from "ethers"
import { NUMBER_DISPLAY_LENGTH } from "~/constants"

type intish = bigint | number | string

const UNITS: [number, string][] = [
  [86400_000, 'day'],
  [3600_000, 'hour'],
  [60_000, 'minute'],
  [1000, 'second'],
]

export namespace Formatter {

  // Rendered in place of a number that doesn't exist. Every formatter here is
  // called during render with values derived from backend JSON, where a missing
  // field becomes NaN through arithmetic (or arrives as undefined outright).
  // BigInt() and Date#toISOString() both *throw* on those, and a throw inside
  // render unmounts the whole route — a blank protocol page because one field
  // was late. Degrading to this marker keeps the rest of the page alive.
  export const NO_VALUE = '—'

  // True only for values `number()` can actually render. bigint is always
  // finite; a numeric string is validated by parsing (the parse is a gate, not
  // a conversion — the digits themselves still go through BigInt below, so
  // precision beyond a double survives). Anything else — undefined, null, NaN,
  // ±Infinity, '' , 'abc' — is not renderable.
  function renderable(value: intish): boolean {
    if (typeof value === 'bigint') return true
    if (typeof value === 'number') return Number.isFinite(value)
    if (typeof value === 'string') return value.trim() !== '' && Number.isFinite(Number(value))
    return false
  }

  export function percent(value: number, length: number = 0): string {
    // Bare marker, no '%' affix — "—%" reads as a real measurement.
    if (!renderable(value)) return NO_VALUE
    return number(100 * value, 3 + length) + '%'
  }

  // Currency formatter — keeps both the sign and the below-precision
  // marker in front of the currency symbol, so we get "-$1.2k" and
  // "<$0.01" instead of the malformed "$-1.2k" / "$<0.01" you'd get from
  // concatenating "$" + number(...) directly.
  export function usd(value: intish, length = NUMBER_DISPLAY_LENGTH, decimals = 0): string {
    // Bare marker, no '$' affix — "$—" reads as a real amount.
    if (!renderable(value)) return NO_VALUE
    const str = value.toString()
    const negative = str.startsWith('-')
    const formatted = number(negative ? str.slice(1) : str, length, decimals)
    // Below visible precision: the sign is moot at sub-cent magnitudes.
    if (formatted.startsWith('<')) return '<$' + formatted.slice(1)
    return (negative ? '-$' : '$') + formatted
  }

  // `length` is an exact digit count, not a maximum: results are padded with
  // trailing zeros until they carry exactly that many digits ("2" -> "2.00",
  // "2k" -> "2.00k" at the length-3 default), so a column of figures shares one
  // decimal precision. Only the integer part can exceed it — a value whose
  // integer digits already fill `length` renders without a fraction, and the
  // "<0.01" sub-precision rail is a marker rather than a number, so neither is
  // padded.
  export function number(value: intish, length = NUMBER_DISPLAY_LENGTH, decimals = 0): string {
    if (!renderable(value)) return NO_VALUE
    let str = value.toString()

    if (str.includes('e')) {
      // toFixed expands small magnitudes (1e-9 → "0.000000001"), but bails
      // back to exponential for |n| >= 1e21 — and BigInt() below can't parse
      // "1e+21". Those are always integral at that scale, so expand via BigInt.
      const n = Number(str)
      str = Math.abs(n) >= 1e21 ? BigInt(n).toString() : n.toFixed(9)
    }

    let prefix = ''
    if (str.startsWith('-')) {
      prefix = '-'
      str = str.slice(1)
    }

    let [int, dec] = splitintfrac(str, decimals)
    // Zero drops the sign but keeps the padding, so an empty stat still lines
    // up with its non-zero neighbours.
    if (BigInt(int + dec) == BigInt(0)) return padfrac('0', '', length)

    if (int.length + dec.length <= length) {
      return prefix + padfrac(int, dec, length)
    }

    let res = ''
    let suffix = ''
    let sepidx = 0
    if (int.length > 9) {
      suffix = 'B'
      sepidx = 9
    } else if (int.length > 6) {
      suffix = 'M'
      sepidx = 6
    } else if (int.length > 3) {
      suffix = 'k'
      sepidx = 3
    }

    if (sepidx > 0) {
      [int, dec] = shiftleft(int, dec, sepidx)
    }

    const maxdeclen = length - int.length
    if (maxdeclen <= 0) {
      res = int
    } else if (maxdeclen >= dec.length) {
      res = padfrac(int, dec, length)
    } else {
      const cutdec = dec.substring(0, maxdeclen)
      // Everything visible truncated to zero and nothing left of the point:
      // the value is below the displayable precision, so say so instead of
      // rendering a padded "0.00" that reads as an exact zero.
      if (Number(cutdec) == 0 && Number(int) == 0) {
        const zeros = '0'.repeat(length - 2)
        res = `<0.${zeros}1`
      } else {
        res = int + '.' + cutdec
      }
    }

    return prefix + res + suffix
  }

  // Cardinal quantities — delegators, validators, anything you count rather
  // than measure. `number`'s exact-digit padding is wrong here: it renders 2
  // delegators as "2.00", and a count has no sub-unit for those digits to
  // describe. So this one never pads and never compacts to a k/M suffix — the
  // exact answer exists and is short enough to show.
  export function count(value: intish): string {
    if (!renderable(value)) return NO_VALUE
    let str = value.toString()

    if (str.includes('e')) {
      // Same expansion `number` does: BigInt() can't parse "1e+21", and
      // toFixed bails back to exponential above that magnitude.
      const n = Number(str)
      str = Math.abs(n) >= 1e21 ? BigInt(n).toString() : n.toFixed(9)
    }

    let prefix = ''
    if (str.startsWith('-')) {
      prefix = '-'
      str = str.slice(1)
    }

    // Truncation toward zero, not rounding: a fractional count means something
    // upstream stopped being a count, and rounding 2.7 up to 3 would invent a
    // delegator that isn't there.
    const int = (str.split('.')[0] ?? '').replace(/^0+(?=\d)/, '')
    if (int === '' || BigInt(int) == BigInt(0)) return '0'
    return prefix + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  export function address(adr: string, num = 5): string {
    if (adr.startsWith('0x') && adr.length == 42) {
      // getAddress throws on an invalid EIP-55 checksum; fall back to the raw
      // address (still truncated below) rather than crashing the render.
      try {
        adr = getAddress(adr)
      } catch { /* keep the raw address */ }
    }
    const start = adr.substring(0, 2 + num)
    const end = adr.substring(adr.length - num)
    return `${start}...${end}`
  }

  export function date(unix: number): string {
    const d = new Date(unix * 1000)
    // toISOString throws RangeError on an invalid date rather than returning
    // "Invalid Date" the way toLocaleDateString does.
    if (Number.isNaN(d.getTime())) return NO_VALUE
    // Fixed-width slice rather than split('.')[0] — the ISO layout is
    // "YYYY-MM-DDTHH:mm:ss.sssZ", so 19 chars is exactly through the seconds.
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }

  export function dateHuman(unix: number): string {
    const d = new Date(unix * 1000)
    if (Number.isNaN(d.getTime())) return NO_VALUE
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // News post dates are ISO calendar days ("2026-08-20"), not the unix
  // seconds every other date helper here takes. Several details are
  // load-bearing:
  //
  //   • `timeZone: 'UTC'`. `new Date('2026-08-20')` is parsed as UTC
  //     midnight, so formatting it in a negative-offset zone would render the
  //     previous day — a post dated the 20th showing as the 19th for every
  //     reader west of Greenwich.
  //   • The typeof guard. `new Date(null)` is the epoch rather than Invalid
  //     Date, so without it a null date renders "1 Jan 1970" — garbage that
  //     looks like an answer, which is the failure mode NO_VALUE exists for.
  //   • The regex guard. An unpadded string like '2026-8-20' still parses,
  //     but as *local* midnight rather than UTC — the same off-by-one the
  //     `timeZone: 'UTC'` option above exists to prevent, entering through a
  //     different door. Requiring the zero-padded shape closes that.
  //   • The round-trip check. '2026-02-30' also parses — the platform
  //     silently normalises it to 2 March — so re-serialising the parsed
  //     date and comparing it back to the input catches a calendar day that
  //     never existed. `day` is for ISO calendar days; a plausible-looking
  //     guess is exactly what NO_VALUE exists to avoid.
  export function day(iso: string): string {
    if (typeof iso !== 'string') return NO_VALUE
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NO_VALUE
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return NO_VALUE
    if (d.toISOString().slice(0, 10) !== iso) return NO_VALUE
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  export function relativeDate(unix: number, n = 1): string {
    // Without this a missing timestamp falls through every unit and reports
    // "0 seconds ago" — an absent value rendered as "just now".
    if (!renderable(unix)) return NO_VALUE
    let dif = Date.now() - unix * 1000
    const parts: string[] = []

    for (const [ms, label] of UNITS) {
      if (parts.length >= n) break
      const count = Math.floor(dif / ms)
      if (count > 0) {
        parts.push(`${count} ${label}${count != 1 ? 's' : ''}`)
        dif -= count * ms
      }
    }

    return (parts.length > 0 ? parts.join(' ') : '0 seconds') + ' ago'
  }

  export function days(unix: number): string {
    // Bare marker, no ' days' suffix — the unit implies a quantity.
    if (!renderable(unix)) return NO_VALUE
    return number(unix / 86400, 1) + ' days'
  }

  export function duration(ms: number): string {
    // NaN fails the <= 0 test below, then every part comes out NaN and the
    // zero-fallback emits the literal string "NaNs".
    if (!renderable(ms)) return NO_VALUE
    if (ms <= 0) return "0s"
    const s = Math.floor(ms / 1000)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const parts: string[] = []
    if (d) parts.push(`${d}d`)
    if (h) parts.push(`${h}h`)
    if (m) parts.push(`${m}m`)
    if (sec || parts.length === 0) parts.push(`${sec}s`)
    return parts.join(" ")
  }

  export function error(msg: string): string {
    const regex = /user rejected action\s*\(action="([^"]+)"/i
    const match = msg.match(regex)
    if (match) {
      const [_, action] = match
      return `user rejected action "${action}"`
    }
    return msg
  }

  // Joins an integer and fractional part into exactly `length` digits, padding
  // the fraction with trailing zeros. Callers only reach it with a fraction
  // that fits, so this pads and never rounds.
  function padfrac(int: string, dec: string, length: number): string {
    const declen = Math.max(length - int.length, 0)
    if (declen == 0) return int
    return int + '.' + dec.padEnd(declen, '0')
  }

  function shiftleft(int: string, dec: string, n: number): [string, string] {
    if (n == 0) return [int, dec]
    const decshift = n >= int.length ? n - int.length : -1
    return decshift == -1 ? [
      int.slice(0, int.length - n),
      int.substring(int.length - n, int.length) + dec
    ] : ['0', '0'.repeat(decshift) + int + dec]
  }

  function splitintfrac(s: string, n: number): [string, string] {
    const spl = s.split('.')
    // split always yields at least one element; the ?? satisfies
    // noUncheckedIndexedAccess without pretending the empty case is reachable.
    return shiftleft(spl[0] ?? '', spl[1] ?? '', n)
  }

}
