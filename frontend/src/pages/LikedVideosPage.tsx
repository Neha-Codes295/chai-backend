import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function LikedVideosPage() {
  return (
    <div className="page">
      <EmptyState
        title="Liked videos"
        description="Videos you liked will appear here."
        action={<Link to="/">Browse home</Link>}
      />
    </div>
  )
}
