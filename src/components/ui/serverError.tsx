import { ApiError } from '~/backendApi'

type ServerErrorProps = {
  error?: unknown
  status?: number
  className?: string
}

const MAX_DESC_CHARS = 280

const labelForStatus = (status: number): string => {
  if (status === 0) return 'Connection failed'
  if (status === 400) return 'Bad request'
  if (status === 401) return 'Unauthorized'
  if (status === 403) return 'Forbidden'
  if (status === 404) return 'Not found'
  if (status === 408) return 'Request timeout'
  if (status === 409) return 'Conflict'
  if (status === 429) return 'Too many requests'
  if (status === 502) return 'Bad gateway'
  if (status === 503) return 'Service unavailable'
  if (status === 504) return 'Gateway timeout'
  if (status >= 500) return 'Server error'
  if (status >= 400) return 'Request failed'
  return 'Error'
}

const extractMessage = (error: unknown): string | undefined => {
  if (error == null) return undefined
  if (typeof error === 'string') return error.trim() || undefined
  if (error instanceof ApiError) {
    const body = error.body as unknown
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>
      if (typeof b.error === 'string' && b.error) return b.error
      if (typeof b.message === 'string' && b.message) return b.message
    }
    if (typeof body === 'string' && body) return body
    if (error.message) return error.message
    return error.statusText || undefined
  }
  if (error instanceof Error) return error.message || undefined
  try { return String(error) } catch { return undefined }
}

const truncate = (text: string): string =>
  text.length <= MAX_DESC_CHARS ? text : text.slice(0, MAX_DESC_CHARS - 1).trimEnd() + '…'

const derive = (error: unknown, statusOverride?: number) => {
  let status = statusOverride
  if (status == null && error instanceof ApiError) status = error.status

  const message = extractMessage(error)
  const hasStatus = status != null && status > 0

  return {
    statusDisplay: hasStatus ? String(status) : '—',
    label: hasStatus ? labelForStatus(status!) : 'Connection failed',
    description: message
      ? truncate(message)
      : hasStatus
        ? 'The request failed.'
        : 'Could not reach the server. Check your connection and try again.',
  }
}

export const ServerError = ({ error, status, className }: ServerErrorProps) => {
  const { statusDisplay, label, description } = derive(error, status)
  const containerClass = className ? `error-container ${className}` : 'error-container'
  return (
    <div className={containerClass}>
      <div className="error-status">{statusDisplay}</div>
      <div className="error-label">{label}</div>
      <p className="error-desc">{description}</p>
    </div>
  )
}

export default ServerError
