import React from 'react'
import { RiMailSendLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import SlideUp from '../../utils/animations/slideUp'
import profile from "../../assets/images/about/profile.svg"


const Summary = () => {
    return (
        <section id="about" className="about-single-area innerpage-single-area">
            <div className="container">
                <div className="row">
{/*                     <div className="col-lg-4">
                        <SlideUp>
                            <div className="about-image-part">
                                <img src={profile} alt="Stakecore Logo" />
                            </div>
                        </SlideUp>
                    </div> */}
                    <div className="col-lg-12">
                        <SlideUp>
                            <div className="about-content-part">
                                <h2>
                                    Who are we?
                                </h2>
                                <p>
                                    In short, StakeCore enables risk-free yield through crypto protocol infrastructure provision.
                                    But what does that mean?
                                    <br /><br />
                                    The crypto space is based on decentralized principles and runs on independant infrastructure,
                                    provided by economically vested individualy such us ourselves. Usually crypto protocols enable
                                    delegation programs that allow regular users to provide assets to the provider in order to
                                    increase their consensus power. In return those users earn yield, while the provider charges some fee.
                                    <br /><br />
                                    But why is it risk-free? The protocols we expose delegation to, are core to the delegated token.
                                    If the protocol fails or gets hacked, your token will lose value eitherway.
                                    Therefore, when delegating to us, you are not exposed to risk other than that which already exists due to holding the token.
                                    <br /><br />
                                    So, let's say you own 10 AVAX that you're hodling because you believe in the Avalanche network.
                                    If you view the AVAX token as an investment bound to desirable price changes, and are not
                                    thinking of token being anything more, you should rethink your position. That token can and should earn yield.
                                </p>
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