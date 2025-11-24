import { getAddress } from "ethers"

type intish = bigint | number | string

export namespace Formatter {

  export function percent(value: number, length: number): string {
    return number(100 * value, 2 + length) + '%'
  }

  export function number(value: intish, length: number, decimals = 0): string {
    let str = value.toString()

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
          const zeros = '0'.repeat(length - 3)
          res = `< 0.${zeros}1`
        }
      }
    }

    return prefix + res + suffix
  }

  export function address(adr: string, num = 5): string {
    if (adr.startsWith('0x')) {
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

  export function relativeDate(unix: number): string {
    const now = new Date(Date.now())
    const thn = new Date(unix * 1000)
    const dif = now.getTime() - thn.getTime()

    if (dif < 60_000) {
      const seconds = number(dif / 1000, 1)
      return `${seconds} seconds ago`
    } else if (dif < 3600_000) {
      const minutes = number(dif / 60_000, 1)
      return `${minutes} minutes ago`
    } else if (dif < 86400_000) {
      const hours = number(dif / 3600_000, 1)
      return `${hours} hours ago`
    }

    return date(unix)
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
    return [
      int.slice(0, int.length - n),
      int.substring(int.length - n, int.length) + dec
    ]
  }

  function splitintfrac(s: string, n: number): [string, string] {
    const spl = s.split('.')
    return shiftleft(spl[0], spl[1] ?? '', n)
  }

}
