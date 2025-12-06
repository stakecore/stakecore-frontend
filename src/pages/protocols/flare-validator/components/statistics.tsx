import Countdown from "../../../../components/ui/countdown"
import MeterBar from "../../../../components/ui/meterBar"
import type { IGraphics } from "../types"


const FlareValidatorStatisticsComponent = ({ config }: { config: IGraphics }) => {
  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s flare-div-border mt-30">
      <h2>Stakecore Statistics</h2>
      <p>
        Note that we restake our validators less than 24 hours after expiration.
      </p>
      <div className="mt-40 mb-40">
        <Countdown launchDate={config.countdown.endTime} />
      </div>
      <p>
        We picked some of the most important statistics for our validator to let you monitor Stakecore's activity.
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