# 166 Cargo — Customer Panel (react-customer-admin-side)

Müştəri tərəfindən istifadə olunan şəxsi kabinet interfeysi.  
166kargo.az saytının daxil olduqdan sonra açılan panel.  
React + Vite ilə qurulub, backend yoxdur — hazırda bütün data `src/data/mockData.js`-dədir.

---

## Texnologiyalar

| Paket | Versiya | Nə üçün |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | Client-side routing |
| Vite | 8 | Build tool / dev server |

CSS framework yoxdur. Bütün stillər `src/index.css`-dədir, CSS custom properties (variables) ilə idarə olunur.

---

## Layihəni işə salmaq

```bash
# Asılılıqları quraşdır
npm install

# Dev server-i başlat (http://localhost:5173)
npm run dev

# Production build
npm run build

# Build-i yoxlamaq
npm run preview
```

---

## Qovluq strukturu

```
src/
├── main.jsx                  # React root, BrowserRouter buradadır
├── App.jsx                   # Bütün route-lar buradadır
├── index.css                 # Tək CSS faylı — bütün stillər buradadır
│
├── data/
│   └── mockData.js           # Bütün saxta data (istifadəçi, sifarişlər, ünvanlar)
│
├── components/
│   ├── Layout.jsx            # Header + Sidebar + <Outlet> — bütün səhifələri əhatə edir
│   ├── Header.jsx            # İki sıralı header + istifadəçi dropdown menyu
│   └── Sidebar.jsx           # Sol panel: istifadəçi kartı, düymələr, nav links + SVG ikonlar
│
└── pages/
    ├── Packages.jsx          # /            → Bağlamalarım (əsas dashboard)
    ├── Addresses.jsx         # /addresses   → Xaricdəki ünvanlarım
    ├── Profile.jsx           # /profile     → Şəxsi məlumatlar
    ├── Balance.jsx           # /balance     → Daşınma balansı
    ├── Debts.jsx             # /debts       → Borclarım
    ├── Queries.jsx           # /queries     → Sorğular
    ├── Courier.jsx           # /courier     → Kuryer sifarişi
    └── Post.jsx              # /post        → Azərpoçt
```

---

## Route xəritəsi

```
/                →  Packages   — aktiv bağlamalar + sifariş tarixçəsi cədvəli
/addresses       →  Addresses  — Türkiyə / ABŞ / İngiltərə / Çin / İspanya ünvanları
/profile         →  Profile    — şəxsi məlumat formu + şifrə yeniləmə
/balance         →  Balance    — balans kartı, balans artırma, tarixçə
/debts           →  Debts      — borc cədvəli
/queries         →  Queries    — sorğu yarat / mənim sorğularım
/courier         →  Courier    — kuryer sifarişi formu (tabbed)
/post            →  Post       — Azərpoçt çatdırılma formu (tabbed)
```

Bilinməyən route avtomatik `/`-ə yönləndirilir (`<Navigate to="/" replace />`).

---

## Layout necə işləyir

Bütün səhifələr eyni `Layout` komponentini paylaşır:

```
<Layout>
  <Header />          ← sticky, yuxarıda
  <Sidebar />         ← sol, sabit en (272px)
  <Outlet />          ← aktiv səhifənin komponenti buraya render olur
</Layout>
```

Sidebar-dakı `NavLink`-lər React Router-in `isActive`-indən istifadə edərək aktiv linki sarı rəngdə göstərir.  
Header-dakı user dropdown menyu da eyni route-lara link verir.

---

## Stillər haqqında

Tək CSS faylı (`src/index.css`) istifadə olunur. Əsas dəyişənlər:

```css
:root {
  --primary: #F5A300;       /* sarı — düymələr, aktiv nav, vurğular */
  --primary-dark: #DC9200;  /* hover vəziyyəti */
  --green: #28a745;         /* "Balansı artır" düyməsi */
  --red-link: #C62828;      /* OSS- tracking linklər */
  --bg: #f2f4f6;            /* səhifə fonu */
  --sidebar-width: 272px;
}
```

Rəng dəyişdirmək lazım olsa — yalnız bu dəyişənləri yeniləmək kifayətdir.

---

## Mock data (`src/data/mockData.js`)

Hazırda bütün data statikdir. Real API qoşulanda əvəz olunacaq:

| Export | Nə saxlayır |
|---|---|
| `user` | Aktiv istifadəçinin bütün məlumatları |
| `orderHistory` | Sifariş tarixçəsi cədvəlinin sətirləri |
| `turkeyAddress` | Türkiyə anbar ünvanı |
| `branches` | Kuryer sifarişi üçün Bakı rayonları |
| `regions` | Azərpoçt üçün rayonlar + qiymətlər |
| `balanceHistory` | Balans tarixçəsi (hazırda boş array) |
| `debts` | Borclar (hazırda boş array) |

---

## Komponent qeydləri

### Header.jsx
- İki hissəlidir: `header-top` (FAQ / Əlaqə / user) + `header-nav` (logo / menyu / telefon)
- User dropdown `useRef` + `useEffect` ilə kənar klik edildikdə bağlanır
- `useLocation` import edilib amma hazırda istifadə olunmur — silmək olar

### Sidebar.jsx
- SVG ikonlar komponent olaraq faylın altında təyin edilib (function declarations, hoisted olur)
- `Daşınma balansı` düyməsi `<Link>` ilə `/balance`-ə aparır, digər iki düymə hazırda handler-sızdir

### Packages.jsx
- Checkbox seçimi lokal `useState`-də saxlanır, real ödəniş loqikası yoxdur
- Promokod input-u da hazırda yalnız UI-dır

### Profile.jsx
- Toggle switch CSS-onlydır (`toggle` + `toggle-slider` class-ları ilə)
- `Yenilə` və `Şifrəni yenilə` düymələrinin submit handler-i yoxdur

### Queries.jsx
- `SORĞU YARAT` bölməsi default açıq gəlir (`useState(true)`)
- Fayl yükləmə sahəsi yalnız UI-dır, `<input type="file">` bağlı deyil

---

## API inteqrasiyası üçün başlanğıc nöqtələri

Real backend qoşulanda aşağıdakı addımlar atacaqsınız:

1. `src/data/mockData.js`-i sil və ya API çağırışlarına əvəz et
2. Hər səhifəyə `useEffect` + `fetch`/`axios` əlavə et
3. `Profile.jsx` formunun `Yenilə` düyməsinə submit handler yaz
4. `Packages.jsx`-dəki ödəniş düymələrinə (`Kartla ödə`, `Balansdan ödə`) handler yaz
5. `Balance.jsx`-dəki `Balansı artır` düyməsini ödəniş gateway-inə bağla
6. Header-dəki `Çıxış` düyməsinə logout loqikası yaz (token təmizlə, `/login`-ə yönləndir)

---

## Mühit

Node.js 18+ tələb olunur. Başqa system dependency yoxdur.
