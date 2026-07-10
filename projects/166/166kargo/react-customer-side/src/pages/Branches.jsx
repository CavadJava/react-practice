const BRANCHES = [
  {
    name: 'Mərkəzi Ofis — Səbail',
    address: 'Bakı şəhəri, Səbail rayonu, Şeyx Şamil küçəsi 16',
    phone: '*0166, 0125260166',
    hours: 'Həftə içi 10:00–20:00 | Şənbə 11:00–18:00',
    metro: 'İçərişəhər metro stansiyasına 5 dəqiqə',
  },
  {
    name: 'Gənclik Filialı',
    address: 'Bakı şəhəri, Nərimanov rayonu, Gənclik mall yanı',
    phone: '0125260167',
    hours: 'Həftə içi 10:00–20:00 | Şənbə 10:00–18:00',
    metro: 'Gənclik metro stansiyasına 2 dəqiqə',
  },
  {
    name: 'Sumqayıt Filialı',
    address: 'Sumqayıt şəhəri, 14-cü məhəllə, C blok',
    phone: '0125260168',
    hours: 'Həftə içi 09:00–19:00 | Şənbə 10:00–17:00',
    metro: null,
  },
  {
    name: 'Gəncə Filialı',
    address: 'Gəncə şəhəri, Nizami prospekti 45',
    phone: '0125260169',
    hours: 'Həftə içi 10:00–19:00 | Şənbə 10:00–17:00',
    metro: null,
  },
  {
    name: 'Xırdalan Məntəqəsi',
    address: 'Abşeron rayonu, Xırdalan şəhəri, Heydər Əliyev prospekti 12',
    phone: '0125260170',
    hours: 'Həftə içi 10:00–18:00',
    metro: null,
  },
  {
    name: 'Lənkəran Filialı',
    address: 'Lənkəran şəhəri, 8-ci Mikro rayon, 14 saylı bina',
    phone: '0125260171',
    hours: 'Həftə içi 10:00–18:00 | Şənbə 10:00–16:00',
    metro: null,
  },
]

export default function Branches() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Filial və Məntəqələr</h1>
          <p>Sizə ən yaxın 166 Kargo filialını tapın</p>
        </div>
      </div>

      <section className="branches-section">
        <div className="container">
          <div style={{ background: '#fff9e6', borderRadius: 12, padding: '16px 20px', marginBottom: 32, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--brand-yellow-dark)', fontSize: 18 }} />
            <span style={{ fontSize: 14, color: '#555' }}>
              Bağlamanızı istənilən filialımızdan götürə bilərsiniz. Ev çatdırılması üçün bizimlə əlaqə saxlayın.
            </span>
          </div>

          <div className="branches-grid">
            {BRANCHES.map((b, i) => (
              <div className="branch-card" key={i}>
                <h3>
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--brand-yellow-dark)', marginRight: 8 }} />
                  {b.name}
                </h3>
                <div className="branch-info">
                  <div className="branch-info-row">
                    <i className="fa-solid fa-map-pin" />
                    <span>{b.address}</span>
                  </div>
                  <div className="branch-info-row">
                    <i className="fa-solid fa-phone" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="branch-info-row">
                    <i className="fa-solid fa-clock" />
                    <span>{b.hours}</span>
                  </div>
                  {b.metro && (
                    <div className="branch-info-row">
                      <i className="fa-solid fa-train-subway" />
                      <span>{b.metro}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
