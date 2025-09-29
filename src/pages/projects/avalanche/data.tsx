import { secondsUntil, sleep } from "../../../utlits/misc/time"
import { ValidatorNodeLink } from "../../../components/utils/links"
import { avalancheTransactionUrl, avalancheValidatorUrl } from "../../../utlits/data/constants"
import type { AvalancheData, BaseData, IGraphics, ISpecs, ISummary } from "./types"

const data = {
  validatorNodeId: 'NodeID-6kHEKvCMAK3WSChsrVXfLDujyKizshbS6',
  validatorTransaction: '2UhdTbBY6zk9ASjNSXnHqFob2gmCu5ydnNZGcP1VDhfVkVUx2e',
  apy: 5,
  risk: 'Low',
  validatorFee: 2.00,
  validatorStake: 2004,
  validatorCapacity: 8e3,
  validatorStartTime: 1757696437,
  validatorEndTime: 1761932462,
  totalDelegators: 9,
  totalDelegated: 6310.1,
  validatorUptime: 0.99
}

export async function getAvalanchePageData(): Promise<AvalancheData> {
  //await sleep(10000)
  const base = data
  const summary = getSummary(data)
  const specs = getSpecs(data)
  const graphics = getGraphics(data)
  return { base, summary, specs, graphics }
}


export function getSummary(data: BaseData): ISummary {
  return {
    asset: 'AVAX',
    apy: data.apy + '%',
    risk: 'Low',
    lockup: '14-365 days'
  }
}

function getSpecs(data: BaseData): ISpecs {
  // avalanche validator transaction link
  const validatorTransactionUrl = avalancheTransactionUrl(data.validatorTransaction)
  const validatorTransactionLink = <ValidatorNodeLink url={validatorTransactionUrl} nodeId={data.validatorTransaction} />

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
        value: data.validatorCapacity + ' AVAX',
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

function getGraphics(data: BaseData): IGraphics {
  const validatorLeftoverCapactiy = data.validatorCapacity - data.totalDelegated
  const validatorLeftoverCapacityPercent = 100 * (validatorLeftoverCapactiy / data.validatorCapacity)

  const validatorUptimePercent = Math.round(1000 * data.validatorUptime) / 10

  return {
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
  }
}