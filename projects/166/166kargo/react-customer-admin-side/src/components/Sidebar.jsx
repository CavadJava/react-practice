import { NavLink, Link } from 'react-router-dom'
import { user } from '../data/mockData'

const navItems = [
  { to: '/addresses', label: 'Xaricdəki ünvanlarım', icon: <AddressIcon /> },
  { to: '/', label: 'Bağlamalarım', icon: <PackageIcon />, end: true },
  { to: '/profile', label: 'Şəxsi məlumatlar', icon: <ProfileIcon /> },
  { to: '/balance', label: 'Daşınma balansı', icon: <BalanceIcon /> },
  { to: '/debts', label: 'Borclarım', icon: <DebtIcon /> },
  { to: '/queries', label: 'Sorğular', icon: <QueryIcon /> },
  { to: '/courier', label: 'Kuryer sifarişi', icon: <CourierIcon /> },
  { to: '/post', label: 'Azərpoçt', icon: <PostIcon /> },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-card">
        <div className="sidebar-user">
          <h3>{user.name}</h3>
          <p>Müştəri kodu:{user.customerId}</p>
          <p>Daşınma balansı: {user.shippingBalance}AZN</p>
          <p>Sifariş (TL) balansı: {user.orderBalance}TL</p>
        </div>
        <div className="sidebar-actions">
          <button className="btn-sidebar-action">
            <span className="btn-icon">🛒</span> Sifariş et
          </button>
          <Link to="/balance">
            <button className="btn-sidebar-action" style={{ width: '100%' }}>
              <span className="btn-icon">💳</span> Daşınma balansı
            </button>
          </Link>
          <button className="btn-sidebar-action">
            <span className="btn-icon">📱</span> OTP Əlavə Et (Amazon)
          </button>
        </div>
      </div>

      <div className="sidebar-card">
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function AddressIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="7" y1="3" x2="7" y2="17" />
      <line x1="2" y1="8" x2="18" y2="8" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6l8-3 8 3v8l-8 3-8-3V6z" />
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="2" y1="6" x2="18" y2="6" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="3" />
      <path d="M3 17c0-4 3-6 7-6s7 2 7 6" />
    </svg>
  )
}

function BalanceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v8M7 8h4.5a1.5 1.5 0 010 3H7" />
    </svg>
  )
}

function DebtIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 17c0-3 2.5-5 6-5" />
      <circle cx="15" cy="14" r="3" />
      <line x1="15" y1="12" x2="15" y2="16" />
      <line x1="13" y1="14" x2="17" y2="14" />
    </svg>
  )
}

function QueryIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M8 8a2 2 0 114 0c0 1.5-2 2-2 3.5" />
      <circle cx="10" cy="15" r="0.5" fill="currentColor" />
    </svg>
  )
}

function CourierIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="15" r="1.5" />
      <circle cx="15" cy="15" r="1.5" />
      <path d="M1 4h10v9H1zM11 7h4l3 4v4h-3" />
    </svg>
  )
}

function PostIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <polyline points="2,5 10,12 18,5" />
    </svg>
  )
}
