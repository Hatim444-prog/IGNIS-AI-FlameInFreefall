const DIMENSION_LABELS = {
  objective: 'Research goal',
  fuel: 'Fuel / material',
  oxygen: 'Oxygen level',
  pressure: 'Pressure',
  outcome: 'Suppression outcomes',
  evidence: 'Source quality',
  gravity: 'Gravity environment',
}

export default function MissionResultCard({ row, weights }) {
  const dims = row.score_dimensions || {}
  const limitations = row.limitations || []

  return (
    <article className="mission-card">
      <header className="mission-card-head">
        <h3 className="mission-card-title">
          {row.investigation_title || row.investigation_code}
        </h3>
        <div className="match-badge">
          Match strength: <strong>{row.ranking_score}</strong>
          <span className="hint-inline"> (relevance estimate, not fire risk)</span>
        </div>
      </header>
      {row.investigation_url ? (
        <p className="field-help">
          <a href={row.investigation_url} target="_blank" rel="noopener noreferrer">
            View program information
          </a>
        </p>
      ) : null}
      {row.experiment_code ? (
        <p className="field-help">Closest experiment on file: {row.experiment_code}</p>
      ) : null}
      {weights ? (
        <div className="score-grid">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const val = dims[key]
            return (
              <div key={key} className="score-row">
                <span className="score-label">{label}</span>
                <div className="score-track" aria-hidden>
                  <div
                    className="score-fill"
                    style={{
                      width: val == null ? '0%' : `${Math.round(Number(val) * 100)}%`,
                      opacity: val == null ? 0.25 : 1,
                    }}
                  />
                </div>
                <span className="score-val">
                  {val == null ? '—' : `${Math.round(Number(val) * 100)}%`}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
      {limitations.length ? (
        <ul className="limit-list">
          {limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
