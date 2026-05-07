import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()

  return (
    <div className="page watch-layout">
      <EmptyState
        title="Watch"
        description={`Video: ${videoId ?? 'unknown'}. Playback and comments coming soon.`}
        action={<Link to="/">← Back home</Link>}
      />
    </div>
  )
}
