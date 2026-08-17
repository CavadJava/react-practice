import { useState } from 'react'
import { turkeyAddress } from '../data/mockData'

const countries = [
  { key: 'turkey', label: 'TÜRKİYƏ Ünvan', flag: '🇹🇷' },
  { key: 'usa', label: 'ABŞ Ünvan', flag: '🇺🇸' },
  { key: 'uk', label: 'İngiltərə Ünvan', flag: '🇬🇧' },
  { key: 'china', label: 'Çin Ünvan', flag: '🇨🇳' },
  { key: 'spain', label: 'İspanya Ünvan', flag: '🇪🇸' },
]

export default function Addresses() {
  const [activeCountry, setActiveCountry] = useState('turkey')

  return (
    <div className="content-card">
      <div className="notice-box">
        Hörmətli müştəri, 'Trendyol' saytında adres əlavə edərkən 'onay kodu' tələb edilən zaman
        <strong> +994552134166</strong> nömrəsi ilə əlaqə saxlayın.
      </div>

      <button
        className="btn btn-yellow"
        style={{ width: '100%', marginBottom: 24, padding: '12px', fontSize: 14, borderRadius: 6 }}
      >
        Onay kodu olmadan &apos;TRENDYOL&apos;-A ÜNVANIMI ƏLAVƏ ET
      </button>

      <div className="country-grid">
        {countries.map(c => (
          <button
            key={c.key}
            className={`country-card ${activeCountry === c.key ? 'active' : ''}`}
            onClick={() => setActiveCountry(c.key)}
            style={{ border: 'none' }}
          >
            <span className="country-flag">{c.flag}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {activeCountry === 'turkey' && (
        <div className="address-info-grid">
          <div className="address-info-item">
            <label>📋 Ad Soyad:</label>
            <p>{turkeyAddress.fullName}</p>
          </div>
          <div className="address-info-item">
            <label>📋 Adress Satır 1:</label>
            <p>{turkeyAddress.addressLine1}</p>
          </div>
          <div className="address-info-item">
            <label>📋 Adress Satır 2:</label>
            <p>{turkeyAddress.addressLine2}</p>
          </div>
          <div className="address-info-item">
            <label>📋 İl:</label>
            <p>{turkeyAddress.city}</p>
          </div>
        </div>
      )}

      {activeCountry !== 'turkey' && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 14 }}>
          Bu ölkə üçün ünvan məlumatı mövcud deyil.
        </div>
      )}
    </div>
  )
}
