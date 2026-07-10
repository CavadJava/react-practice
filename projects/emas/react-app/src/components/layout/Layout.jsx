import { Outlet, Link } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <>
      <Sidebar />
      <div className="main-wrapper">
        <Outlet />
        <footer className="main-footer">
          <small>© 2026 EMAS — Elektron Sosial Müavinət İdarəetmə Sistemi</small>
          <small>
            Versiya 3.1.4 · <Link to="/profile" style={{ color: 'var(--accent)' }}>Profil</Link>{' '}
            · <a href="#" style={{ color: 'var(--accent)' }}>Dəstək</a>
          </small>
        </footer>
      </div>
    </>
  )
}
