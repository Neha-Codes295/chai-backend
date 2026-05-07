import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function ChannelPage() {
  const { username } = useParams<{ username: string }>()

  return (
    <div className="page">
      <EmptyState
        title="Channel"
        description={`@${username ?? 'unknown'}. Channel page coming soon.`}
        action={<Link to="/">← Back home</Link>}
      />
    </div>
  )
}
