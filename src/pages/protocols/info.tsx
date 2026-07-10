import React from "react"
import SpecsTooltip from "./tooltip"
import { HashLink } from "~/components/ui/links"
import { symbolToChain } from "~/utils/misc/translations"
import type { ISpecs, ISpecValue } from "./types"
import './specs.scss'


const InfoComponent = ({ summary, specs }) => {
  const chain = symbolToChain(summary.asset)

  return <>
    <div className="row">
      <div className="col-lg-3">
        <div className='single-project-page-left'>
          <ProjectInfoSummary {...summary} />
        </div>
      </div>
      <div className="col-lg-9">
        <div className='single-project-page-right'>
          <Specs config={specs} />
        </div>
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

const SpecsValue = ({ value }: { value: ISpecValue }) =>
  typeof value === 'string'
    ? <>{value}</>
    : <HashLink url={value.url} address={value.hash} />

const SpecsRow = ({ title, value, tooltip }: { title: React.ReactNode, value: ISpecValue, tooltip?: string }) => {
  const label = tooltip ? <span><SpecsTooltip text={tooltip} />{title}</span> : title
  return (
    <tr className="specs-table-row">
      <td className="specs-table-data specs-table-data-left">{label}</td>
      <td className="specs-table-data specs-table-data-right link"><SpecsValue value={value} /></td>
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