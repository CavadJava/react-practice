import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { user } from '../data/mockData'

const navItems = [
  { to: '/', label: 'Bağlamalarım', icon: '📦' },
  { to: '/addresses', label: 'Xaricdəki ünvanlarım', icon: '🗺️' },
  { to: '/profile', label: 'Şəxsi məlumatlar', icon: '📋' },
  { to: '/balance', label: 'Daşınma balansı', icon: '💰' },
  { to: '/debts', label: 'Borclarım', icon: '💳' },
  { to: '/queries', label: 'Sorğular', icon: '❓' },
  { to: '/courier', label: 'Kuryer sifarişi', icon: '🚚' },
  { to: '/post', label: 'Azərpoçt', icon: '✉️' },
]

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user.name.split(' ').map(n => n[0]).join('')

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-top-left">
          <a href="#">Tez-tez verilən suallar</a>
          <a href="#">Əlaqə</a>
        </div>
        <div className="header-top-right" ref={dropdownRef}>
          <button className="btn-digital-login">digital login</button>
          <button
            className="user-trigger"
            onClick={() => setDropdownOpen(v => !v)}
          >
            <span>{user.name}</span>
            <div className="user-avatar">{initials}</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <div className="user-dropdown-footer">
                <button className="btn-digital-login-full">digital login •</button>
                <button className="btn-logout">
                  <span>⇥</span> Çıxış
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="header-nav">
        <Link to="/" className="header-logo">
          <span className="logo-number">166</span>
          <span className="logo-icon">✈</span>
          <span className="logo-cargo">CARGO</span>
        </Link>

        <ul className="header-menu">
          <li><a href="#">Haqqımızda</a></li>
          <li><a href="#">Nümunə saytlar</a></li>
          <li><a href="#">Tariflər</a></li>
          <li><a href="#">Xəbərlər və Yeniliklər</a></li>
          <li><a href="#">Filial və məntəqələr</a></li>
          <li>
            <button className="lang-btn">AZ ▾</button>
          </li>
        </ul>

        <a href="tel:*0166" className="header-phone">
          <span>📞</span>
          <span>*0166</span>
        </a>
      </nav>
    </header>
  )
}
