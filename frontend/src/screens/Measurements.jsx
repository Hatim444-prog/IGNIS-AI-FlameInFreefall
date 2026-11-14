import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BarChart from '../components/BarChart'
import PageHero from '../components/PageHero'
import EmptyState from '../components/EmptyState'
import DevDetails from '../components/DevDetails'
import { apiGet, apiPostJson } from '../lib/api'
import { friendlyApiError } from '../lib/labels'
import { useExperimentSelection } from '../context/ExperimentSelection'

function aggregateForChart(measurements) {
  const buckets = new Map()
  for (const m of measurements) {
    const code = m.experiment_code
    const val = Number(m.value)
    if (!buckets.has(code)) buckets.set(code, { sum: 0, count: 0, unit: m.unit })
    const b = buckets.get(code)
    b.sum += val
    b.count += 1
  }
  return [...buckets.entries()].map(([code, b]) => ({
    key: code,
    label: code.replace(/^ZARM-/, ''),
    value: b.sum / b.count,
    unit: b.unit,
  }))
}

const VARIABLE_HINTS = {
  propagation_rate: 'How fast the flame front moved in the run',
  oxygen_concentration: 'Oxygen level during the test',
  airflow_velocity: 'Air speed past the sample',
  pressure: 'Ambient pressure during the test',
}

export default function Measurements() {
  const { selected } = useExperimentSelection()
  const [variables, setVariables] = useState([])
  const [variable, setVariable] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet('/ai/data/variables?dataset_prefix=ZARM-')
      .then((data) => {
        const list = data.variables || []
        setVariables(list)
        const preferred = list.find((v) => v.variable_name === 'propagation_rate')
        setVariable(preferred?.variable_name || list[0]?.variable_name || '')
      })
      .catch((err) => setError(friendlyApiError(err.message)))
  }, [])

  const chartPoints = useMemo(
    () => (result?.measurements ? aggregateForChart(result.measurements) : []),
    [result],
  )

  async function compare() {
    if (!selected.length) {
      setError('Add at least one experiment to your shortlist first.')
      return
    }
    if (!variable) {
      setError('Choose what you want to measure.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await apiPostJson('/ai/data/compare', {
        variable_name: variable,
        experiment_codes: selected,
        dataset_prefix: 'ZARM-',
      })
      setResult(data)
    } catch (err) {
      setError(friendlyApiError(err.message))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const summary = result?.summary
  const currentVar = variables.find((v) => v.variable_name === variable)

  return (
    <>
      <PageHero
        title="Compare results"
        lead="See how a measured quantity differs across the experiments on your shortlist."
      />

      {selected.length === 0 ? (
        <EmptyState
          title="Your shortlist is empty"
          body="Browse experiments and check the ones you want to compare."
          actionTo="/experiments"
          actionLabel="Browse experiments"
        />
      ) : (
        <div className="alert info">
          Comparing <strong>{selected.length}</strong> experiment
          {selected.length === 1 ? '' : 's'} from your shortlist.
        </div>
      )}

      <section className="panel">
        <div className="field-block">
          <label htmlFor="var">What to compare</label>
          <select
            id="var"
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            disabled={!variables.length}
          >
            {variables.map((v) => (
              <option key={v.variable_name} value={v.variable_name}>
                {v.variable_name.replace(/_/g, ' ')} ({v.unit})
              </option>
            ))}
          </select>
          {VARIABLE_HINTS[variable] ? (
            <p className="field-help">{VARIABLE_HINTS[variable]}</p>
          ) : currentVar ? (
            <p className="field-help">
              {currentVar.observation_count} recorded values across{' '}
              {currentVar.experiment_count} experiments
            </p>
          ) : null}
        </div>

        <div className="row">
          <button type="button" onClick={compare} disabled={loading || !selected.length}>
            {loading ? 'Building chart…' : 'Show comparison'}
          </button>
        </div>

        {error ? <div className="alert fail">{error}</div> : null}

        {summary && !summary.warning ? (
          <div className="summary-callout">
            <span className="summary-stat">
              Lowest: <strong>{summary.minimum}</strong> {summary.unit}
            </span>
            <span className="summary-stat">
              Highest: <strong>{summary.maximum}</strong> {summary.unit}
            </span>
            <span className="summary-stat">
              Average: <strong>{Number(summary.mean).toFixed(4)}</strong> {summary.unit}
            </span>
          </div>
        ) : null}
        {summary?.warning ? <div className="alert info">{summary.warning}</div> : null}

        <BarChart points={chartPoints} unit={summary?.unit} />

        {result?.measurements?.length ? (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Value</th>
                  <th>Uncertainty</th>
                </tr>
              </thead>
              <tbody>
                {result.measurements.map((m, i) => (
                  <tr key={`${m.experiment_code}-${i}`}>
                    <td>{m.experiment_code}</td>
                    <td>
                      {m.value} {m.unit}
                    </td>
                    <td>{m.uncertainty ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {result?.disclaimer ? <p className="hint">{result.disclaimer}</p> : null}
        <DevDetails value={result} />
      </section>

      {selected.length > 0 ? (
        <p className="hint">
          Want a narrative explanation?{' '}
          <Link to="/assistant">Ask a question</Link> about these runs.
        </p>
      ) : null}
    </>
  )
}
