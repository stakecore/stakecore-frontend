import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import SlideUp from '../../utils/animations/slideUp'
import ServerError from '../ui/serverError'
import Proposal from './proposal'
import { getProposalData } from "../../utils/data/proposals"
import { useGlobalStore } from "~/utils/store/global"
import { LandingPageService } from '../../backendApi'
import { PAGE_COLOR_CODE } from '../../constants'


const CallToAction = () => {
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)

  const { data, isLoading, error } = useSWR(['page-user-info', walletAddress], async ([_, address]) => {
    if (address == null) return null
    return LandingPageService.pageControllerGetUserInfo(address).then(resp => resp.data)
  })

  async function onConnectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  let renderr = false
  let component = null
  if (walletAddress == null) {
    component = <div className="hero-btns">
      <a onClick={onConnectWallet} className="theme-btn">
        Connect Wallet
      </a>
    </div>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
      <SpinnerCircular color={PAGE_COLOR_CODE} size={100} />
    </div>
  } else if (data == null) {
    renderr = true
    component = <ServerError status={500} message={error} />
  } else {
    const proposal = getProposalData(data)
    if (proposal.length > 0) {
      return <Proposal priceData={proposal} />
    }
    component = <div>You have no FLR, AVAX, or SGB</div>
  }

  return (
    <section className="call-to-action-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <SlideUp>
              <div className="about-content-part call-to-action-part text-center">
                { !renderr && <>
                  <h2>Earn yield</h2>
                  <p>Put your dormant FLR, AVAX, or SGB to work and earn without any introducing any additional risk.</p>
                </> }
                {component}
              </div>
            </SlideUp>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction