import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "~/components/utils/links"
import { unixnow } from "~/utils/misc/time"
import { flarePChainTransactionUrl, flareValidatorUrl } from "~/constants"
import { ApiResponseDto_AvalancheDelegatorInfoDto, AvalancheValidatorInfoDto, FlareValidatorService } from "~/backendApi"
import type { AvalancheData, IDelegation, IGraphics } from "./types"
import type { ISpecs, ISummary } from "~/components/types"

export namespace FlareValidatorDataAccess {

  export async function getDelegatorInfo(address: string, pchain: string): Promise<ApiResponseDto_AvalancheDelegatorInfoDto> {
    return await FlareValidatorService.flareValidatorControllerGetFlareDelegatorInfo(address, pchain)
  }

  async function getPageData(): Promise<AvalancheValidatorInfoDto> {
    const resp = await FlareValidatorService.flareValidatorControllerGetFlareValidatorPageInfo()
    return resp.data
  }

  export async function getFlarePageData(): Promise<AvalancheData> {
    const base = await getPageData()
    const summary = getSummary(base)
    const specs = getSpecs(base)
    const graphics = getGraphics(base)
    const delegation = getDelegation(base)
    return { base, summary, specs, graphics, delegation }
  }

  export function getSummary(data: AvalancheValidatorInfoDto): ISummary {
    const minDelegated = Formatter.number(data.minimumDelegated)
    const maxDelegated = Formatter.number(data.validatorAvailableCapacity)
    const maxLockup = Formatter.days(data.validatorEndTime - unixnow())
    return {
      asset: 'FLR',
      apy: Formatter.percent(data.apy, 0),
      delegation: minDelegated + ' - ' + maxDelegated,
      lockup: `14 - ${maxLockup}`
    }
  }

  function getSpecs(data: AvalancheValidatorInfoDto): ISpecs {
    // avalanche validator transaction link
    const validatorTransactionUrl = flarePChainTransactionUrl(data.validatorTransactionHash)
    const validatorTransactionLink = <HashLink url={validatorTransactionUrl} address={data.validatorTransactionHash} />

    // avalanche validator link
    const validatorUrl = flareValidatorUrl(data.validatorNodeId)
    const validatorNodeIdLink = <HashLink url={validatorUrl} address={data.validatorNodeId} />

    // validator duration
    const validatorStartTime = Formatter.date(data.validatorStartTime)
    const validatorEndTime = Formatter.date(data.validatorEndTime)

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

  function getGraphics(data: AvalancheValidatorInfoDto): IGraphics {
    return {
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
        endTime: new Date(data.validatorEndTime * 1000)
      }
    }
  }

  function getDelegation(data: AvalancheValidatorInfoDto): IDelegation {
    const validatorUrl = flareValidatorUrl(data.validatorNodeId)
    const validatorLink = <HashLink url={validatorUrl} address={data.validatorNodeId} />
    return { validatorLink }
  }

}

export default FlareValidatorDataAccess