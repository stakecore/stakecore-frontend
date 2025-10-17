import useSWR from "swr"
import { useGlobalStore } from "~/utlits/store/global"
import { SpinnerCircular } from 'spinners-react'
import { sleep } from "~/utlits/misc/time"
import { RiArrowDownBoxLine } from "@remixicon/react"
import InvestFlow from "~/components/ui/investFlow"

interface UserPosition {
  cChain: {
    address: string
    balance: string
  }
  pChain: {
    address: string
    balance: string
  }
  staked: string
  delegated: string

  usdValue: string
}

async function fetchUserPosition(address: string): Promise<UserPosition> {
  if (address == null) return
  await sleep(3000)
  return {
    pChain: {
      address: 'avax1umkusjfu7hgdckc6eldnfhwnll5yuj7qutkk2n',
      balance: '10000'
    },
    cChain: {
      address: address,
      balance: '10000'
    },
    staked: '100000',
    delegated: '100000',
    usdValue: '1000'
  }
}

const AvalancheValidatorUserComponent = () => {
  const walletAddress = useGlobalStore((state) => state.walletAddress)
  const setWalletVisible = useGlobalStore((state) => state.setWalletVisible)
  const walletVisible = useGlobalStore((state) => state.walletVisible)
  const { data, error, isLoading } = useSWR([walletAddress], ([address]) => {
    if (address == null) return null
    return fetchUserPosition(address)
  })

  async function connectWallet() {
    if (walletVisible || walletAddress != null) return
    setWalletVisible(true)
  }

  const tokens = [
    {
      symbol: 'AVAX (C)',
      logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FAVAX_logo.png&w=96&q=75',
      balance: 100,
      price: 20,
      arrows: {
        down: true,
        up: true
      },
      ireturn: [1, 0.9, null]
    },
    {
      symbol: 'AVAX (P)',
      logoUrl: 'https://flare-systems-explorer.flare.rocks/_next/image?url=%2Fbackend-url%2Fmedia%2Fimages%2Ffeed%2FAVAX_logo.png&w=96&q=75',
      balance: 200,
      price: 20,
      arrows: {
        down: true,
        up: false
      },
      ireturn: [0.9, 1, null]
    }
  ]

  let component = null
  if (walletAddress == null) {
    component = <a onClick={connectWallet} className="theme-btn">
      Connect Wallet To See Your Position
    </a>
  } else if (isLoading) {
    component = <SpinnerCircular color="firebrick" size={45} />
  } else if (error != null) {
    component = <div>error {error}</div>
  }
  else {
    component = <>
      <div className="mb-40">
        <p>
          Delegating AVAX involves moving it from C-Chain to P-Chain, where you then sign the add delegator transaction.
          After the set delegation lockup time expires, funds are automatically returned to your P-Chain account.
        </p>
      </div>
      <InvestFlow staked={100} tokens={tokens} />
    </>
  }

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
      <h2>Position</h2>
      {component}
    </div>
  )
}

export default AvalancheValidatorUserComponent