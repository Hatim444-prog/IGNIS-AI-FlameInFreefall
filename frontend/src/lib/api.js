import { getApiBase, inferenceHeaders } from './inference'

function url(path) {
  const base = getApiBase()
  return `${base}${path}`
}

async function handleResponse(res) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && data.detail
        ? typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail)
        : typeof data === 'string'
          ? data
          : res.statusText
    throw new Error(detail || `HTTP ${res.status}`)
  }
  return data
}

export async function apiGet(path) {
  const res = await fetch(url(path), {
    headers: inferenceHeaders(),
  })
  return handleResponse(res)
}

export async function apiPostJson(path, body) {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: inferenceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  return handleResponse(res)
}

export async function apiPostForm(path, formData) {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: inferenceHeaders(),
    body: formData,
  })
  return handleResponse(res)
}
