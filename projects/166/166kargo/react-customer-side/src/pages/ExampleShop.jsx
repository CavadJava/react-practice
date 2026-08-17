import { useState } from 'react'

const SHOPS = [
  { name: 'Trendyol', country: 'TR', emoji: '🛍️', desc: 'Türkiyənin ən böyük e-ticarət platforması', url: 'https://trendyol.com', cat: 'Türkiyə' },
  { name: 'Hepsiburada', country: 'TR', emoji: '📦', desc: 'Elektronika, geyim, ev əşyaları', url: 'https://hepsiburada.com', cat: 'Türkiyə' },
  { name: 'DeFacto', country: 'TR', emoji: '👗', desc: 'Münasib qiymətli moda markası', url: 'https://defacto.com.tr', cat: 'Türkiyə' },
  { name: 'KOTON', country: 'TR', emoji: '👔', desc: 'Türk moda brendinin rəsmi saytı', url: 'https://koton.com', cat: 'Türkiyə' },
  { name: 'LC Waikiki', country: 'TR', emoji: '🧥', desc: 'Ailə üçün məqbul qiymətli geyim', url: 'https://lcwaikiki.com', cat: 'Türkiyə' },
  { name: 'gittigidiyor', country: 'TR', emoji: '🏷️', desc: 'Türkiyənin ikinci əl bazarı', url: 'https://gittigidiyor.com', cat: 'Türkiyə' },
  { name: 'Amazon US', country: 'US', emoji: '🌎', desc: 'Dünyanın ən böyük onlayn mağazası', url: 'https://amazon.com', cat: 'ABŞ' },
  { name: 'eBay', country: 'US', emoji: '🔨', desc: 'Onlayn hərrac və alış-veriş', url: 'https://ebay.com', cat: 'ABŞ' },
  { name: 'Walmart', country: 'US', emoji: '🏪', desc: 'ABŞ-ın ən böyük pərakəndə ticarəti', url: 'https://walmart.com', cat: 'ABŞ' },
  { name: 'Target', country: 'US', emoji: '🎯', desc: 'Elektronika, geyim, ev, oyuncaq', url: 'https://target.com', cat: 'ABŞ' },
  { name: 'Nike', country: 'US', emoji: '👟', desc: 'Rəsmi Nike US mağazası', url: 'https://nike.com', cat: 'ABŞ' },
  { name: 'Apple', country: 'US', emoji: '🍎', desc: 'iPhone, iPad, MacBook və s.', url: 'https://apple.com', cat: 'ABŞ' },
  { name: 'ASOS', country: 'GB', emoji: '✨', desc: 'İngiltərənin moda e-ticarət nəhəngi', url: 'https://asos.com', cat: 'İngiltərə' },
  { name: 'Amazon UK', country: 'GB', emoji: '🇬🇧', desc: 'Amazon-un İngiltərə saytı', url: 'https://amazon.co.uk', cat: 'İngiltərə' },
  { name: 'Next', country: 'GB', emoji: '🛒', desc: 'İngilis moda və ev əşyaları', url: 'https://next.co.uk', cat: 'İngiltərə' },
  { name: 'Marks & Spencer', country: 'GB', emoji: '🧣', desc: 'Keyfiyyətli geyim və ərzaq', url: 'https://marksandspencer.com', cat: 'İngiltərə' },
]

const CATS = ['Hamısı', 'Türkiyə', 'ABŞ', 'İngiltərə']
const FLAG = { TR: '🇹🇷', US: '🇺🇸', GB: '🇬🇧' }

export default function ExampleShop() {
  const [activeCat, setActiveCat] = useState('Hamısı')

  const filtered = activeCat === 'Hamısı' ? SHOPS : SHOPS.filter(s => s.cat === activeCat)

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Nümunə Saytlar</h1>
          <p>Bu saytlardan sifariş edib 166 Kargo ilə Azərbaycana çatdıra bilərsiniz</p>
        </div>
      </div>

      <section className="example-shop-section">
        <div className="container">
          <div style={{ background: '#f0f6ff', borderRadius: 12, padding: '16px 20px', marginBottom: 32, border: '1px solid #bdd7f5', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <i className="fa-solid fa-lightbulb" style={{ color: 'var(--brand-blue)', fontSize: 18, marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: 14, color: '#333' }}>Necə sifariş edəcəksiniz?</strong>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Qeydiyyatdan keçdikdən sonra sizə verilən anbar ünvanını seçdiyiniz saytda çatdırılma ünvanı kimi daxil edin.
                Sifariş etməkdə çətinlik çəkirsinizsə, linki bizə göndərin — biz sizin üçün sifariş edək.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            {CATS.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  padding: '8px 18px', borderRadius: 30,
                  border: `2px solid ${cat === activeCat ? 'var(--brand-yellow)' : '#eee'}`,
                  background: cat === activeCat ? '#fff9e6' : '#fff',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat === 'Türkiyə' && '🇹🇷 '}
                {cat === 'ABŞ' && '🇺🇸 '}
                {cat === 'İngiltərə' && '🇬🇧 '}
                {cat}
              </button>
            ))}
          </div>

          <div className="shops-grid">
            {filtered.map(shop => (
              <a key={shop.name} href={shop.url} target="_blank" rel="noreferrer" className="shop-card" style={{ textDecoration: 'none' }}>
                <div className="shop-icon">{shop.emoji}</div>
                <div className="shop-name">{shop.name}</div>
                <div className="shop-country">{shop.desc}</div>
                <div className="country-badge">
                  {FLAG[shop.country]} {shop.cat}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
