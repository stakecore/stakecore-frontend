import MovieClip from "../../../components/ui/youtube"
import MeterBar from "../../../components/ui/meterBar"
import Countdown from "../../../components/ui/countdown"
import { avalancheValidatorLink, avalancheValidatorNodeId } from "../../../utlits/data/constants"
import { ValidatorNodeLink } from "../../../components/utils/links"

const Tooltip = ({ text }) => {
    return (
        <div className="specs-table-info info-tooltip tooltip-fade" data-title={text}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path fill="none" d="M0 0h24v24H0V0z"></path>
                <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
            </svg>
        </div>
    )
}

export const AvalancheValidatorProject = () => {
    const validatorTxLink = 'https://subnets.avax.network/p-chain/address/avax1umkusjfu7hgdckc6eldnfhwnll5yuj7qutkk2n'

    const data = {
        validatorNodeId: avalancheValidatorNodeId,
        validatorTransaction: '2UhdTbBY6zk9ASjNSXnHqFob2gmCu5ydnNZGcP1VDhfVkVUx2e',
        apy: 5,
        risk: 'Low',
        validatorFee: 2.00,
        validatorStake: 2004,
        validatorCapacity: 8e3,
        validatorStartTime: 1757696437,
        validatorEndTime: 1761932462,
        totalDelegators: 9,
        totalDelegated: 6310.1,
        validatorUptime: 0.99
    }

    const validatorLeftoverTime = Math.floor((new Date(data.validatorEndTime * 1000) - Date.now()) / 1000)
    const validatorLeftoverTimePercent = 100 * (validatorLeftoverTime / (data.validatorEndTime - data.validatorStartTime))
    const validatorDurationDays = Math.floor(validatorLeftoverTime / 86400)

    const validatorLeftoverCapactiy = data.validatorCapacity - data.totalDelegated
    const validatorLeftoverCapacityPercent = 100 * (validatorLeftoverCapactiy / data.validatorCapacity)
    const validatorLeftoverCapacityAvax = Math.round(validatorLeftoverCapactiy)

    const validatorUptimePercent = Math.round(1000 * data.validatorUptime) / 10

    return (
        <div className="single-project-page-design single-project-page-design-avalanche-validator">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12 text-center pb-30">
                        <p>Help Secure The Avalanche Network</p>
                        <h1>Avalanche Validator Delegation</h1>
                    </div>
                </div>
            </div>
            <div className="container pt-30">
                <div className="row">
                    <div className="col-lg-3">
                        {/* <!-- START SINGLE LEFT DESIGN AREA --> */}
                        <div className="single-project-page-left wow fadeInUp delay-0-2s avalanche-div-border">
                            <div className="single-info">
                                <p>Asset</p>
                                <h3>AVAX</h3>
                            </div>
                            <div className="single-info">
                                <p>APY</p>
                                <h3>{data.apy}%</h3>
                            </div>
                            <div className="single-info">
                                <p>Risk Rating</p>
                                <h3>{data.risk}</h3>
                            </div>
                            <div className="single-info">
                                <p>Lockup</p>
                                <h3>14-365 days</h3>
                            </div>
                        </div>
                        {/* <!-- / END SINGLE LEFT DESIGN AREA --> */}
                    </div>
                    {/* <!-- START SINGLE RIGHT DESIGN AREA --> */}
                    <div className="col-lg-9">
                        <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border">
                            <div className="specs-container">
                                <div className="specs-table-container">
                                    <table className="specs-table">
                                        <tbody className="">
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Validator Node Id</td>
                                                <td className="specs-table-data specs-table-data-right link">
                                                    <ValidatorNodeLink link={avalancheValidatorLink} nodeId={data.validatorNodeId} />
                                                </td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Validator Transaction</td>
                                                <td className="specs-table-data specs-table-data-right link">
                                                    <ValidatorNodeLink link={validatorTxLink} nodeId={data.validatorTransaction} />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <hr className="specs-table-border mt-20"></hr>
                                <div className="specs-table-container">
                                    <table className="specs-table">
                                        <tbody>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data specs-table-data-left">
                                                    <Tooltip text="Fee charged to delegators" />
                                                    <span>Delegation Fee</span>
                                                </td>
                                                <td className="specs-table-data specs-table-data-right">
                                                    {data.validatorFee}%
                                                </td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">
                                                    <Tooltip text="Space free for delegations" />
                                                    <span>Validator Capacity</span>
                                                </td>
                                                <td className="specs-table-data specs-table-data-right">
                                                    {data.validatorCapacity} AVAX
                                                </td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">
                                                    <Tooltip text="The maximum delegation time" />
                                                    <span>Validator Duration</span>
                                                </td>
                                                <td className="specs-table-data specs-table-data-right">
                                                    {validatorDurationDays} days
                                                </td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">
                                                    <Tooltip text="Total number of delegators" />
                                                    <span>Total Delegators</span>
                                                </td>
                                                <td className="specs-table-data specs-table-data-right">
                                                    {data.totalDelegators}
                                                </td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">
                                                    <Tooltip text="Total delegations from delegators" />
                                                    <span>Total Delegated</span>
                                                </td>
                                                <td className="specs-table-data specs-table-data-right">
                                                    {data.totalDelegated} AVAX
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <!-- / END SINGLE RIGHT DESIGN AREA --> */}
                </div>
                <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
                    <h2>Stakecore Statistics</h2>
                    <p>
                        Note that we restake our validators less than 24 hours after expiration.
                    </p>
                    <div className="mt-40 mb-40">
                        <Countdown launchDate={new Date(data.validatorEndTime * 1000)} />
                    </div>
                    <p>
                        We picked some of the most important statistics for our validator to let you monitor Stakecore's activity.
                    </p>
                    <div>
                        <MeterBar name="Validator Uptime" ranges={[80, 95]} value={validatorUptimePercent} />
                        <MeterBar name="Delegation Capacity"
                            ranges={[10, 50]} value={validatorLeftoverCapacityPercent} text={validatorLeftoverCapacityAvax + ' AVAX'} />
                        <MeterBar name="Validation Duration"
                            ranges={[10, 80]} value={validatorLeftoverTimePercent} text={validatorDurationDays + ' DAYS'} />
                    </div>
                </div>
                <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
                    <h2>How To Delegate And Earn APY?</h2>
                    <p>
                        Users need to delegate to our Stakecore validator &nbsp;
                        <ValidatorNodeLink link={avalancheValidatorLink} nodeId={data.validatorNodeId} /> or any other one.
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