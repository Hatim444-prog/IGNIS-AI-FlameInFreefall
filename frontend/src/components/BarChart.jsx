export default function BarChart({ points, unit }) {
  if (!points?.length) return null

  const values = points.map((p) => Number(p.value))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || max || 1

  return (
    <figure className="bar-chart" aria-label="Measurement comparison chart">
      <ul className="bar-chart-list">
        {points.map((p) => {
          const v = Number(p.value)
          const height = Math.max(8, Math.round(((v - min) / span) * 100))
          return (
            <li key={p.key} className="bar-chart-item">
              <div
                className="bar-fill"
                style={{ height: `${height}%` }}
                title={`${p.label}: ${v} ${unit || p.unit || ''}`}
              />
              <span className="bar-value">{v}</span>
              <span className="bar-label">{p.label}</span>
            </li>
          )
        })}
      </ul>
      {unit ? <figcaption className="hint">Values in {unit}</figcaption> : null}
    </figure>
  )
}
