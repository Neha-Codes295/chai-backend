import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { fetchVideosPage } from '../api/videos'
import { VideoCard } from '../components/VideoCard'
import { VideoGridSkeleton } from '../components/VideoGridSkeleton'
import { Button, EmptyState, ErrorBanner } from '../components/ui'
import { normalizeVideoDocs } from '../lib/videoSummary'
import type { VideoSummary } from '../types/video'

function matchesQuery(video: VideoSummary, q: string): boolean {
  const n = q.trim().toLowerCase()
  if (!n) return true
  if (video.title.toLowerCase().includes(n)) return true
  const un = video.owner?.username?.toLowerCase() ?? ''
  const fn = video.owner?.fullname?.toLowerCase() ?? ''
  return un.includes(n) || fn.includes(n)
}

export function HomePage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const qRaw = params.get('q') ?? ''

  const [items, setItems] = useState<VideoSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalDocs, setTotalDocs] = useState<number | null>(null)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage1 = useCallback(async () => {
    setLoadingInitial(true)
    setError(null)
    const r = await fetchVideosPage(1)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load videos.')
      setItems([])
      setHasNextPage(false)
      setTotalDocs(null)
    } else {
      const docs = normalizeVideoDocs(r.data.docs as unknown[])
      setItems(docs)
      setPage(r.data.page)
      setHasNextPage(Boolean(r.data.hasNextPage))
      setTotalDocs(typeof r.data.totalDocs === 'number' ? r.data.totalDocs : null)
    }
    setLoadingInitial(false)
  }, [])

  useEffect(() => {
    void loadPage1()
  }, [loadPage1])

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loadingInitial) return
    setLoadingMore(true)
    setError(null)
    const next = page + 1
    const r = await fetchVideosPage(next)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load more videos.')
      setLoadingMore(false)
      return
    }
    const incoming = normalizeVideoDocs(r.data.docs as unknown[])
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
    setPage(r.data.page)
    setHasNextPage(Boolean(r.data.hasNextPage))
    setLoadingMore(false)
  }, [hasNextPage, loadingMore, loadingInitial, page])

  const filtered = useMemo(
    () => items.filter((v) => matchesQuery(v, qRaw)),
    [items, qRaw],
  )

  const showFilterHint =
    Boolean(qRaw.trim()) && items.length > 0 && filtered.length === 0

  return (
    <div className="page">
      <div className="home-feed-head">
        <h1 className="page-title">Home</h1>
        {totalDocs != null && !loadingInitial ?
          <p className="muted small home-feed-meta">
            {qRaw.trim() ?
              <>
                {filtered.length} match{filtered.length === 1 ? '' : 'es'} in
                loaded videos · {items.length} loaded
              </>
            : <>
                {totalDocs} published video{totalDocs === 1 ? '' : 's'} · showing{' '}
                {items.length}
                {hasNextPage ? '+' : ''}
              </>
            }
          </p>
        : null}
      </div>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {error && !loadingInitial ?
        <div className="pager">
          <Button type="button" variant="secondary" onClick={() => void loadPage1()}>
            Retry
          </Button>
        </div>
      : null}

      {loadingInitial ? <VideoGridSkeleton /> : null}

      {!loadingInitial && !error && items.length === 0 ?
        <EmptyState
          title="No videos yet"
          description="When creators publish, they will appear here."
          action={
            user ?
              <Link to="/upload">Upload a video</Link>
            : <Link to="/login">Sign in to upload</Link>
          }
        />
      : null}

      {!loadingInitial && items.length > 0 ?
        <>
          {showFilterHint ?
            <EmptyState
              title="No matches"
              description={`Nothing in the loaded list matches “${qRaw.trim()}”. Try another keyword or load more videos.`}
              action={
                hasNextPage ?
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                : <span className="muted small">All loaded videos are shown.</span>
              }
            />
          : (
            <div className="video-grid">
              {filtered.map((v) => (
                <VideoCard key={v._id} video={v} />
              ))}
            </div>
          )}

          {!showFilterHint && hasNextPage ?
            <div className="pager">
              <Button
                type="button"
                variant="secondary"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          : null}
        </>
      : null}

      {user ?
        <p className="muted small" style={{ marginTop: '2rem' }}>
          Signed in as <strong>@{user.username}</strong> ·{' '}
          <Link to="/studio">Studio</Link>
        </p>
      : (
        <p className="muted small" style={{ marginTop: '2rem' }}>
          <Link to="/login">Sign in</Link> or <Link to="/register">Sign up</Link> to
          upload and subscribe.
        </p>
      )}
    </div>
  )
}
