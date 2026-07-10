import { useState } from 'react'
import { branches } from '../data/mockData'

export default function Courier() {
  const [tab, setTab] = useState('new')
  const [form, setForm] = useState({
    region: branches[0],
    time: '1 iş günü ərzində',
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
          className={`tab-btn ${tab === 'new' ? 'active' : ''}`}
          onClick={() => setTab('new')}
        >
          Yeni kuryer sifarişi
        </button>
        <button
          className={`tab-btn ${tab === 'my' ? 'active' : ''}`}
          onClick={() => setTab('my')}
        >
          Kuryer sifarişlərim
        </button>
      </div>

      {tab === 'new' && (
        <>
          <div className="info-alert">
            İndi kuryer xidməti ilə bağlamalarınız birbaşa qapınıza gəlir. Belə ki, kuryer xidmətimiz bağlamaları
            11:00–20:00 saatları aralığında seçdiyiniz ünvana çatdırır. Rahatlığınız üçün iki növ xidmət təklif
            edirik: a) 3 günlük Şəhərdaxili çatdırılma; b) Express çatdırılma; a) 3 günlük Şəhərdaxili
            çatdırılma ilə sifarişlər 3 iş günü ərzində çatdırılır. b) Express çatdırılma 1 iş günə həyata
            keçirilir. Qiymətlər isə seçdiyiniz məkana uyğun olaraq dəyişir. Kuryer xidməti yalnız İçərişəhər
            filialı üçün keçərlidir. Zəhmət olmasa, bağlamalarınızın qısa zamanda çatdırılması üçün ünvanı tam
            və dəqiq qeyd edəsiniz.
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Rayon seçin</label>
              <select className="form-control" value={form.region} onChange={handleChange('region')}>
                {branches.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Vaxt seçin</label>
              <select className="form-control" value={form.time} onChange={handleChange('time')}>
                <option>1 iş günü ərzində</option>
                <option>3 iş günü ərzində</option>
              </select>
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
                <input value={form.phone} onChange={handleChange('phone')} placeholder="" />
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
                <th>№</th>
                <th>OSS</th>
                <th>Ölkə</th>
                <th>Daşınmaq haqqı</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right', paddingTop: 16 }}>
                  <button className="btn btn-yellow">Sifariş et</button>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {tab === 'my' && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 14 }}>
          Kuryer sifarişi yoxdur
        </div>
      )}
    </div>
  )
}
