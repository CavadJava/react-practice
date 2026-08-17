import { Link } from 'react-router-dom'

export default function TopNav() {
  return (
    <div className="top-nav">
      <div className="container">
        <div className="top-nav-left">
          <Link to="/faq">Tez-tez verilən suallar</Link>
          <Link to="/blog">Bloq</Link>
        </div>
        <div className="top-nav-right">
          <Link to="/login" className="btn-login">Daxil olun</Link>
          <Link to="/register">Qeydiyyatdan keç</Link>
          <Link to="/register" className="btn-gift">🎁 Hədiyyəli Giriş</Link>
        </div>
      </div>
    </div>
  )
}
