import { FLARE_FSP_VIDEO_ID } from "~/constants"
import MovieClip from "../../../../components/ui/movieClip"

const FlareFspOfficialDelegateComponent = ({ validatorLink }) => {
  return (
    <div className="single-project-page-right wow fadeInUp delay-0-4s mt-30">
      <h2>Delegate On The Official Flare Network Site</h2>
      <p>
        Users can choose to delegate to the Stakecore delegation address {validatorLink}.
        Note that the rewards distributed are bound to the delegated provider's performance
        during that epoch. If provider fails to meet minimal conditions, it can result in reward loss for the delegators.
        Follow the video below to delegate to Stakecore's FSP provider.
      </p>
      <div className="video-container mb-30">
        <MovieClip videoId={FLARE_FSP_VIDEO_ID} />
      </div>
    </div>
  )
}

export default FlareFspOfficialDelegateComponent