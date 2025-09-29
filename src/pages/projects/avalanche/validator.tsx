import { useEffect, useState } from "react"
import MovieClip from "../../../components/ui/movieClip"
import MeterBar from "../../../components/ui/meterBar"
import Countdown from "../../../components/ui/countdown"
import InfoComponent from "../../../components/pages/info"
import ProjectTitle from "../../../components/pages/title"
import { avalancheValidatorUrl } from "../../../utlits/data/constants"
import { ValidatorNodeLink } from "../../../components/utils/links"
import { getAvalanchePageData } from "./data"
import type { AvalancheData } from "./types"


export const AvalancheValidatorProject = () => {
    const [data, setData] = useState<AvalancheData>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        async function fetchData() {
            const res = await getAvalanchePageData()
            setData(res)
            setLoading(false)
        }
        fetchData()
    }, [])


    if (loading) return <div />

    return (
        <div className="single-project-page-design single-project-page-design-avalanche-validator">
            <ProjectTitle title='Avalanche Validator Delegation' suptitle='Help Secure The Avalanche Network' />
            <div className="container pt-30">
                <InfoComponent specs={data.specs} summary={data.summary} />
                <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
                    <h2>Stakecore Statistics</h2>
                    <p>
                        Note that we restake our validators less than 24 hours after expiration.
                    </p>
                    <div className="mt-40 mb-40">
                        <Countdown launchDate={new Date(data.base.validatorEndTime * 1000)} />
                    </div>
                    <p>
                        We picked some of the most important statistics for our validator to let you monitor Stakecore's activity.
                    </p>
                    <div>
                        <MeterBar
                            name="Validator Uptime"
                            ranges={[80, 95]}
                            value={data.graphics.validatorUptime.percent}
                        />
                        <MeterBar
                            name="Delegation Capacity"
                            ranges={[10, 50]}
                            value={data.graphics.validatorLeftoverCapacity.percent}
                            text={data.graphics.validatorLeftoverCapacity.amount}
                        />
                        <MeterBar
                            name="Validation Duration"
                            ranges={[10, 80]}
                            value={data.graphics.validatorLeftoverDuration.percent}
                            text={data.graphics.validatorLeftoverDuration.amount}
                        />
                    </div>
                </div>
                <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
                    <h2>How To Delegate And Earn APY?</h2>
                    <p>
                        Users need to delegate to our Stakecore validator &nbsp;
                        <ValidatorNodeLink url={avalancheValidatorUrl} nodeId={data.base.validatorNodeId} /> or any other one.
                        However, note that validators failing to deliver 80%+ uptime will cause their delegators to lose out on rewards.
                        Due to security reasons we require users to interact with the official Avalanche website when signing transactions,
                        while providing only the necessary information here. See the video below to learn how to delegate to Stakecore's validator node.
                    </p>
                    <div className="video-container mb-30">
                        <MovieClip videoId="wRPxDEMgDdM" />
                    </div>
                </div>
            </div>
        </div>
    )
}


export default AvalancheValidatorProject