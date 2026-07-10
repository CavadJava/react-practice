import { useState } from 'react'

const COUNTRIES = [
  {
    key: 'turkey',
    flag: 'https://flagcdn.com/w40/tr.png',
    label: 'Türkiyə',
    ratePerKg: 6,
    rows: [
      { range: '0.000 – 0.100 kq', price: '0.88 $' },
      { range: '0.101 – 0.250 kq', price: '1.65 $' },
      { range: '0.251 – 0.500 kq', price: '2.30 $' },
      { range: '0.501 – 0.700 kq', price: '3.50 $' },
      { range: '0.701 – 1.000 kq', price: '4.50 $' },
      { range: '1.001 – 1.500 kq', price: '6.00 $' },
      { range: '1.501 – 2.000 kq', price: '7.50 $' },
      { range: '2.001 – 3.000 kq', price: '10.00 $' },
    ],
  },
  {
    key: 'usa',
    flag: 'https://flagcdn.com/w40/us.png',
    label: 'ABŞ',
    ratePerKg: 14,
    rows: [
      { range: '0.000 – 0.100 kq', price: '3.00 $' },
      { range: '0.101 – 0.250 kq', price: '5.50 $' },
      { range: '0.251 – 0.500 kq', price: '7.00 $' },
      { range: '0.501 – 0.700 kq', price: '8.50 $' },
      { range: '0.701 – 1.000 kq', price: '11.00 $' },
      { range: '1.001 – 1.500 kq', price: '15.00 $' },
      { range: '1.501 – 2.000 kq', price: '19.00 $' },
      { range: '2.001 – 3.000 kq', price: '26.00 $' },
    ],
  },
  {
    key: 'uk',
    flag: 'https://flagcdn.com/w40/gb.png',
    label: 'İngiltərə',
    ratePerKg: 10,
    rows: [
      { range: '0.000 – 0.100 kq', price: '2.50 $' },
      { range: '0.101 – 0.250 kq', price: '4.00 $' },
      { range: '0.251 – 0.500 kq', price: '5.50 $' },
      { range: '0.501 – 0.700 kq', price: '7.00 $' },
      { range: '0.701 – 1.000 kq', price: '9.00 $' },
      { range: '1.001 – 1.500 kq', price: '13.00 $' },
      { range: '1.501 – 2.000 kq', price: '17.00 $' },
      { range: '2.001 – 3.000 kq', price: '23.00 $' },
    ],
  },
]

export default function Tarif() {
  const [country, setCountry] = useState('turkey')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)

  const selected = COUNTRIES.find(c => c.key === country)

  const handleCalc = () => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return
    setResult((w * selected.ratePerKg).toFixed(2))
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Tariflər</h1>
          <p>Ölkəyə görə daşıma tarifləri və çəki kalkulyatoru</p>
        </div>
      </div>

      <section style={{ padding: '50px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {COUNTRIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCountry(c.key); setResult(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 30,
                  border: `2px solid ${c.key === country ? 'var(--brand-yellow)' : '#eee'}`,
                  background: c.key === country ? '#fff9e6' : '#fff',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <img src={c.flag} alt={c.label} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
            <div>
              <div className="rate-card">
                <div className="rate-card-header">
                  <img src={selected.flag} alt={selected.label} />
                  <span>{selected.label} — Daşıma Tarifləri</span>
                </div>
                {selected.rows.map(r => (
                  <div className="rate-row" key={r.range}>
                    <span>{r.range}</span>
                    <span className="price">{r.price}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: '20px', background: '#f8f9fa', borderRadius: 12, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: '#333' }}>Qeydlər:</strong>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Göstərilən qiymətlər ABŞ dolları ilə verilmişdir.</li>
                  <li>Çəki hesablanarkən həcmi çəki də nəzərə alına bilər.</li>
                  <li>Gömrük rüsumları ayrıca hesablanır.</li>
                  <li>Ev çatdırılması üçün əlavə ödəniş tətbiq edilir.</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="section-title">Kalkulyator</h4>
              <div className="calc-card">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Ölkə</label>
                  <select className="form-select" value={country} onChange={e => { setCountry(e.target.value); setResult(null) }}>
                    {COUNTRIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Çəki (kq)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={weight}
                    onChange={e => { setWeight(e.target.value); setResult(null) }}
                  />
                </div>
                <button className="btn-yellow" onClick={handleCalc} style={{ width: '100%' }}>Hesabla</button>
                {result !== null && (
                  <div className="calc-result">
                    Təxmini: <span style={{ color: 'var(--brand-blue)' }}>{result} $</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
