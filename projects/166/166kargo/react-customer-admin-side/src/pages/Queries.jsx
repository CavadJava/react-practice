import { useState } from 'react'

export default function Queries() {
  const [createOpen, setCreateOpen] = useState(true)
  const [myOpen, setMyOpen] = useState(false)

  const [form, setForm] = useState({
    product: '',
    quantity: '',
    store: '',
    tracking: '',
    country: 'Türkiyə',
    note: '',
  })

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="content-card">
      <div className="info-alert">
        <strong>DİQQƏT! DİQQƏT!</strong> Bildirmək istəyirik ki, sorğular bölməsi Türkiyə, İngiltərə və ABŞ-dan göndərilən
        bağlamalar üçündür. Bağlama xarici anbarına təslim edilib, ancaq 24 saat keçməsinə baxmayaraq sistemdə əks
        olunmursa, nə etməlisiniz? Sorğular bölməsinə daxil olub, müvafiq xanaları doldurmalısan — Məhsul sayını,
        izləmə kodunu, ölkə seçimi, məhsulun təsvirini, təslimetmə məlumatlarını əlavə edirsən — Təslimetmə
        məlumatlarını - 'takip numarası', 'gönderi numarası'nı va ya tracking numberini, məhsulun hansı tarixdə
        və saatda kim tərəfindən təhvil alındığını yazırsan. Sorğuya baxılma müddəti 7-14 iş günüdür.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <button
            className="collapsible-header collapsible-primary"
            onClick={() => setCreateOpen(v => !v)}
            style={{ width: '100%', borderRadius: 6 }}
          >
            <span>SORĞU YARAT</span>
            <span>{createOpen ? '▲' : '▼'}</span>
          </button>
        </div>
        <div>
          <button
            className="collapsible-header collapsible-outline"
            onClick={() => setMyOpen(v => !v)}
            style={{ width: '100%', borderRadius: 6 }}
          >
            <span>MƏNİM SORĞULARIM</span>
            <span>{myOpen ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      {createOpen && (
        <div className="form-grid">
          <div className="form-group">
            <label>Məhsul adı</label>
            <input className="form-control" value={form.product} onChange={handleChange('product')} />
          </div>
          <div className="form-group">
            <label>Say</label>
            <input className="form-control" type="number" value={form.quantity} onChange={handleChange('quantity')} />
          </div>
          <div className="form-group">
            <label>Mağaza adı</label>
            <input className="form-control" value={form.store} onChange={handleChange('store')} />
          </div>
          <div className="form-group">
            <label>İzləmə kodu (Gönderi numarası və ya Takip numarası)</label>
            <input className="form-control" value={form.tracking} onChange={handleChange('tracking')} />
          </div>
          <div className="form-group">
            <label>Məhsul təsviri və təslimat məlumatları</label>
            <div className="upload-area">
              <span className="upload-icon">⬆</span>
              <div>Sürükləyib bura atın və ya</div>
              <span className="upload-link">faylları seçin</span>
            </div>
          </div>
          <div className="form-group">
            <label>Ölkə</label>
            <select className="form-control" value={form.country} onChange={handleChange('country')}>
              <option>Türkiyə</option>
              <option>İngiltərə</option>
              <option>ABŞ</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>Qeyd</label>
            <textarea
              className="form-control"
              rows={4}
              value={form.note}
              onChange={handleChange('note')}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-yellow" style={{ padding: '10px 28px' }}>Sorğu göndər</button>
          </div>
        </div>
      )}

      {myOpen && (
        <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
          Aktiv sorğu yoxdur
        </div>
      )}
    </div>
  )
}
