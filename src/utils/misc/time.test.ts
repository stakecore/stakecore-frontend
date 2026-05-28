import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { secondsUntil, sleep, unixnow } from './time'

// Pin Date.now via fake timers so all assertions are deterministic.
const NOW_MS = new Date('2026-05-28T12:00:00Z').getTime()

describe('unixnow', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(NOW_MS) })
  afterAll(() => { vi.useRealTimers() })

  it('returns the current epoch in seconds (floor of Date.now() / 1000)', () => {
    expect(unixnow()).toBe(Math.floor(NOW_MS / 1000))
  })

  it('rounds DOWN at sub-second precision', () => {
    // Set time at .999 ms past the second mark — should still report
    // the lower second.
    vi.setSystemTime(NOW_MS + 999)
    expect(unixnow()).toBe(Math.floor(NOW_MS / 1000))
    vi.setSystemTime(NOW_MS) // restore for the next test
  })
})

describe('secondsUntil', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(NOW_MS) })
  afterAll(() => { vi.useRealTimers() })

  it('returns the positive delta when the unix timestamp is in the future', () => {
    const now = Math.floor(NOW_MS / 1000)
    expect(secondsUntil(now + 60)).toBe(60)
    expect(secondsUntil(now + 3600)).toBe(3600)
  })

  it('returns a negative delta when the unix timestamp is in the past', () => {
    const now = Math.floor(NOW_MS / 1000)
    expect(secondsUntil(now - 30)).toBe(-30)
  })

  it('returns 0 at the exact instant', () => {
    const now = Math.floor(NOW_MS / 1000)
    expect(secondsUntil(now)).toBe(0)
  })
})

describe('sleep', () => {
  beforeAll(() => { vi.useFakeTimers() })
  afterAll(() => { vi.useRealTimers() })

  it('resolves after the requested ms (verified via fake-timer advance)', async () => {
    let resolved = false
    sleep(500).then(() => { resolved = true })
    // Not yet — only 499ms in.
    await vi.advanceTimersByTimeAsync(499)
    expect(resolved).toBe(false)
    // The next 1ms tips it over.
    await vi.advanceTimersByTimeAsync(1)
    expect(resolved).toBe(true)
  })
})
