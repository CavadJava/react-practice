# 166 Kargo — Müştəri Tərəfi (React App)

**166karqo.az** saytının müştəri tərəfinin React ilə yazılmış versiyası.
Türkiyə, İngiltərə və ABŞ-dan Azərbaycana kargo çatdırılma xidmətinin frontend hissəsidir.

---

## Texnologiyalar

| Texnologiya | Versiya | İstifadə məqsədi |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | Səhifə routing |
| Vite | 8 | Build tool / dev server |
| Pure CSS | — | Stilləmə (Bootstrap yoxdur) |
| Font Awesome | 6.5 (CDN) | İkonlar |
| Google Fonts Inter | — | Şrift (CDN) |

> Heç bir UI kitabxanası (Bootstrap, MUI, Tailwind) işlənməyib.
> Bütün stillər `src/index.css` faylında CSS dəyişənləri ilə idarə olunur.

---

## Başlatma

```bash
# Asılılıqları yüklə
npm install

# Development server-i başlat (http://localhost:5173)
npm run dev

# Production build al
npm run build

# Build-i yerli olaraq yoxla
npm run preview
```

---

## Qovluq strukturu

```
react-customer-side/
├── index.html                  # HTML şablonu (dil: az)
├── src/
│   ├── main.jsx                # React app-ın giriş nöqtəsi
│   ├── App.jsx                 # Router qurulumu — bütün route-lar burada
│   ├── index.css               # Qlobal stillər + CSS dəyişənləri
│   │
│   ├── components/             # Hər səhifədə təkrarlanan komponentlər
│   │   ├── Layout.jsx          # Bütün səhifələri sarır (TopNav + Navbar + Footer)
│   │   ├── TopNav.jsx          # Ən yuxarı mini menyu (FAQ, Bloq, Giriş, Qeydiyyat)
│   │   ├── Navbar.jsx          # Əsas naviqasiya (sticky, mobil hamburger daxil)
│   │   └── Footer.jsx          # Alt hissə (linklər, əlaqə, sosial şəbəkələr)
│   │
│   └── pages/                  # Hər route üçün bir fayl
│       ├── Home.jsx            # Ana səhifə
│       ├── About.jsx           # Haqqımızda
│       ├── Register.jsx        # Qeydiyyat
│       ├── Login.jsx           # Giriş
│       ├── Tarif.jsx           # Tariflər
│       ├── FAQ.jsx             # Tez-tez verilən suallar
│       ├── Blog.jsx            # Xəbərlər / Bloq
│       ├── Branches.jsx        # Filial və məntəqələr
│       ├── Contact.jsx         # Əlaqə
│       └── ExampleShop.jsx     # Nümunə saytlar
```

---

## Səhifələr və route-lar

| URL | Fayl | Məzmun |
|---|---|---|
| `/` | `Home.jsx` | Hero banner + login kartı, bağlama axtarış, tariflər, kalkulyator, necə işləyir, xəbərlər, mağazalar |
| `/about` | `About.jsx` | Şirkət haqqında, statistika kartları, üstünlüklər, komanda |
| `/register` | `Register.jsx` | Tam qeydiyyat forması (hüquqi şəxs toggle-ı, S/V seriya, FİN, məntəqə) + video bölməsi |
| `/login` | `Login.jsx` | E-poçt/şifrə ilə giriş + sosial giriş düymələri |
| `/tarif` | `Tarif.jsx` | 3 ölkə üzrə tab, tam tarif cədvəli, kalkulyator |
| `/faq` | `FAQ.jsx` | Accordion stil FAQ (açıb-bağlanan suallar) |
| `/blog` | `Blog.jsx` | Kateqoriyaya görə filter + bloq kartları |
| `/branches` | `Branches.jsx` | 6 filialın ünvan, telefon, iş saatı kartları |
| `/contact` | `Contact.jsx` | Əlaqə məlumatları + contact form (göndərildikdə success mesajı) |
| `/example-shop` | `ExampleShop.jsx` | 16 mağaza (Türkiyə / ABŞ / İngiltərə filtri ilə) |

---

## Brend rəngləri (CSS dəyişənləri)

Bütün rənglər `src/index.css`-in yuxarısında `:root` blokunda təyin edilib.
Rəng dəyişdirmək lazım olarsa **yalnız bu faylı** redaktə etmək kifayətdir.

```css
:root {
  --brand-yellow:      #f8c325;   /* Əsas sarı — düymələr, vurğular */
  --brand-yellow-dark: #e0ae1b;   /* Hover vəziyyəti üçün tünd sarı */
  --brand-blue:        #0056b3;   /* Linklər, aktiv elementlər */
  --brand-dark:        #1a1a1a;   /* Logo, başlıqlar */
  --bg-light:          #fdfcf7;   /* Hero arxa fon */
  --text-muted:        #6c757d;   /* İkincil mətn */
  --input-bg:          #f8f9fa;   /* Form sahəsi arxa fonu */
}
```

---

## Yeni səhifə əlavə etmək

**Addım 1.** `src/pages/` qovluğunda yeni fayl yarat, məs. `Orders.jsx`:

```jsx
export default function Orders() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>Sifarişlərim</h1>
          <p>Alt başlıq</p>
        </div>
      </div>

      <section style={{ padding: '60px 0' }}>
        <div className="container">
          {/* məzmun */}
        </div>
      </section>
    </>
  )
}
```

**Addım 2.** `src/App.jsx`-də route əlavə et:

```jsx
import Orders from './pages/Orders'

// <Routes> içinə:
<Route path="orders" element={<Orders />} />
```

**Addım 3.** `src/components/Navbar.jsx`-də link əlavə et:

```jsx
<li><NavLink to="/orders" onClick={() => setOpen(false)}>Sifarişlərim</NavLink></li>
```

---

## Hazır CSS klass-ları

Tez-tez istifadə olunan klass-lar — yeni komponent yazarkən bunlardan istifadə et:

```
.container          → Mərkəzləşdirilmiş ən geniş 1140px wrapper
.btn-yellow         → Əsas sarı düymə
.form-control       → Input sahəsi (focus-da sarı kənar)
.form-select        → Select element stili
.form-label         → Label stili
.form-row           → 2 sütunlu form sırası (mobilde 1 sütuna düşür)
.page-hero          → Daxili səhifələrin sarı gradient başlıq bölməsi
.rate-card          → Tarif kartı (bayraq + qiymət sətirləri)
.news-card          → Xəbər kartı (hover-da yuxarı qalxır)
.branch-card        → Filial məlumat kartı
.section-header     → Başlıq + "Hamısını gör" link (sağda)
.search-box         → Bağlama axtarış inputu + düymə
```

---

## Backend inteqrasiyası üçün qeydlər

Hazırda bütün məlumatlar `pages/*.jsx` faylları içindəki sabit `const` massivlərindən gəlir.
Real API bağlandıqda aşağıdakı yerlər əvəz edilməlidir:

| Fayl | Dəyişdirilməli yer | Necə |
|---|---|---|
| `Home.jsx` | `RATES`, `NEWS` | `useEffect` + `fetch` |
| `Blog.jsx` | `POSTS` | `useEffect` + `fetch` |
| `Branches.jsx` | `BRANCHES` | `useEffect` + `fetch` |
| `ExampleShop.jsx` | `SHOPS` | `useEffect` + `fetch` |
| `Tarif.jsx` | `COUNTRIES`, `CALC_RATES` | `useEffect` + `fetch` |
| `Register.jsx` | `handleSubmit` funksiyası | `POST /api/register` |
| `Login.jsx` | `handleSubmit` funksiyası | `POST /api/login` → token saxla |
| `Contact.jsx` | `handleSubmit` funksiyası | `POST /api/contact` |

Nümunə — məlumat çəkməyin sadə yolu:

```jsx
import { useState, useEffect } from 'react'

const [data, setData] = useState([])

useEffect(() => {
  fetch('/api/branches')
    .then(r => r.json())
    .then(setData)
}, [])
```

---

## Referans prototiplər

`../bootstrap/` qovluğunda bu React app-ın ilkin HTML/Bootstrap prototipləri var:

| Fayl | Məzmun |
|---|---|
| `indexv1.html` | Ana səhifənin ilk variantı |
| `indexv2.html` | Tam versiya (xəbərlər, mağazalar, footer daxil) |
| `register.html` | Qeydiyyat forması |

Bu fayllar **yalnız referans** üçün saxlanılıb, aktiv istifadə edilmir.

---

## Bilinən məhdudiyyətlər / TODO

- [ ] Login/Register backend-ə bağlanmayıb (auth yoxdur)
- [ ] Bağlama izləmə işləmir (search box yalnız UI-dır)
- [ ] Kalkulyator sabit dəyərlərlə işləyir (real tariflər API-dan gəlməlidir)
- [ ] Hero banner-də şəkil yoxdur (gradient placeholder istifadə olunur)
- [ ] Xəbər kartlarında real şəkil yoxdur (gradient placeholder istifadə olunur)
- [ ] Dil seçimi (AZ/EN/RU) hələ işlənməyib

---

## Əlaqə

Layihə ilə bağlı suallar üçün: **info@166karqo.az**
