import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>()

  return (
    <div className="page">
      <EmptyState
        title="Playlist"
        description={`Playlist: ${playlistId ?? 'unknown'}. Coming soon.`}
        action={<Link to="/">← Back home</Link>}
      />
    </div>
  )
}
