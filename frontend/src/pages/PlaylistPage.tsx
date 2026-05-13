import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deletePlaylistApi,
  fetchPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylistMeta,
} from '../api/playlists'
import { useAuth } from '../context/AuthProvider'
import { PageTitle } from '../components/PageTitle'
import { VideoCard } from '../components/VideoCard'
import { Button, EmptyState, ErrorBanner, Input, Spinner } from '../components/ui'
import { normalizeVideoDocs } from '../lib/videoSummary'
import type { VideoSummary } from '../types/video'

function isValidObjectId(id: string | undefined): id is string {
  return Boolean(id && /^[a-f\d]{24}$/i.test(id))
}

function isPublishedDoc(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const v = raw as Record<string, unknown>
  return v.isPublished !== false
}

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null)
  const [playlistOwnerId, setPlaylistOwnerId] = useState<string | null>(null)
  const [items, setItems] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [manageErr, setManageErr] = useState<string | null>(null)
  const [metaSaving, setMetaSaving] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null)

  const isOwner = Boolean(
    user && playlistOwnerId && String(user._id) === String(playlistOwnerId),
  )

  const load = useCallback(async () => {
    if (!isValidObjectId(playlistId)) {
      setError('Invalid playlist id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setManageErr(null)
    const r = await fetchPlaylistById(playlistId)
    if (!r.ok || !r.data) {
      setName('')
      setDescription('')
      setOwnerUsername(null)
      setPlaylistOwnerId(null)
      setItems([])
      setError(r.message || 'Playlist not found.')
    } else {
      const d = r.data
      setName(d.name)
      setDescription(d.description)
      let ownerId: string | null = null
      const ow = d.owner
      if (ow && typeof ow === 'object') {
        const o = ow as Record<string, unknown>
        setOwnerUsername(typeof o.username === 'string' ? o.username : null)
        ownerId =
          typeof o._id === 'string' ? o._id
          : o._id != null ? String(o._id)
          : null
      } else {
        setOwnerUsername(null)
      }
      setPlaylistOwnerId(ownerId)
      const raw = Array.isArray(d.videos) ? d.videos : []
      const ownerView = Boolean(user && ownerId && String(user._id) === String(ownerId))
      const filtered = raw.filter((doc) => ownerView || isPublishedDoc(doc))
      setItems(normalizeVideoDocs(filtered))
    }
    setLoading(false)
  }, [playlistId, user])

  useEffect(() => {
    void load()
  }, [load])

  async function onSaveMeta(e: FormEvent) {
    e.preventDefault()
    if (!playlistId || !isOwner) return
    setManageErr(null)
    const nm = name.trim()
    const desc = description.trim()
    if (!nm || !desc) {
      setManageErr('Name and description are required.')
      return
    }
    setMetaSaving(true)
    const r = await updatePlaylistMeta(playlistId, { name: nm, description: desc })
    setMetaSaving(false)
    if (!r.ok) {
      setManageErr(r.message || 'Could not update playlist.')
      return
    }
    setName(nm)
    setDescription(desc)
  }

  async function onRemoveFromPlaylist(videoId: string) {
    if (!playlistId || !isOwner) return
    setRemoveBusyId(videoId)
    setManageErr(null)
    const r = await removeVideoFromPlaylist(playlistId, videoId)
    setRemoveBusyId(null)
    if (!r.ok) {
      setManageErr(r.message || 'Could not remove video.')
      return
    }
    setItems((prev) => prev.filter((v) => v._id !== videoId))
  }

  async function onDeletePlaylist() {
    if (!playlistId || !isOwner) return
    if (
      !window.confirm(
        'Delete this playlist permanently? Videos on the site are not deleted.',
      )
    ) {
      return
    }
    setDeleteBusy(true)
    setManageErr(null)
    const r = await deletePlaylistApi(playlistId)
    setDeleteBusy(false)
    if (!r.ok) {
      setManageErr(r.message || 'Could not delete playlist.')
      return
    }
    navigate(
      ownerUsername ?
        `/channel/${encodeURIComponent(ownerUsername)}?tab=playlists`
      : '/',
      { replace: true },
    )
  }

  if (!isValidObjectId(playlistId)) {
    return (
      <div className="page">
        <PageTitle title="Playlist" />
        <EmptyState
          title="Invalid playlist"
          description="Playlist id must be a 24-character hex value."
          action={<Link to="/">← Home</Link>}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page page-center">
        <PageTitle title="Playlist" />
        <Spinner center label="Loading playlist…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <PageTitle title="Playlist" />
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <EmptyState
          title="Unavailable"
          description={error}
          action={
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          }
        />
        <p className="pager">
          <Link to="/">← Home</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <PageTitle title={name || 'Playlist'} />
      <div className="playlist-header">
        <div>
          <h1 className="page-title">{name || 'Playlist'}</h1>
          {ownerUsername ?
            <p className="muted small" style={{ margin: '0.35rem 0 0' }}>
              By{' '}
              <Link to={`/channel/${encodeURIComponent(ownerUsername)}`}>
                @{ownerUsername}
              </Link>
            </p>
          : null}
        </div>
      </div>

      {!isOwner && description ?
        <div className="description-card" style={{ marginBottom: '1.25rem' }}>
          <p className="description-text">{description}</p>
        </div>
      : null}

      {isOwner ?
        <section className="settings-block" style={{ maxWidth: '520px' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Edit playlist
          </h2>
          {manageErr ?
            <ErrorBanner message={manageErr} onDismiss={() => setManageErr(null)} />
          : null}
          <form className="stack-form" onSubmit={(e) => void onSaveMeta(e)}>
            <Input
              label="Name"
              name="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="field">
              <label htmlFor="pl-desc">Description</label>
              <textarea
                id="pl-desc"
                name="description"
                className="input-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" wide disabled={metaSaving}>
              {metaSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
          <div style={{ marginTop: '1.25rem' }}>
            <Button
              type="button"
              variant="danger"
              wide
              disabled={deleteBusy}
              onClick={() => void onDeletePlaylist()}
            >
              {deleteBusy ? 'Deleting…' : 'Delete playlist'}
            </Button>
          </div>
        </section>
      : null}

      {items.length === 0 ?
        <EmptyState
          title="No videos"
          description={
            isOwner ?
              'Open any video, use Save below the player, and pick this playlist.'
            : 'This playlist has no videos yet, or they are hidden.'
          }
          action={<Link to="/">Browse home</Link>}
        />
      : (
        <div className="video-grid">
          {items.map((v) => (
            <div key={v._id} className="playlist-video-cell">
              <VideoCard video={v} />
              {isOwner ?
                <Button
                  type="button"
                  variant="danger"
                  className="remove-from-pl small"
                  disabled={removeBusyId === v._id}
                  onClick={() => void onRemoveFromPlaylist(v._id)}
                >
                  {removeBusyId === v._id ? 'Removing…' : 'Remove from playlist'}
                </Button>
              : null}
            </div>
          ))}
        </div>
      )}

      <p className="pager">
        <Link to="/">← Home</Link>
        {ownerUsername ?
          <>
            {' · '}
            <Link to={`/channel/${encodeURIComponent(ownerUsername)}`}>
              Channel
            </Link>
          </>
        : null}
      </p>
    </div>
  )
}
