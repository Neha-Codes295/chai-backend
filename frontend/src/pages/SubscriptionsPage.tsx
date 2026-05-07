import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function SubscriptionsPage() {
  return (
    <div className="page">
      <EmptyState
        title="Subscriptions"
        description="Channels you follow will appear here."
        action={<Link to="/">Browse home</Link>}
      />
    </div>
  )
}
