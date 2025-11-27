import { Formatter } from "~/utlits/misc/formatter"
import { HashLink } from "~/components/utils/links"
import { avalanchePChainTransactionUrl, avalancheValidatorUrl } from "~/utlits/data/constants"
import { ApiResponseDto_AvalancheDelegatorInfoDto, AvalancheValidatorInfoDto, ValidatorService } from "~/backendApi"
import type { AvalancheData, IDelegation, IGraphics } from "./types"
import type { ISpecs, ISummary } from "~/components/types"

export namespace AvalancheValidatorDataAccess {

  export async function getDelegatorInfo(address: string, pchain: string): Promise<ApiResponseDto_AvalancheDelegatorInfoDto> {
    return await ValidatorService.validatorControllerGetAvalancheDelegatorInfo(address, pchain)
  }

  async function getPageData(): Promise<AvalancheValidatorInfoDto> {
    const resp = await ValidatorService.validatorControllerGetAvalancheValidatorPageInfo()
    return resp.data
  }

  export async function getAvalanchePageData(): Promise<AvalancheData> {
    const base = await getPageData()
    const summary = getSummary(base)
    const specs = getSpecs(base)
    const graphics = getGraphics(base)
    const delegation = getDelegation(base)
    return { base, summary, specs, graphics, delegation }
  }

  export function getSummary(data: AvalancheValidatorInfoDto): ISummary {
    return {
      asset: 'AVAX',
      apy: data.apy + '%',
      risk: 'Low',
      lockup: '14-365 days'
    }
  }

  function getSpecs(data: AvalancheValidatorInfoDto): ISpecs {
    // avalanche validator transaction link
    const validatorTransactionUrl = avalanchePChainTransactionUrl(data.validatorTransactionHash)
    const validatorTransactionLink = <HashLink url={validatorTransactionUrl} address={data.validatorTransactionHash} />

    // avalanche validator link
    const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
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
          value: data.validatorOwnedStake + ' AVAX',
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
    const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
    const validatorLink = <HashLink url={validatorUrl} address={data.validatorNodeId} />
    return { validatorLink }
  }

}

export default AvalancheValidatorDataAccess