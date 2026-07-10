import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Register() {
  const [isLegal, setIsLegal] = useState(false)
  const [form, setForm] = useState({
    name: '', surname: '', email: '', phone: '', phonePrefix: '050',
    gender: '', birthdate: '', nationality: 'Azerbaijan',
    idSerial: '', idSerialPrefix: 'AA', finCode: '', branch: '', address: '',
    password: '', passwordConfirm: '', agreed: false,
  })

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    if (form.password !== form.passwordConfirm) return alert('Şifrələr uyğun gəlmir!')
    if (!form.agreed) return alert('İstifadəçi razılaşmasını qəbul edin!')
    alert('Qeydiyyat uğurla tamamlandı!')
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Qeydiyyat</h1>
          <p>166 Kargo ailəsinə qoşulun — Türkiyə, İngiltərə və ABŞ anbar ünvanınızı əldə edin.</p>
        </div>
      </div>

      <section className="auth-section">
        <div className="container">
          <div className="auth-grid">
            <div className="register-card">
              <div className="register-card-header">
                <h2>Qeydiyyat</h2>
                <label className="switch-label">
                  Hüquqi şəxs
                  <span className="toggle-switch">
                    <input type="checkbox" checked={isLegal} onChange={e => setIsLegal(e.target.checked)} />
                    <span className="toggle-track" />
                  </span>
                </label>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Adınız</label>
                    <input type="text" className="form-control" value={form.name} onChange={set('name')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Soyadınız</label>
                    <input type="text" className="form-control" value={form.surname} onChange={set('surname')} required />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">E-poçt</label>
                    <input type="email" className="form-control" value={form.email} onChange={set('email')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefon</label>
                    <div className="input-group">
                      <select value={form.phonePrefix} onChange={set('phonePrefix')}>
                        {['010','050','051','055','070','077'].map(p => <option key={p}>{p}</option>)}
                      </select>
                      <input type="text" className="form-control" placeholder="XXX XX XX" value={form.phone} onChange={set('phone')} required />
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Cins</label>
                    <div className="radio-group">
                      <label><input type="radio" name="gender" value="kisi" checked={form.gender === 'kisi'} onChange={set('gender')} /> Kişi</label>
                      <label><input type="radio" name="gender" value="qadin" checked={form.gender === 'qadin'} onChange={set('gender')} /> Qadın</label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Doğum tarixi</label>
                    <input type="date" className="form-control" value={form.birthdate} onChange={set('birthdate')} required />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Milliyyət</label>
                    <select className="form-select" value={form.nationality} onChange={set('nationality')}>
                      <option>Azerbaijan</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">S/V seriya nömrəsi</label>
                    <div className="input-group">
                      <select value={form.idSerialPrefix} onChange={set('idSerialPrefix')}>
                        {['AA','AZE','MYI'].map(p => <option key={p}>{p}</option>)}
                      </select>
                      <input type="text" className="form-control" value={form.idSerial} onChange={set('idSerial')} required />
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">S/V FİN kodu</label>
                    <input type="text" className="form-control" value={form.finCode} onChange={set('finCode')} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Məntəqə</label>
                    <select className="form-select" value={form.branch} onChange={set('branch')}>
                      <option value="">Seçin...</option>
                      <option>İçərişəhər, Bakı şəhəri, Səbail rayonu</option>
                      <option>Gənclik filialı</option>
                      <option>Sumqayıt filialı</option>
                      <option>Gəncə filialı</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Ünvan</label>
                    <input type="text" className="form-control" value={form.address} onChange={set('address')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Şifrə</label>
                    <input type="password" className="form-control" value={form.password} onChange={set('password')} required minLength={6} />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Təkrar şifrə</label>
                    <input type="password" className="form-control" value={form.passwordConfirm} onChange={set('passwordConfirm')} required />
                  </div>
                  <div className="form-group">
                    <div className="checkbox-group">
                      <input type="checkbox" id="agreed" checked={form.agreed} onChange={set('agreed')} />
                      <label htmlFor="agreed">İstifadəçi razılaşması</label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-yellow" style={{ width: '100%', padding: '13px', fontSize: 15 }}>
                  Qeydiyyatı tamamla →
                </button>

                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
                  Artıq hesabınız var? <Link to="/login" style={{ color: 'var(--brand-blue)', fontWeight: 600 }}>Daxil olun</Link>
                </p>
              </form>
            </div>

            <div className="video-hint">
              <h3>Qeydiyyatdan keçməkdə çətinlik çəkirsinizsə videonu izləyin</h3>
              <div className="video-wrapper">
                <i className="fa-regular fa-circle-play" />
                <span style={{ fontSize: 13, opacity: 0.7 }}>Necə qeydiyyatdan keçmək olar?</span>
              </div>

              <div style={{ marginTop: 28 }}>
                <h3 style={{ marginBottom: 14 }}>Niyə 166 Kargo?</h3>
                {[
                  { icon: 'fa-bolt', text: 'Sürətli çatdırılma — həftədə 2 dəfə uçuş' },
                  { icon: 'fa-shield-halved', text: 'Sığortalı daşıma — bağlamanız qorunur' },
                  { icon: 'fa-tag', text: 'Münasib tariflər — kq başına ən aşağı qiymət' },
                  { icon: 'fa-headset', text: '7/12 müştəri dəstəyi' },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, background: '#fff9e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-yellow-dark)', flexShrink: 0 }}>
                      <i className={`fa-solid ${f.icon}`} />
                    </div>
                    <span style={{ fontSize: 14, color: '#555', paddingTop: 8 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
