import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchChannelProfile, type ChannelProfile } from '../api/channels'
import {
  createPlaylist,
  fetchPlaylistsByUserId,
  type PlaylistListItem,
} from '../api/playlists'
import { fetchChannelVideosPage } from '../api/videos'
import { toggleSubscription } from '../api/subscriptions'
import {
  createTweet,
  deleteTweetApi,
  fetchUserTweetsPage,
  type TweetItem,
} from '../api/tweets'
import { useAuth } from '../context/AuthProvider'
import { useToast } from '../context/ToastProvider'
import { PageTitle } from '../components/PageTitle'
import { VideoCard } from '../components/VideoCard'
import { Button, EmptyState, ErrorBanner, Input, Spinner } from '../components/ui'
import { normalizeVideoDocs } from '../lib/videoSummary'
import type { VideoSummary } from '../types/video'

const VIDEO_PAGE_LIMIT = 12
const TWEET_PAGE_LIMIT = 10

type Tab = 'videos' | 'playlists' | 'community'

function playlistFromDoc(raw: unknown): PlaylistListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  const id = p._id
  const name = p.name
  const description = p.description
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof description !== 'string'
  ) {
    return null
  }
  return {
    _id: String(id),
    name,
    description,
    videos: Array.isArray(p.videos) ? p.videos : [],
  }
}

export function ChannelPage() {
  const { username: usernameParam } = useParams<{ username: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { pushToast } = useToast()
  const cleanUsername = (usernameParam ?? '').replace(/^@/, '').trim().toLowerCase()

  const tab = useMemo<Tab>(() => {
    const t = searchParams.get('tab')
    if (t === 'playlists') return 'playlists'
    if (t === 'community') return 'community'
    return 'videos'
  }, [searchParams])

  function goTab(next: Tab) {
    if (next === 'videos') setSearchParams({}, { replace: true })
    else setSearchParams({ tab: next }, { replace: true })
  }
  const [profile, setProfile] = useState<ChannelProfile | null>(null)
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([])
  const [items, setItems] = useState<VideoSummary[]>([])
  const [videoPage, setVideoPage] = useState(1)
  const [hasNextVideo, setHasNextVideo] = useState(false)
  const [totalVideos, setTotalVideos] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subBusy, setSubBusy] = useState(false)
  const [subOverride, setSubOverride] = useState<boolean | null>(null)

  const [playlistModal, setPlaylistModal] = useState(false)
  const [plName, setPlName] = useState('')
  const [plDesc, setPlDesc] = useState('')
  const [plSaving, setPlSaving] = useState(false)
  const [plErr, setPlErr] = useState<string | null>(null)

  const [tweets, setTweets] = useState<TweetItem[]>([])
  const [tweetPage, setTweetPage] = useState(1)
  const [tweetTotal, setTweetTotal] = useState(0)
  const [tweetsLoading, setTweetsLoading] = useState(false)
  const [tweetsLoadMore, setTweetsLoadMore] = useState(false)
  const [tweetsErr, setTweetsErr] = useState<string | null>(null)
  const [newTweet, setNewTweet] = useState('')
  const [tweetPostBusy, setTweetPostBusy] = useState(false)

  const load = useCallback(async () => {
    if (!cleanUsername) {
      setProfile(null)
      setError('Invalid channel name.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setSubOverride(null)

    const [pr, vr] = await Promise.all([
      fetchChannelProfile(cleanUsername),
      fetchChannelVideosPage(cleanUsername, 1, VIDEO_PAGE_LIMIT),
    ])

    if (!pr.ok || !pr.data) {
      setProfile(null)
      setPlaylists([])
      setItems([])
      setHasNextVideo(false)
      setTotalVideos(null)
      setError(pr.message || 'Channel not found.')
      setLoading(false)
      return
    }

    setProfile(pr.data)

    const pl = await fetchPlaylistsByUserId(pr.data._id)
    if (pl.ok && Array.isArray(pl.data)) {
      const rows: PlaylistListItem[] = []
      for (const row of pl.data) {
        const n = playlistFromDoc(row)
        if (n) rows.push(n)
      }
      setPlaylists(rows)
    } else {
      setPlaylists([])
    }

    if (vr.ok && vr.data) {
      const docs = Array.isArray(vr.data.docs) ? vr.data.docs : []
      setItems(normalizeVideoDocs(docs))
      setVideoPage(vr.data.page)
      setHasNextVideo(Boolean(vr.data.hasNextPage))
      setTotalVideos(typeof vr.data.totalDocs === 'number' ? vr.data.totalDocs : null)
    } else {
      setItems([])
      setHasNextVideo(false)
      setTotalVideos(null)
    }

    setLoading(false)
  }, [cleanUsername])

  useEffect(() => {
    void load()
  }, [load])

  const loadMoreVideos = useCallback(async () => {
    if (!cleanUsername || !hasNextVideo || loadingMore || loading) return
    setLoadingMore(true)
    const next = videoPage + 1
    const r = await fetchChannelVideosPage(cleanUsername, next, VIDEO_PAGE_LIMIT)
    if (!r.ok || !r.data) {
      setLoadingMore(false)
      return
    }
    const incoming = normalizeVideoDocs(
      Array.isArray(r.data.docs) ? r.data.docs : [],
    )
    setItems((prev) => {
      const seen = new Set(prev.map((x) => x._id))
      const merged = [...prev]
      for (const v of incoming) {
        if (!seen.has(v._id)) {
          seen.add(v._id)
          merged.push(v)
        }
      }
      return merged
    })
    setVideoPage(r.data.page)
    setHasNextVideo(Boolean(r.data.hasNextPage))
    setLoadingMore(false)
  }, [cleanUsername, hasNextVideo, loadingMore, loading, videoPage])

  useEffect(() => {
    if (tab !== 'community' || !profile?._id) return
    setTweetsErr(null)
    setTweetsLoading(true)
    void (async () => {
      const r = await fetchUserTweetsPage(String(profile._id), 1, TWEET_PAGE_LIMIT)
      setTweetsLoading(false)
      if (!r.ok || !r.data) {
        setTweetsErr(r.message || 'Could not load community posts.')
        setTweets([])
        setTweetPage(1)
        setTweetTotal(0)
        return
      }
      const list = Array.isArray(r.data.data) ? r.data.data : []
      setTweets(list)
      setTweetPage(r.data.page)
      setTweetTotal(typeof r.data.total === 'number' ? r.data.total : list.length)
    })()
  }, [tab, profile?._id])

  const loadMoreTweets = useCallback(async () => {
    if (!profile?._id || tweetsLoadMore || tweetsLoading) return
    if (tweets.length >= tweetTotal) return
    setTweetsLoadMore(true)
    setTweetsErr(null)
    const next = tweetPage + 1
    const r = await fetchUserTweetsPage(String(profile._id), next, TWEET_PAGE_LIMIT)
    setTweetsLoadMore(false)
    if (!r.ok || !r.data) {
      setTweetsErr(r.message || 'Could not load more posts.')
      return
    }
    const incoming = Array.isArray(r.data.data) ? r.data.data : []
    setTweets((prev) => {
      const seen = new Set(prev.map((x) => String(x._id)))
      const merged = [...prev]
      for (const t of incoming) {
        const id = String(t._id)
        if (!seen.has(id)) {
          seen.add(id)
          merged.push(t)
        }
      }
      return merged
    })
    setTweetPage(r.data.page)
    if (typeof r.data.total === 'number') setTweetTotal(r.data.total)
  }, [profile?._id, tweetPage, tweetTotal, tweets.length, tweetsLoadMore, tweetsLoading])

  async function onPostTweet(e: FormEvent) {
    e.preventDefault()
    const text = newTweet.trim()
    if (!text) return
    setTweetPostBusy(true)
    setTweetsErr(null)
    const r = await createTweet(text)
    setTweetPostBusy(false)
    if (!r.ok || !r.data) {
      const msg = r.message || 'Could not post.'
      setTweetsErr(msg)
      pushToast(msg, 'error')
      return
    }
    setNewTweet('')
    setTweets((prev) => [r.data!, ...prev])
    setTweetTotal((n) => n + 1)
    pushToast('Post published.', 'success')
  }

  async function onDeleteTweet(tweetId: string) {
    setTweetsErr(null)
    const r = await deleteTweetApi(tweetId)
    if (!r.ok) {
      const msg = r.message || 'Could not delete post.'
      setTweetsErr(msg)
      pushToast(msg, 'error')
      return
    }
    setTweets((prev) => prev.filter((t) => String(t._id) !== tweetId))
    setTweetTotal((n) => Math.max(0, n - 1))
    pushToast('Post removed.', 'info')
  }

  const isOwner =
    Boolean(user && profile && String(user._id) === String(profile._id))

  const isSubscribed =
    subOverride !== null ? subOverride : Boolean(profile?.isSubscribed)

  async function onToggleSubscribe() {
    if (!user || !profile?._id || isOwner) return
    setSubBusy(true)
    const r = await toggleSubscription(String(profile._id))
    if (r.ok && r.data && typeof r.data.subscribed === 'boolean') {
      setSubOverride(r.data.subscribed)
    }
    setSubBusy(false)
  }

  async function onCreatePlaylist(e: FormEvent) {
    e.preventDefault()
    setPlErr(null)
    const n = plName.trim()
    const d = plDesc.trim()
    if (!n || !d) {
      setPlErr('Name and description are required.')
      return
    }
    setPlSaving(true)
    const r = await createPlaylist({ name: n, description: d })
    setPlSaving(false)
    if (!r.ok) {
      setPlErr(r.message || 'Could not create playlist.')
      return
    }
    setPlaylistModal(false)
    setPlName('')
    setPlDesc('')
    void load()
  }

  if (!cleanUsername) {
    return (
      <div className="page">
        <PageTitle title="Channel" />
        <EmptyState
          title="Invalid channel"
          description="Missing username in the URL."
          action={<Link to="/">← Home</Link>}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page page-center">
        <PageTitle title="Channel" />
        <Spinner center label="Loading channel…" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="page">
        <PageTitle title="Channel" />
        {error ?
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        : null}
        <EmptyState
          title="Channel not found"
          description={error || 'This channel does not exist.'}
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

  const displayName = profile.fullname || `@${profile.username ?? cleanUsername}`
  const handle = profile.username ?? cleanUsername

  return (
    <div className="page channel-page">
      <PageTitle title={displayName} />
      <div
        className="channel-banner"
        style={
          profile.coverImage ?
            { backgroundImage: `url(${profile.coverImage})` }
          : undefined
        }
      />

      <div className="channel-bar">
        {profile.avatar ?
          <img
            src={profile.avatar}
            alt={`${displayName} channel avatar`}
            className="channel-avatar"
          />
        : (
          <div
            className="channel-avatar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface)',
              fontWeight: 700,
              fontSize: '2rem',
            }}
            aria-hidden
          >
            {(handle[0] || '?').toUpperCase()}
          </div>
        )}
        <div className="channel-info">
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.35rem' }}>
            {displayName}
          </h1>
          <p className="muted small" style={{ margin: '0.25rem 0 0' }}>
            @{handle} · {profile.subscribersCount ?? 0} subscriber
            {(profile.subscribersCount ?? 0) === 1 ? '' : 's'}
            {typeof profile.channelsSubscribedToCount === 'number' ?
              <> · {profile.channelsSubscribedToCount} following</>
            : null}
          </p>
        </div>
        <div className="channel-actions">
          {user ?
            isOwner ?
              <Link to="/studio" className="btn secondary">
                Studio
              </Link>
            : (
              <Button
                type="button"
                variant={isSubscribed ? 'secondary' : 'accent'}
                disabled={subBusy}
                onClick={() => void onToggleSubscribe()}
              >
                {subBusy ? '…' : isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Button>
            )
          : (
            <Link to="/login" className="btn accent">
              Sign in to subscribe
            </Link>
          )}
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Channel sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'videos'}
          className={`tab${tab === 'videos' ? ' active' : ''}`}
          onClick={() => goTab('videos')}
        >
          Videos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'playlists'}
          className={`tab${tab === 'playlists' ? ' active' : ''}`}
          onClick={() => goTab('playlists')}
        >
          Playlists
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'community'}
          className={`tab${tab === 'community' ? ' active' : ''}`}
          onClick={() => goTab('community')}
        >
          Community
        </button>
      </div>

      {tab === 'videos' ?
        <>
          {totalVideos != null ?
            <p className="muted small">
              {totalVideos} published video{totalVideos === 1 ? '' : 's'}
              {items.length < totalVideos ? ` · showing ${items.length}` : ''}
            </p>
          : null}
          {items.length === 0 ?
            <EmptyState
              title="No videos yet"
              description="This channel has no published videos."
              action={<Link to="/">Browse home</Link>}
            />
          : (
            <>
              <div className="video-grid">
                {items.map((v) => (
                  <VideoCard key={v._id} video={v} />
                ))}
              </div>
              {hasNextVideo ?
                <div className="pager">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingMore}
                    onClick={() => void loadMoreVideos()}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              : null}
            </>
          )}
        </>
      : tab === 'playlists' ?
        <>
          {isOwner && playlists.length > 0 ?
            <div style={{ marginBottom: '1rem' }}>
              <Button
                type="button"
                variant="accent"
                onClick={() => {
                  setPlaylistModal(true)
                  setPlErr(null)
                }}
              >
                New playlist
              </Button>
            </div>
          : null}
          {playlists.length === 0 ?
            <EmptyState
              title="No playlists"
              description={
                isOwner ?
                  'Create a playlist to group your videos.'
                : 'This channel has no playlists yet.'
              }
              action={
                isOwner ?
                  <Button
                    type="button"
                    variant="accent"
                    onClick={() => {
                      setPlaylistModal(true)
                      setPlErr(null)
                    }}
                  >
                    New playlist
                  </Button>
                : <Link to="/">Browse home</Link>
              }
            />
          : (
            <div className="playlist-grid">
              {playlists.map((pl) => (
                <Link key={pl._id} to={`/playlist/${pl._id}`} className="playlist-card">
                  <div className="playlist-card-title">{pl.name}</div>
                  <p className="muted small" style={{ margin: 0 }}>
                    {pl.videos?.length ?? 0} video{(pl.videos?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                  <p className="small" style={{ margin: '0.5rem 0 0' }}>
                    {pl.description.length > 120 ?
                      `${pl.description.slice(0, 117)}…`
                    : pl.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      : (
        <section className="community-feed" aria-labelledby="community-heading">
          <h2 id="community-heading" className="sr-only">
            Community
          </h2>
          {tweetsErr ?
            <ErrorBanner message={tweetsErr} onDismiss={() => setTweetsErr(null)} />
          : null}
          {isOwner ?
            <form className="tweet-compose" onSubmit={(e) => void onPostTweet(e)}>
              <label htmlFor="channel-new-tweet" className="small" style={{ fontWeight: 600 }}>
                Post an update
              </label>
              <textarea
                id="channel-new-tweet"
                name="tweet"
                maxLength={2000}
                placeholder="Share something with subscribers…"
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
              />
              <div>
                <Button type="submit" disabled={tweetPostBusy || !newTweet.trim()}>
                  {tweetPostBusy ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </form>
          : null}
          {tweetsLoading ?
            <Spinner label="Loading posts…" />
          : tweets.length === 0 ?
            <EmptyState
              title="No posts yet"
              description={
                isOwner ?
                  'Write the first post for your community tab.'
                : 'This channel has not posted in Community yet.'
              }
            />
          : (
            <>
              {tweets.map((tw) => (
                <article key={String(tw._id)} className="tweet-row">
                  <div className="tweet-row-meta">
                    <time dateTime={tw.createdAt}>
                      {tw.createdAt ?
                        new Date(tw.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : ''}
                    </time>
                    {isOwner ?
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void onDeleteTweet(String(tw._id))}
                      >
                        Delete
                      </Button>
                    : null}
                  </div>
                  <p className="tweet-body">{tw.content}</p>
                </article>
              ))}
              {tweets.length < tweetTotal ?
                <div className="pager">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={tweetsLoadMore}
                    onClick={() => void loadMoreTweets()}
                  >
                    {tweetsLoadMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              : null}
            </>
          )}
        </section>
      )}

      {playlistModal ?
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !plSaving && setPlaylistModal(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ch-pl-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h2 id="ch-pl-title" className="page-title" style={{ fontSize: '1.1rem' }}>
              New playlist
            </h2>
            {plErr ?
              <ErrorBanner message={plErr} onDismiss={() => setPlErr(null)} />
            : null}
            <form
              className="stack-form"
              style={{ marginTop: '0.75rem' }}
              onSubmit={(e) => void onCreatePlaylist(e)}
            >
              <Input
                label="Name"
                name="pl-name"
                value={plName}
                onChange={(e) => setPlName(e.target.value)}
              />
              <div className="field">
                <label htmlFor="ch-pl-desc">Description</label>
                <textarea
                  id="ch-pl-desc"
                  name="pl-description"
                  className="input-textarea"
                  rows={3}
                  value={plDesc}
                  onChange={(e) => setPlDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={plSaving}
                  onClick={() => setPlaylistModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={plSaving}>
                  {plSaving ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      : null}

      <p className="pager">
        <Link to="/">← Home</Link>
      </p>
    </div>
  )
}
