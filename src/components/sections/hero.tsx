import useSWR from 'swr'
import { LandingPageService } from '~/backendApi'
import profile from '../../assets/images/about/profile.svg'
import ServerError from '../ui/serverError'
import RecentActivity from '../ui/recentActivity'
import { Diff } from '../pages/diff'
import { Formatter } from '~/utils/misc/formatter'
import { REFRESH_QUERY_SLOW_MS } from '~/constants'
import './hero.scss'


type HeroStats = {
  delegated: string
  delegators: string
  delegatedDiff: string
  delegatorDiff: string
}

const Hero = () => {
  const { data, isLoading, error } = useSWR(['page-info'], async () => {
    const resp = await LandingPageService.pageControllerGetPageInfo()
    if (resp?.data == null) throw new Error(resp.error)
    return resp
  }, { refreshInterval: REFRESH_QUERY_SLOW_MS })

  let stats: HeroStats | null = null
  if (data?.data != null) {
    const d0 = data.data.historicDelegations.reduce((x, y) => x + y.delegatedUsd, 0)
    const d1 = data.data.delegated.reduce((x, y) => x + y.delegatedUsd, 0)
    const u0 = data.data.historicDelegations.reduce((x, y) => x + y.delegators, 0)
    const u1 = data.data.delegated.reduce((x, y) => x + y.delegators, 0)
    stats = {
      delegated: Formatter.number(d1),
      delegators: Formatter.number(u1),
      delegatedDiff: Formatter.percent(d0 > 0 ? d1 / d0 - 1 : 0),
      delegatorDiff: Formatter.percent(u0 > 0 ? u1 / u0 - 1 : 0),
    }
  }

  const hasError = !isLoading && data == null

  return (
    <section className="hero">
      <img src={profile} alt="" className="hero-watermark" aria-hidden />
      <div className="container">
        <header className="hero-brand">
          <h1 className="hero-wordmark">Stakecore</h1>
          <p className="hero-tagline">
            Validator infrastructure for Flare, Songbird, and Avalanche
          </p>
        </header>

        {hasError ? (
          <div className="hero-error">
            <ServerError status={500} message={error} />
          </div>
        ) : (
          <>
            <div className="hero-stats">
              <Stat label="Total Delegated" prefix="$" value={stats?.delegated} diff={stats?.delegatedDiff} />
              <Stat label="Delegators" value={stats?.delegators} diff={stats?.delegatorDiff} />
            </div>

            <div className="hero-activity">
              <RecentActivity data={data} isLoading={isLoading} error={error} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const Stat = ({ label, value, diff, prefix }: {
  label: string
  value?: string
  diff?: string
  prefix?: string
}) => (
  <div className="hero-stat">
    <div className="hero-stat-label">{label}</div>
    <div className="hero-stat-value">
      {prefix && <span className="hero-stat-affix">{prefix}</span>}
      <span className="hero-stat-number">{value ?? '—'}</span>
    </div>
    {diff && (
      <div className="hero-stat-diff">
        <Diff diff={diff} unit="24h" pill />
      </div>
    )}
  </div>
)

export default Hero
