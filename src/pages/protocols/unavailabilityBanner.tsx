import { RiAlertLine } from '@remixicon/react'
import type { ISummary } from './types'
import './unavailabilityBanner.scss'

type Props = { summary: ISummary }

// Validator-page banner shown when capacity is exhausted or the
// validator stake expires too soon (< 14 days). Returns null on healthy
// summaries so the caller can render it unconditionally.
const UnavailabilityBanner = ({ summary }: Props) => {
  const reasons: string[] = []
  if (summary.delegation === 'Unavailable') {
    reasons.push('the validator has reached its delegation capacity')
  }
  if (summary.lockup === 'Unavailable') {
    reasons.push('the validator stake expires too soon (less than 14 days remaining)')
  }
  if (reasons.length === 0) return null

  return (
    <div className="unavailability-banner" role="alert">
      <div className="container unavailability-banner-inner">
        <RiAlertLine size={22} className="unavailability-banner-icon" aria-hidden="true" />
        <span className="unavailability-banner-text">
          <strong>Delegation to this validator is currently unavailable</strong>
          {' — '}
          {reasons.join(' and ')}.
        </span>
      </div>
    </div>
  )
}

export default UnavailabilityBanner
