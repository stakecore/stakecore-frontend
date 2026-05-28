import { describe, it, expect } from 'vitest'
import { expbigint } from './bigint'

describe('expbigint', () => {
  it('returns 0n when the integer multiplier is 0', () => {
    expect(expbigint(0, 18)).toBe(0n)
  })

  it('produces 10^e × n as a bigint', () => {
    expect(expbigint(1, 0)).toBe(1n)
    expect(expbigint(1, 18)).toBe(10n ** 18n)
    expect(expbigint(5, 6)).toBe(5_000_000n)
  })

  it('handles negative multipliers', () => {
    expect(expbigint(-3, 4)).toBe(-30_000n)
  })

  it('survives values beyond Number.MAX_SAFE_INTEGER once scaled', () => {
    // 1e30 cannot be represented as a Number safely, but expbigint must
    // produce the exact bigint without precision loss.
    expect(expbigint(1, 30).toString()).toBe('1' + '0'.repeat(30))
  })
})
