import { secondsUntil } from "~/utlits/misc/time"
import { ValidatorNodeLink } from "~/components/utils/links"
import { avalancheTransactionUrl, avalancheValidatorUrl } from "~/utlits/data/constants"
import { AvalancheInfoDto, DataService } from "~/backendApi"
import type { AvalancheData, IDelegation, IGraphics, ISpecs, ISummary } from "./types"


export async function getPageData(): Promise<AvalancheInfoDto> {
  const resp = await DataService.dataControllerGetAvalanchePageInfo()
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

export function getSummary(data: AvalancheInfoDto): ISummary {
  return {
    asset: 'AVAX',
    apy: data.apy + '%',
    risk: 'Low',
    lockup: '14-365 days'
  }
}

function getSpecs(data: AvalancheInfoDto): ISpecs {
  // avalanche validator transaction link
  const validatorTransactionUrl = avalancheTransactionUrl(data.validatorTransactionHash)
  const validatorTransactionLink = <ValidatorNodeLink url={validatorTransactionUrl} nodeId={data.validatorTransactionHash} />

  // avalanche validator link
  const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
  const validatorNodeIdLink = <ValidatorNodeLink url={validatorUrl} nodeId={data.validatorNodeId} />

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
      }
    ]
  ]

  return specs
}

function getGraphics(data: AvalancheInfoDto): IGraphics {
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

function getDelegation(data: AvalancheInfoDto): IDelegation {
  const validatorUrl = avalancheValidatorUrl(data.validatorNodeId)
  const validatorLink = <ValidatorNodeLink url={validatorUrl} nodeId={data.validatorNodeId} />
  return { validatorLink }
}