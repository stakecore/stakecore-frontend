import { RiAlertLine } from '@remixicon/react'
import type { ISummary } from './types'
import './unavailabilityBanner.scss'

type Props = { summary: ISummary }

// Validator-page banner shown when the validator can't accept new
// delegations. Returns null on healthy summaries so the caller can
// render it unconditionally.
const UnavailabilityBanner = ({ summary }: Props) => {
  const reasons: string[] = []
  if (summary.expired) {
    // Expiration subsumes the other reasons (capacity goes to 0 + lockup
    // becomes negative as side effects), so it's the only reason worth
    // surfacing in that state.
    reasons.push('the validator duration expired')
  } else {
    if (summary.delegation === 'Unavailable') {
      reasons.push('the validator has reached its delegation capacity')
    }
    if (summary.lockup === 'Unavailable') {
      reasons.push('the validator stake expires too soon (less than 14 days remaining)')
    }
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
