import MovieClip from "../../youtube";

export const AvalancheValidatorProject = () => {
    return (
        <div className="single-project-page-design single-project-page-design-avalanche-validator">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12 text-center pb-30">
                        <p>Help Secure The Avalanche Network</p>
                        <h1>Avalanche Validator Delegation</h1>
                    </div>
                </div>
            </div>
            {/* <div className="single-project-image">
                <img src={singleProjectImg} alt="image" />
            </div> */}
            <div className="container pt-30">
                <div className="row">
                    <div className="col-lg-4">
                        {/* <!-- START SINGLE LEFT DESIGN AREA --> */}
                        <div className="single-project-page-left wow fadeInUp delay-0-2s avalanche-div-border">
                            <div className="single-info">
                                <p>Asset</p>
                                <h3>AVAX</h3>
                            </div>
                            <div className="single-info">
                                <p>AVAX APY</p>
                                <h3>5.00%</h3>
                            </div>
                            <div className="single-info">
                                <p>Risk Rating</p>
                                <h3>Low</h3>
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
                        <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border">
                            <h2>
                                Project Description
                            </h2>
                            <p>
                                If deciding to delegate AVAX on Avalanche, you will earn fees in exchange to help secure
                                the network by participating in its unique proof of stake consensus model, called Snowman.
                            </p>
                            <p>
                                Each delegator needs to choose the validator they will provide their delegation to. That validator
                                gains the delegated power and uses it to prove AVAX holder's trust to the network when making important
                                decisions, like mining blocks. Special care needs to be taken, as delegating to a validator that fails
                                to provide 80% uptime to the network, will result in lost rewards, although no overall loss of invested
                                funds (slashing).

                                Stakecore's mission is to be a reliable candidate, and aims to keep earning trust from its delegators
                                by providing 100% uptime, with the lowest possible delegation fee of 2%.
                            </p>
                        </div>
                    </div>
                    {/* <!-- / END SINGLE RIGHT DESIGN AREA --> */}
                </div>
                <div className="video-container">
                    <MovieClip videoId="wRPxDEMgDdM" />
                </div>
                <div className="col-lg-12">
                    <div className="single-project-page-right wow fadeInUp delay-0-4s">
                        <h2>
                            Description
                        </h2>
                        <p>
                            If deciding to delegate AVAX on Avalanche, you will earn fees in exchange to help secure
                            the Avalanche network by participating in its unique proof of stake consensus model, called Snowman.
                        </p>
                        <p>
                            Each delegator needs to choose the validator they will provide their delegation to. That validator
                            gains the delegated power and uses it to prove AVAX holder's trust to the network when making important
                            decisions, like mining blocks. Special care needs to be taken, as delegating to a validator that fails
                            to provide 80% uptime to the network, will result in lost rewards, although no overall loss of invested
                            funds (slashing).

                            Stakecore's mission is to be a reliable candidate, and aims to keep earning trust from its delegators
                            by providing 100% uptime, with the lowest possible delegation fee of 2%.
                        </p>
                    </div>
                </div>
                {/* <!-- START SINGLE PAGE GALLERY DESIGN AREA --> */}
                {/* <div className="row pt-30">
                    <div className="col-lg-6">
                        <div className="single-image wow fadeInUp delay-0-2s">
                            <img src={singleProject1} alt="gallery" />
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="single-image wow fadeInUp delay-0-4s">
                            <img src={singleProject2} alt="gallery" />
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="single-image wow fadeInUp delay-0-6s">
                            <img src={singleProject3} alt="gallery" />
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="single-image wow fadeInUp delay-0-8s">
                            <img src={singleProject4} alt="gallery" />
                        </div>
                    </div>
                </div> */}
                {/* <!--  / END SINGLE PAGE GALLERY DESIGN AREA --> */}
            </div>
        </div>
    )
}

export default AvalancheValidatorProject