import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          166<span>KARGO</span>
        </Link>

        <button className="navbar-toggler" onClick={() => setOpen(o => !o)} aria-label="Menyu">
          <i className={open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} />
        </button>

        <div className={`navbar-collapse${open ? ' open' : ''}`}>
          <ul className="navbar-nav">
            <li><NavLink to="/about" onClick={() => setOpen(false)}>Haqqımızda</NavLink></li>
            <li><NavLink to="/example-shop" onClick={() => setOpen(false)}>Nümunə saytlar</NavLink></li>
            <li><NavLink to="/tarif" onClick={() => setOpen(false)}>Tariflər</NavLink></li>
            <li><NavLink to="/blog" onClick={() => setOpen(false)}>Xəbərlər</NavLink></li>
            <li><NavLink to="/branches" onClick={() => setOpen(false)}>Filial və məntəqələr</NavLink></li>
          </ul>

          <div className="navbar-actions">
            <select className="lang-select">
              <option>AZ</option>
              <option>EN</option>
              <option>RU</option>
            </select>
            <a href="tel:*0166" className="hotline-btn">
              <i className="fa-solid fa-phone-volume" /> *0166
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
