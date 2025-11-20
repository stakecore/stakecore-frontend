import SlideUp from '../../utlits/animations/slideUp'
import { useGlobalStore } from "~/utlits/store/global"


const CallToAction = () => {
    const setWalletChoiceVisible = useGlobalStore(state => state.setWalletChoiceVisible)
    const walletAddress = useGlobalStore(state => state.walletAddress)
    return (
        <section className="call-to-action-area">
            <div className="container">
                <div className="row">
                    {/* <!-- START ABOUT TEXT DESIGN AREA --> */}
                    <div className="col-lg-12">
                        <SlideUp>
                            <div className="about-content-part call-to-action-part text-center">
                                <h2>Want to earn yield for your dormant FLR, AVAX, or SGB without any additional risk?</h2>
                                <p>{/* You can go to <Link to="https://portal.flare.network/staking">portal.flare.network</Link>{' '}
                                and stake FLR to Node Id {' '} <ValidatorNodeLink /> or delegate WFLR to address {' '} <DelegationAddressLink />. */}
                                </p>
                                <div className="hero-btns">
                                    <a onClick={() => setWalletChoiceVisible(true)} className="theme-btn">
                                        Connect Wallet To See Your Position
                                    </a>
                                </div>
                            </div>
                        </SlideUp>
                    </div>
                    {/* <!-- / END ABOUT TEXT DESIGN AREA --> */}
                </div>
            </div>
        </section>
    )
}

export default CallToAction