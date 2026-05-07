import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { Button, ErrorBanner, Input } from '../components/ui'

type LocationState = { from?: string }

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as LocationState | null)?.from &&
    typeof (location.state as LocationState).from === 'string'
      ? (location.state as LocationState).from!
      : '/'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = identifier.trim()
    if (!trimmed || !password) {
      setError('Enter email or username and password.')
      return
    }

    const payload =
      trimmed.includes('@') ?
        { email: trimmed, password }
      : { username: trimmed, password }

    setSubmitting(true)
    try {
      const result = await login(payload)
      if (result.ok) {
        navigate(from, { replace: true })
      } else {
        setError(result.message || 'Could not sign in.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow auth-page">
      <h1 className="page-title">Sign in</h1>
      <p className="muted small">Email or username. Cookies must be enabled.</p>

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <form className="stack-form" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Email or username"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" wide disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="small muted">
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  )
}
