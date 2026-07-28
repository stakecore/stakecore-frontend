import { lazy, Suspense, useCallback } from "react"
import { Formatter } from "~/utils/misc/formatter"
import EpochProgress from "~/components/ui/epochProgress"
import MeterBar from "~/components/ui/meterBar"
import ValidatorStatsStrip from "../validatorStatsStrip"
import type { IGraphics } from "./types"

// recharts + d3 are heavy and only used for this below-the-fold chart, so
// load it lazily instead of shipping it in the validator page chunks.
const StatsChart = lazy(() => import("~/components/ui/statsChart"))


const ValidatorStatistics = ({ config }: { config: IGraphics }) => {
  const { startTimeMs, endTimeMs } = config.countdown

  const validatorPeriod = useCallback((_now: number) => ({
    startMs: startTimeMs,
    endMs: endTimeMs,
    // An expired validator comes back with a 0 (epoch) end time; drop the
    // pill in that case rather than showing a 1970-01-01 expiration.
    metadata: endTimeMs > 0 ? [{ label: "Validator Expiration", value: new Date(endTimeMs).toISOString().split('T')[0] }] : [],
  }), [startTimeMs, endTimeMs])

  return (
    <div className="single-project-page-right mt-30">
      <div className="mb-40">
        <EpochProgress period={validatorPeriod} color="FireBrick" />
      </div>
      <ValidatorStatsStrip stats={config.stats} accentColor="FireBrick" />
      <div className="row">
        <div className="col-lg-6">
          <MeterBar name='Uptime' ranges={[80, 95]} value={config.meterBar.validatorUptime.percent} />
          <MeterBar name='P-chain connected nodes' ranges={[80, 90]} value={config.meterBar.validatorConnectedPChain.percent} />
        </div>
        <div className="col-lg-6">
          <MeterBar name='C-chain connected nodes' ranges={[80, 90]} value={config.meterBar.validatorConnectedCChain.percent} />
          <MeterBar name='X-chain connected nodes' ranges={[80, 90]} value={config.meterBar.validatorConnectedXChain.percent} />
        </div>
      </div>
      {config.epochApys.length > 0 && (
        <div className="row mt-40">
          <h5 className='meter-bar-title'>APY through reward epochs</h5>
          <p>
            Annual percentage yield (APY) earned by stake delegators for each <i>reward epoch</i>,
            based on the validator's uptime and total stake during that epoch.
            The APY shown in the summary above is that of the latest reward epoch.
          </p>
          <Suspense fallback={null}>
            <StatsChart
              data={config.epochApys.map(({ rewardEpoch, apy }) => ({ x: rewardEpoch, 'APY': apy }))}
              keys={['APY']}
              formatY={v => Formatter.percent(v)}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default ValidatorStatistics
