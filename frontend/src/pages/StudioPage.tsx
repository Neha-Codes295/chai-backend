import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function StudioPage() {
  return (
    <div className="page">
      <EmptyState
        title="Studio"
        description="Manage your videos here soon."
        action={<Link to="/upload">Upload (stub)</Link>}
      />
    </div>
  )
}
