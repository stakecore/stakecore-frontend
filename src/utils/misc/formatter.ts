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

  export function percent(value: number, length: number = 0): string {
    return number(100 * value, 3 + length) + '%'
  }

  export function number(value: intish, length = NUMBER_DISPLAY_LENGTH, decimals = 0): string {
    let str = value.toString()

    if (str.includes('e')) {
      str = Number(str).toFixed(9)
    }

    let prefix = ''
    if (str.startsWith('-')) {
      prefix = '-'
      str = str.slice(1)
    }

    let [int, dec] = splitintfrac(str, decimals)
    if (BigInt(int + dec) == BigInt(0)) return '0'

    if (int.length + dec.length <= length) {
      if (dec.length == 0) {
        return prefix + int
      } else if (int == '0') {
        return `${prefix}0.${dec}`
      } else {
        return `${int}.${dec}`
      }
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
      res = int + '.' + dec
    } else {
      const cutdec = dec.substring(0, maxdeclen)
      if (Number(cutdec) != 0) {
        res = int + '.' + cutdec
      } else {
        if (Number(int) != 0) {
          res = int
        } else {
          const zeros = '0'.repeat(length - 2)
          res = `<0.${zeros}1`
        }
      }
    }

    return prefix + res + suffix
  }

  export function address(adr: string, num = 5): string {
    if (adr.startsWith('0x') && adr.length == 42) {
      adr = getAddress(adr)
    }
    const start = adr.substring(0, 2 + num)
    const end = adr.substring(adr.length - num)
    return `${start}...${end}`
  }

  export function date(unix: number): string {
    const d = new Date(unix * 1000)
    return d.toISOString().replace('T', ' ').split('.')[0];
  }

  export function dateHuman(unix: number): string {
    const d = new Date(unix * 1000)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  export function relativeDate(unix: number, n = 1): string {
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
    return number(unix / 86400, 1) + ' days'
  }

  export function duration(ms: number): string {
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
    return shiftleft(spl[0], spl[1] ?? '', n)
  }

}
