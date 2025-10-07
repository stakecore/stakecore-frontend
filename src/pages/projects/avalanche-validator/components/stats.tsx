import Countdown from "../../../../components/ui/countdown"
import MeterBar from "../../../../components/ui/meterBar"
import type { IGraphics } from "../types"


const AvalancheValidatorGraphicsComponent = ({ config }: { config: IGraphics }) => {
  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
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
      <div>
        <MeterBar
          name="Validator Uptime"
          ranges={[80, 95]}
          value={config.meterBar.validatorUptime.percent}
        />
        <MeterBar
          name="Delegation Capacity"
          ranges={[10, 50]}
          value={config.meterBar.validatorLeftoverCapacity.percent}
          text={config.meterBar.validatorLeftoverCapacity.amount}
        />
        <MeterBar
          name="Validation Duration"
          ranges={[10, 80]}
          value={config.meterBar.validatorLeftoverDuration.percent}
          text={config.meterBar.validatorLeftoverDuration.amount}
        />
      </div>
    </div>
  )
}

export default AvalancheValidatorGraphicsComponent