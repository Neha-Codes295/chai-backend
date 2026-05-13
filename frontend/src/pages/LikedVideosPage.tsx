import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchLikedVideosPage } from '../api/likes'
import { LibraryNav } from '../components/LibraryNav'
import { VideoCard } from '../components/VideoCard'
import { VideoGridSkeleton } from '../components/VideoGridSkeleton'
import { Button, EmptyState, ErrorBanner } from '../components/ui'
import { normalizeVideoDocs } from '../lib/videoSummary'
import type { VideoSummary } from '../types/video'

const PAGE_LIMIT = 12

export function LikedVideosPage() {
  const [items, setItems] = useState<VideoSummary[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage1 = useCallback(async () => {
    setLoadingInitial(true)
    setError(null)
    const r = await fetchLikedVideosPage(1, PAGE_LIMIT)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load liked videos.')
      setItems([])
      setTotal(0)
    } else {
      setItems(normalizeVideoDocs(r.data.data))
      setPage(r.data.page)
      setTotal(typeof r.data.total === 'number' ? r.data.total : 0)
    }
    setLoadingInitial(false)
  }, [])

  useEffect(() => {
    void loadPage1()
  }, [loadPage1])

  const hasNextPage = page * PAGE_LIMIT < total

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || loadingInitial) return
    setLoadingMore(true)
    setError(null)
    const next = page + 1
    const r = await fetchLikedVideosPage(next, PAGE_LIMIT)
    if (!r.ok || !r.data) {
      setError(r.message || 'Could not load more.')
      setLoadingMore(false)
      return
    }
    const incoming = normalizeVideoDocs(r.data.data)
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
    setTotal(typeof r.data.total === 'number' ? r.data.total : total)
    setLoadingMore(false)
  }, [hasNextPage, loadingMore, loadingInitial, page, total])

  return (
    <div className="page">
      <LibraryNav />
      <h1 className="page-title">Liked videos</h1>
      {!loadingInitial && total > 0 ?
        <p className="muted small">
          {total} video{total === 1 ? '' : 's'} liked · showing {items.length}
          {hasNextPage ? '+' : ''}
        </p>
      : null}

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
          title="No likes yet"
          description="Like videos from the watch page to see them here."
          action={<Link to="/">Browse home</Link>}
        />
      : null}

      {!loadingInitial && items.length > 0 ?
        <>
          <div className="video-grid">
            {items.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
          {hasNextPage ?
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
    </div>
  )
}
