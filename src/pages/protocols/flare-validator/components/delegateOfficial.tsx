import { FLARE_VALIDATOR_VIDEO_ID } from "~/constants"
import MovieClip from "../../../../components/ui/movieClip"

const FlareValidatorOfficialDelegateComponent = ({ validatorLink }) => {
  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s flare-div-border mt-30">
      <h2>Delegate On The Official Flare Site</h2>
      <p>
        Users can choose to delegate to the Stakecore validator &nbsp; {validatorLink}.
        Note that validators failing to deliver 80%+ uptime will cause their delegators to lose out on rewards.
        Due to security reasons we require users to interact with the official Flare website when signing transactions,
        while providing only the necessary information here.
        Follow the below video to delegate to Stakecore's Flare validator node.
      </p>
      <div className="video-container mb-30">
        <MovieClip videoId={FLARE_VALIDATOR_VIDEO_ID} />
      </div>
    </div>
  )
}

export default FlareValidatorOfficialDelegateComponent