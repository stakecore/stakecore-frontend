// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// StatsChart pulls in recharts, which is heavy and needs real layout — stub
// it out so the tests only assert the section's conditional rendering.
vi.mock('~/components/ui/statsChart', () => ({
  default: () => <div data-testid="stats-chart" />,
}))

import ValidatorStatistics from './statistics'
import type { IGraphics } from './types'

const graphicsOf = (overrides: Partial<IGraphics> = {}): IGraphics => ({
  stats: {
    delegators: 10,
    networkShare: 0.01,
    capacity: { asset: 'FLR', ownedStake: 100, delegated: 200, available: 700 },
  },
  meterBar: {
    validatorUptime: { percent: 99 },
    validatorConnectedPChain: { percent: 95 },
    validatorConnectedCChain: { percent: 95 },
    validatorConnectedXChain: { percent: 95 },
  },
  countdown: { startTimeMs: 0, endTimeMs: Date.now() + 86_400_000 },
  epochApys: [],
  ...overrides,
})

describe('ValidatorStatistics APY chart section', () => {
  it('renders the APY chart when epoch APYs are available', async () => {
    render(<ValidatorStatistics config={graphicsOf({
      epochApys: [{ rewardEpoch: 100, apy: 0.05 }, { rewardEpoch: 101, apy: 0.06 }],
    })} />)
    expect(screen.getByText('APY through reward epochs')).toBeTruthy()
    // The chart is behind a lazy() boundary, so it resolves asynchronously.
    expect(await screen.findByTestId('stats-chart')).toBeTruthy()
  })

  it('hides the whole section when the epoch APY series is empty', () => {
    render(<ValidatorStatistics config={graphicsOf({ epochApys: [] })} />)
    expect(screen.queryByText('APY through reward epochs')).toBeNull()
    expect(screen.queryByTestId('stats-chart')).toBeNull()
  })
})
