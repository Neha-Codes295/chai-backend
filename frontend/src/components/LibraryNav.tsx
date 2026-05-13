import { NavLink } from 'react-router-dom'

function linkClass({ isActive }: { isActive: boolean }) {
  return `nav-pill${isActive ? ' active' : ''}`
}

export function LibraryNav() {
  return (
    <nav className="library-nav" aria-label="Library">
      <NavLink to="/history" className={linkClass}>
        History
      </NavLink>
      <NavLink to="/liked" className={linkClass}>
        Liked
      </NavLink>
      <NavLink to="/subscriptions" className={linkClass}>
        Subscriptions
      </NavLink>
    </nav>
  )
}
