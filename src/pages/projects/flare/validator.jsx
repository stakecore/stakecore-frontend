import MovieClip from "../../../components/ui/youtube";

export const FlareValidatorProject = () => {
    return (
        <div className="single-project-page-design single-project-page-design-flare-validator">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12 text-center pb-30">
                        <p>Help Secure The Flare Network</p>
                        <h1>Flare Validator Delegation</h1>
                    </div>
                </div>
            </div>
            <div className="container pt-30">
                <div className="row">
                    <div className="col-lg-4">
                        {/* <!-- START SINGLE LEFT DESIGN AREA --> */}
                        <div className="single-project-page-left wow fadeInUp delay-0-2s flare-div-border">
                            <div className="single-info">
                                <p>Asset</p>
                                <h3>FLR</h3>
                            </div>
                            <div className="single-info">
                                <p>APY</p>
                                <h3>12.14%</h3>
                            </div>
                            <div className="single-info">
                                <p>Risk Rating</p>
                                <h3>Medium</h3>
                            </div>
                            <div className="single-info">
                                <p>Lockup</p>
                                <h3>14-365 days</h3>
                            </div>
                        </div>
                        {/* <!-- / END SINGLE LEFT DESIGN AREA --> */}
                    </div>
                    {/* <!-- START SINGLE RIGHT DESIGN AREA --> */}
                    <div className="col-lg-8">
                        <div className="single-project-page-right wow fadeInUp delay-0-4s flare-div-border">
                            <h2>
                                Project Description
                            </h2>
                            <p>
                                If deciding to delegate FLR on the Flare Network, you will earn fees in exchange to help secure
                                the network by participating in its avalanche-based proof of stake consensus model, called Snowman.
                            </p>
                            <p>
                                Each delegator needs to choose the validator they will provide their delegation to. That validator
                                gains the delegated power and uses it to prove FLR holder's trust to the network when making important
                                decisions, like mining blocks.

                                Flare validation process is tightly tied to the Flare System Protocol (FSP), and validator rewards
                                are distributed based on validator's performance there.

                                Stakecore's mission is to be a reliable candidate, and aims to keep earning trust from its delegators
                                by providing 100% uptime, participating in the FSP, and set a reasonable delegation fee of 14%.
                            </p>
                        </div>
                    </div>
                    {/* <!-- / END SINGLE RIGHT DESIGN AREA --> */}
                </div>
                <div className="video-container">
                    <MovieClip videoId="hWrj4k56me0" />
                </div>
            </div>
        </div>
    )
}

export default FlareValidatorProject