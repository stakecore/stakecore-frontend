import { describe, it, expect } from 'vitest'
import { getProposalData } from './proposals'
import type { PageUserInfoDto } from '~/backendApi'
import { ApyDto, BalanceDto } from '~/backendApi'

// --- Test-data builders ---------------------------------------------------

// Backend APY entries are keyed by numeric (chain, protocol) IDs that get
// mapped to string labels inside getProposalData. Build small helpers that
// produce a well-shaped PageUserInfoDto from minimal inputs so each test
// reads as an obvious scenario, not a wall of fixture noise.

const apy = (chain: ApyDto.chain, protocol: ApyDto.protocol, value: number): ApyDto =>
  ({ chain, protocol, apy: value })

// Real backend responses ship a balance entry for every supported
// token (zero amount if the user holds none), so reflect that in the
// fixture rather than letting a test omit them. proposals.tsx looks
// missing entries up via Map.get(token) which returns undefined —
// passing that to Formatter.number would crash.
const ALL_TOKENS = ['FLR', 'WFLR', 'SGB', 'WSGB', 'AVAX']
const balancesFor = (amounts: Partial<Record<string, number>>): BalanceDto[] =>
  ALL_TOKENS.map(token => ({
    token,
    amount: amounts[token] ?? 0,
    chain: BalanceDto.chain._0, // not consumed by getProposalData
  }))

const fakeInfo = (overrides: Partial<PageUserInfoDto> = {}): PageUserInfoDto => ({
  balances: [],
  apys: [
    // Default: every (chain, protocol) pair has an APY entry so the lookup
    // map is fully populated even when a test only exercises one chain.
    apy(ApyDto.chain._0 as ApyDto.chain, ApyDto.protocol._0 as ApyDto.protocol, 0.05), // Flare FSP
    apy(ApyDto.chain._0 as ApyDto.chain, ApyDto.protocol._1 as ApyDto.protocol, 0.07), // Flare Validator
    apy(ApyDto.chain._1 as ApyDto.chain, ApyDto.protocol._0 as ApyDto.protocol, 0.04), // Songbird FSP
    apy(ApyDto.chain._2 as ApyDto.chain, ApyDto.protocol._1 as ApyDto.protocol, 0.06), // Avalanche Validator
  ],
  prices: { flr: 0.02, sgb: 0.01, avax: 25 } as PageUserInfoDto['prices'],
  ...overrides,
})

// --- Tests ----------------------------------------------------------------

describe('getProposalData — no holdings', () => {
  it('returns an empty array when the wallet has no balances', () => {
    expect(getProposalData(fakeInfo())).toEqual([])
  })

  it('ignores zero-amount balance entries (none of the if-checks fire)', () => {
    const out = getProposalData(fakeInfo({
      balances: balancesFor({}),
    }))
    expect(out).toEqual([])
  })
})

describe('getProposalData — Flare card', () => {
  it('renders a Flare card when FLR balance is positive', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ FLR: 100 }) }))
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 1, title: 'Flare Network' })
  })

  it('also renders when only WFLR is held (the if-test ORs FLR and WFLR)', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ WFLR: 50 }) }))
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('Flare Network')
  })

  it('lists both balances in sortInfo when FLR + WFLR are both present', () => {
    const out = getProposalData(fakeInfo({
      balances: balancesFor({ FLR: 100, WFLR: 50 }),
    }))
    expect(out[0].sortInfo).toBe('Invest your 100 FLR and 50 WFLR into our protocols to earn up to')
  })

  it('omits the zero side from sortInfo (joinTokenValues filters zeros)', () => {
    const out = getProposalData(fakeInfo({
      balances: balancesFor({ FLR: 100, WFLR: 0 }),
    }))
    expect(out[0].sortInfo).toBe('Invest your 100 FLR into our protocols to earn up to')
  })

  it('computes earned as validator APY × (FLR + WFLR) × FLR price', () => {
    // 0.07 × (100 + 50) × 0.02 = 0.21
    const out = getProposalData(fakeInfo({
      balances: balancesFor({ FLR: 100, WFLR: 50 }),
    }))
    expect(out[0].price).toBe('0.21')
  })

  it('produces the two-feature link list (validator + FSP) with formatted APYs', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ FLR: 10 }) }))
    expect(out[0].features).toEqual([
      { id: 1, feature: 'Earn 7% APY by delegating FLR to our validator', link: '/flare/validator' },
      { id: 2, feature: 'Earn 5% APY by delegating WFLR to our FSP provider', link: '/flare/fsp' },
    ])
  })
})

describe('getProposalData — Avalanche card', () => {
  it('renders only an Avalanche card for a wallet that just holds AVAX', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ AVAX: 2 }) }))
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 2, title: 'Avalanche' })
  })

  it('computes earned as validator APY × AVAX × AVAX price', () => {
    // 0.06 × 2 × 25 = 3
    const out = getProposalData(fakeInfo({ balances: balancesFor({ AVAX: 2 }) }))
    expect(out[0].price).toBe('3')
  })

  it('sortInfo uses the AVAX balance directly (no FLR-style "and" joining)', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ AVAX: 2 }) }))
    expect(out[0].sortInfo).toBe('Invest your 2 AVAX into our protocols to earn up to')
  })

  it('produces a single feature pointing to the avalanche validator route', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ AVAX: 1 }) }))
    expect(out[0].features).toEqual([
      { id: 1, feature: 'Earn 6% APY by delegating AVAX to our validator', link: '/avalanche/validator' },
    ])
  })
})

describe('getProposalData — Songbird card', () => {
  it('renders a Songbird card for SGB or WSGB holdings', () => {
    const sgb = getProposalData(fakeInfo({ balances: balancesFor({ SGB: 1000 }) }))
    expect(sgb).toHaveLength(1)
    expect(sgb[0]).toMatchObject({ id: 3, title: 'Songbird Canary Network' })

    const wsgb = getProposalData(fakeInfo({ balances: balancesFor({ WSGB: 500 }) }))
    expect(wsgb[0]).toMatchObject({ id: 3, title: 'Songbird Canary Network' })
  })

  it('computes earned as FSP APY × (SGB + WSGB) × SGB price', () => {
    // 0.04 × (1000 + 500) × 0.01 = 0.6
    const out = getProposalData(fakeInfo({
      balances: balancesFor({ SGB: 1000, WSGB: 500 }),
    }))
    expect(out[0].price).toBe('0.6')
  })

  it('produces a single feature pointing to the songbird FSP route', () => {
    const out = getProposalData(fakeInfo({ balances: balancesFor({ SGB: 1 }) }))
    expect(out[0].features).toEqual([
      { id: 1, feature: 'Earn 4% APY by delegating WSGB to our FSP provider', link: '/songbird/fsp' },
    ])
  })
})

describe('getProposalData — multi-chain ordering', () => {
  it('returns the cards in fixed source order (Flare, Avalanche, Songbird) when the wallet holds tokens for every chain', () => {
    const out = getProposalData(fakeInfo({
      balances: balancesFor({ FLR: 100, AVAX: 2, SGB: 1000 }),
    }))
    expect(out.map(r => r.title)).toEqual([
      'Flare Network',
      'Avalanche',
      'Songbird Canary Network',
    ])
  })
})
