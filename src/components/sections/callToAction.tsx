import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import ServerError from '../ui/serverError'
import Proposal from './proposal'
import { getProposalData } from "../../utils/data/proposals"
import { useGlobalStore } from "~/utils/store/global"
import { useShallow } from "zustand/react/shallow"
import { LandingPageService } from '../../backendApi'
import { PAGE_COLOR_CODE } from '../../constants'
import './callToAction.scss'


const CallToAction = () => {
  const { setWalletChoiceVisible, walletChoiceVisible, walletAddress } = useGlobalStore(
    useShallow(state => ({ setWalletChoiceVisible: state.setWalletChoiceVisible, walletChoiceVisible: state.walletChoiceVisible, walletAddress: state.walletAddress }))
  )

  const { data, isLoading, error } = useSWR(['page-user-info', walletAddress], async ([_, address]) => {
    if (address == null) return null
    return LandingPageService.pageControllerGetUserInfo(address).then(resp => resp.data)
  })

  async function onConnectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  let hasError = false
  let component = null
  if (walletAddress == null) {
    component = <div className="hero-btns">
      <button type="button" onClick={onConnectWallet} className="theme-btn">
        Connect Wallet
      </button>
    </div>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
      <SpinnerCircular color={PAGE_COLOR_CODE} size={100} />
    </div>
  } else if (data == null) {
    hasError = true
    component = <ServerError status={500} message={error} />
  } else {
    const proposal = getProposalData(data)
    if (proposal.length > 0) {
      return <Proposal priceData={proposal} />
    }
    component = <div>No FLR, AVAX, or SGB detected in this wallet.</div>
  }

  return (
    <section className="call-to-action-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="call-to-action-part">
              { !hasError && <>
                <h2>Earn yield</h2>
                <p>Put your dormant FLR, AVAX, or SGB to work and earn yield with a risk profile close to simply holding the asset.</p>
              </> }
              {component}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction