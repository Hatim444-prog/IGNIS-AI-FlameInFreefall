import { Link } from 'react-router-dom'

const tiles = [
  {
    to: '/assistant',
    title: 'Ask a question',
    desc: 'Get an evidence-based answer from papers and lab data.',
    cta: 'Start asking',
  },
  {
    to: '/mission',
    title: 'Plan a mission',
    desc: 'See which past research best fits your habitat or vehicle scenario.',
    cta: 'Open planner',
  },
  {
    to: '/experiments',
    title: 'Browse experiments',
    desc: 'Explore flame-spread runs and add runs to your shortlist.',
    cta: 'Browse',
  },
  {
    to: '/vision',
    title: 'Photos & video',
    desc: 'Upload flame images for a plain-language description.',
    cta: 'Open gallery',
  },
]

export default function QuickNav() {
  return (
    <section className="home-actions" aria-labelledby="home-actions-heading">
      <h2 id="home-actions-heading" className="section-heading">
        What would you like to do?
      </h2>
      <div className="action-cards">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="action-card">
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <span className="action-card-cta">{t.cta}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
