import { useGlobalStore } from "~/utlits/store/global"
import { SpinnerCircular } from 'spinners-react'
import { useEffect, useState } from "react"
import { sleep } from "~/utlits/misc/time"

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
}

async function fetchUserPosition(address: string): Promise<UserPosition> {
  await sleep(3000)
  return {
    pChain: {
      address: 'avax1umkusjfu7hgdckc6eldnfhwnll5yuj7qutkk2n',
      balance:  '10000'
    },
    cChain: {
      address: address,
      balance: '10000'
    },
    staked: '100000',
    delegated: '100000'
  }
}

const AvalancheValidatorUserComponent = () => {
  const walletAddress = useGlobalStore((state) => state.walletAddress)
  const setWalletVisible = useGlobalStore((state) => state.setWalletVisible)
  const walletVisible = useGlobalStore((state) => state.walletVisible)
  const [position, setPosition] = useState<[boolean, UserPosition]>([false, null])

  async function connectWallet() {
    if (walletVisible || walletAddress != null) return
    setWalletVisible(true)
  }

  useEffect(() => {
    async function fetchData() {
      if (walletAddress == null) return
      setPosition([true, null])
      const pos = await fetchUserPosition(walletAddress)
      setPosition([false, pos])
    }
    fetchData()
  }, [walletAddress])

  let component = null
  if (walletAddress != null && position[1] != null && !position[0]) {
    const data = position[1]
    component = <>
      <div>{data.pChain.address}: {data.pChain.balance}</div>
      <div>{data.cChain.address}: {data.cChain.balance}</div>
    </>
  } else if (walletVisible || walletAddress != null || position[0]) {
    component = <SpinnerCircular color="firebrick" size={45} />
  } else {
    component = <a onClick={connectWallet} className="theme-btn">Connect Wallet To See Your Position</a>
  }

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
      <h2>Position</h2>
      <div style={{ textAlign: 'center' }}>
        {component}
      </div>
    </div>
  )
}

export default AvalancheValidatorUserComponent