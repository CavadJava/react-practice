import { Link } from 'react-router-dom'

const STATS = [
  { value: '50,000+', label: 'Məmnun Müştəri' },
  { value: '3', label: 'Ölkə' },
  { value: '7+', label: 'İl Təcrübə' },
  { value: '6', label: 'Filial' },
  { value: '99%', label: 'Müştəri Məmnuniyyəti' },
  { value: '7/12', label: 'Dəstək Xidməti' },
]

const TEAM = [
  { name: 'Elnur Əliyev', role: 'Baş Direktor', emoji: '👨‍💼' },
  { name: 'Nigar Hüseynova', role: 'Müştəri Xidmətləri', emoji: '👩‍💼' },
  { name: 'Tural Quliyev', role: 'Logistika Meneceri', emoji: '👨‍💼' },
  { name: 'Aytən Məmmədova', role: 'Maliyyə', emoji: '👩‍💼' },
]

export default function About() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Haqqımızda</h1>
          <p>166 Kargo — Türkiyə, İngiltərə və ABŞ-dan Azərbaycana etibarlı çatdırılma</p>
        </div>
      </div>

      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-img">🚚</div>
            <div className="about-text">
              <h2>Biz kimik?</h2>
              <p>
                166 Kargo 2018-ci ildən fəaliyyət göstərən, Azərbaycanlı müştərilərə Türkiyə, İngiltərə və ABŞ-dan
                yüksək keyfiyyətli daşıma xidməti göstərən kargo şirkətidir.
              </p>
              <p>
                Missiyamız — hər bir müştəriyə sürətli, etibarlı və əlçatan qiymətlərlə beynəlxalq alış-veriş
                imkanı yaratmaqdır. Ölkə daxilindəki 6 filialımız vasitəsilə Azərbaycanın hər yerindən xidmətimizə
                çatmaq mümkündür.
              </p>
              <p>
                Müasir anbar infrastrukturumuz, peşəkar komandamız və rəqəmsal izləmə sistemimiz sayəsində
                bağlamanız sizi hər addımda məlumatlandırır.
              </p>
              <Link to="/register" className="btn-yellow" style={{ display: 'inline-block', marginTop: 8 }}>
                İndi qeydiyyatdan keç
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            {STATS.map(s => (
              <div className="stat-card" key={s.label}>
                <h3>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0', background: '#f8f9fa' }}>
        <div className="container">
          <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 12 }}>Niyə 166 Kargo?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 15 }}>Müştərilərimizin bizi seçməsinin əsas səbəbləri</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { icon: 'fa-bolt', title: 'Sürətli Çatdırılma', desc: 'Türkiyədən 3–5 gün, ABŞ-dan 7–10 gün, İngiltərədən 5–8 gün ərzində.' },
              { icon: 'fa-shield-halved', title: 'Sığortalı Daşıma', desc: 'Bütün bağlamalar sığortalıdır. İtki halında tam kompensasiya.' },
              { icon: 'fa-tag', title: 'Münasib Qiymətlər', desc: 'Bazardakı ən rəqabətli tariflər. Gizli ödəniş yoxdur.' },
              { icon: 'fa-location-dot', title: 'Onlayn İzləmə', desc: 'Bağlamanızın hər addımını real vaxt rejimində izləyin.' },
              { icon: 'fa-headset', title: '7/12 Dəstək', desc: 'Peşəkar müştəri xidmətləri komandası hər zaman hazırdır.' },
              { icon: 'fa-building', title: '6 Filial', desc: 'Bakı, Sumqayıt, Gəncə, Lənkəran və digər şəhərlərdə.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #eee' }}>
                <div style={{ width: 50, height: 50, background: '#fff9e6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-yellow-dark)', fontSize: 22, marginBottom: 14 }}>
                  <i className={`fa-solid ${f.icon}`} />
                </div>
                <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <h3 style={{ fontWeight: 700, fontSize: 24, marginBottom: 12 }}>Komandamız</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36, fontSize: 15 }}>Sizi xoşbəxt etmək üçün çalışan insanlar</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {TEAM.map(t => (
              <div key={t.name} style={{ textAlign: 'center', background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #eee' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{t.emoji}</div>
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
