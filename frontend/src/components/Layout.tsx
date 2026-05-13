import {
  useCallback,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { ErrorBanner } from './ui/ErrorBanner'

function navClass(isActive: boolean) {
  return `nav-pill${isActive ? ' active' : ''}`
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading, sessionError, logout } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuBtnId = useId()

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useOnClickOutside(menuRef, closeMenu, menuOpen)

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  async function onLogout() {
    closeMenu()
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="top-bar" aria-label="Site header">
        <div className="top-bar-left" role="navigation" aria-label="Primary">
          <Link to="/" className="brand">
            Playtube
          </Link>
          <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>
            Home
          </NavLink>
        </div>

        <div className="top-bar-center">
          <form className="search-form" onSubmit={onSearchSubmit} role="search">
            <label htmlFor="global-search" className="sr-only">
              Search
            </label>
            <input
              id="global-search"
              className="search-input"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>

        <div className="top-bar-right">
          {!loading && !user ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-pill ghost${isActive ? ' active' : ''}`
                }
              >
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `nav-pill accent${isActive ? ' active' : ''}`
                }
              >
                Sign up
              </NavLink>
            </>
          ) : null}

          {!loading && user ? (
            <>
              <NavLink
                to="/upload"
                className={({ isActive }) => navClass(isActive)}
              >
                Upload
              </NavLink>
              <div className="user-menu" ref={menuRef}>
                <button
                  type="button"
                  id={menuBtnId}
                  className="icon-btn user-avatar-btn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <img
                    src={user.avatar}
                    alt=""
                    className="user-avatar-sm"
                    width={36}
                    height={36}
                  />
                </button>
                {menuOpen ? (
                  <div
                    className="user-dropdown"
                    role="menu"
                    aria-labelledby={menuBtnId}
                  >
                    <div className="user-dropdown-head">
                      <strong>{user.fullname}</strong>
                      <span className="muted small">@{user.username}</span>
                    </div>
                    <Link to="/studio" role="menuitem" onClick={closeMenu}>
                      Studio
                    </Link>
                    <Link to="/history" role="menuitem" onClick={closeMenu}>
                      History
                    </Link>
                    <Link
                      to="/subscriptions"
                      role="menuitem"
                      onClick={closeMenu}
                    >
                      Subscriptions
                    </Link>
                    <Link to="/liked" role="menuitem" onClick={closeMenu}>
                      Liked videos
                    </Link>
                    <Link to="/settings" role="menuitem" onClick={closeMenu}>
                      Settings
                    </Link>
                    <button
                      type="button"
                      className="link-btn block"
                      role="menuitem"
                      onClick={() => void onLogout()}
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </header>

      {sessionError ? (
        <div className="page page-narrow">
          <ErrorBanner message={sessionError} />
        </div>
      ) : null}

      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
