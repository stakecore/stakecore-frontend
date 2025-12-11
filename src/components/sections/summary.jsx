import SlideUp from '../../utils/animations/slideUp'


const Summary = () => {
    return (
        <section id="about" className="about-single-area innerpage-single-area">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <SlideUp>
                            <div className="about-content-part">
                                <h5>
                                    Who are we?
                                </h5>
                                <p>
                                    In short, StakeCore enables yield through infrastructure provision to core protocols on various crypto networks.
                                    Because those protocols are core to the network, the risks of investing into them are the same as holding the
                                    network's native token. In other words, if you hold FLR, AVAX, or SGB, there is no reason not to invest with StakeCore.
                                </p>
                                <h5>How does it work?</h5>
                                <div>
                                    The crypto space is based on decentralized principles, and needs independant participants
                                    to put their work and belief into it. Because running the required infrastructure is often not as cheap or easy
                                    as running a BitTorrent client, crypto protocols often offer economic incentives to offset the work and costs.
                                    For example:

                                    <ul style={{ all: 'revert' }}>
                                        <li className='mb-10'>
                                            <span style={{ color: 'FireBrick'}}>Proof of stake: &nbsp;</span>
                                            The economic incentive is a secured yield on stake locked in the protocol by the consensus participant.
                                            That stake can increase via delegation, which is locked by participants that do not provide consensus
                                            themselves, but rather delegate that task to a provider they trust. In return, they get a share of
                                            the provider's yield, with the provider taking a fee.
                                        </li>
                                        <li><span style={{ color: 'firebrick'}}>Proof of work: &nbsp;</span>
                                            In proof of stake the scarce resource is the native currency that is being staked.
                                            In proof of work, it's work, most commonly in the form of computing power.
                                            The economic incentive is still present, and comes in the form of reward
                                            obtained by each mined block, making block miners the consensus providers.
                                            In POW, delegation is not as explicit, but is implemented via work pools,
                                            where users can consolidate their work, most commonly in the form of hashrate.
                                        </li>
                                    </ul>

                                    We are a consensus provider in two protocols - Snowball (used by Avalanche and Flare),
                                    and FSP/SSP (used by Flare and Songbird). Both of those protocols enable rewards through
                                    delegations, which is where you come in.
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

export default Summary