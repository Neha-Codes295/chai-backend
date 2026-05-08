import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { Button, ErrorBanner, Input } from '../components/ui'

type LocationState = {
  from?: string
  registered?: boolean
  email?: string
}

function errorsToLines(errors: unknown[] | undefined): string[] | undefined {
  if (!errors?.length) return undefined
  return errors.map((e) =>
    typeof e === 'string' ? e : JSON.stringify(e),
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const initialState = location.state as LocationState | null

  const [identifier, setIdentifier] = useState(() =>
    typeof initialState?.email === 'string' ? initialState.email : '',
  )
  const [successFlash, setSuccessFlash] = useState<string | null>(() =>
    initialState?.registered ?
      'Account created. Sign in with your new credentials.'
    : null,
  )

  const strippedRegisterRef = useRef(false)

  useEffect(() => {
    const s = location.state as LocationState | null
    if (!s?.registered || strippedRegisterRef.current) return
    strippedRegisterRef.current = true
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {
        ...(typeof s.from === 'string' ? { from: s.from } : {}),
        ...(typeof s.email === 'string' ? { email: s.email } : {}),
      },
    })
  }, [location.state, location.pathname, location.search, navigate])

  const from = useMemo(() => {
    const s = location.state as LocationState | null
    const f = s?.from
    return typeof f === 'string' && f.startsWith('/') ? f : '/'
  }, [location.state])

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[] | undefined>()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setErrorDetails(undefined)
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
        setErrorDetails(errorsToLines(result.errors))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow auth-page">
      <h1 className="page-title">Sign in</h1>
      <p className="muted small">
        Use your email or username. Cookies must be enabled for the session.
      </p>

      {successFlash ?
        <div className="alert success" role="status">
          <span>{successFlash}</span>
          <button
            type="button"
            className="link-btn small"
            onClick={() => setSuccessFlash(null)}
          >
            Dismiss
          </button>
        </div>
      : null}

      {error ?
        <ErrorBanner
          message={error}
          details={errorDetails}
          onDismiss={() => {
            setError(null)
            setErrorDetails(undefined)
          }}
        />
      : null}

      <form className="stack-form" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Email or username"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="password-field-row">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input password-field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn secondary small password-toggle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <Button type="submit" wide disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="small muted">
        No account?{' '}
        <Link
          to="/register"
          state={
            typeof (location.state as LocationState | null)?.from === 'string'
              ? { from: (location.state as LocationState).from }
              : undefined
          }
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
