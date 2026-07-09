import type { ReactNode } from 'react'
import { SpinnerCircular } from 'spinners-react'
import ServerError from './serverError'
import EmptyState from './emptyState'

interface QueryStateProps<T> {
  isLoading: boolean
  error: unknown
  data: T | null | undefined
  spinnerColor?: string
  spinnerSize?: number
  emptyTitle?: string
  emptyDescription?: string
  children: (data: T) => ReactNode
}

// Standard loading/error/empty ladder for SWR-backed sections. Critically it
// distinguishes a real failure (error set → ServerError) from a successful
// but empty/expired response (data == null → EmptyState), so the latter can't
// surface a false "Connection failed" the way `data == null → ServerError`
// did on the FSP pages.
export function QueryState<T>({
  isLoading,
  error,
  data,
  spinnerColor = 'white',
  spinnerSize = 100,
  emptyTitle,
  emptyDescription,
  children,
}: QueryStateProps<T>) {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center' }} className="mt-30 mb-30">
        <SpinnerCircular color={spinnerColor} size={spinnerSize} />
      </div>
    )
  }
  if (error != null) {
    return <ServerError error={error} />
  }
  if (data == null) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return <>{children(data)}</>
}

export default QueryState
