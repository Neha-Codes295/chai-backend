import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWatchHistory } from '../api/history'
import { VideoCard } from '../components/VideoCard'
import { VideoGridSkeleton } from '../components/VideoGridSkeleton'
import { Button, EmptyState, ErrorBanner } from '../components/ui'
import { normalizeVideoDocs } from '../lib/videoSummary'
import type { VideoSummary } from '../types/video'

export function HistoryPage() {
  const [items, setItems] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await fetchWatchHistory()
    if (!r.ok || !Array.isArray(r.data)) {
      setError(r.message || 'Could not load watch history.')
      setItems([])
    } else {
      setItems(normalizeVideoDocs(r.data))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="page">
      <h1 className="page-title">Watch history</h1>

      {error ?
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      : null}

      {error && !loading ?
        <div className="pager">
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      : null}

      {loading ? <VideoGridSkeleton /> : null}

      {!loading && !error && items.length === 0 ?
        <EmptyState
          title="No history yet"
          description="Videos you watch while signed in appear here."
          action={<Link to="/">Browse home</Link>}
        />
      : null}

      {!loading && items.length > 0 ?
        <div className="video-grid">
          {items.map((v) => (
            <VideoCard key={v._id} video={v} />
          ))}
        </div>
      : null}
    </div>
  )
}
