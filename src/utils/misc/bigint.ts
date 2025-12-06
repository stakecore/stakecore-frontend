export function expbigint(n: number, e: number): bigint {
  return BigInt(10) ** BigInt(e) * BigInt(n)
}