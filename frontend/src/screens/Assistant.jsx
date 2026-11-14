import { useEffect, useState } from 'react'
import PageHero from '../components/PageHero'
import DevDetails from '../components/DevDetails'
import { apiGet, apiPostJson } from '../lib/api'
import { ASSISTANT_MODES, friendlyApiError } from '../lib/labels'
import { useExperimentSelection } from '../context/ExperimentSelection'

const PATHS = {
  paper: '/ai/ask',
  hybrid: '/ai/ask-hybrid',
  multimodal: '/ai/ask-multimodal',
}

export default function Assistant() {
  const { selected } = useExperimentSelection()
  const [mode, setMode] = useState('hybrid')
  const [question, setQuestion] = useState(
    'How does flame spread change in low gravity, and what should we be cautious about?',
  )
  const [variables, setVariables] = useState([])
  const [variableName, setVariableName] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    apiGet('/ai/data/variables?dataset_prefix=ZARM-')
      .then((data) => setVariables(data.variables || []))
      .catch(() => {})
  }, [])

  function buildBody() {
    const trimmed = question.trim()
    if (mode === 'paper') return { question: trimmed }
    if (mode === 'hybrid') {
      return {
        question: trimmed,
        dataset_prefix: 'ZARM-',
        variable_name: variableName || null,
        experiment_codes: selected,
        max_experiments: 8,
        top_k_papers: 4,
      }
    }
    return {
      question: trimmed,
      experiment_codes: selected,
      top_k_papers: 4,
      top_k_visual: 3,
    }
  }

  async function ask() {
    if (!question.trim()) {
      setError('Please type your question first.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await apiPostJson(PATHS[mode], buildBody())
      setResult(data)
    } catch (err) {
      setError(friendlyApiError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'What limits our confidence in flame spread measurements?',
    'How might oxygen level affect fire risk in a pressurized rover?',
    'Summarize what we know about suppression in microgravity.',
  ]

  return (
    <>
      <PageHero
        title="Ask a question"
        lead="You will get a written answer with links to papers, numbers, or images we used. Treat it as a starting point — not a final safety decision."
      />

      <section className="panel">
        <h2 className="section-heading">Where should we look for answers?</h2>
        <div className="mode-cards">
          {ASSISTANT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
            >
              <span className="mode-card-title">{m.title}</span>
              <span className="mode-card-desc">{m.description}</span>
            </button>
          ))}
        </div>

        {selected.length > 0 ? (
          <p className="field-help">
            Including measurements from {selected.length} experiment
            {selected.length === 1 ? '' : 's'} on your shortlist.
          </p>
        ) : null}

        <div className="field-block">
          <label htmlFor="q">Your question</label>
          <textarea
            id="q"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about flame behavior, past missions, or your scenario…"
          />
        </div>

        <div className="suggestion-row">
          <span className="hint">Try:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="suggestion-chip"
              onClick={() => setQuestion(s)}
            >
              {s.length > 48 ? `${s.slice(0, 48)}…` : s}
            </button>
          ))}
        </div>

        <button type="button" className="text-btn" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? 'Hide' : 'Show'} fine-tuning options
        </button>
        {showAdvanced && mode === 'hybrid' ? (
          <div className="field-block">
            <label htmlFor="var">Focus on measurement (optional)</label>
            <select
              id="var"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
            >
              <option value="">Let IGNIS pick from your question</option>
              {variables.map((v) => (
                <option key={v.variable_name} value={v.variable_name}>
                  {v.variable_name.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="row" style={{ marginTop: '1rem' }}>
          <button type="button" onClick={ask} disabled={loading}>
            {loading ? 'Preparing answer…' : 'Get answer'}
          </button>
        </div>
        {error ? <div className="alert fail">{error}</div> : null}
      </section>

      {result?.answer ? (
        <section className="panel answer-panel">
          <h2 className="section-heading">Answer</h2>
          <p className="answer-body">{result.answer}</p>

          {[...(result.warnings || []), ...(result.limitations || [])].map((w) => (
            <div key={w} className="notice-block">
              {w}
            </div>
          ))}

          <h3 className="subhead">Sources we used</h3>
          {result.sources?.map((s) => (
            <SourceCard
              key={s.reference}
              type="Research paper"
              title={s.file}
              meta={`Page ${s.page}`}
            />
          ))}
          {result.paper_sources?.map((s, i) => (
            <SourceCard
              key={`p-${i}`}
              type="Research paper"
              title={s.source || s.file}
              meta={`Page ${s.page}`}
            />
          ))}
          {result.visual_sources?.map((s, i) => (
            <SourceCard
              key={`v-${i}`}
              type="Photo or video (AI description)"
              title={s.filename}
              meta="Review status may be pending"
              excerpt={String(s.description || '').slice(0, 280)}
            />
          ))}
          {result.measurement_sources?.map((s, i) => (
            <SourceCard
              key={`m-${i}`}
              type="Lab measurement"
              title={s.experiment_code}
              meta={`${s.variable_name}: ${s.value} ${s.unit}`}
            />
          ))}

          <DevDetails value={result} />
        </section>
      ) : null}
    </>
  )
}

function SourceCard({ type, title, meta, excerpt }) {
  return (
    <article className="source-card">
      <span className="source-type">{type}</span>
      <h4>{title}</h4>
      {meta ? <p className="hint">{meta}</p> : null}
      {excerpt ? <p className="source-excerpt">{excerpt}</p> : null}
    </article>
  )
}
