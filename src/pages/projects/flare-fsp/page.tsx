import { useEffect, useState } from "react"
import { SpinnerCircular } from 'spinners-react'
import ProjectTitle from "~/components/pages/title"
import InfoComponent from "~/components/pages/info"
import { getPageData } from "./data"
import type { FlareData } from "./types"


export const AvalancheValidatorProject = () => {
    const [data, setData] = useState<FlareData>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        async function fetchData() {
            const res = await getPageData()
            setData(res)
            setLoading(false)
        }
        fetchData()
    }, [])

    let component = null
    if (loading) {
        component = <>
            <div style={{ textAlign: 'center' }} className="mt-30 mb-30" >
                <SpinnerCircular color='FireBrick' size={100} />
            </div>
        </>
    } else {
        component = <>
            <InfoComponent specs={data.specs} summary={data.summary} />
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