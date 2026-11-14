import { useState } from 'react'
import PageHero from '../components/PageHero'
import MissionResultCard from '../components/MissionResultCard'
import DevDetails from '../components/DevDetails'
import { apiPostJson } from '../lib/api'
import { ENVIRONMENT_LABELS, FOCUS_LABELS, friendlyApiError } from '../lib/labels'

const ENVIRONMENTS = Object.keys(ENVIRONMENT_LABELS)
const FOCUSES = Object.keys(FOCUS_LABELS)

const defaults = {
  environment: 'pressurized_lunar_rover',
  research_focus: 'suppression',
  oxygen_percent: 32,
  pressure_psi: 12.2,
  fuel_material: '',
  max_results: 10,
  include_external_research: true,
}

export default function Mission() {
  const [form, setForm] = useState(defaults)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function analyze() {
    setLoading(true)
    setError('')
    try {
      const body = {
        ...form,
        fuel_material: form.fuel_material.trim() || null,
        oxygen_percent: Number(form.oxygen_percent),
        pressure_psi: Number(form.pressure_psi),
        max_results: Number(form.max_results),
      }
      const data = await apiPostJson('/ai/mission/analyze', body)
      setResult(data)
    } catch (err) {
      setError(friendlyApiError(err.message))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const nasaFound = (result?.ranked_nasa_investigations || []).length > 0

  return (
    <>
      <PageHero
        title="Plan a mission"
        lead="Describe your vehicle or habitat and we will suggest past research that might be relevant — with clear limits on what the scores mean."
      />

      <section className="panel">
        <div className="field-block">
          <label htmlFor="env">Where will people live or travel?</label>
          <select
            id="env"
            value={form.environment}
            onChange={(e) => update('environment', e.target.value)}
          >
            {ENVIRONMENTS.map((v) => (
              <option key={v} value={v}>
                {ENVIRONMENT_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-block">
          <label htmlFor="focus">What fire topic matters most?</label>
          <select
            id="focus"
            value={form.research_focus}
            onChange={(e) => update('research_focus', e.target.value)}
          >
            {FOCUSES.map((v) => (
              <option key={v} value={v}>
                {FOCUS_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-grid-2">
          <div className="field-block">
            <label htmlFor="o2">Expected oxygen (%)</label>
            <input
              id="o2"
              type="number"
              min={0}
              max={100}
              value={form.oxygen_percent}
              onChange={(e) => update('oxygen_percent', e.target.value)}
            />
          </div>
          <div className="field-block">
            <label htmlFor="psi">Cabin pressure (psi)</label>
            <input
              id="psi"
              type="number"
              min={0}
              step={0.1}
              value={form.pressure_psi}
              onChange={(e) => update('pressure_psi', e.target.value)}
            />
          </div>
        </div>
        <div className="field-block">
          <label htmlFor="fuel">Fuel or material (optional)</label>
          <input
            id="fuel"
            type="text"
            value={form.fuel_material}
            onChange={(e) => update('fuel_material', e.target.value)}
            placeholder="e.g. PMMA, wire insulation"
          />
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={form.include_external_research}
            onChange={(e) => update('include_external_research', e.target.checked)}
          />
          Also show relevant non-NASA studies (clearly labeled)
        </label>
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button type="button" onClick={analyze} disabled={loading}>
            {loading ? 'Finding matches…' : 'Find relevant research'}
          </button>
        </div>
        {error ? <div className="alert fail">{error}</div> : null}
      </section>

      {result ? (
        <>
          <h2 className="section-heading">Results for your scenario</h2>

          {!nasaFound ? (
            <div className="alert info">
              We did not find NASA-linked studies in the library for this scenario yet. That does
              not mean none exist — more data may need to be imported and verified.
            </div>
          ) : null}

          {result.warnings?.map((w) => (
            <div key={w} className="notice-block">
              {w}
            </div>
          ))}

          <section className="panel panel-soft">
            <h3 className="section-heading">NASA-linked programs</h3>
            <p className="field-help">
              Match strength shows how closely metadata fits your scenario — not the chance of a
              fire or success of suppression.
            </p>
            {result.ranked_nasa_investigations?.length ? (
              result.ranked_nasa_investigations.map((row) => (
                <MissionResultCard key={row.investigation_code} row={row} weights={result.weights} />
              ))
            ) : (
              <p className="hint">No NASA-linked items to show.</p>
            )}
          </section>

          {form.include_external_research ? (
            <section className="panel">
              <h3 className="section-heading">Other research</h3>
              {result.related_external_research?.length ? (
                result.related_external_research.map((row) => (
                  <MissionResultCard
                    key={`ext-${row.investigation_code}`}
                    row={row}
                    weights={result.weights}
                  />
                ))
              ) : (
                <p className="hint">None found for these settings.</p>
              )}
            </section>
          ) : null}

          <DevDetails value={result} />
        </>
      ) : null}
    </>
  )
}
