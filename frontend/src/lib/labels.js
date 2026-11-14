export const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/experiments', label: 'Browse experiments' },
  { to: '/measurements', label: 'Compare results' },
  { to: '/assistant', label: 'Ask a question' },
  { to: '/vision', label: 'Photos & video' },
  { to: '/mission', label: 'Plan a mission' },
  { to: '/settings', label: 'Advanced' },
]

export const ENVIRONMENT_LABELS = {
  pressurized_lunar_rover: 'Pressurized lunar rover',
  lunar_habitat: 'Lunar habitat',
  mars_habitat: 'Mars habitat',
  spacecraft: 'Spacecraft cabin',
  space_station: 'Space station',
}

export const FOCUS_LABELS = {
  suppression: 'Fire suppression',
  prevention: 'Fire prevention',
  detection: 'Fire detection',
}

export const ASSISTANT_MODES = [
  {
    id: 'paper',
    title: 'From research papers',
    description: 'Answers using published NASA-related PDFs with page references.',
  },
  {
    id: 'hybrid',
    title: 'Papers + lab measurements',
    description: 'Combines written research with numeric experiment data where available.',
  },
  {
    id: 'multimodal',
    title: 'Everything together',
    description: 'Papers, measurements, and saved flame photos or videos.',
  },
]

export function friendlyApiError(message) {
  const m = String(message || '')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return 'We cannot reach the research service. Make sure the IGNIS app is running on your computer, then try again.'
  }
  if (m.includes('503')) {
    return 'The AI or database is temporarily unavailable. Wait a moment and try again.'
  }
  return m.length > 200 ? `${m.slice(0, 200)}…` : m
}
