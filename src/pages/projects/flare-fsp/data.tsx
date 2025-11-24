import { FspDelegatorInfoDto, FspGraphicsDataDto, FspInfoDto, FspService } from "~/backendApi"
import { flareEvmAddressUrl, flareFspAddressUrl } from "~/utlits/data/constants"
import { AddressLink } from "~/components/utils/links"
import type { ISpecs, ISummary } from "~/components/types"
import type { FspData } from "./types"


namespace FspDataLayer {

  export async function getDelegatorInfo(chain: string, address: string): Promise<FspDelegatorInfoDto> {
    const resp = await FspService.fspControllerGetFlareFspDelegatorInfo(chain, address)
    return resp.data
  }

  export async function getGraphicsData(chain: string): Promise<FspGraphicsDataDto> {
    const resp = await FspService.fspControllerGetFlareFspGraphicsData(chain)
    return resp.data
  }

  export async function getPageData(chain: string): Promise<FspData> {
    const info = await FspService.fspControllerGetFlareFspPageInfo(chain)
    const data = info.data
    return {
      base: data,
      specs: getSpecs(data),
      summary: getSummary(chain, data)
    }
  }

  function getSummary(chain: string, info: FspInfoDto): ISummary {
    const symbol = chain == 'flare' ? 'FLR' : 'SGB'
    return {
      asset: symbol,
      apy: `${info.apy}%`,
      risk: info.risk,
      lockup: 'None'
    }
  }

  function getSpecs(info: FspInfoDto): ISpecs {
    const delegationAddressUrl = flareEvmAddressUrl(info.delegationAddress)
    const delegationAddressLink = <AddressLink url={delegationAddressUrl} address={info.delegationAddress} />
    const identityAddressUrl = flareFspAddressUrl(info.identityAddress)
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

export default FspDataLayer