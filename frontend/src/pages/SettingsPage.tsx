import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function SettingsPage() {
  return (
    <div className="page">
      <EmptyState
        title="Settings"
        description="Account settings coming soon."
        action={<Link to="/">Home</Link>}
      />
    </div>
  )
}
