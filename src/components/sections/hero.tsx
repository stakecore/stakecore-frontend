import { Link } from 'react-router-dom'
import { RiGithubLine, RiSendPlaneLine, RiTwitterXLine } from '@remixicon/react'
import useSWR from 'swr'
import { LandingPageService } from '~/backendApi'
import profile from "../../assets/images/about/profile.svg"
import SlideUp from '../../utils/animations/slideUp'
import ServerError from '../ui/serverError'
import DelegationSummary from '../ui/delegationSummary'
import RecentActivity from '../ui/recentActivity'
import { REFRESH_QUERY_SLOW_MS } from '~/constants'
import './hero.scss'


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
        <DelegationSummary data={data} isLoading={isLoading} error={error} />
      </SlideUp>
      <SlideUp>
        <div className="about-content-part-bottom">
          <RecentActivity data={data} isLoading={isLoading} error={error} />
        </div>
      </SlideUp>
    </>
  }

  return (
    <section id="about" className="about-area">
      <div className="container">
        <div className="row">
          {/* <!-- START ABOUT IMAGE DESIGN AREA --> */}
          <div className="col-xl-4">
            <SlideUp>
              <div className="about-image-part">
                <img src={profile} alt="StakeCore" style={{ width: 170 }} />
                <h2 style={{ marginTop: 12, marginBottom: 0, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 30 }}>
                  StakeCore
                </h2>
                <p style={{ marginTop: 20, marginBottom: 20 }}>
                  Infrastructure provider for core crypto protocols on Flare, Avalanche, and Songbird.
                  Provide security by delegating your dormant tokens to us and earn RISK-FREE yield in return!
                </p>
                <div className="about-social text-center">
                  <ul>
                    <li><Link target="_blank" to="https://x.com/stake_core"><RiTwitterXLine size={20} /></Link></li>
                    <li><Link target="_blank" to="https://t.me/+xZoChBQyyCo3OGY0"><RiSendPlaneLine size={20} /></Link></li>
                    <li><Link target="_blank" to="https://github.com/stakecore"><RiGithubLine size={20} /></Link></li>
                  </ul>
                </div>
              </div>
            </SlideUp>
          </div>
          {/* <!-- / END ABOUT IMAGE DESIGN AREA -->
          <!-- START ABOUT TEXT DESIGN AREA --> */}
          <div className="col-xl-8">
            {component}
          </div>
          {/* <!-- / END ABOUT TEXT DESIGN AREA --> */}
        </div>
      </div>
    </section>
  )
}

export default Hero