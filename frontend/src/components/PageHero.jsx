export default function PageHero({ title, lead, children }) {
  return (
    <header className="page-hero">
      <h1 className="page-title">{title}</h1>
      {lead ? <p className="page-lead">{lead}</p> : null}
      {children}
    </header>
  )
}
