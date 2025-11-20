import { avalanchePChainAddressUrl, flareEvmUrl, songbirdEvmUrl } from "~/utlits/data/constants"
import avalanche from "../../assets/images/networks/AVAX.webp"
import flare from "../../assets/images/networks/FLR.webp"
import songbird from "../../assets/images/networks/SGB.svg"
import { Formatter } from "~/utlits/misc/formatter"
import { unixnow } from "~/utlits/misc/time"
import { AddressLink } from "../utils/links"
import React from "react"


function networkToLogo(network: string): string {
  if (network == 'Avalanche') {
    return avalanche
  } else if (network == 'Flare') {
    return flare
  } else if (network == 'Songbird') {
    return songbird
  }
}

function networkToAddressUrl(network: string, address: string) {
  if (network == 'Avalanche') {
    return avalanchePChainAddressUrl(address)
  } else if (network == 'Flare') {
    return flareEvmUrl(address)
  } else if (network == 'Songbird') {
    return songbirdEvmUrl(address)
  }
}

function TokenStats() {

  const data = [
    {
      network: 'Avalanche',
      protocol: 'validator',
      address: '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e',
      delegated: 10.123,
      timestamp: unixnow()
    },
    {
      network: 'Flare',
      protocol: 'FSP',
      address: '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e',
      delegated: 10.123,
      timestamp: unixnow()
    },
    {
      network: 'Flare',
      protocol: 'FSP',
      address: '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e',
      delegated: 1000000.123,
      timestamp: unixnow()
    },
    {
      network: 'Songbird',
      protocol: 'FSP',
      address: '0x868822C4A79ee2a18bedfdd5f1EF3b23B190cf1e',
      delegated: 100.123,
      timestamp: unixnow()
    }
  ]

  return <>
    <div className="delegation-updates">
      <div>Network</div>
      <div>Protocol</div>
      <div>Delegator</div>
      <div>Delegated</div>
      <div>Timestamp</div>
      {data.map((x, i) => {
        const logo = networkToLogo(x.network)
        const url = networkToAddressUrl(x.network, x.address)
        return <React.Fragment key={i}>
          <div><img src={logo} width={25} /></div>
          <div>{x.protocol}</div>
          <div><AddressLink address={x.address} url={url} length={5} /></div>
          <div>{Formatter.number(x.delegated, 3)}</div>
          <div>{Formatter.date(x.timestamp)}</div>
        </React.Fragment>
      })}
    </div>
  </>
}


export default TokenStats