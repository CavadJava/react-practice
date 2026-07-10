import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MENU } from '../../data/menu'

function itemMatchesPath(item, pathname) {
  if (!item.sub) return item.path === pathname
  return item.sub.some(s => s.path.split('#')[0] === pathname)
}

export default function Sidebar() {
  const { pathname } = useLocation()

  const [open, setOpen] = useState(() => {
    const init = {}
    MENU.forEach(section =>
      section.items.forEach(item => {
        if (item.sub && itemMatchesPath(item, pathname)) init[item.id] = true
      })
    )
    return init
  })

  const toggle = id => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="logo-icon"><i className="bi bi-shield-check"></i></div>
        <div className="logo-text">
          <strong>EMAS</strong>
          <span>E-Sosial Sistemlər</span>
        </div>
      </Link>

      {MENU.map(section => (
        <div key={section.section}>
          <p className="sb-section">{section.section}</p>
          <ul className="sb-nav">
            {section.items.map(item => {
              const isActive = itemMatchesPath(item, pathname)
              const isOpen = open[item.id]

              return (
                <li key={item.id}>
                  {item.sub ? (
                    <>
                      <button
                        className={`sb-link ${isActive ? 'active' : ''}`}
                        onClick={() => toggle(item.id)}
                      >
                        <i className={`bi ${item.icon} sb-icon`}></i>
                        <span className="sb-label">{item.label}</span>
                        {item.badge && <span className="sb-badge">{item.badge}</span>}
                        <i className={`bi bi-chevron-down sb-chevron ${isOpen ? 'open' : ''}`}></i>
                      </button>
                      {isOpen && (
                        <ul className="sb-sub">
                          {item.sub.map(s => (
                            <li key={s.label}>
                              <Link
                                to={s.path}
                                className={`sb-sub-link ${pathname === s.path.split('#')[0] ? 'active' : ''}`}
                              >
                                <span className="sub-dot"></span>
                                {s.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path || '#'}
                      className={`sb-link ${pathname === item.path ? 'active' : ''}`}
                    >
                      <i className={`bi ${item.icon} sb-icon`}></i>
                      <span className="sb-label">{item.label}</span>
                      {item.badge && <span className="sb-badge">{item.badge}</span>}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div className="sidebar-footer">
        <Link to="/profile"><i className="bi bi-person-circle"></i> Profil</Link>
        <a href="#"><i className="bi bi-question-circle"></i> Yardım</a>
        <a href="#"><i className="bi bi-box-arrow-right"></i> Çıxış</a>
      </div>
    </aside>
  )
}
