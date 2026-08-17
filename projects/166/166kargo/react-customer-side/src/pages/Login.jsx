import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    alert('Giriş uğurla tamamlandı!')
  }

  return (
    <section className="login-page">
      <div className="container">
        <div className="login-page-card">
          <h2>Xoş gəlmisiniz!</h2>
          <p className="subtitle">Hesabınıza daxil olmaq üçün məlumatlarınızı daxil edin.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">E-poçt</label>
              <input
                type="email"
                className="form-control"
                placeholder="E-poçt ünvanınız"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">
                Şifrə
                <Link to="/login" className="forgot-link">Şifrəni unutmusunuz?</Link>
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Şifrəniz"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-yellow">Daxil ol</button>
          </form>

          <p className="register-prompt">
            Hesabınız yoxdur? <Link to="/register">Qeydiyyatdan keç</Link>
          </p>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Sürətli giriş</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fa-brands fa-google" style={{ color: '#ea4335' }} /> Google
              </button>
              <button style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fa-brands fa-facebook" style={{ color: '#1877f2' }} /> Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
