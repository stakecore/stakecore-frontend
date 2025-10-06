export namespace Formatter {

  export function formatBigint(value: bigint, decimals: number, precision: number): string {
    if (decimals < 0 || precision < 0) throw new Error("decimals and precision must be non-negative")

    const base = 10n ** BigInt(decimals)
    const intPart = value / base
    const fracPart = value % base

    if (precision === 0) return intPart.toString()
    let fracStr = fracPart.toString().padStart(decimals, "0").slice(0, precision)
    return `${intPart.toString()}.${fracStr}`
  }
}