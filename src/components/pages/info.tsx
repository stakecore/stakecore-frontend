import React from "react"
import classNames from "classnames"
import SpecsTooltip from "./tooltip"
import { chainToDivBorderClassName, symbolToChain } from "~/utlits/misc/translations"
import type { ISpecs } from "../types"


const InfoComponent = ({ summary, specs }) => {
  const chain = symbolToChain(summary.asset)
  const classname = chainToDivBorderClassName(chain)

  return <>
    <div className="row">
      <div className="col-lg-3">
        <div className={classNames('single-project-page-left wow fadeInUp delay-0-2s', { [classname]: true })}>
          <ProjectInfoSummary {...summary} />
        </div>
      </div>
      <div className="col-lg-9">
        <div className={classNames('single-project-page-right wow fadeInUp delay-0-4s', { [classname]: true })}>
          <Specs config={specs} />
        </div>
      </div>
    </div>
  </>
}

const ProjectInfoSummary = ({ asset, apy, risk, lockup }) => {
  return (
    <>
      <ProjectSingleInfo title='Asset' value={asset} />
      <ProjectSingleInfo title='APY' value={apy} />
      <ProjectSingleInfo title='Risk Rating' value={risk} />
      <ProjectSingleInfo title='Lockup' value={lockup} />
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