import React from "react"
import SpecsTooltip from "./tooltip"
import { HashLink } from "~/components/ui/links"
import { symbolToChain } from "~/utils/misc/translations"
import type { ISpecs, ISpecValue, ISummaryValue } from "./types"
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

// A summary value is plain text or a pair of bounds. The bounds are named
// rather than joined with "to", because "25.0 to 93.0" left the reader to
// work out that they were a min and a max — and the unit rides on the range
// so it appears once, at the end, instead of being missing entirely (the
// asset has its own row further up the same card).
const SummaryValue = ({ value }: { value: ISummaryValue }) => {
  if (typeof value === 'string') return <>{value}</>
  return (
    <span className="single-info-range">
      <span className="single-info-bound-group">
        <span className="single-info-bound">Min</span> {value.min}
      </span>
      {/* A real whitespace node, not just a flex gap: flex ignores
          whitespace-only children for layout, but textContent keeps it, so
          the accessible name stays "Min 25.0 Max 93.0 FLR" rather than
          running the two bounds together. */}
      {' '}
      <span className="single-info-bound-group">
        <span className="single-info-bound">Max</span> {value.max}
        {value.unit && ` ${value.unit}`}
      </span>
    </span>
  )
}

const ProjectSingleInfo = ({ title, value }: { title: string, value: ISummaryValue }) => {
  return (
    <div className="single-info">
      <p>{title}</p>
      <h3><SummaryValue value={value} /></h3>
    </div>
  )
}

export default InfoComponent