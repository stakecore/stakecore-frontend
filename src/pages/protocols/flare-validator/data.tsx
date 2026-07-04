import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "~/components/ui/links"
import { unixnow } from "~/utils/misc/time"
import { flarePChainTransactionUrl, flareValidatorUrl } from "~/constants"
import { checkRangeAvailable } from "../utils"
import { ApiResponseDto_AvalancheDelegatorInfoDto, PChainValidatorInfoDto, FlareValidatorService } from "~/backendApi"
import type { AvalancheData, IDelegation, IGraphics } from "./types"
import type { ISpecs, ISummary } from "../types"

export namespace FlareValidatorDataAccess {

  export async function getDelegatorInfo(address: string, pchain: string): Promise<ApiResponseDto_AvalancheDelegatorInfoDto> {
    return await FlareValidatorService.flareValidatorControllerGetFlareDelegatorInfo(address, pchain)
  }

  async function getPageData(): Promise<PChainValidatorInfoDto[]> {
    const resp = await FlareValidatorService.flareValidatorControllerGetFlareValidatorPageInfo()
    return resp.data
  }

  export async function getFlarePageData(): Promise<AvalancheData[]> {
    const bases = await getPageData()
    return bases.map(base => ({
      base,
      summary: getSummary(base),
      specs: getSpecs(base),
      graphics: getGraphics(base),
      delegation: getDelegation(base),
    }))
  }

  export function getSummary(data: PChainValidatorInfoDto): ISummary {
    const minDelegated = Formatter.number(data.minimumDelegated)
    const maxDelegated = Formatter.number(data.validatorAvailableCapacity)
    const leftover = data.validatorEndTime - unixnow()
    const maxLockup = Formatter.days(leftover)
    return {
      asset: 'FLR',
      apy: Formatter.percent(data.apy),
      delegation: checkRangeAvailable(
        data.minimumDelegated,
        data.validatorAvailableCapacity,
        `${minDelegated} to ${maxDelegated}`
      ),
      lockup: checkRangeAvailable(14 * 86400, leftover, `14 to ${maxLockup}`),
      expired: leftover <= 0,
    }
  }

  function getSpecs(data: PChainValidatorInfoDto): ISpecs {
    // avalanche validator transaction link
    const validatorTransactionUrl = flarePChainTransactionUrl(data.validatorTransactionHash)
    const validatorTransactionLink = <HashLink url={validatorTransactionUrl} address={data.validatorTransactionHash} />

    // avalanche validator link
    const validatorUrl = flareValidatorUrl(data.validatorNodeId)
    const validatorNodeIdLink = <HashLink url={validatorUrl} address={data.validatorNodeId} />

    // validator duration — guard against a 0 (epoch) timestamp from an
    // expired validator so we don't render a bogus 1970 date; the
    // unavailability banner already surfaces the expired state.
    const validatorStartTime = data.validatorStartTime > 0 ? Formatter.dateHuman(data.validatorStartTime) : 'Unavailable'
    const validatorEndTime = data.validatorEndTime > 0 ? Formatter.dateHuman(data.validatorEndTime) : 'Unavailable'

    const specs = [
      [
        {
          title: 'Validator Node Id',
          value: validatorNodeIdLink
        },
        {
          title: 'Validator Transaction',
          value: validatorTransactionLink
        }
      ],
      [
        {
          title: 'Delegation Fee',
          value: data.validatorFee + '%',
          tooltip: 'Fee charged to delegators',
        },
        {
          title: 'Validator Owned Stake',
          value: Formatter.number(data.validatorOwnedStake) + ' FLR',
          tooltip: 'Amount staked by Stakecore'
        },
        {
          title: 'Validator Start Time',
          value: validatorStartTime,
          tooltip: 'Time when we staked funds to our validator'
        },
        {
          title: 'Validator End Time',
          value: validatorEndTime,
          tooltip: 'Time when the stake to the validator expires'
        }
      ]
    ]

    return specs
  }

  function getGraphics(data: PChainValidatorInfoDto): IGraphics {
    return {
      stats: {
        delegators: data.totalDelegators,
        networkShare: data.validatorNetworkShare,
        capacity: {
          asset: 'FLR',
          ownedStake: data.validatorOwnedStake,
          delegated: data.totalDelegated,
          available: data.validatorAvailableCapacity,
        },
      },
      meterBar: {
        validatorUptime: {
          percent: data.validatorUptime
        },
        validatorConnectedPChain: {
          percent: data.pChainConnected
        },
        validatorConnectedCChain: {
          percent: data.cChainConnected
        },
        validatorConnectedXChain: {
          percent: data.xChainConnected
        }
      },
      countdown: {
        startTimeMs: data.validatorStartTime * 1000,
        endTimeMs: data.validatorEndTime * 1000
      }
    }
  }

  function getDelegation(data: PChainValidatorInfoDto): IDelegation {
    const validatorUrl = flareValidatorUrl(data.validatorNodeId)
    const validatorLink = <HashLink url={validatorUrl} address={data.validatorNodeId} />
    return { validatorLink }
  }

}

export default FlareValidatorDataAccess