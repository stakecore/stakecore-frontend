import { describe, it, expect } from 'vitest'
import { checkRangeAvailable } from './utils'

// --- checkRangeAvailable --------------------------------------------------

describe('checkRangeAvailable', () => {
  it('returns the available value when min <= max', () => {
    expect(checkRangeAvailable(0, 100, '50 FLR')).toBe('50 FLR')
    expect(checkRangeAvailable(5, 5, 'anything')).toBe('anything')
  })

  it('returns "Unavailable" when min > max (the range is degenerate)', () => {
    expect(checkRangeAvailable(10, 5, '50 FLR')).toBe('Unavailable')
  })
})
