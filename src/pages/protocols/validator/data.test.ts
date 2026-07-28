import { describe, it, expect } from 'vitest'
import { Chain } from '~/enums'
import { createValidatorDataAccess, type ValidatorService } from './data'
import type { PChainValidatorInfoDto } from '~/backendApi'

const infoOf = (overrides: Partial<PChainValidatorInfoDto> = {}): PChainValidatorInfoDto => ({
  validatorNodeId: 'NodeID-1',
  validatorTransactionHash: '0xabc',
  featured: true,
  apy: 0.07,
  epochApys: [],
  minimumDelegated: 25,
  validatorFee: 10,
  validatorOwnedStake: 100_000,
  validatorTotalStake: 1_500_000,
  validatorAvailableCapacity: 1_000_000,
  validatorStartTime: 1_700_000_000,
  validatorEndTime: 1_800_000_000,
  totalDelegators: 10,
  totalDelegated: 400_000,
  validatorNetworkShare: 0.01,
  validatorUptime: 99,
  pChainConnected: 95,
  cChainConnected: 95,
  xChainConnected: 95,
  ...overrides,
})

const serviceOf = (info: PChainValidatorInfoDto): ValidatorService => ({
  getDelegatorInfo: () => Promise.reject(new Error('unused')),
  getValidatorPageInfo: () => Promise.resolve({ data: [info] }),
})

describe('createValidatorDataAccess epoch APYs', () => {
  it('threads epochApys from the DTO into graphics', async () => {
    const epochApys = [{ rewardEpoch: 100, apy: 0.05 }, { rewardEpoch: 101, apy: 0.06 }]
    const access = createValidatorDataAccess(Chain.FLARE, serviceOf(infoOf({ epochApys })))
    const [validator] = await access.getPageData()
    expect(validator.graphics.epochApys).toEqual(epochApys)
  })

  it('defaults epochApys to [] when the backend omits the field', async () => {
    const info = infoOf()
    delete (info as Partial<PChainValidatorInfoDto>).epochApys
    const access = createValidatorDataAccess(Chain.FLARE, serviceOf(info))
    const [validator] = await access.getPageData()
    expect(validator.graphics.epochApys).toEqual([])
  })
})
