import { useState } from 'react'
import PageHero from '../components/PageHero'
import {
  backendsForMode,
  getApiBase,
  getInferenceMode,
  getNimKey,
  inferenceHeaders,
  setApiBase,
  setInferenceMode,
  setNimKey,
} from '../lib/inference'
import { apiGet } from '../lib/api'
import { friendlyApiError } from '../lib/labels'

export default function Settings() {
  const [apiBase, setApiBaseState] = useState(() => getApiBase())
  const [mode, setMode] = useState(() => getInferenceMode())
  const [nimKey, setNimKeyState] = useState(() => getNimKey())
  const [message, setMessage] = useState('')
  const [kind, setKind] = useState('info')
  const [showServer, setShowServer] = useState(false)

  async function testConnection() {
    setMessage('')
    try {
      await apiGet('/ai/health')
      setKind('ok')
      setMessage('Connected successfully.')
    } catch (err) {
      setKind('fail')
      setMessage(friendlyApiError(err.message))
    }
  }

  function save() {
    setApiBase(apiBase)
    setInferenceMode(mode)
    setNimKey(nimKey.trim())
    setKind('ok')
    setMessage('Preferences saved on this device.')
  }

  const modeDescriptions = {
    ollama: 'Runs AI on your PC using Ollama (slower but private).',
    'nim-mixed': 'Uses NVIDIA cloud for answers; keeps local embeddings.',
    nim: 'Uses NVIDIA cloud for all AI steps.',
  }

  return (
    <>
      <PageHero
        title="Advanced"
        lead="Optional setup for power users and developers. Most people can use IGNIS without changing anything here."
      />

      {message ? <div className={`alert ${kind}`}>{message}</div> : null}

      <section className="panel panel-soft">
        <h2 className="section-heading">AI provider</h2>
        <p className="field-help">
          Choose how answers and image descriptions are generated. Your NVIDIA API key stays in
          this browser — not on the server.
        </p>
        <div className="field-block">
          <label htmlFor="mode">Provider</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="ollama">This computer (Ollama)</option>
            <option value="nim-mixed">NVIDIA cloud + local embeddings</option>
            <option value="nim">NVIDIA cloud only</option>
          </select>
          <p className="field-help">{modeDescriptions[mode]}</p>
        </div>
        {mode !== 'ollama' ? (
          <div className="field-block">
            <label htmlFor="key">NVIDIA API key</label>
            <input
              id="key"
              type="password"
              autoComplete="off"
              value={nimKey}
              onChange={(e) => setNimKeyState(e.target.value)}
              placeholder="Paste key from build.nvidia.com"
            />
          </div>
        ) : null}
        <div className="row">
          <button type="button" onClick={save}>
            Save preferences
          </button>
        </div>
        <p className="hint">
          Active route: chat via {backendsForMode(mode).chat}, embeddings via{' '}
          {backendsForMode(mode).embed}
          {inferenceHeaders().Authorization ? ', cloud key attached' : ''}
        </p>
      </section>

      <button type="button" className="text-btn" onClick={() => setShowServer((v) => !v)}>
        {showServer ? 'Hide' : 'Show'} server & developer options
      </button>

      {showServer ? (
        <section className="panel">
          <h2 className="section-heading">Server URL</h2>
          {import.meta.env.PROD ? (
            <>
              <p className="field-help">
                Hosted deployments use the same-origin proxy to reach the private backend service.
              </p>
              <button type="button" className="secondary" onClick={testConnection}>
                Test connection
              </button>
            </>
          ) : (
            <>
              <p className="field-help">
                Leave empty to use the local development proxy, or enter a direct API URL.
              </p>
              <div className="row">
                <input
                  type="text"
                  aria-label="Server URL"
                  placeholder="(empty = use the default API proxy)"
                  value={apiBase}
                  onChange={(e) => setApiBaseState(e.target.value)}
                />
                <button type="button" className="secondary" onClick={testConnection}>
                  Test connection
                </button>
              </div>
              <p className="hint">
                API documentation:{' '}
                <a href="http://127.0.0.1:8001/docs" target="_blank" rel="noopener noreferrer">
                  OpenAPI reference
                </a>
              </p>
            </>
          )}
        </section>
      ) : null}
    </>
  )
}
