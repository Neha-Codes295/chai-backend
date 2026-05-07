import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState
        title="Page not found"
        description="That route does not exist."
        action={<Link to="/">Go home</Link>}
      />
    </div>
  )
}
