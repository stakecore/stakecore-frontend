import { DataService, FlareFspDelegatorInfoDto, FlareFspGraphicsDataDto, FlareFspInfoDto } from "~/backendApi"
import { flareEvmUrl, flareFspUrl } from "~/utlits/data/constants"
import { AddressLink } from "~/components/utils/links"
import type { ISpecs, ISummary } from "~/components/types"
import type { FlareData } from "./types"


namespace FlareFspDataLayer {

  export async function getDelegatorInfo(address: string): Promise<FlareFspDelegatorInfoDto> {
    const resp = await DataService.dataControllerGetFlareFspDelegatorInfo(address)
    return resp.data
  }

  export async function getGraphicsData(): Promise<FlareFspGraphicsDataDto> {
    const resp = await DataService.dataControllerGetFlareFspGraphicsData()
    return resp.data
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
      apy: `${info.apy}%`,
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
          title: 'Provider Fee',
          value: info.providerFee + '%',
          tooltip: 'Fee charged for oracle services'
        }
      ]
    ]
  }
}

export default FlareFspDataLayer