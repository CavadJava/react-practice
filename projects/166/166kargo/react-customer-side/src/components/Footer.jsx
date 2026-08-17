import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="footer-brand">166<span>KARGO</span></Link>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
              Türkiyə, İngiltərə və Amerikadan sürətli, etibarlı və münasib qiymətlərlə kargo çatdırılması.
            </p>
            <div className="social-icons">
              <a href="https://instagram.com" target="_blank" rel="noreferrer"><i className="fa-brands fa-instagram" /></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer"><i className="fa-brands fa-facebook" /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"><i className="fa-brands fa-youtube" /></a>
            </div>
          </div>

          <div>
            <div className="footer-heading">Keçidlər</div>
            <ul className="footer-links">
              <li><Link to="/faq">› Tez-tez verilən suallar</Link></li>
              <li><Link to="/tarif">› Sifariş şərtləri</Link></li>
              <li><Link to="/tarif">› Daşınma şərtləri</Link></li>
              <li><Link to="/about">› Gizlilik şərtləri</Link></li>
              <li><Link to="/register">› İstifadəçi razılaşması</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-heading">Əlaqə</div>
            <ul className="contact-list">
              <li>
                <i className="fa-solid fa-location-dot" />
                Bakı şəhəri, Səbail rayonu, Şeyx Şamil küç. 16
              </li>
              <li>
                <i className="fa-solid fa-phone" />
                *0166, 0125260166
              </li>
              <li>
                <i className="fa-solid fa-envelope" />
                info@166karqo.az
              </li>
              <li>
                <i className="fa-solid fa-clock" />
                Həftə içi 10:00–20:00, Şənbə 11:00–18:00
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="copyright-bar">
        <div className="container">
          © 2026 166 Kargo | Bütün hüquqlar qorunur
        </div>
      </div>
    </footer>
  )
}
