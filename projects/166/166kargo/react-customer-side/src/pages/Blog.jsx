import { useState } from 'react'

const POSTS = [
  { id: 1, title: 'Smart customs-da yenilik var!', date: '03 iyun, 2026', bg: 'linear-gradient(135deg,#f6d365,#fda085)', label: 'Smart Customs', cat: 'Yeniliklər', excerpt: 'Azərbaycan Dövlət Gömrük Komitəsi Smart Customs sistemini yenilədi. Elektron bəyannamə prosesi daha da sürətləndi.' },
  { id: 2, title: 'Trendyolda böyük endirim fürsəti başladı!', date: '06 may, 2026', bg: 'linear-gradient(135deg,#f8c325,#ee7b12)', label: 'Trendyol', cat: 'Kampaniya', excerpt: 'Trendyol-un illik böyük satışı başladı. Elektronika, geyim və ev əşyalarında 70%-ə qədər endirim.' },
  { id: 3, title: 'Amerikadan həftədə 2 dəfə çatdırılma!', date: '05 may, 2026', bg: 'linear-gradient(135deg,#203a43,#2c5364)', label: 'Amerika', cat: 'Xəbər', excerpt: 'ABŞ-dan sifariş eləyənlər üçün xoş xəbər: indi həftədə 2 uçuş ilə çatdırılma mövcuddur.' },
  { id: 4, title: 'Amazon Prime Day sifarişlərini necə verək?', date: '20 aprel, 2026', bg: 'linear-gradient(135deg,#a1c4fd,#c2e9fb)', label: 'Amazon', cat: 'Bələdçi', excerpt: 'Amazon Prime Day-də ən yaxşı endirimlər necə tapılır? Addım-addım alış-veriş bələdçisi.' },
  { id: 5, title: 'Türkiyə anbar ünvanınız yeniləndi', date: '15 aprel, 2026', bg: 'linear-gradient(135deg,#d4fc79,#96e6a1)', label: 'Türkiyə', cat: 'Yeniliklər', excerpt: 'Türkiyə anbarımız daha böyük məkana köçürüldü. Yeni ünvanı şəxsi kabinetinizdən yoxlayın.' },
  { id: 6, title: 'Qeydiyyat bonusu — 5 AZN hədiyyə!', date: '01 aprel, 2026', bg: 'linear-gradient(135deg,#ffecd2,#fcb69f)', label: 'Kampaniya', cat: 'Kampaniya', excerpt: 'İlk dəfə qeydiyyatdan keçən müştərilərimizə 5 AZN hesab bonusu verilir. Tələsin!' },
]

const CATS = ['Hamısı', 'Xəbər', 'Kampaniya', 'Yeniliklər', 'Bələdçi']

export default function Blog() {
  const [activeCat, setActiveCat] = useState('Hamısı')

  const filtered = activeCat === 'Hamısı' ? POSTS : POSTS.filter(p => p.cat === activeCat)

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Xəbərlər və Yeniliklər</h1>
          <p>166 Kargo-nun son xəbərləri, kampaniyalar və faydalı bələdçilər</p>
        </div>
      </div>

      <section className="blog-section">
        <div className="container">
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
                {cat}
              </button>
            ))}
          </div>

          <div className="blog-grid">
            {filtered.map(post => (
              <div className="blog-card" key={post.id}>
                <div className="blog-card-img" style={{ background: post.bg }}>{post.label}</div>
                <div className="blog-card-body">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ background: '#f0f6ff', color: 'var(--brand-blue)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{post.cat}</span>
                    <span className="blog-date">{post.date}</span>
                  </div>
                  <div className="blog-card-title">{post.title}</div>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <a href="#" style={{ fontSize: 13, color: 'var(--brand-blue)', fontWeight: 600, marginTop: 10, display: 'inline-block' }}>
                    Daha çox ox &rsaquo;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
