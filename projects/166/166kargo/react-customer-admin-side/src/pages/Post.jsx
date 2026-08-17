import { useState } from 'react'
import { regions } from '../data/mockData'

export default function Post() {
  const [tab, setTab] = useState('delivery')
  const [form, setForm] = useState({
    region: regions[0],
    postIndex: '',
    address: '',
    phonePrefix: '010',
    phone: '',
  })

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="content-card">
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'delivery' ? 'active' : ''}`}
          onClick={() => setTab('delivery')}
        >
          Rayonlara çatdırılma sifarişləri
        </button>
        <button
          className={`tab-btn ${tab === 'my' ? 'active' : ''}`}
          onClick={() => setTab('my')}
        >
          Azərpoçt sifarişlərim
        </button>
      </div>

      {tab === 'delivery' && (
        <>
          <div className="info-alert">
            Hörmətli müştərilər, poçt sifarişləri aşağıdakı qeyd edilən tariflərə əsasən 1 kq üçün nəzərdə
            tutulmuşdur. Əgər bağlamanın çəkisi 1 kq-dan çox olarsa, hər kq üçün əlavə olaraq 0.80 AZN ödəniş
            tələb olunacaqdır. Bağlamaların poçt göndərişi 7 iş günü ərzində həyata keçiriləcəkdir.
            Bağlamalarınızın düzgün çatdırılması üçün zəhmət olmasa ünvanı tam və dəqiq şəkildə qeyd edəsiniz.
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Rayon seçin</label>
              <select className="form-control" value={form.region} onChange={handleChange('region')}>
                {regions.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Poçt indeksi seçin</label>
              <input
                className="form-control"
                value={form.postIndex}
                onChange={handleChange('postIndex')}
                placeholder=""
              />
            </div>
            <div className="form-group">
              <label>Dəqiq ünvan əlavə edin</label>
              <input className="form-control" value={form.address} onChange={handleChange('address')} />
            </div>
            <div className="form-group">
              <label>Əlaqə nömrəsi daxil edin</label>
              <div className="input-prefix-group">
                <select value={form.phonePrefix} onChange={handleChange('phonePrefix')}>
                  <option>010</option>
                  <option>050</option>
                  <option>051</option>
                  <option>055</option>
                  <option>070</option>
                  <option>077</option>
                </select>
                <input value={form.phone} onChange={handleChange('phone')} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <a href="#" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
              Xəritədən təyin et
            </a>
          </div>

          <div style={{ background: 'var(--primary)', borderRadius: '6px 6px 0 0', padding: '10px 16px', color: 'var(--white)', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
            Ödənilmiş bağlamalar
          </div>
          <table className="data-table" style={{ borderTop: '2px solid var(--primary)' }}>
            <thead>
              <tr>
                <th>İzləmə kodu (Gönderi numarası və ya Takip numarası)</th>
                <th>Mağaza</th>
                <th>Məhsul adı</th>
                <th>Məbləğ</th>
                <th>Çəki</th>
                <th>Çatdırılma</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <strong>5.7 azn</strong>
                    <button className="btn btn-yellow">Sifariş et və ödə</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {tab === 'my' && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 14 }}>
          Azərpoçt sifarişi yoxdur
        </div>
      )}
    </div>
  )
}
