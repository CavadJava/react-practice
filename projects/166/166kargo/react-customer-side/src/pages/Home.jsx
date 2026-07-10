import { useState } from 'react'
import { Link } from 'react-router-dom'

const RATES = {
  turkey: {
    flag: 'https://flagcdn.com/w40/tr.png',
    label: 'Türkiyə',
    rows: [
      { range: '0.000 – 0.100 kq', price: '0.88 $' },
      { range: '0.101 – 0.250 kq', price: '1.65 $' },
      { range: '0.251 – 0.500 kq', price: '2.30 $' },
      { range: '0.501 – 0.700 kq', price: '3.50 $' },
      { range: '0.701 – 1.000 kq', price: '4.50 $' },
    ],
  },
  usa: {
    flag: 'https://flagcdn.com/w40/us.png',
    label: 'ABŞ',
    rows: [
      { range: '0.000 – 0.100 kq', price: '3.00 $' },
      { range: '0.101 – 0.250 kq', price: '5.50 $' },
      { range: '0.251 – 0.500 kq', price: '7.00 $' },
      { range: '0.501 – 0.700 kq', price: '8.50 $' },
      { range: '0.701 – 1.000 kq', price: '11.00 $' },
    ],
  },
  uk: {
    flag: 'https://flagcdn.com/w40/gb.png',
    label: 'İngiltərə',
    rows: [
      { range: '0.000 – 0.100 kq', price: '2.50 $' },
      { range: '0.101 – 0.250 kq', price: '4.00 $' },
      { range: '0.251 – 0.500 kq', price: '5.50 $' },
      { range: '0.501 – 0.700 kq', price: '7.00 $' },
      { range: '0.701 – 1.000 kq', price: '9.00 $' },
    ],
  },
}

const CALC_RATES = { turkey: 6, usa: 14, uk: 10 }

const NEWS = [
  { id: 1, title: 'Smart customs-da yenilik var!', date: '03 iyun, 2026', bg: 'linear-gradient(135deg,#f6d365,#fda085)', label: 'Smart Customs' },
  { id: 2, title: 'Trendyolda böyük endirim fürsəti başladı!', date: '06 may, 2026', bg: 'linear-gradient(135deg,#f8c325,#ee7b12)', label: 'Trendyol' },
  { id: 3, title: 'Amerikadan həftədə 2 dəfə çatdırılma!', date: '05 may, 2026', bg: 'linear-gradient(135deg,#203a43,#2c5364)', label: 'Amerika' },
]

const BRANDS = [
  { name: 'Trendyol', img: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Trendyol_logo.svg' },
  { name: 'DeFacto', img: null },
  { name: 'KOTON', img: null },
  { name: 'ZARA', img: null },
  { name: 'gittigidiyor', img: null, italic: true },
  { name: 'H&M', img: null, red: true },
]

export default function Home() {
  const [calcCountry, setCalcCountry] = useState('turkey')
  const [calcWeight, setCalcWeight] = useState('')
  const [calcResult, setCalcResult] = useState(null)
  const [trackCode, setTrackCode] = useState('')

  const handleCalc = () => {
    const w = parseFloat(calcWeight)
    if (!w || w <= 0) return
    const result = (w * CALC_RATES[calcCountry]).toFixed(2)
    setCalcResult(result)
  }

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-banner">
              <div className="hero-badge">
                <i className="fa-solid fa-bolt" /> Sürətli Çatdırılma
              </div>
              <h1>Amerika sifarişini <span>evinə kimi</span> çatdıraq!</h1>
              <p>Türkiyə, İngiltərə və ABŞ-dan sürətli, etibarlı və münasib qiymətlərlə daşınma.</p>
            </div>

            <div className="login-card">
              <h3>İstifadəçi girişi</h3>
              <div className="form-group">
                <label className="form-label">E-poçt</label>
                <input type="email" className="form-control" placeholder="E-poçt ünvanınız" />
              </div>
              <div className="form-group">
                <label className="form-label">Şifrə</label>
                <input type="password" className="form-control" placeholder="Şifrəniz" />
              </div>
              <button className="btn-yellow" style={{ width: '100%', padding: '12px', marginTop: 8 }}>
                Daxil ol
              </button>
              <div className="login-card-footer">
                <Link to="/login">Şifrəni unutmusunuz?</Link>
                <Link to="/register" className="register-link">Qeydiyyatdan keç</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Package Search ---- */}
      <section className="search-section">
        <div className="container">
          <div className="search-inner">
            <h4>Bağlama axtar</h4>
            <div className="search-box">
              <input
                type="text"
                placeholder="Bağlama kodunu daxil edin"
                value={trackCode}
                onChange={e => setTrackCode(e.target.value)}
              />
              <button type="button">Axtar</button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Tariffs + Calculator ---- */}
      <section className="tarif-calc-section">
        <div className="container">
          <div className="tarif-calc-grid">
            <div>
              <h4 className="section-title">Tariflər</h4>
              <div className="rate-cards-grid">
                {Object.entries(RATES).map(([key, c]) => (
                  <div className="rate-card" key={key}>
                    <div className="rate-card-header">
                      <img src={c.flag} alt={c.label} />
                      <span>{c.label}</span>
                    </div>
                    {c.rows.map(r => (
                      <div className="rate-row" key={r.range}>
                        <span>{r.range}</span>
                        <span className="price">{r.price}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="section-title">Kalkulyator</h4>
              <div className="calc-card">
                <div className="form-group">
                  <label className="form-label">Ölkə seç</label>
                  <select className="form-select" value={calcCountry} onChange={e => { setCalcCountry(e.target.value); setCalcResult(null) }}>
                    <option value="turkey">Türkiyə</option>
                    <option value="usa">ABŞ</option>
                    <option value="uk">İngiltərə</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Çəki (kq)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={calcWeight}
                    onChange={e => { setCalcWeight(e.target.value); setCalcResult(null) }}
                  />
                </div>
                <button className="btn-yellow" onClick={handleCalc}>Hesabla</button>
                {calcResult !== null && (
                  <div className="calc-result">
                    Təxmini məbləğ: <span style={{ color: 'var(--brand-blue)' }}>{calcResult} $</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="how-section">
        <div className="container">
          <h3 className="section-title">Necə işləyir?</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon"><i className="fa-solid fa-address-card" /></div>
              <h4>Qeydiyyatdan keçirsiniz</h4>
              <p>Sizə Türkiyə, İngiltərə və ABŞ-da yerləşən anbarların ünvanlarını göndəririk.</p>
            </div>
            <div className="step-card">
              <div className="step-icon"><i className="fa-solid fa-basket-shopping" /></div>
              <h4>Sifariş et</h4>
              <p>Türkiyəyə, İngiltərəyə və ya ABŞ-a çatdıran veb saytdan alış-veriş edirsiniz. Probleminiz olsa linki bizə göndərin, biz sifariş edək.</p>
            </div>
            <div className="step-card">
              <div className="step-icon"><i className="fa-solid fa-box-open" /></div>
              <h4>Bağlamanı əldə edin</h4>
              <p>Sifarişinizi Bakı ofisimizdən götürürsünüz və ya evinizə çatdırılma xidmətimizdən istifadə edirsiniz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- News ---- */}
      <section className="news-section">
        <div className="container">
          <div className="section-header">
            <h3>Son xəbərlər</h3>
            <Link to="/blog" className="see-all">Hamısını gör &rsaquo;</Link>
          </div>
          <div className="news-grid">
            {NEWS.map(n => (
              <div className="news-card" key={n.id}>
                <div className="news-img" style={{ background: n.bg }}>{n.label}</div>
                <span className="news-date">{n.date}</span>
                <div className="news-title">{n.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Brands ---- */}
      <section className="brands-section">
        <div className="container">
          <div className="section-header">
            <h5 style={{ fontWeight: 700, color: '#444' }}>Bəzi mağazalar</h5>
            <Link to="/example-shop" className="see-all">Hamısını gör &rsaquo;</Link>
          </div>
          <div className="brands-grid">
            {BRANDS.map(b => (
              <div className="brand-item" key={b.name}>
                {b.img ? (
                  <img src={b.img} alt={b.name} />
                ) : (
                  <span style={{ fontStyle: b.italic ? 'italic' : 'normal', color: b.red ? '#dc3545' : '#333' }}>
                    {b.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
