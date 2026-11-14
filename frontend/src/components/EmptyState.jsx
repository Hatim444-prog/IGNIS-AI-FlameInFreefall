import { Link } from 'react-router-dom'

export default function EmptyState({ title, body, actionTo, actionLabel }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionTo ? (
        <Link to={actionTo} className="btn">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
