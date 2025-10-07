import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import { LoadingStatus, useDataLoader } from "~/components/utils/loader"
import FlareFspStatsComponent from "./components/stats"
import { FlareFspDataLayer } from "./data"
import { FLARE_COLOR_CODE } from "~/utlits/data/constants"


export const AvalancheValidatorProject = () => {
    const { data, status, error } = useDataLoader(FlareFspDataLayer.getPageData)

    let component = null
    if (status == LoadingStatus.NONE || status == LoadingStatus.LOADING) {
        component = <>
            <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
                <SpinnerCircular color={FLARE_COLOR_CODE} size={100} />
            </div>
        </>
    } else {
        component = <>
            <InfoComponent specs={data.specs} summary={data.summary} />
            <FlareFspStatsComponent />
        </>
    }

    return (
        <div className="single-project-page-design">
            <ProjectTitle title='Flare FSP Delegation' suptitle='Help Secure Flare Network Oracle Data' />
            <div className="container pt-30">
                {component}
            </div>
        </div>
    )
}

export default AvalancheValidatorProject