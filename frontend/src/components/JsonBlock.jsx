export default function JsonBlock({ value }) {
  const text =
  value === undefined || value === null
    ? ''
    : typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 2)

  if (!text) return null

  return <pre className="json-block">{text}</pre>
}
