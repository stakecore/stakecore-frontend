import React from "react"
import SlideUp from '../../utils/animations/slideUp'
import SpecsTooltip from "./tooltip"
import { symbolToChain } from "~/utils/misc/translations"
import type { ISpecs } from "../types"


const InfoComponent = ({ summary, specs }) => {
  const chain = symbolToChain(summary.asset)

  return <>
    <div className="row">
      <div className="col-lg-3">
        <SlideUp>
          <div className='single-project-page-left wow fadeInUp delay-0-2s'>
            <ProjectInfoSummary {...summary} />
          </div>
        </SlideUp>
      </div>
      <div className="col-lg-9">
        <SlideUp>
          <div className='single-project-page-right wow fadeInUp delay-0-4s'>
            <Specs config={specs} />
          </div>
        </SlideUp>
      </div>
    </div>
  </>
}

const ProjectInfoSummary = ({ asset, apy, delegation, lockup }) => {
  return (
    <>
      <ProjectSingleInfo title='Asset' value={asset} />
      <ProjectSingleInfo title='APY' value={apy} />
      <ProjectSingleInfo title='Delegation Amount' value={delegation} />
      <ProjectSingleInfo title='Lockup Time' value={lockup} />
    </>
  )
}

const Specs = ({ config }: { config: ISpecs }) => {
  return <>
    <div className="specs-container">
      {config.map((cfg, i: number) => {
        const hr = <hr className="specs-table-border mt-20"></hr>
        return (
          <React.Fragment key={i}>
            <SpecsTable config={cfg} />
            {(i + 1 < config.length) && hr}
          </React.Fragment>
        )
      })}
    </div>
  </>
}

const SpecsTable = ({ config }) => {
  return (
    <div className="specs-table-container">
      <table className="specs-table">
        <tbody>
          {config.map(({ title, value, tooltip }, i: number) => {
            return <SpecsRow key={i} title={title} value={value} tooltip={tooltip} />
          })}
        </tbody>
      </table>
    </div>
  )
}

const SpecsRow = ({ title, value, tooltip }) => {
  if (tooltip) title = <span><SpecsTooltip text={tooltip} />{title}</span>
  return (
    <tr className="specs-table-row">
      <td className="specs-table-data specs-table-data-left">{title}</td>
      <td className="specs-table-data specs-table-data-right link">{value}</td>
    </tr>
  )
}

const ProjectSingleInfo = ({ title, value }) => {
  return (
    <div className="single-info">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  )
}

export default InfoComponent