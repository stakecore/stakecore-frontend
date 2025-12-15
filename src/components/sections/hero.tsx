import { Link } from 'react-router-dom'
import { RiGithubLine, RiTwitterXLine } from '@remixicon/react'
import useSWR from 'swr'
import { LandingPageService } from '~/backendApi'
import profile from "../../assets/images/about/profile.svg"
import SlideUp from '../../utils/animations/slideUp'
import ServerError from '../ui/serverError'
import DelegationSummary from '../ui/delegationSummary'
import DelegationUpdates from '../ui/delegationUpdates'
import { REFRESH_QUERY_SLOW_MS } from '~/constants'


const Hero = () => {
  const { data, isLoading, error } = useSWR(['page-info'], async (_) => {
    const resp = await LandingPageService.pageControllerGetPageInfo()
    if (resp?.data == null) throw new Error(resp.error)
    return resp
  }, { refreshInterval: REFRESH_QUERY_SLOW_MS })

  let component = null
  if (!isLoading && data == null) {
    component = <div className="about-content-part">
      <ServerError status={500} message={error} />
    </div>
  } else {
    component = <>
      <SlideUp>
        <div className="about-content-part">
          <DelegationSummary data={data} isLoading={isLoading} error={error} />
        </div>
      </SlideUp>
      <SlideUp>
        <div className="about-content-part-bottom">
          <DelegationUpdates data={data} isLoading={isLoading} error={error} />
        </div>
      </SlideUp>
    </>
  }

  return (
    <section id="about" className="about-area">
      <div className="container">
        <div className="row">
          {/* <!-- START ABOUT IMAGE DESIGN AREA --> */}
          <div className="col-lg-4">
            <SlideUp>
              <div className="about-image-part">
                <img src={profile} alt="About Us" />
                <p style={{ marginTop: 30, marginBottom: 40 }}>
                  Infrastructure provider for core crypto protocols on three networks.
                  Provide security by delegating your dormant tokens to us and earn yield in return!
                </p>
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
            {component}
          </div>
          {/* <!-- / END ABOUT TEXT DESIGN AREA --> */}
        </div>
      </div>
    </section>
  )
}

export default Hero