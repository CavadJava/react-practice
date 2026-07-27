# Data modeli — `src/data/cargo.ts`

`#types` `#seed-data`

15 sətirlik kiçik fayldır, amma bütün modulun tip sistemi buradan başlayır.

## İxrac olunanlar

```ts
export type CargoCompany = {
  id: string;
  name: string;
  url: string;
  icon: string;   // emoji, məs. '📦'
  color: string;  // hex string, məs. '#2F8FE0'
};

export const DEFAULT_CARGO_COMPANIES: CargoCompany[] = [
  { id: '166karqo', name: '166 Karqo', url: 'https://166karqo.az/', icon: '📦', color: '#2F8FE0' },
  { id: 'elpost',   name: 'Elpost',    url: 'https://www.elpost.az/', icon: '📮', color: '#E0632F' },
];
```

## `CargoCompany` haradan istifadə olunur?

- [`CargoCompaniesContext`](03-companies-context.md) — CRUD state-inin element tipi.
- [`CargoAccountsContext`](04-accounts-context.md) — `CargoAccount.companyId` bu tipin `id`-sinə istinad edir (foreign key kimi, amma DB yoxdur, sadəcə string müqayisəsidir).
- [`CargoScreen`](07-cargo-screen.md) — şirkət grid-i, şirkət CRUD formu (`editingCompany: CargoCompany | 'new' | null`).
- [`CargoWebViewOverlay`](08-webview-overlay.md) — `company.url` → `WebView source`, `company.color` → aktiv tab-ın border rəngi, `company.icon` → tab chip-i.

## `DEFAULT_CARGO_COMPANIES` niyə var, harada işlədilir?

Bu, **yalnız ilk açılış üçün seed data**-dır:

1. `CargoCompaniesContext` `AsyncStorage`-da heç nə tapmadıqda bu massivi
   yazır və state-ə qoyur (bax [03-companies-context.md](03-companies-context.md)).
2. `CargoAccountsContext`-in `seedAccounts()` funksiyası da bu massiv üzərində
   `flatMap` edərək hər şirkət üçün 3 boş hesab (`İstifadəçi 1/2/3`) yaradır
   (bax [04-accounts-context.md](04-accounts-context.md)).

**`#gotcha`**: `DEFAULT_CARGO_COMPANIES`-i dəyişmək **mövcud istifadəçilərin
storage-ına təsir etmir** — çünki storage-da artıq məlumat varsa, bu massiv
heç oxunmur belə. Yəni "default siyahını yeniləmək" production-da effekt
verməyəcək, yalnız təzə install-larda görünəcək.

## Yeni sahə (field) əlavə etmək istəsəniz

`CargoCompany`-yə yeni sahə (məs. `trackingUrlPattern: string`) əlavə etmək
istəsəniz, aşağıdakı yerləri yoxlayın:

- `DEFAULT_CARGO_COMPANIES` seed massivi — yeni sahə üçün dəyər verilməlidir.
- `CargoScreen`-dəki şirkət formu (`formCompanyName`, `formCompanyUrl`,
  `formCompanyIcon`, `formCompanyColor` state-ləri) — yeni sahə üçün analoji
  `useState` + `TextInput`/seçici əlavə olunmalıdır.
- `CargoCompaniesContext.addCompany`/`updateCompany` tipləri
  (`Omit<CargoCompany, 'id'>`) avtomatik yenilənəcək, əlavə iş tələb olunmur.

`#gotcha`: `AsyncStorage`-da **köhnə formatda saxlanmış** obyektlərdə yeni
sahə olmayacaq (`undefined` gələcək) — `EnglishNotesContext`-də olduğu kimi
bir **migration** məntiqi yazmasanız, tətbiqin köhnə istifadəçilərində bu
sahə boş qalacaq. Kargo context-lərinin heç birində hazırda migration yoxdur
— sadə tip dəyişikliyi edərkən bunu nəzərə alın.
