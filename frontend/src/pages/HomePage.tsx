import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

export function HomePage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const q = params.get('q')

  return (
    <div className="page">
      <h1 className="page-title">Home</h1>
      <p className="muted" style={{ maxWidth: '640px' }}>
        Welcome. Video feed and search are next.
      </p>

      {q ? (
        <p className="muted small" style={{ marginTop: '1rem' }}>
          Searching for <strong>{q}</strong> (not wired yet).
        </p>
      ) : null}

      <ul className="muted small" style={{ marginTop: '1.5rem', lineHeight: 1.7 }}>
        <li>
          <Link to="/watch/demo-placeholder">Sample watch page</Link>
        </li>
        <li>
          <Link to="/channel/demo-user">Sample channel page</Link>
        </li>
        {!user ? (
          <li>
            <Link to="/login">Sign in</Link> or <Link to="/register">Sign up</Link>
          </li>
        ) : (
          <li>
            Signed in as <strong>@{user.username}</strong> ·{' '}
            <Link to="/studio">Studio</Link>
          </li>
        )}
      </ul>
    </div>
  )
}
