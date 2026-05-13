import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { PageTitle } from '../components/PageTitle'
import { Button, ErrorBanner, Input } from '../components/ui'

function errorsToLines(errors: unknown[] | undefined): string[] | undefined {
  if (!errors?.length) return undefined
  return errors.map((e) =>
    typeof e === 'string' ? e : JSON.stringify(e),
  )
}

type RegisterLocationState = { from?: string }

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as RegisterLocationState | null)?.from

  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[] | undefined>()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setErrorDetails(undefined)

    if (!fullname.trim() || !email.trim() || !username.trim() || !password) {
      setError('All text fields are required.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    if (!avatar) {
      setError('Avatar is required.')
      return
    }

    const fd = new FormData()
    fd.append('fullname', fullname.trim())
    fd.append('email', email.trim())
    fd.append('username', username.trim().toLowerCase())
    fd.append('password', password)
    fd.append('avatar', avatar)
    if (cover) {
      fd.append('coverImage', cover)
    }

    setSubmitting(true)
    try {
      const result = await register(fd)
      if (result.ok) {
        navigate('/login', {
          replace: true,
          state: {
            registered: true,
            email: email.trim(),
            ...(typeof returnTo === 'string' &&
            returnTo.startsWith('/') ?
              { from: returnTo }
            : {}),
          },
        })
      } else {
        setError(result.message || 'Registration failed.')
        setErrorDetails(errorsToLines(result.errors))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow auth-page">
      <PageTitle title="Create account" />
      <h1 className="page-title">Create account</h1>
      <p className="muted small">Avatar required. Cover optional.</p>

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
          label="Full name"
          name="fullname"
          autoComplete="name"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          hint="Saved lowercase."
        />
        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <div className="password-field-row">
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          <span className="small muted">At least 8 characters.</span>
        </div>

        <div className="field">
          <label htmlFor="reg-avatar">Avatar image</label>
          <input
            id="reg-avatar"
            name="avatar"
            type="file"
            accept="image/*"
            className="input"
            required
            onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="field">
          <label htmlFor="reg-cover">Cover image (optional)</label>
          <input
            id="reg-cover"
            name="coverImage"
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button type="submit" wide disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>

      <p className="small muted">
        Already have an account?{' '}
        <Link
          to="/login"
          state={
            typeof returnTo === 'string' && returnTo.startsWith('/')
              ? { from: returnTo }
              : undefined
          }
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
