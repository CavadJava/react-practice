import { useState } from 'react'

const FAQS = [
  {
    q: 'Qeydiyyatdan keçmək üçün nə lazımdır?',
    a: 'Qeydiyyat üçün adınız, soyadınız, e-poçt ünvanınız, telefon nömrəniz, şəxsiyyət vəsiqənizin seriya nömrəsi və FİN kodunuz lazımdır. Qeydiyyat tamamen pulsuzdur.',
  },
  {
    q: 'Türkiyə anbarının ünvanını necə əldə edə bilərəm?',
    a: 'Qeydiyyatdan keçdikdən sonra şəxsi kabinetinizə daxil olun. Orada Türkiyə, ABŞ və İngiltərə anbar ünvanları avtomatik olaraq sizə təyin edilir.',
  },
  {
    q: 'Bağlamam nə vaxt Azərbaycana çatacaq?',
    a: 'Türkiyədən bağlamalar anbarımıza daxil olduqdan 3-5 iş günü ərzində çatdırılır. ABŞ-dan 7-10 iş günü, İngiltərədən isə 5-8 iş günü çəkir.',
  },
  {
    q: 'Gömrük rüsumu nə qədərdir?',
    a: 'Azərbaycan qanunvericiliyinə əsasən, 300 AZN-ə qədər olan sifarişlər gömrük vergisindən azaddır. Bu həddən artıq olan sifarişlər üçün müvafiq gömrük rüsumları tətbiq edilir.',
  },
  {
    q: 'Bağlamanı evinizə çatdıra bilərsinizmi?',
    a: 'Bəli, Bakı daxilində ev çatdırılması xidməti mövcuddur. Xidmət haqqı bağlamanın çəkisinə görə dəyişir. Ofisimizdən şəxsən də götürə bilərsiniz.',
  },
  {
    q: 'Nə cür məhsullar sifariş edə bilərəm?',
    a: 'Qadağan edilmiş mallar (silah, narkotik, partlayıcı və s.) istisna olmaqla, demək olar ki, bütün məhsulları sifariş edə bilərsiniz. Çatdırılması qadağan olan məhsulların siyahısı ilə əlaqə vasitəsilə tanış ola bilərsiniz.',
  },
  {
    q: 'Sifariş etməyi bacarmıramsa, siz edə bilərsinizmi?',
    a: 'Bəli! Məhsulun linkini, rəngini, ölçüsünü bizə göndərin. Bank kartı ilə ödəniş həyata keçirin, biz sizin üçün sifariş edək. Xidmət haqqı tətbiq edilir.',
  },
  {
    q: 'Bağlamam gömrükdə qaldı, nə etməliyəm?',
    a: 'Bizim mütəxəssislərimiz gömrük prosesi ilə bağlı sizə kömək edəcəklər. *0166 nömrəsinə zəng edin və ya ofisimizə gəlin.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  const toggle = i => setOpen(open === i ? null : i)

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Tez-tez verilən suallar</h1>
          <p>Ən çox soruşulan sualların cavablarını burada tapın</p>
        </div>
      </div>

      <section className="faq-section">
        <div className="container">
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div className="faq-item" key={i}>
                <button
                  className={`faq-question${open === i ? ' open' : ''}`}
                  onClick={() => toggle(i)}
                >
                  {faq.q}
                  <i className={`fa-solid ${open === i ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: 12, flexShrink: 0 }} />
                </button>
                {open === i && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 50, padding: 30, background: 'linear-gradient(135deg,#fdf4cd,#fff7d6)', borderRadius: 16, maxWidth: 800 }}>
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Cavabınızı tapa bilmədiniz?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Bizimlə əlaqə saxlayın, ən qısa zamanda cavab verərik.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="tel:*0166" className="btn-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <i className="fa-solid fa-phone" /> *0166
              </a>
              <a href="mailto:info@166karqo.az" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', border: '2px solid #ddd', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#333' }}>
                <i className="fa-solid fa-envelope" /> info@166karqo.az
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
