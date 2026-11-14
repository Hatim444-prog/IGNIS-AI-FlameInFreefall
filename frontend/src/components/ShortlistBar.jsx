import { Link } from 'react-router-dom'
import { useExperimentSelection } from '../context/ExperimentSelection'

function shortLabel(code) {
  if (code.length <= 18) return code
  return `${code.slice(0, 8)}…${code.slice(-6)}`
}

export default function ShortlistBar() {
  const { selected, remove, clear } = useExperimentSelection()

  if (!selected.length) {
    return null
  }

  return (
    <div className="shortlist-bar" aria-live="polite">
      <span className="shortlist-title">Experiments in your shortlist</span>
      <div className="chip-row">
        {selected.map((code) => (
          <button
            key={code}
            type="button"
            className="chip chip-btn"
            title={code}
            onClick={() => remove(code)}
          >
            {shortLabel(code)} · Remove
          </button>
        ))}
      </div>
      <div className="shortlist-actions">
        <Link to="/measurements" className="btn small">
          Compare them
        </Link>
        <Link to="/assistant" className="btn secondary small">
          Ask about them
        </Link>
        <button type="button" className="text-btn" onClick={clear}>
          Clear shortlist
        </button>
      </div>
    </div>
  )
}
