import { secondsUntil, sleep } from "~/utlits/misc/time"
import { AddressLink } from "~/components/utils/links"
import { avalancheTransactionUrl, avalancheValidatorUrl } from "~/utlits/data/constants"
import { AvalancheValidatorInfoDto, DataService } from "~/backendApi"
import type { AvalancheData, IDelegation, IGraphics } from "./types"
import type { ISpecs, ISummary } from "~/components/pages/types"

namespace AvalancheValidatorDataAccess {

  async function getPageData(): Promise<AvalancheValidatorInfoDto> {
    const resp = await DataService.dataControllerGetAvalancheValidatorPageInfo()
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
    const validatorTransactionUrl = avalancheTransactionUrl(data.validatorTransactionHash)
    const validatorTransactionLink = <AddressLink url={validatorTransactionUrl} address={data.validatorTransactionHash} />

    // avalanche validator link
    const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
    const validatorNodeIdLink = <AddressLink url={validatorUrl} address={data.validatorNodeId} />

    // validator duration
    const validatorLeftoverTime = secondsUntil(data.validatorEndTime)
    const validatorDurationDays = Math.floor(validatorLeftoverTime / 86400)

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
          title: 'Validator Capacity',
          value: data.validatorAvailableCapacity + ' AVAX',
          tooltip: 'Space free for delegations'
        },
        {
          title: 'Validator Duration',
          value: validatorDurationDays + ' days',
          tooltip: 'The maximum delegation time'
        },
        {
          title: 'Total Delegators',
          value: data.totalDelegators,
          tooltip: 'Total number of delegators'
        },
        {
          title: 'Total Delegated',
          value: data.totalDelegated + ' AVAX',
          tooltip: 'Total delegations from delegators'
        },
        {
          title: 'Validator Network Share',
          value: (100 * data.validatorNetworkShare) + '%',
          tooltip: 'Validator Stake Share On The Network'
        }
      ]
    ]

    return specs
  }

  function getGraphics(data: AvalancheValidatorInfoDto): IGraphics {
    const capacity = Number(data.validatorAvailableCapacity)
    const validatorLeftoverCapactiy = capacity - data.totalDelegated
    const validatorLeftoverCapacityPercent = 100 * (validatorLeftoverCapactiy / capacity)
    const validatorUptimePercent = Math.round(1000 * data.validatorUptime) / 10

    return {
      meterBar: {
        validatorLeftoverCapacity: {
          percent: validatorLeftoverCapacityPercent,
          amount: Math.round(validatorLeftoverCapactiy) + ' AVAX'
        },
        validatorUptime: {
          percent: validatorUptimePercent,
        },
        validatorLeftoverDuration: {
          percent: 20,
          amount: '30 days'
        }
      },
      countdown: {
        endTime: new Date(data.validatorEndTime * 1000)
      }
    }
  }

  function getDelegation(data: AvalancheValidatorInfoDto): IDelegation {
    const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
    const validatorLink = <AddressLink url={validatorUrl} address={data.validatorNodeId} />
    return { validatorLink }
  }

}

export default AvalancheValidatorDataAccess