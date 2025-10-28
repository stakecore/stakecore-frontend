import { getAddress } from "ethers"

type intish = bigint | number | string

export namespace Formatter {

  export function percent(value: number, length: number): string {
    return number(100 * value, 2 + length) + '%'
  }

  export function number(value: intish, length: number, decimals = 0): string {
    let [int, dec] = splitintfrac(value.toString(), decimals)
    if (BigInt(int + dec) == BigInt(0)) return '0'

    if (int.length + dec.length <= length) {
      if (dec.length == 0) {
        return int
      } else if (int == '0') {
        return `0.${dec}`
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

    return res + suffix
  }

  export function address(adr: string, num = 5): string {
    if (adr.startsWith('0x')) {
      adr = getAddress(adr)
    }
    const start = adr.substring(0, 2 + num)
    const end = adr.substring(adr.length - num)
    return `${start}...${end}`
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
