import { FspDelegatorInfoDto, FspInfoDto, FspPageDataDto, FspService } from "~/backendApi"
import { flareEvmAddressUrl, flareFspAddressUrl } from "~/constants"
import { Formatter } from "~/utils/misc/formatter"
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
    const symbol = chain == 'flare' ? 'WFLR' : 'WSGB'
    return {
      asset: symbol,
      apy: Formatter.percent(info.apy, 0),
      delegation: 'No Limit',
      lockup: 'No Limit'
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
          value: Formatter.percent(info.providerFee, 0),
          tooltip: 'Fee charged for oracle services'
        }
      ]
    ]
  }
}

export default FspDataLayer