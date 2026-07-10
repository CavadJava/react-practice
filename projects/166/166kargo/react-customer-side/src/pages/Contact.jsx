import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Əlaqə</h1>
          <p>Bizimlə əlaqə saxlayın — ən qısa müddətdə cavab verərik</p>
        </div>
      </div>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info-block">
              <h3>Bizimlə əlaqə</h3>

              {[
                { icon: 'fa-location-dot', title: 'Ünvanımız', text: 'Bakı şəhəri, Səbail rayonu, Şeyx Şamil küçəsi 16' },
                { icon: 'fa-phone', title: 'Telefon', text: '*0166, 0125260166' },
                { icon: 'fa-envelope', title: 'E-poçt', text: 'info@166karqo.az' },
                { icon: 'fa-clock', title: 'İş saatları', text: 'Həftə içi: 10:00–20:00\nŞənbə: 11:00–18:00' },
              ].map(d => (
                <div className="contact-detail" key={d.title}>
                  <div className="contact-detail-icon">
                    <i className={`fa-solid ${d.icon}`} />
                  </div>
                  <div>
                    <h4>{d.title}</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{d.text}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 30 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 14 }}>Sosial şəbəkələr</h4>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { icon: 'fa-instagram', color: '#e1306c', href: 'https://instagram.com' },
                    { icon: 'fa-facebook', color: '#1877f2', href: 'https://facebook.com' },
                    { icon: 'fa-youtube', color: '#ff0000', href: 'https://youtube.com' },
                    { icon: 'fa-whatsapp', color: '#25d366', href: 'https://whatsapp.com' },
                  ].map(s => (
                    <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                      style={{ width: 44, height: 44, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18, transition: 'transform 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className={`fa-brands ${s.icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <h3>Mesaj göndər</h3>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 50, marginBottom: 16 }}>✅</div>
                  <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Mesajınız göndərildi!</h4>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ən qısa müddətdə sizinlə əlaqə saxlayacağıq.</p>
                  <button className="btn-yellow" style={{ marginTop: 20 }} onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}>
                    Yeni mesaj
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-row form-group" style={{ marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Ad Soyad</label>
                      <input type="text" className="form-control" value={form.name} onChange={set('name')} required />
                    </div>
                    <div>
                      <label className="form-label">E-poçt</label>
                      <input type="email" className="form-control" value={form.email} onChange={set('email')} required />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Telefon</label>
                    <input type="tel" className="form-control" placeholder="+994 XX XXX XX XX" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Mövzu</label>
                    <select className="form-select" value={form.subject} onChange={set('subject')} required>
                      <option value="">Seçin...</option>
                      <option>Bağlama haqqında sorğu</option>
                      <option>Gömrük məsələsi</option>
                      <option>Ödəniş problemi</option>
                      <option>Qeydiyyat yardımı</option>
                      <option>Digər</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label">Mesajınız</label>
                    <textarea value={form.message} onChange={set('message')} required placeholder="Mesajınızı yazın..." />
                  </div>
                  <button type="submit" className="btn-yellow" style={{ width: '100%', padding: '13px' }}>
                    Göndər <i className="fa-solid fa-paper-plane" style={{ marginLeft: 8 }} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
