import MovieClip from "../../../components/ui/youtube"
import MeterBar from "../../../components/ui/meterBar"
import Countdown from "../../../components/ui/countdown"
import { avalancheValidatorLink, avalancheValidatorNodeId } from "../../../utlits/data/constants"
import { ValidatorNodeLink } from "../../../components/utils/links"

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
        validatorEndTime: 1761932462,
        validatorStartTime: 1757696437,
        totalDelegators: 9,
        totalDelegated: 6310.1,
    }

    const validatorLeftoverTime = new Date(data.validatorEndTime * 1000) - Date.now()
    const validatorLeftoverTimePercent = 100 * (validatorLeftoverTime / (data.validatorEndTime - data.validatorStartTime))
    const validatorDurationDays = Math.floor(validatorLeftoverTime / 86400000)

    const validatorLeftoverCapactiy = data.validatorCapacity - data.totalDelegated
    const validatorLeftoverCapacityPercent = 100 * (validatorLeftoverCapactiy / data.validatorCapacity)
    const validatorLeftoverCapacityAvax = Math.round(validatorLeftoverCapactiy)

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
                                <hr class="specs-table-border mt-20"></hr>
                                <div className="specs-table-container">
                                    <table className="specs-table">
                                        <tbody>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Validator Fee</td>
                                                <td className="specs-table-data specs-table-data-right">{data.validatorFee}%</td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Validator Capacity</td>
                                                <td className="specs-table-data specs-table-data-right">{data.validatorCapacity} AVAX</td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Validator Duration</td>
                                                <td className="specs-table-data specs-table-data-right">{validatorDurationDays} days</td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Total Delegations</td>
                                                <td className="specs-table-data specs-table-data-right">{data.totalDelegators}</td>
                                            </tr>
                                            <tr className="specs-table-row">
                                                <td className="specs-table-data">Total Delegated</td>
                                                <td className="specs-table-data specs-table-data-right">{data.totalDelegated} AVAX</td>
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
                        <MeterBar name="Validator Uptime" value={99} ranges={[80, 95]} />
                        <MeterBar name="Delegation Capacity = Maximum Amount Delegated"
                            value={validatorLeftoverCapacityPercent} text={validatorLeftoverCapacityAvax} ranges={[10, 50]} />
                        <MeterBar name="Validation Duration = Maximum Delegation Time"
                            value={validatorLeftoverTimePercent} text={validatorDurationDays} ranges={[10, 80]} />
                    </div>
                </div>
                <div className="single-project-page-right wow fadeInUp delay-0-4s avalanche-div-border mt-30">
                    <h2>How To Delegate?</h2>
                    <p>
                        Avalanche has three subchains - C for contracts, X for transfers, and P for platform-related activity.
                        If you haven't heard of them, you likely hold your AVAX on the C-chain, however delegation requires you
                        to move them to the P-chain. This is done by signing two transactions - export from C to P and import to P from C.
                        Then you need to sign the delegate transaction. If this sounds too complex, the Avalabs team made easy-to-use
                        apps that simplify the process. See the video below.
                    </p>
                    <div className="video-container mb-30">
                        <MovieClip videoId="wRPxDEMgDdM" />
                    </div>
                    <p>
                        Note our validator info is

                    </p>
                </div>
            </div>
        </div>
    )
}


export default AvalancheValidatorProject