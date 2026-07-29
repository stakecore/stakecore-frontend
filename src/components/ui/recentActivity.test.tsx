// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ApiResponseDto_PageStatsDto, PageActivityDto } from '~/backendApi'
import RecentActivity from './recentActivity'

// The marquee measures itself via IntersectionObserver + rAF; neither matters
// for key/identity assertions, so stub IO out rather than fight happy-dom.
vi.stubGlobal('IntersectionObserver', class {
  observe() {}
  disconnect() {}
})

const activity = (o: Partial<PageActivityDto>): PageActivityDto => ({
  type: PageActivityDto.type.DELEGATION,
  delegatee: '0x1e68DC808A240C096F0261144dc41fd4c883Cfb0',
  delegator: '0xAAAA000000000000000000000000000000000001',
  amount: '111',
  transaction: '0xtx_a',
  timestamp: 1785302268,
  chain: PageActivityDto.chain._0,
  protocol: PageActivityDto.protocol._0,
  ...o,
})

const payload = (items: PageActivityDto[]): ApiResponseDto_PageStatsDto => ({
  status: 200,
  data: {
    activity: items,
    delegated: [],
    historicDelegations: [],
  },
} as ApiResponseDto_PageStatsDto)

const amounts = (c: HTMLElement) =>
  [...c.querySelectorAll('.activity-amount-value')].map(n => n.textContent?.trim())

afterEach(cleanup)

describe('RecentActivity', () => {
  // The backend emits one entry per delegation event, not per transaction: a
  // batched delegation, or a redelegation (a +/- pair), yields several entries
  // sharing one transaction hash. Both shapes occur in live /api/page/info data.
  const batched = [
    activity({ transaction: '0xtx_same', amount: '111', delegator: '0xAAAA1' }),
    activity({ transaction: '0xtx_same', amount: '222', delegator: '0xBBBB2' }),
    activity({ transaction: '0xtx_other', amount: '333', timestamp: 1785302000 }),
  ]

  it('renders every entry of a transaction that emitted several', () => {
    const { container } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    // The track is duplicated for the marquee loop, so each entry appears twice.
    expect(amounts(container)).toEqual(['111', '222', '333', '111', '222', '333'])
  })

  it('keeps entries distinct and ordered when the list updates', () => {
    const { container, rerender } = render(
      <RecentActivity data={payload(batched)} isLoading={false} error="" />
    )
    const newest = activity({ transaction: '0xtx_new', amount: '444', timestamp: 1785999999 })
    rerender(
      <RecentActivity data={payload([newest, ...batched])} isLoading={false} error="" />
    )
    // Newest first, no stale or duplicated card injected by a key collision.
    expect(amounts(container)).toEqual([
      '444', '111', '222', '333',
      '444', '111', '222', '333',
    ])
  })
})
