# Companies Context — `src/context/CargoCompaniesContext.tsx`

`#context` `#crud` `#async-storage`

## Məqsəd

Kargo şirkətlərinin (166 Karqo, Elpost, istifadəçinin əlavə etdiyi hər hansı
başqa şirkət) siyahısını idarə edir: oxu, əlavə et, redaktə et, sil —
hamısı `AsyncStorage`-a fiziki yazılır.

## Storage açarı

```ts
const STORAGE_KEY = 'teslahubs_cargo_companies';
```

`#gotcha`: Bu açarı dəyişsəniz, mövcud istifadəçilər öz saxladıqları
şirkətləri **itirər** (yeni açarla storage boş görünəcək, seed data yenidən
yazılacaq). Açarı yalnız qəsdən "bütün istifadəçiləri sıfırla" istəyirsinizsə
dəyişin.

## İxrac olunan tip

```ts
type CargoCompaniesContextValue = {
  companies: CargoCompany[];
  getCompany: (id: string) => CargoCompany | undefined;
  addCompany: (company: Omit<CargoCompany, 'id'>) => void;
  updateCompany: (id: string, company: Omit<CargoCompany, 'id'>) => void;
  removeCompany: (id: string) => void;
};
```

Hook: `useCargoCompanies()` — `CargoCompaniesProvider`-dən kənarda çağırılsa
`throw new Error('useCargoCompanies must be used within CargoCompaniesProvider')`
atır. Bu, "səssiz undefined" xətaları əvəzinə inkişaf zamanı **dərhal**
aşkar olunan xəta almaq üçün standart pattern-dir (bütün Kargo context-ləri
eyni pattern-i işlədir).

## `persist()` — yazma qatının ürəyi

```ts
const persist = (updater: (prev: CargoCompany[]) => CargoCompany[]) => {
  setCompanies(prev => {
    const next = updater(prev);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  });
};
```

Bu, tətbiqdəki **bütün** AsyncStorage-backed context-lərin (Companies,
Accounts, EnglishNotes, MyPlaces və s.) ortaq pattern-idir: React state-i
yeniləyən funksional `setState` callback-i içində, eyni zamanda yeni
dəyəri `AsyncStorage`-a da yazır. Beləliklə state və storage **heç vaxt
sinxronsuz olmur** — hər dəyişiklikdən sonra ikisi də eyni andadır.

`addCompany`/`updateCompany`/`removeCompany` hamısı bu `persist()`-i
çağırır, birbaşa `setCompanies` işlətmir.

## İlk yükləmə (`useEffect`)

```ts
useEffect(() => {
  AsyncStorage.getItem(STORAGE_KEY).then(stored => {
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompanies(parsed);
          return;
        }
      } catch { /* ignore malformed storage */ }
    }
    setCompanies(DEFAULT_CARGO_COMPANIES);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARGO_COMPANIES));
  });
}, []);
```

Axın:

1. Storage-da nə isə varsa və o `JSON.parse` ilə düzgün array-ə çevrilirsə → onu istifadə et.
2. Storage boşdursa **və ya** parse xətası olarsa (korlanmış data) → seed data-ya (`DEFAULT_CARGO_COMPANIES`) qayıt, dərhal storage-a da yaz.

`#gotcha`: `catch` bloku boşdur (`// ignore malformed storage`) — yəni
korlanmış JSON səssizcə seed data ilə **əvəz olunur**, istifadəçiyə heç bir
xəbərdarlıq göstərilmir. Debug edərkən "niyə mənim şirkətlərim sıfırlandı"
sualının cavabı çox vaxt budur — `AsyncStorage`-a əl ilə səhv format
yazılıbsa (məs. manual test zamanı), bu path işə düşür.

## `getCompany` — O(n) axtarış

```ts
getCompany: id => companies.find(c => c.id === id),
```

Hər çağırışda tam siyahı üzərində xətti axtarış edir. Şirkət sayı çox az
olduğu üçün (adətən 2-10 arası) performans problemi yaratmır, amma minlərlə
şirkət olsaydı `Map`-ə keçirmək lazım olardı.

## Çağırıldığı yerlər

- `CargoScreen.tsx` — `companies` (grid render), `getCompany` (picker başlığı üçün), `addCompany`/`updateCompany` (şirkət formu), `removeCompany` (silmə təsdiqi).
- `CargoWebViewOverlay.tsx` — `getCompany` (aktiv tab-ın URL/rəng/ikonunu tapmaq üçün, hər sessiya `CargoAccount.companyId` vasitəsilə şirkətə bağlıdır).

## Yeni funksionallıq əlavə edərkən

Əgər "şirkətləri sırala" və ya "şirkəti axtarışla filtrlə" kimi funksiya
əlavə etmək istəsəniz, bunu bu context-in **daxilində** (`value` obyektinə
yeni funksiya əlavə edərək) edin, `CargoScreen`-də lokal state ilə yox —
beləliklə məntiq bir yerdə qalır və gələcəkdə başqa ekranlar da (məs. axtarış
modalı) eyni funksiyanı yenidən yaza bilmədən istifadə edə bilər.
