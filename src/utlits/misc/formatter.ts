type intish = bigint | number | string

export namespace Formatter {

  export function format(value: intish, decimals: number, precision: number, suffix?: string): string {
    if (decimals < 0 || precision < 0) throw new Error("decimals and precision must be non-negative")
    const v = BigInt(value)

    const base = 10n ** BigInt(decimals)
    const intPart = v / base
    const fracPart = v % base

    if (precision === 0) return intPart.toString() + (suffix ?? '')
    let fracStr = fracPart.toString().padStart(decimals, "0").slice(0, precision)
    return `${intPart.toString()}.${fracStr}` + (suffix ?? '')
  }

  export function smartFormat(value: intish, decimals: number): string {
    const v = BigInt(value)
    if (v >= 10n ** BigInt(decimals + 5)) {
      let prec = 1
      if (v >= 10n ** BigInt(decimals + 6)) {
        prec = 0
      }
      return Formatter.format(v, decimals + 6, prec, 'M')
    } else if (v >= 10n ** BigInt(decimals + 2)) {
      let prec = 1
      if (v >= 10n ** BigInt(decimals + 3)) {
        prec = 0
      }
      return Formatter.format(v, decimals + 3, prec, 'K')
    } else {
      return Formatter.format(v, decimals, 2)
    }
  }

}