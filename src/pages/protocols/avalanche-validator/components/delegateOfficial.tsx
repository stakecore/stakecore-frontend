import { AVALANCHE_VALIDATOR_VIDEO_ID } from "~/constants"
import MovieClip from "../../../../components/ui/movieClip"

const AvalancheValidatorOfficialDelegateComponent = ({ validatorLink }) => {
  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
      <h2>Delegate On The Official Avalanche Site</h2>
      <p>
        Users can choose to delegate to the Stakecore validator &nbsp; {validatorLink}.
        Note that validators failing to deliver 80%+ uptime will cause reward losses to its delegators.
        Due to security reasons we require users to interact with the official Avalanche website when signing transactions,
        while providing only the necessary information here. Follow the video below to delegate to Stakecore's validator node.
      </p>
      <div className="video-container mb-30">
        <MovieClip videoId={AVALANCHE_VALIDATOR_VIDEO_ID} />
      </div>
    </div>
  )
}

export default AvalancheValidatorOfficialDelegateComponent