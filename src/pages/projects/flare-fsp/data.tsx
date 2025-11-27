import { FspDelegatorInfoDto, FspInfoDto, FspPageDataDto, FspService } from "~/backendApi"
import { flareEvmAddressUrl, flareFspAddressUrl } from "~/utlits/data/constants"
import { HashLink } from "~/components/utils/links"
import type { ISpecs, ISummary } from "~/components/types"


namespace FspDataLayer {

  export async function getPageData(chain: string): Promise<FspPageDataDto> {
    const info = await FspService.fspControllerGetFlareFspPageInfo(chain)
    return info.data
  }

  export async function getDelegatorInfo(chain: string, address: string): Promise<FspDelegatorInfoDto> {
    const resp = await FspService.fspControllerGetFlareFspDelegatorInfo(chain, address)
    return resp.data
  }

  export function extractSummary(chain: string, info: FspInfoDto): ISummary {
    const symbol = chain == 'flare' ? 'FLR' : 'SGB'
    return {
      asset: symbol,
      apy: `${info.apy}%`,
      risk: info.risk,
      lockup: 'None'
    }
  }

  export function extractSpecs(info: FspInfoDto): ISpecs {
    const delegationAddressUrl = flareEvmAddressUrl(info.delegationAddress)
    const delegationAddressLink = <HashLink url={delegationAddressUrl} address={info.delegationAddress} />
    const identityAddressUrl = flareFspAddressUrl(info.identityAddress)
    const identityAddressLink = <HashLink url={identityAddressUrl} address={info.identityAddress} />
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