import { FspDelegatorInfoDto, FspInfoDto, FspPageDataDto, FspService } from "~/backendApi"
import type { FspStatisticsDto } from "~/backendApi"
import {
  flareEvmAddressUrl, flareFspAddressUrl,
  songbirdEvmAddressUrl, songbirdFspAddressUrl,
} from "~/constants"
import { Formatter } from "~/utils/misc/formatter"
import { HashLink } from "~/components/ui/links"
import type { ISpecs, ISummary } from "../types"


namespace FspDataLayer {

  export async function getPageData(chain: string): Promise<FspPageDataDto> {
    const info = await FspService.fspControllerGetFlareFspPageInfo(chain)
    return info.data
  }

  export async function getDelegatorInfo(chain: string, address: string): Promise<FspDelegatorInfoDto> {
    const resp = await FspService.fspControllerGetFlareFspDelegatorInfo(chain, address)
    return resp.data
  }

  export function extractSummary(chain: string, info: FspInfoDto, statistics: FspStatisticsDto): ISummary {
    const symbol = chain == 'flare' ? 'WFLR' : 'WSGB'
    // info.apy from the backend lags one epoch behind the latest entry in
    // statistics.apys.result (the same series rendered by the "APY through
    // reward epochs" chart on this page). Prefer the chart's most recent
    // point so the card matches what the user sees plotted.
    const apys = statistics.apys.result
    const apy = apys.length > 0 ? apys[apys.length - 1].apy : info.apy
    return {
      asset: symbol,
      apy: Formatter.percent(apy),
      delegation: 'No Limit',
      lockup: 'No Limit'
    }
  }

  export function extractSpecs(chain: string, info: FspInfoDto): ISpecs {
    // This data layer is shared by both FSP routes, so the explorer URLs must
    // follow the chain — otherwise the Songbird page links into the Flare
    // explorers.
    const evmAddressUrl = chain == 'flare' ? flareEvmAddressUrl : songbirdEvmAddressUrl
    const fspAddressUrl = chain == 'flare' ? flareFspAddressUrl : songbirdFspAddressUrl
    const delegationAddressUrl = evmAddressUrl(info.delegationAddress)
    const delegationAddressLink = <HashLink url={delegationAddressUrl} address={info.delegationAddress} />
    const identityAddressUrl = fspAddressUrl(info.identityAddress)
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
          value: Formatter.percent(info.providerFee),
          tooltip: 'Fee charged for oracle services'
        }
      ]
    ]
  }
}

export default FspDataLayer