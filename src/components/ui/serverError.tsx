export const ServerError = ({ status, message }) => {
  return <div className="error-container">
    <div className="error-status">{status}</div>
    <div className="error-label">Server error</div>
    <p className="error-desc">{String(message ?? 'The request failed.')}</p>
  </div>
}

export default ServerError
