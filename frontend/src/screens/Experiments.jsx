import { useEffect, useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import EmptyState from '../components/EmptyState'
import DevDetails from '../components/DevDetails'
import { apiGet } from '../lib/api'
import { friendlyApiError } from '../lib/labels'
import { useExperimentSelection } from '../context/ExperimentSelection'

export default function Experiments() {
  const { selected, toggle, add } = useExperimentSelection()
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const [showDev, setShowDev] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await apiGet('/ai/data/experiments?dataset_prefix=ZARM-&limit=80')
        if (!cancelled) {
          setRows(data.experiments || [])
          if (data.experiments?.[0]) setActive(data.experiments[0])
        }
      } catch (err) {
        if (!cancelled) setError(friendlyApiError(err.message))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (row) =>
        row.experiment_code?.toLowerCase().includes(q) ||
        row.investigation_title?.toLowerCase().includes(q) ||
        String(row.fuel_material || '').toLowerCase().includes(q),
    )
  }, [rows, query])

  return (
    <>
      <PageHero
        title="Browse experiments"
        lead="Pick the runs you want to compare or discuss. Add them to your shortlist — we will use only those you select."
      />

      <section className="panel">
        <div className="row">
          <label className="search-label" htmlFor="search-exp">
            Search by name, fuel, or ID
          </label>
          <input
            id="search-exp"
            type="search"
            placeholder="e.g. PMMA or oxygen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {error ? <div className="alert fail">{error}</div> : null}
        {loading ? <p className="hint">Loading experiments…</p> : null}

        {!loading && !filtered.length ? (
          <EmptyState
            title="No experiments match"
            body="Try a different search term, or check that the IGNIS service is connected."
          />
        ) : null}

        <div className="split-explorer">
          <div className="table-wrap">
            <table className="data table-selectable">
              <thead>
                <tr>
                  <th scope="col">Add</th>
                  <th scope="col">Run</th>
                  <th scope="col">Oxygen</th>
                  <th scope="col">Fuel</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isSel = selected.includes(row.experiment_code)
                  const isActive = active?.experiment_code === row.experiment_code
                  return (
                    <tr
                      key={row.experiment_code}
                      className={isActive ? 'row-active' : undefined}
                      onClick={() => setActive(row)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Add ${row.experiment_code} to shortlist`}
                          checked={isSel}
                          onChange={() => toggle(row.experiment_code)}
                        />
                      </td>
                      <td>{row.experiment_code}</td>
                      <td>{row.oxygen_percent != null ? `${row.oxygen_percent}%` : '—'}</td>
                      <td>{row.fuel_material || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <aside className="detail-panel">
            <h2 className="section-heading">Details</h2>
            {active ? (
              <>
                <p className="detail-run-name">{active.experiment_code}</p>
                <p className="hint">{active.investigation_title || active.investigation_code}</p>
                <ul className="detail-facts">
                  <li>
                    <span>Oxygen</span>
                    {active.oxygen_percent != null ? `${active.oxygen_percent}%` : 'Unknown'}
                  </li>
                  <li>
                    <span>Pressure</span>
                    {active.pressure_pa != null ? `${active.pressure_pa} Pa` : 'Unknown'}
                  </li>
                  <li>
                    <span>Airflow</span>
                    {active.airflow_m_s != null ? `${active.airflow_m_s} m/s` : 'Unknown'}
                  </li>
                  <li>
                    <span>Gravity</span>
                    {active.gravity_condition || 'Unknown'}
                  </li>
                  <li>
                    <span>Fuel</span>
                    {active.fuel_material || 'Unknown'}
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => add(active.experiment_code)}
                  disabled={selected.includes(active.experiment_code)}
                >
                  {selected.includes(active.experiment_code)
                    ? 'On your shortlist'
                    : 'Add to shortlist'}
                </button>
              </>
            ) : (
              <p className="hint">Select a row to see conditions.</p>
            )}
          </aside>
        </div>

        <button
          type="button"
          className="text-btn"
          onClick={() => setShowDev((v) => !v)}
        >
          {showDev ? 'Hide' : 'Show'} developer filters
        </button>
        {showDev ? (
          <DevDetails label="Loaded experiment records" value={filtered.slice(0, 5)} />
        ) : null}
      </section>
    </>
  )
}
