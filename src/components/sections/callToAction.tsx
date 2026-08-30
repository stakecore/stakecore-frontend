import type { ReactNode } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router'
import { SpinnerCircular } from 'spinners-react'
import { RiArrowRightLine } from '@remixicon/react'
import ServerError from '../ui/serverError'
import Proposal from './proposal'
import { getProposalData } from "../../utils/data/proposals"
import { useGlobalStore } from "~/features/wallet/store"
import { useShallow } from "zustand/react/shallow"
import { LandingPageService } from '../../backendApi'
import { PAGE_COLOR_CODE } from '../../constants'
import './callToAction.scss'


// A persistent frame, not a swapping section. The heading and the talk-to-us
// prop bracket a slot that varies with the wallet/fetch state; the section
// itself always renders the same shape.
//
// It used to be the whole section that swapped: Proposal *replaced* this card
// once a connected wallet turned out to hold something, so a second value
// proposition living in here would have been invisible to precisely the
// connected holders it is aimed at. Proposal now renders into the slot and
// supplies only its cards.
//
// `hideContactPrompt` is set by the /contact route (see router.tsx), where the
// prop would be a door into the page the visitor is already standing in.
const CallToAction = ({ hideContactPrompt = false }: { hideContactPrompt?: boolean }) => {
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

  // SWR reports `isLoading` for every retry after a failure, not just the
  // first load, so a ladder that checks it before treating a missing payload
  // as an error tore the "Connection failed" panel down and rebuilt it on each
  // retry. Gate the spinner on "nothing has arrived yet" instead. Same rule as
  // the ladder in queryState.tsx, which carries the browser trace.
  const firstLoad = isLoading && error == null && data == null

  let slot: ReactNode = null
  if (walletAddress == null) {
    slot = <button type="button" onClick={onConnectWallet} className="theme-btn">
      Connect Wallet
    </button>
  } else if (firstLoad) {
    slot = <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
      <SpinnerCircular color={PAGE_COLOR_CODE} size={100} />
    </div>
  } else if (data == null) {
    slot = <ServerError error={error} />
  } else {
    const proposal = getProposalData(data)
    slot = proposal.length > 0
      ? <Proposal priceData={proposal} />
      : <p>No FLR, AVAX, or SGB detected in this wallet.</p>
  }

  return (
    <section className="call-to-action-area">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="call-to-action-part">
              <h2>Use your crypto</h2>
              <p>Put your dormant FLR, AVAX, or SGB to work and earn yield with a risk profile close to simply holding the asset.</p>
              <div className="call-to-action-slot">{slot}</div>
              {!hideContactPrompt && (
                <p className="call-to-action-more">
                  Something else in mind? We run any workload on any network — validators, RPC and archive nodes, indexers, relayers.
                  {' '}
                  <Link to="/contact">
                    Talk to us<i><RiArrowRightLine size={14} /></i>
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToAction
