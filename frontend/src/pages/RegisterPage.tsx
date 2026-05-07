import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { Button, ErrorBanner, Input } from '../components/ui'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullname.trim() || !email.trim() || !username.trim() || !password) {
      setError('All text fields are required.')
      return
    }
    if (!avatar) {
      setError('Avatar image is required by the API.')
      return
    }

    const fd = new FormData()
    fd.append('fullname', fullname.trim())
    fd.append('email', email.trim())
    fd.append('username', username.trim())
    fd.append('password', password)
    fd.append('avatar', avatar)
    if (cover) {
      fd.append('coverImage', cover)
    }

    setSubmitting(true)
    try {
      const result = await register(fd)
      if (result.ok) {
        navigate('/login', { replace: true })
      } else {
        setError(result.message || 'Registration failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-narrow auth-page">
      <h1 className="page-title">Create account</h1>
      <p className="muted small">Avatar image is required.</p>

      {error ? <ErrorBanner message={error} onDismiss={() => setError(null)} /> : null}
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
          hint="Stored lowercase on the server."
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
