import JsonBlock from './JsonBlock'

export default function DevDetails({ label = 'Technical details (for developers)', value }) {
  if (value == null) return null
  return (
    <details className="dev-details">
      <summary>{label}</summary>
      <JsonBlock value={value} />
    </details>
  )
}
