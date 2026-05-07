import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function HistoryPage() {
  return (
    <div className="page">
      <EmptyState
        title="Watch history"
        description="Your watch history will appear here."
        action={<Link to="/">Browse home</Link>}
      />
    </div>
  )
}
