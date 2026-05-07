import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui'

export function UploadPage() {
  return (
    <div className="page">
      <EmptyState
        title="Upload"
        description="Upload videos here soon."
        action={<Link to="/studio">Go to Studio (stub)</Link>}
      />
    </div>
  )
}
