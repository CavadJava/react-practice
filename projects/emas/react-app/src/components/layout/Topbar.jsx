import { Link } from 'react-router-dom'
import { useClock } from '../../hooks/useClock'
import { useAuthStore } from '../../store/auth'

export default function Topbar({ title, crumb }) {
  const { time, date } = useClock()
  const user = useAuthStore(s => s.user)
  const initials = (user.ad[0] || '') + (user.soyad[0] || '')

  return (
    <header className="topbar">
      <div>
        <div className="tb-title">{title}</div>
        <div className="tb-crumb">{crumb}</div>
      </div>

      <div className="tb-search">
        <i className="bi bi-search"></i>
        <input type="text" placeholder="Axtar..." />
      </div>

      <div className="tb-right">
        <div className="tb-clock">
          <div className="tb-date">{date}</div>
          <div className="tb-time">{time}</div>
        </div>
        <div className="tb-divider"></div>
        <span className="live-dot me-2">Canlı</span>
        <div className="tb-icon" title="Bildirişlər">
          <i className="bi bi-bell"></i>
          <span className="tb-dot"></span>
        </div>
        <div className="tb-icon" title="Mesajlar">
          <i className="bi bi-chat-dots"></i>
        </div>
        <div className="tb-divider"></div>
        <Link to="/profile" className="tb-user">
          <div className="tb-avatar">{initials}</div>
          <div>
            <div className="tb-uname">{user.ad} {user.soyad}</div>
            <div className="tb-urole">{user.rol}</div>
          </div>
          <i className="bi bi-chevron-down ms-1" style={{ fontSize: 11, color: '#aaa' }}></i>
        </Link>
      </div>
    </header>
  )
}
