import React from 'react'
import { RiMailSendLine } from '@remixicon/react'
import { Link } from 'react-router-dom'
import SlideUp from '../../utlits/animations/slideUp'
import profile from "../../assets/images/about/profile.svg"


const Summary = () => {
    return (
        <section id="about" className="about-single-area innerpage-single-area">
            <div className="container">
                <div className="row">
                    {/* <!-- START ABOUT IMAGE DESIGN AREA --> */}
                    <div className="col-lg-4">
                        <SlideUp>
                            <div className="about-image-part">
                                <img src={profile} alt="Stakecore Logo" />
                            </div>
                        </SlideUp>
                    </div>
                    {/* <!-- / END ABOUT IMAGE DESIGN AREA -->
                    <!-- START ABOUT TEXT DESIGN AREA --> */}
                    <div className="col-lg-8">
                        <SlideUp>
                            <div className="about-content-part">
                                <h2>
                                    We are stakecore, a staking service provider for the Flare Network.
                                </h2>
                                <p>
                                    We formed in 2024 around a core member stemming from the Flare development team.
                                    All of us are based in Slovenia, keeping a close eye on crypto developments.
                                    Stakecore is a start-up in its infancy, and we are looking to expand our services in the near future.
                                    If want to join our team or have any questions, feel free to contact us.
                                </p>
                                <div className="hero-btns">
                                    <Link to="/contact" className="theme-btn">Get In touch<i> <RiMailSendLine size={16} /> </i></Link>
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