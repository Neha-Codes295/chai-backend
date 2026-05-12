import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPlaylistById } from '../api/playlists'
import { useAuth } from '../context/AuthProvider'
import { VideoCard } from '../components/VideoCard'
import { Button, EmptyState, ErrorBanner, Spinner } from '../components/ui'
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
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null)
  const [playlistOwnerId, setPlaylistOwnerId] = useState<string | null>(null)
  const [items, setItems] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isValidObjectId(playlistId)) {
      setError('Invalid playlist id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
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
      const isOwner = Boolean(user && ownerId && String(user._id) === String(ownerId))
      const filtered = raw.filter((doc) => isOwner || isPublishedDoc(doc))
      setItems(normalizeVideoDocs(filtered))
    }
    setLoading(false)
  }, [playlistId, user])

  useEffect(() => {
    void load()
  }, [load])

  if (!isValidObjectId(playlistId)) {
    return (
      <div className="page">
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
        <Spinner center label="Loading playlist…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
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

      {description ?
        <div className="description-card" style={{ marginBottom: '1.25rem' }}>
          <p className="description-text">{description}</p>
        </div>
      : null}

      {items.length === 0 ?
        <EmptyState
          title="No videos"
          description={
            user && playlistOwnerId && String(user._id) === String(playlistOwnerId) ?
              'Open any video, then use Save below the player and pick this playlist.'
            : 'This playlist has no videos yet, or they are hidden.'
          }
          action={<Link to="/">Browse home</Link>}
        />
      : (
        <div className="video-grid">
          {items.map((v) => (
            <VideoCard key={v._id} video={v} />
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
