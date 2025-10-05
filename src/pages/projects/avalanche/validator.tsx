import { useEffect, useState } from "react"
import { SpinnerDotted } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import AvalancheValidatorGraphicsComponent from "./components/stats"
import AvalancheValidatorDelegateComponent from "./components/delegate"
import AvalancheValidatorUserComponent from "./components/user"
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

    let component = null
    if (loading) {
        component = <>
            <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
                <SpinnerDotted color='white' size={100} />
            </div>
        </>
    } else {
        component = <>
            <InfoComponent specs={data.specs} summary={data.summary} />
            <AvalancheValidatorUserComponent />
            <AvalancheValidatorGraphicsComponent config={data.graphics} />
            <AvalancheValidatorDelegateComponent validatorLink={data.delegation.validatorLink} />
        </>
    }

    return (
        <div className="single-project-page-design single-project-page-design-avalanche-validator">
            <ProjectTitle title='Avalanche Validator Delegation' suptitle='Help Secure The Avalanche Network' />
            <div className="container pt-30">
                {component}
            </div>
        </div>
    )
}

export default AvalancheValidatorProject