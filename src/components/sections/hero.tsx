import { Link } from 'react-router-dom'
import Marquee from "react-fast-marquee"
import { RiGithubLine, RiTwitterXLine } from '@remixicon/react'
import profile from "../../assets/images/about/profile.svg"
import SlideUp from '../../utlits/animations/slideUp'
import avalanche from "../../assets/images/client-logos/avalanche.png"
import flare from "../../assets/images/client-logos/flare.png"


const Hero = () => {
    return (
        <section id="about" className="about-area">
            <div className="container">
                <div className="row">
                    {/* <!-- START ABOUT IMAGE DESIGN AREA --> */}
                    <div className="col-lg-4">
                        <SlideUp>
                            <div className="about-image-part">
                                <img src={profile} alt="About Me" />
                                <p style={{marginTop: 30, marginBottom: 40}}>Flare network validator, FTSO and FDC provider.
                                    Put your FLR to work by staking and delegating with us!</p>
                                <div className="about-social text-center">
                                    <ul>
                                        {/* <li><Link to=""><RiFacebookCircleFill size={20} /></Link></li> */}
                                        <li><Link target="_blank" to="https://x.com/stake_core"><RiTwitterXLine size={20} /></Link></li>
                                        {/* <li><Link to=""><RiLinkedinFill size={20} /></Link></li> */}
                                        <li><Link target="_blank" to="https://github.com/stakecore"><RiGithubLine size={20} /></Link></li>
                                    </ul>
                                </div>
                            </div>
                        </SlideUp>
                    </div>
                    {/* <!-- / END ABOUT IMAGE DESIGN AREA -->
                    <!-- START ABOUT TEXT DESIGN AREA --> */}
                    <div className="col-lg-8">
                        <SlideUp>
                            <div className="about-content-part">
                                <p>Who are we?</p>
                                <h3>An inrastructure, investment, and development group</h3>
                                <div className="adress-field">
                                    We focus on running secure infrastructure for decentralized networks,
                                    and securing them economically with investments through yield offerings.
                                </div>
                            </div>
                        </SlideUp>
                        <SlideUp>
                            <div className="about-content-part-bottom">
                                <h2>Tokens we're providing prices for</h2>
                                <div className="company-list">
                                    <div className="scroller">
                                        <div className="scroller__inner">
                                            <Marquee>
                                                <img height={"100px"} src={avalanche} alt="" />
                                                <img height={"100px"} src={flare} alt="" />
                                            </Marquee>
                                        </div>
                                    </div>
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

export default Hero