import { useState } from 'react'
import PageHero from '../components/PageHero'
import DevDetails from '../components/DevDetails'
import { apiGet, apiPostForm } from '../lib/api'
import { friendlyApiError } from '../lib/labels'

export default function Vision() {
  const [experimentCode, setExperimentCode] = useState('')
  const [searchQ, setSearchQ] = useState('flame in microgravity')
  const [result, setResult] = useState(null)
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function upload(endpoint, file, persist) {
    if (!file) {
      setError('Please choose a photo or video first.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    const form = new FormData()
    form.append('file', file)
    if (experimentCode.trim()) form.append('experiment_code', experimentCode.trim())
    try {
      const data = await apiPostForm(endpoint, form)
      setResult(data)
    } catch (err) {
      setError(friendlyApiError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function search() {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet(
        `/ai/vision/search?q=${encodeURIComponent(searchQ)}&limit=6`,
      )
      setSearchResult(data)
    } catch (err) {
      setError(friendlyApiError(err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        title="Photos & video"
        lead="Get a plain-language description of what is visible in a flame image. This is not a measurement of temperature or fire risk."
      />

      {loading ? (
        <div className="alert info" role="status">
          Analyzing — this can take up to a minute.
        </div>
      ) : null}
      {error ? <div className="alert fail">{error}</div> : null}

      <div className="vision-grid">
        <section className="panel panel-soft">
          <h2 className="section-heading">Quick look (not saved)</h2>
          <p className="field-help">JPEG, PNG up to 10 MB, or MP4 up to 30 MB.</p>
          <FilePick
            accept="image/jpeg,image/png"
            label="Upload a photo"
            disabled={loading}
            onPick={(f) => upload('/ai/vision/image', f, false)}
          />
          <FilePick
            accept="video/mp4"
            label="Upload a video"
            disabled={loading}
            onPick={(f) => upload('/ai/vision/video', f, false)}
          />
        </section>

        <section className="panel panel-soft">
          <h2 className="section-heading">Save to the library</h2>
          <p className="field-help">
            Stored items can appear when you ask multimodal questions later.
          </p>
          <div className="field-block">
            <label htmlFor="exp">Link to an experiment (optional)</label>
            <input
              id="exp"
              type="text"
              value={experimentCode}
              onChange={(e) => setExperimentCode(e.target.value)}
              placeholder="Paste an ID from Browse experiments"
            />
          </div>
          <FilePick
            accept="image/jpeg,image/png"
            label="Save a photo"
            disabled={loading}
            onPick={(f) => upload('/ai/vision/store-image', f, true)}
          />
          <FilePick
            accept="video/mp4"
            label="Save a video"
            disabled={loading}
            onPick={(f) => upload('/ai/vision/store-video', f, true)}
          />
        </section>
      </div>

      {result?.description ? (
        <section className="panel answer-panel">
          <h2 className="section-heading">What we see</h2>
          <p className="answer-body">{result.description}</p>
          <DevDetails value={result} />
        </section>
      ) : null}

      <section className="panel">
        <h2 className="section-heading">Search saved visuals</h2>
        <div className="row">
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            aria-label="Search saved visuals"
            placeholder="Describe what you are looking for"
          />
          <button type="button" className="secondary" onClick={search} disabled={loading}>
            Search
          </button>
        </div>
        {searchResult?.results?.map((r) => (
          <article key={r.observation_id} className="source-card">
            <span className="source-type">Saved visual</span>
            <h4>{r.filename}</h4>
            <p className="hint">
              {r.experiment_code ? `Experiment ${r.experiment_code} · ` : ''}
              Review: {r.review_status}
            </p>
            <p className="source-excerpt">{String(r.description || '').slice(0, 400)}</p>
          </article>
        ))}
      </section>
    </>
  )
}

function FilePick({ accept, label, disabled, onPick }) {
  return (
    <label className="file-pick">
      <span className="btn secondary">{label}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
      />
    </label>
  )
}
