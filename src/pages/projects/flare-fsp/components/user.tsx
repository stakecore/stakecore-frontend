import useSWR from "swr"
import { SpinnerCircular } from 'spinners-react'
import { useGlobalStore } from "~/utlits/store/global"
import { sleep } from "~/utlits/misc/time"

interface UserPosition {
  address: string
  balance: string
  delegated: string
}

async function fetchUserPosition(address: string): Promise<UserPosition> {
  await sleep(3000)
  return {
    address: address,
    balance: '1000',
    delegated: '100000'
  }
}

const FlareFspUserComponent = () => {
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

  let component = null
  if (walletAddress == null) {
    component = <a onClick={connectWallet} className="theme-btn">Connect Wallet To See Your Position</a>
  } else if (isLoading) {
    component = <SpinnerCircular color="firebrick" size={45} />
  } else if (error != null) {
    component = <div>error {error}</div>
  }
  else {
    component = <>
      <div>{data.address}: {data.balance}: {data.delegated}</div>
    </>
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

export default FlareFspUserComponent