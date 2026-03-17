import { useCallback } from "react"
import EpochProgress from "~/components/ui/epochProgress"
import MeterBar from "../../../../components/ui/meterBar"
import type { IGraphics } from "../types"


const FlareValidatorStatisticsComponent = ({ config }: { config: IGraphics }) => {
  const { startTimeMs, endTimeMs } = config.countdown

  const validatorPeriod = useCallback((_now: number) => ({
    startMs: startTimeMs,
    endMs: endTimeMs,
    metadata: [{ label: "Validator Expiration", value: new Date(endTimeMs).toISOString().split('T')[0] }],
  }), [startTimeMs, endTimeMs])

  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s mt-30">
      <div className="mb-40">
        <EpochProgress period={validatorPeriod} color="FireBrick" />
      </div>
      <p>
        Below we picked some of the most important statistics for our validator.
        Note that we restake our validators less than 24 hours after expiration.
      </p>
      <div className="row">
        <div className="col-lg-6">
          <MeterBar name='Uptime' ranges={[80, 95]} value={config.meterBar.validatorUptime.percent} />
          <MeterBar name='P-chain connected nodes' ranges={[75, 95]} value={config.meterBar.validatorConnectedPChain.percent} />
        </div>
        <div className="col-lg-6">
          <MeterBar name='C-chain connected nodes' ranges={[75, 95]} value={config.meterBar.validatorConnectedCChain.percent} />
          <MeterBar name='X-chain connected nodes' ranges={[75, 95]} value={config.meterBar.validatorConnectedXChain.percent} />
        </div>
      </div>
    </div>
  )
}

export default FlareValidatorStatisticsComponent
