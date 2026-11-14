export default function ConnectionStatus({ ok, loading, onRetry }) {
  if (loading) {
    return (
      <div className="connection-pill loading" role="status">
        <span className="dot" aria-hidden />
        Checking connection…
      </div>
    )
  }
  if (ok) {
    return (
      <div className="connection-pill ok" role="status">
        <span className="dot" aria-hidden />
        Ready — evidence library connected
      </div>
    )
  }
  return (
    <div className="connection-banner fail" role="alert">
      <p>
        <strong>Not connected.</strong> Start the IGNIS service on this computer, then retry.
      </p>
      {onRetry ? (
        <button type="button" className="secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}
