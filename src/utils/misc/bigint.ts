export function expbigint(n: number, e: number): bigint {
  if (!Number.isFinite(n)) {
    throw new Error(`expbigint: expected a finite number, got ${n}`)
  }
  // n is frequently a fractional token amount (e.g. 1.5 FLR, or a balance
  // rounded to 2 decimals by a "Max" button), so BigInt(n) would throw a
  // RangeError. Expand n into a fixed-point decimal string with exactly e
  // fractional digits — toFixed never emits scientific notation at the token
  // magnitudes we handle — then assemble the scaled integer from its digits.
  const negative = n < 0
  const [int, frac = ''] = Math.abs(n).toFixed(e).split('.')
  const value = BigInt(int + frac)
  return negative ? -value : value
}