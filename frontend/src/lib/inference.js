const LS_MODE = 'ignis_infer_mode'
const LS_KEY = 'ignis_nim_api_key'
const LS_API = 'ignis_api_base'

export function backendsForMode(mode) {
  if (mode === 'ollama') return { chat: 'ollama', embed: 'ollama' }
  if (mode === 'nim') return { chat: 'nim', embed: 'nim' }
  return { chat: 'nim', embed: 'ollama' }
}

export function getInferenceMode() {
  return localStorage.getItem(LS_MODE) || 'ollama'
}

export function setInferenceMode(mode) {
  localStorage.setItem(LS_MODE, mode)
}

export function getNimKey() {
  return localStorage.getItem(LS_KEY) || ''
}

export function setNimKey(key) {
  if (key) localStorage.setItem(LS_KEY, key)
  else localStorage.removeItem(LS_KEY)
}

export function getApiBase() {
  const stored = localStorage.getItem(LS_API)
  if (stored !== null && stored.trim() !== '') {
    return stored.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) return ''
  return (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')
}

export function setApiBase(url) {
  localStorage.setItem(LS_API, url.trim())
}

export function inferenceHeaders(extra = {}) {
  const mode = getInferenceMode()
  const { chat, embed } = backendsForMode(mode)
  const headers = {
    ...extra,
    'X-IGNIS-Chat-Backend': chat,
    'X-IGNIS-Embed-Backend': embed,
  }
  const key = getNimKey()
  if (key && (chat === 'nim' || embed === 'nim')) {
    headers.Authorization = `Bearer ${key}`
  }
  return headers
}
