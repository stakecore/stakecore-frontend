import { RiInboxLine } from '@remixicon/react'
import './emptyState.scss'

type EmptyStateProps = {
  title?: string
  description?: string
  className?: string
}

// Shown when a request succeeds but returns no data (e.g. the validator
// list is empty because every validator has expired or been removed).
// Deliberately distinct from ServerError — nothing failed, so it reads
// as an informational state rather than an error.
export const EmptyState = ({
  title = 'Nothing to show',
  description,
  className,
}: EmptyStateProps) => {
  const containerClass = className ? `empty-state ${className}` : 'empty-state'
  return (
    <div className={containerClass} role="status">
      <RiInboxLine size={40} className="empty-state-icon" aria-hidden="true" />
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
    </div>
  )
}

export default EmptyState
