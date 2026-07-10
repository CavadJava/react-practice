# EMAS — Elektron Sosial Müavinət İdarəetmə Sistemi

Bootstrap prototipindən köçürülmüş tam funksional **React admin paneli**.  
Azərbaycanlı dil interfeysi, canlı saat, CRUD əməliyyatları, qrafiklər və rol əsaslı icazə matrisi daxildir.

---

## Texnologiyalar

| Paket | Versiya | Nə üçün |
|---|---|---|
| React | 19 | UI framework |
| React Router | 7 | Səhifə naviqasiyası (nested routes) |
| Zustand | 5 | Qlobal state idarəetməsi |
| Bootstrap | 5.3 | Baza layout, form, utility classlar |
| Bootstrap Icons | 1.13 | Bütün ikonalar |
| Chart.js + react-chartjs-2 | 4 / 5 | Qrafiklər (Customers səhifəsində) |
| Vite | 8 | Build tool / dev server |

---

## Başlamaq

```bash
# 1. Asılılıqları qur
npm install

# 2. Dev server-i işə sal
npm run dev

# 3. Build al
npm run build

# 4. Build-i yerli preview et
npm run preview
```

Dev server standart olaraq **http://localhost:5173** ünvanında açılır  
(port tutulubsa Vite avtomatik olaraq 5174, 5175... kimi növbəti portu seçir).

---

## Səhifə Xəritəsi

| URL | Komponent | Funksiya |
|---|---|---|
| `/` | `pages/Dashboard.jsx` | Əsas panel — statistika, qrafik, bildirişlər, canlı fəaliyyət lenti |
| `/customers` | `pages/Customers.jsx` | Müştəri siyahısı, axtarış, CRUD modalları, 4 Chart.js qrafiyi |
| `/users` | `pages/Users.jsx` | İstifadəçi idarəetməsi, blok/bloku aç, rol badgeları |
| `/roles` | `pages/Roles.jsx` | Rol kartları, icazə matrisi, yeni rol yaratma |
| `/profile` | `pages/Profile.jsx` | Şəxsi məlumatlar, şifrə dəyişmə, fəaliyyət loqu, bildiriş parametrləri |

---

## Layihə Strukturu

```
src/
├── main.jsx                  # Tətbiqin giriş nöqtəsi — Bootstrap + CSS import
├── App.jsx                   # BrowserRouter + bütün route-lar
│
├── assets/
│   └── emas.css              # Bütün CSS — CSS dəyişənləri, sidebar, topbar,
│                             #   kartlar, modallar, cədvəllər, qrafiklər, profil
│
├── components/
│   ├── layout/
│   │   ├── Layout.jsx        # Sidebar + <Outlet /> + footer
│   │   ├── Sidebar.jsx       # Naviqasiya menyusu, alt-menyu açıb-bağlama
│   │   └── Topbar.jsx        # Başlıq, canlı saat, istifadəçi avatarı
│   └── ui/
│       ├── Avatar.jsx        # Baş hərflər avatarı — id-ə görə rəng dövr edir
│       ├── Modal.jsx         # Kontrol edilən modal — Bootstrap JS yoxdur
│       ├── Panel.jsx         # Kart wrapper — başlıq + actions slot
│       ├── StatCard.jsx      # Statistika kartı — dəyər, dəyişim, ikon
│       └── StatusBadge.jsx   # StatusBadge + RoleBadge
│
├── data/
│   ├── menu.js               # MENU massivi — Sidebar üçün bütün bölmə/element/alt-elementlər
│   └── seed.js               # Demo məlumatlar: CUSTOMERS, USERS, MODULES, PERMS, ROLES_SEED
│
├── hooks/
│   └── useClock.js           # Hər saniyə yenilənən canlı saat hook-u
│
├── pages/
│   ├── Dashboard.jsx         # Əsas panel
│   ├── Customers.jsx         # Müştəri idarəetməsi
│   ├── Users.jsx             # İstifadəçi idarəetməsi
│   ├── Roles.jsx             # Rol və icazə idarəetməsi
│   └── Profile.jsx           # İstifadəçi profili
│
└── store/
    ├── auth.js               # useAuthStore — giriş etmiş istifadəçi, 2FA, profil yenilənməsi
    ├── customers.js          # useCustomerStore — CRUD + filtrasiya
    └── users.js              # useUserStore — CRUD + toggleBlock
```

---

## State İdarəetməsi

Zustand istifadə olunur. Hər store öz faylındadır:

**`store/customers.js`** — `useCustomerStore`
```js
const { customers, add, update, remove } = useCustomerStore()
// getFiltered(search, status) — filtrasiya üçün
```

**`store/users.js`** — `useUserStore`
```js
const { users, add, update, remove, toggleBlock } = useUserStore()
```

**`store/auth.js`** — `useAuthStore`
```js
const { user, updateProfile, toggle2fa } = useAuthStore()
```

> **Qeyd:** Store-lar hal-hazırda yalnız yaddaşda saxlanır — səhifəni yeniləyəndə ilkin `seed.js` məlumatlarına qayıdır. Real API inteqrasiyası üçün fetch məntiqini `add` / `update` / `remove` action-larına əlavə etmək kifayətdir.

---

## Sidebar Menyusunu Necə Dəyişmək Olar

Bütün menyu strukturu `src/data/menu.js` faylındadır:

```js
export const MENU = [
  {
    section: 'Bölmə Adı',
    items: [
      {
        id: 'unikal-id',
        icon: 'bi-ikon-adi',     // Bootstrap Icons class adı
        label: 'Menyu Yazısı',
        path: '/route',          // Alt-menyu yoxdursa birbaşa path
        badge: 5,                // İstəyə bağlı — qırmızı rəqəm
        sub: [                   // İstəyə bağlı — alt-menyu elementləri
          { label: 'Alt Element', path: '/route/alt' },
        ],
      },
    ],
  },
]
```

Yeni element əlavə etdikdən sonra mütləq `App.jsx`-ə uyğun `<Route>` əlavə edin.

---

## Yeni Səhifə Əlavə Etmək

1. `src/pages/YeniSehife.jsx` faylı yarat
2. `App.jsx`-də route əlavə et:
   ```jsx
   <Route path="yeni" element={<YeniSehife />} />
   ```
3. `src/data/menu.js`-də menyu elementini əlavə et
4. Komponent daxilindən `<Topbar title="..." crumb="..." />` ilə başla

---

## CSS Arxitekturası

`src/assets/emas.css` — tək paylaşılan stilfayl. CSS dəyişənlər `:root`-da təyin edilib:

```css
:root {
  --sb-bg: #0d3b6e;      /* Sidebar arxa fonu */
  --sb-active: #1565c0;  /* Aktiv menyu elementi */
  --accent: #1565c0;     /* Əsas vurğu rəngi */
  --body-bg: #f0f2f5;    /* Səhifə arxa fonu */
  --radius: 10px;        /* Kart künc radiusu */
}
```

Rəngi dəyişmək üçün yalnız bu dəyişənləri redaktə etmək kifayətdir — bütün interfeys avtomatik uyğunlaşır.

---

## Demo Məlumatlar Haqqında

`src/data/seed.js`-dəki bütün məlumatlar **uydurma**dır:  
azərbaycanlı adlar, saxta FİN kodlar, saxta e-poçt ünvanları.  
Real sistemdə bu faylı API cavabları ilə əvəz edin.

---

## Bootstrap Panel (Prototip)

React applikasiyası yaradılmadan öncə hazırlanmış statik HTML/JS prototip  
`projects/emas/admin-panel-bootstrap/` qovluğundadır.  
Bu fayllara müraciət etmək lazım deyil — yalnız dizayn istinadı kimi saxlanılır.
