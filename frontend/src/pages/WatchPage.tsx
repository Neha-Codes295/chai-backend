import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { fetchVideoById } from '../api/videos'
import { toggleVideoLike } from '../api/likes'
import { postWatchHistory } from '../api/history'
import { fetchSubscribedChannels, toggleSubscription } from '../api/subscriptions'
import type { VideoDetail } from '../types/video'
import {
  formatDuration,
  formatPublishedLabel,
  formatViewCount,
} from '../lib/formatMedia'
import { CommentSection } from '../components/watch/CommentSection'
import { Button, EmptyState, Spinner } from '../components/ui'

function isValidObjectId(id: string | undefined): id is string {
  return Boolean(id && /^[a-f\d]{24}$/i.test(id))
}

function normalizeVideoDetail(raw: unknown): VideoDetail | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>
  const id = v._id
  const title = v.title
  const description = v.description
  const videoFile = v.videoFile
  const thumbnail = v.thumbnail
  const durationRaw = v.duration
  const durationNum =
    typeof durationRaw === 'number' ? durationRaw : Number(durationRaw)
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    typeof videoFile !== 'string' ||
    typeof thumbnail !== 'string' ||
    !Number.isFinite(durationNum)
  ) {
    return null
  }
  let owner: VideoDetail['owner'] = null
  const o = v.owner
  if (o && typeof o === 'object') {
    const ow = o as Record<string, unknown>
    owner = {
      _id:
        typeof ow._id === 'string' ? ow._id
        : ow._id != null ? String(ow._id)
        : undefined,
      fullname: typeof ow.fullname === 'string' ? ow.fullname : undefined,
      username: typeof ow.username === 'string' ? ow.username : undefined,
      avatar: typeof ow.avatar === 'string' ? ow.avatar : undefined,
    }
  }
  return {
    _id: String(id),
    title,
    description,
    videoFile,
    thumbnail,
    duration: durationNum,
    views: typeof v.views === 'number' ? v.views : undefined,
    isPublished:
      typeof v.isPublished === 'boolean' ? v.isPublished : undefined,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : undefined,
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : undefined,
    owner,
  }
}

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const { user } = useAuth()
  const historySent = useRef(false)

  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [subBusy, setSubBusy] = useState(false)

  const loadVideo = useCallback(async () => {
    if (!isValidObjectId(videoId)) {
      setVideo(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const r = await fetchVideoById(videoId)
    if (!r.ok || !r.data) {
      setVideo(null)
      setError(r.message || 'Video not found.')
    } else {
      const n = normalizeVideoDetail(r.data)
      setVideo(n)
      if (!n) setError('Invalid video payload.')
    }
    setLoading(false)
  }, [videoId])

  useEffect(() => {
    historySent.current = false
    void loadVideo()
  }, [loadVideo])

  const isOwner =
    Boolean(user && video?.owner?._id && String(video.owner._id) === String(user._id))

  useEffect(() => {
    if (!user || !video?.owner?._id || isOwner) {
      setSubscribed(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const r = await fetchSubscribedChannels()
      if (cancelled) return
      if (r.ok && Array.isArray(r.data)) {
        const sid = String(video.owner!._id)
        setSubscribed(r.data.some((row) => String(row.channel?._id) === sid))
      } else {
        setSubscribed(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, video?.owner?._id, video?._id, isOwner])

  async function onToggleLike() {
    if (!user || !video) return
    setLikeBusy(true)
    const r = await toggleVideoLike(video._id)
    if (r.ok && r.data && typeof r.data.liked === 'boolean') {
      setLiked(r.data.liked)
    }
    setLikeBusy(false)
  }

  async function onToggleSubscribe() {
    if (!user || !video?.owner?._id) return
    setSubBusy(true)
    const r = await toggleSubscription(String(video.owner._id))
    if (r.ok && r.data && typeof r.data.subscribed === 'boolean') {
      setSubscribed(r.data.subscribed)
    }
    setSubBusy(false)
  }

  function onVideoPlay() {
    if (!user || !video || historySent.current) return
    historySent.current = true
    void postWatchHistory(video._id)
  }

  if (!isValidObjectId(videoId)) {
    return (
      <div className="page watch-layout">
        <EmptyState
          title="Invalid link"
          description="Video id must be a 24-character hex value."
          action={<Link to="/">← Home</Link>}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page watch-layout page-center">
        <Spinner center label="Loading video…" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="page watch-layout">
        <EmptyState
          title="Unavailable"
          description={error || 'This video could not be loaded.'}
          action={
            <Button type="button" variant="secondary" onClick={() => void loadVideo()}>
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
    <div className="page watch-layout">
      <div className="player-wrap">
        <video
          className="player"
          controls
          playsInline
          poster={video.thumbnail}
          src={video.videoFile}
          onPlay={onVideoPlay}
        />
      </div>

      <h1 className="watch-title">{video.title}</h1>

      {isOwner && video.isPublished === false ?
        <p className="muted small" style={{ marginTop: '-0.5rem' }}>
          Draft — only you can open this until it is published.
        </p>
      : null}

      <div className="watch-actions">
        <div className="watch-channel">
          {video.owner?.avatar ?
            <img
              src={video.owner.avatar}
              alt=""
              className="watch-avatar"
              width={48}
              height={48}
            />
          : <span className="watch-avatar placeholder-letter">?</span>}
          <div>
            <div className="watch-owner-name">
              {video.owner?.username ?
                <Link to={`/channel/${encodeURIComponent(video.owner.username)}`}>
                  @{video.owner.username}
                </Link>
              : video.owner?.fullname || 'Channel'}
            </div>
            <span className="muted small">
              {formatViewCount(video.views)} ·{' '}
              {formatPublishedLabel(video.createdAt)} ·{' '}
              {formatDuration(video.duration)}
            </span>
          </div>
        </div>
        <div className="watch-btns">
          {user ?
            <>
              <Button
                type="button"
                variant={liked ? 'secondary' : 'accent'}
                disabled={likeBusy}
                onClick={() => void onToggleLike()}
              >
                {likeBusy ? '…' : liked ? 'Liked' : 'Like'}
              </Button>
              {!isOwner && video.owner?._id ?
                <Button
                  type="button"
                  variant={subscribed ? 'secondary' : 'accent'}
                  disabled={subBusy || subscribed === null}
                  onClick={() => void onToggleSubscribe()}
                >
                  {subBusy ? '…'
                  : subscribed === null ? '…'
                  : subscribed ?
                    'Subscribed'
                  : 'Subscribe'}
                </Button>
              : null}
            </>
          : (
            <Link to="/login" className="nav-pill ghost">
              Sign in to like or subscribe
            </Link>
          )}
        </div>
      </div>

      <div className="description-card">
        <p className="description-text">{video.description}</p>
      </div>

      <CommentSection videoId={video._id} user={user} />

      <p className="pager">
        <Link to="/">← Home</Link>
      </p>
    </div>
  )
}
