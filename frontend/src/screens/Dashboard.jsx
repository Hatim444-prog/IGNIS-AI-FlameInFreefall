import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QuickNav from '../components/QuickNav'
import ConnectionStatus from '../components/ConnectionStatus'
import PageHero from '../components/PageHero'
import { apiGet } from '../lib/api'
import { friendlyApiError } from '../lib/labels'

export default function Dashboard() {
  const [connected, setConnected] = useState(false)
  const [studyCount, setStudyCount] = useState(null)
  const [experimentCount, setExperimentCount] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await apiGet('/ai/health')
      const [mission, ex] = await Promise.all([
        apiGet('/ai/mission/health'),
        apiGet('/ai/data/experiments?dataset_prefix=ZARM-&limit=100'),
      ])
      setConnected(true)
      setStudyCount(mission.investigations_in_db)
      setExperimentCount((ex.experiments || []).length)
    } catch (err) {
      setConnected(false)
      setError(friendlyApiError(err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <>
      <PageHero
        title="Welcome to IGNIS"
        lead="Explore how flames behave in space and which past research might apply to your mission — with sources you can check."
      >
        <ConnectionStatus ok={connected && !error} loading={loading} onRetry={refresh} />
      </PageHero>

      {error ? (
        <div className="alert fail" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && connected ? (
        <div className="stat-grid stat-grid-user">
          <div className="stat-card">
            <span className="stat-label">Research programs indexed</span>
            <span className="stat-value">{studyCount ?? '—'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sample experiments loaded</span>
            <span className="stat-value">{experimentCount ?? '—'}</span>
          </div>
        </div>
      ) : null}

      <QuickNav />

      <section className="panel panel-soft">
        <h2 className="section-heading">How it works</h2>
        <ol className="steps-list">
          <li>
            <strong>Ask</strong> — pose a question in plain language; answers cite papers and data.
          </li>
          <li>
            <strong>Shortlist</strong> — select experiments you care about while browsing.
          </li>
          <li>
            <strong>Compare</strong> — chart measurements across those runs.
          </li>
          <li>
            <strong>Plan</strong> — describe a rover or habitat to see relevant past studies.
          </li>
        </ol>
        <p className="hint">
          Data includes external microgravity studies (ZARM) and NASA-linked metadata — sources are
          labeled so you know what you are looking at.
        </p>
      </section>

      <p className="home-secondary-link">
        Need API keys or server URL?{' '}
        <Link to="/settings">Open advanced settings</Link>
      </p>
    </>
  )
}
