import useSWR from 'swr'
import { SpinnerCircular } from 'spinners-react'
import SlideUp from '../../utils/animations/slideUp'
import { getProposalData } from "../../utils/data/proposals"
import Proposal from './proposal'
import { useGlobalStore } from "~/utils/store/global"
import { PageDataService } from '../../backendApi'
import { PAGE_COLOR_CODE } from '../../constants'


const CallToAction = () => {
  const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
  const walletChoiceVisible = useGlobalStore(state => state.walletChoiceVisible)
  const walletAddress = useGlobalStore(state => state.walletAddress)

  const { data, isLoading, error } = useSWR(['page-user-info', walletAddress], async ([_, address]) => {
    if (address == null) return null
    return PageDataService.pageControllerGetUserInfo(address).then(resp => resp.data)
  })

  async function onConnectWallet() {
    if (walletChoiceVisible || walletAddress != null) return
    setWalletChoiceVisible(true)
  }

  let component = null
  if (walletAddress == null) {
    component = <div className="hero-btns">
      <a onClick={onConnectWallet} className="theme-btn">
        Connect Wallet To See Your Position
      </a>
    </div>
  } else if (isLoading) {
    component = <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
      <SpinnerCircular color={PAGE_COLOR_CODE} size={100} />
    </div>
  } else if (data == null) {
    component = <div>Error</div>
  } else {
    const proposal = getProposalData(data)
    return <Proposal priceData={proposal} />
  }

  return (
    <section className="call-to-action-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <SlideUp>
              <div className="about-content-part call-to-action-part text-center">
                <h2>Earn yield for your dormant FLR, AVAX, or SGB without any additional risk</h2>
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