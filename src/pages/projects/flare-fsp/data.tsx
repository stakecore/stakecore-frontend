import { DataService, FlareFspInfoDto } from "~/backendApi"
import { Formatter } from "~/utlits/misc/formatter"
import { flareEvmUrl, flareFspUrl } from "~/utlits/data/constants"
import { AddressLink } from "~/components/utils/links"
import type { ISpecs, ISummary } from "~/components/pages/types"
import type { FlareData, FlareGraphics } from "./types"


export namespace FlareFspDataLayer {

  export async function getGraphicsData(): Promise<FlareGraphics> {
    const resp = await DataService.dataControllerGetDelegatedTimeSeries()
    return {
      delegations: resp.data
    }
  }

  export async function getPageData(): Promise<FlareData> {
    const info = await DataService.dataControllerGetFlareFspPageInfo()
    const data = info.data
    return {
      base: data,
      specs: getSpecs(data),
      summary: getSummary(data)
    }
  }

  function getSummary(info: FlareFspInfoDto): ISummary {
    return {
      asset: 'FLR',
      apy: String(info.apy),
      risk: info.risk,
      lockup: 'None'
    }
  }

  function getSpecs(info: FlareFspInfoDto): ISpecs {
    const delegationAddressUrl = flareEvmUrl(info.delegationAddress)
    const delegationAddressLink = <AddressLink url={delegationAddressUrl} address={info.delegationAddress} />
    const identityAddressUrl = flareFspUrl(info.identityAddress)
    const identityAddressLink = <AddressLink url={identityAddressUrl} address={info.identityAddress} />
    return [
      [
        {
          title: 'Delegation Address',
          value: delegationAddressLink,
          tooltip: 'Address to delegate to'
        },
        {
          title: 'Identity Address',
          value: identityAddressLink,
          tooltip: 'Main FSP address'
        }
      ],
      [
        {
          title: 'Total Delegators',
          value: info.totalDelegators
        },
        {
          title: 'Total Delegated',
          value: Formatter.format(BigInt(info.totalDelegated), 18, 2) + ' FLR'
        },
        {
          title: 'Availability',
          value: (Math.round(10_000 * info.providerAvailability) / 100) + '%',
          tooltip: 'Provider availability for the current reward epoch'
        },
        {
          title: 'Success Rate',
          value: (Math.round(10_000 * info.providerSuccessRate) / 100) + '%',
          tooltip: 'Provider price submission success rate for the current reward epoch'
        }
      ]
    ]
  }
}

export default FlareFspDataLayer