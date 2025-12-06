import { Link } from 'react-router-dom'
import { RiGithubLine, RiTwitterXLine } from '@remixicon/react'
import useSWR from 'swr'
import { PageDataService } from '~/backendApi'
import profile from "../../assets/images/about/profile.svg"
import SlideUp from '../../utils/animations/slideUp'
import DelegatedStats from '../ui/baseMetrics'
import DelegationList from '../ui/delegationList'


const Hero = () => {
  const { data, isLoading, error } = useSWR(['page-info'], async (_) => {
    const resp = await PageDataService.pageControllerGetPageInfo()
    if (resp?.data == null) throw new Error(resp.error)
    return resp
  }, {
    refreshInterval: 30_000,
    revalidateOnReconnect: true
  })

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
            <SlideUp>
              <div className="about-content-part">
                <DelegatedStats data={data} isLoading={isLoading} error={error} />
              </div>
            </SlideUp>
            <SlideUp>
              <div className="about-content-part-bottom">
                <DelegationList data={data} isLoading={isLoading} error={error} />
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