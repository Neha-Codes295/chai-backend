import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  changePassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from '../api/users'
import { useAuth } from '../context/AuthProvider'
import { useToast } from '../context/ToastProvider'
import { Button, ErrorBanner, Input } from '../components/ui'
import { PageTitle } from '../components/PageTitle'

export function SettingsPage() {
  const { user, refreshSession } = useAuth()
  const { pushToast } = useToast()
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountMsg, setAccountMsg] = useState<string | null>(null)
  const [accountErr, setAccountErr] = useState<string | null>(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [mediaSaving, setMediaSaving] = useState<'avatar' | 'cover' | null>(null)
  const [mediaErr, setMediaErr] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFullname(user.fullname ?? '')
      setEmail(user.email ?? '')
    }
  }, [user])

  async function onSaveAccount(e: FormEvent) {
    e.preventDefault()
    setAccountErr(null)
    setAccountMsg(null)
    const fn = fullname.trim()
    const em = email.trim()
    if (!fn || !em) {
      const msg = 'Full name and email are required.'
      setAccountErr(msg)
      pushToast(msg, 'error')
      return
    }
    setAccountSaving(true)
    const r = await updateAccountDetails({ fullname: fn, email: em })
    setAccountSaving(false)
    if (!r.ok) {
      const msg = r.message || 'Could not update account.'
      setAccountErr(msg)
      pushToast(msg, 'error')
      return
    }
    await refreshSession()
    setAccountMsg('Profile saved.')
    pushToast('Profile saved.', 'success')
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwErr(null)
    setPwOk(false)
    if (!oldPassword || !newPassword) {
      setPwErr('Enter your current password and a new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New password and confirmation do not match.')
      return
    }
    setPwSaving(true)
    const r = await changePassword({ oldPassword, newPassword })
    setPwSaving(false)
    if (!r.ok) {
      const msg = r.message || 'Could not change password.'
      setPwErr(msg)
      pushToast(msg, 'error')
      return
    }
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwOk(true)
    pushToast('Password updated.', 'success')
  }

  async function onUploadAvatar() {
    if (!avatarFile) {
      setMediaErr('Choose an image for your avatar.')
      return
    }
    setMediaErr(null)
    const fd = new FormData()
    fd.append('avatar', avatarFile)
    setMediaSaving('avatar')
    const r = await updateUserAvatar(fd)
    setMediaSaving(null)
    if (!r.ok) {
      const msg = r.message || 'Avatar upload failed.'
      setMediaErr(msg)
      pushToast(msg, 'error')
      return
    }
    setAvatarFile(null)
    await refreshSession()
    setAccountMsg('Avatar updated.')
    pushToast('Avatar updated.', 'success')
  }

  async function onUploadCover() {
    if (!coverFile) {
      setMediaErr('Choose an image for your cover.')
      return
    }
    setMediaErr(null)
    const fd = new FormData()
    fd.append('coverImage', coverFile)
    setMediaSaving('cover')
    const r = await updateUserCoverImage(fd)
    setMediaSaving(null)
    if (!r.ok) {
      const msg = r.message || 'Cover upload failed.'
      setMediaErr(msg)
      pushToast(msg, 'error')
      return
    }
    setCoverFile(null)
    await refreshSession()
    setAccountMsg('Cover image updated.')
    pushToast('Cover image updated.', 'success')
  }

  if (!user) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <PageTitle title="Settings" />
      <h1 className="page-title">Settings</h1>
      <p className="muted small">
        Signed in as <strong>@{user.username}</strong> ·{' '}
        <Link to="/">Home</Link>
      </p>

      {accountMsg ?
        <p className="small" style={{ color: 'var(--accent)' }}>
          {accountMsg}
        </p>
      : null}
      {accountErr ?
        <ErrorBanner message={accountErr} onDismiss={() => setAccountErr(null)} />
      : null}

      <section className="settings-block" aria-labelledby="settings-profile">
        <h2 id="settings-profile">Profile</h2>
        <form className="stack-form" style={{ maxWidth: '420px' }} onSubmit={(e) => void onSaveAccount(e)}>
          <Input
            label="Full name"
            name="fullname"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button type="submit" wide disabled={accountSaving}>
            {accountSaving ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </section>

      <section className="settings-block" aria-labelledby="settings-password">
        <h2 id="settings-password">Password</h2>
        {pwOk ?
          <p className="small muted">Password changed.</p>
        : null}
        {pwErr ?
          <ErrorBanner message={pwErr} onDismiss={() => setPwErr(null)} />
        : null}
        <form className="stack-form" style={{ maxWidth: '420px' }} onSubmit={(e) => void onChangePassword(e)}>
          <Input
            label="Current password"
            name="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button type="submit" wide disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Change password'}
          </Button>
        </form>
      </section>

      <section className="settings-block" aria-labelledby="settings-media">
        <h2 id="settings-media">Avatar & cover</h2>
        {mediaErr ?
          <ErrorBanner message={mediaErr} onDismiss={() => setMediaErr(null)} />
        : null}
        <div className="stack-form" style={{ maxWidth: '420px' }}>
          <div className="field">
            <label htmlFor="settings-avatar">New avatar</label>
            <input
              id="settings-avatar"
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            wide
            disabled={mediaSaving !== null}
            onClick={() => void onUploadAvatar()}
          >
            {mediaSaving === 'avatar' ? 'Uploading…' : 'Upload avatar'}
          </Button>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="settings-cover">New cover image</label>
            <input
              id="settings-cover"
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            wide
            disabled={mediaSaving !== null}
            onClick={() => void onUploadCover()}
          >
            {mediaSaving === 'cover' ? 'Uploading…' : 'Upload cover'}
          </Button>
        </div>
      </section>
    </div>
  )
}
