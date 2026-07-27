# Accounts Context — `src/context/CargoAccountsContext.tsx`

`#context` `#crud` `#async-storage` `#security`

## Məqsəd

Hər şirkətə aid **hesabların** (istifadəçi adı/şifrə cütlüklərinin) CRUD-unu
idarə edir. Bir şirkətin bir neçə hesabı ola bilər (məs. öz hesabınız, ailə
üzvünün hesabı) — bunlar Kargo modulunda "tab" kimi paralel açıla bilir
(bax [05-sessions-context.md](05-sessions-context.md)).

## Storage açarı

```ts
const STORAGE_KEY = 'teslahubs_cargo_accounts';
```

[Companies Context](03-companies-context.md)-dəki eyni `#gotcha` bura da
aiddir: açarı dəyişmək = mövcud istifadəçilərin bütün hesablarını (və
şifrələrini!) sıfırlamaq.

## İxrac olunan tip

```ts
export type CargoAccount = {
  id: string;
  companyId: string;  // CargoCompany.id-yə "foreign key" (DB-siz, sadə string)
  label: string;       // istifadəçinin özünün seçdiyi ad, məs. "Mənim hesabım"
  username: string;
  password: string;    // ⚠️ plaintext, aşağıya baxın
};
```

`companyId` heç bir yerdə validasiya olunmur — yəni nəzəri olaraq mövcud
olmayan bir `companyId`-yə istinad edən hesab yarana bilər (məsələn, şirkət
silinəndə hesab silinməsə). Praktikada bu, `confirmDeleteCompany`
funksiyasında qarşısı alınır (bax [07-cargo-screen.md](07-cargo-screen.md)),
amma context səviyyəsində məcburi bir constraint yoxdur.

## `seedAccounts()` — ilk quraşdırma üçün nümunə hesablar

```ts
function seedAccounts(): CargoAccount[] {
  return DEFAULT_CARGO_COMPANIES.flatMap(company =>
    [1, 2, 3].map(n => ({
      id: `${company.id}-seed-${n}`,
      companyId: company.id,
      label: `İstifadəçi ${n}`,
      username: '',
      password: '',
    })),
  );
}
```

Hər default şirkət üçün **3 boş hesab** yaradır (`username`/`password`
boşdur — istifadəçi özü doldurmalıdır). `id` formatı `${company.id}-seed-${n}`
— məs. `166karqo-seed-1`. Bu, ilk açılışda istifadəçiyə "buraya öz
hesabını daxil et" kimi hazır struktur təqdim etmək üçündür, real
kredensial daşımır.

## `persist()` pattern-i

[Companies Context](03-companies-context.md) ilə eynidir — funksional
`setState` + eyni anda `AsyncStorage.setItem`. Təkrarlanmasın deyə burada
təkrar izah edilmir.

## İxrac olunan `CargoAccountsContextValue`

```ts
type CargoAccountsContextValue = {
  accounts: CargoAccount[];
  accountsForCompany: (companyId: string) => CargoAccount[];
  getAccount: (id: string) => CargoAccount | undefined;
  addAccount: (account: Omit<CargoAccount, 'id'>) => void;
  updateAccount: (id: string, account: Omit<CargoAccount, 'id'>) => void;
  removeAccount: (id: string) => void;
};
```

`accountsForCompany` — bir şirkətin bütün hesablarını filtirləyir
(`accounts.filter(a => a.companyId === companyId)`). `CargoScreen`-də
şirkət kartındakı "N hesab" sayğacı və hesab picker-i bunu çağırır.

`getAccount` — `id` üzrə tək hesab tapır. **Ən kritik çağırış yeri**
`CargoWebViewOverlay`-dir: hər render-də `sessionIds` massivindəki hər
`id` üçün `getAccount(id)` çağırılıb hansı hesabın açıq olduğu müəyyən
olunur (bax [08-webview-overlay.md](08-webview-overlay.md)).

## ⚠️ Şifrələrin saxlanma üsulu (`#security`)

`password` sahəsi **heç bir şifrələmə olmadan**, düz mətn kimi
`JSON.stringify` edilib `AsyncStorage`-a yazılır. Bu, bilinən və qəsdən
qəbul edilmiş bir məhdudiyyətdir:

- `AsyncStorage` fiziki cihazda (`SharedPreferences` Android-də, plist
  fayl iOS-da) şifrələnməmiş saxlanılır.
- Cihaz root/jailbreak olubsa, ya da fiziki girişi olan biri fayl sistemə
  çata bilirsə, bu şifrələr oxuna bilər.
- Tətbiq hazırda **yalnız istifadəçinin öz şəxsi telefonunda** işləmək
  üçün nəzərdə tutulub (server-backend yoxdur, çoxistifadəçili deyil) —
  buna görə bu risk hazırkı istifadə üçün qəbul edilib, amma production/
  paylaşılan cihaz ssenarisi üçün **kifayət etmir**.
- Təkmilləşdirmə yolu: `react-native-keychain` (iOS Keychain / Android
  Keystore) istifadə edib şifrələri ordan oxumaq — hələ **edilməyib**.

Bax [10-security.md](10-security.md) — bütün modul üzrə təhlükəsizlik
qeydlərinin toplu siyahısı üçün.

## Çağırıldığı yerlər

- `CargoScreen.tsx` — demək olar bütün funksiyalar (`accountsForCompany`, `addAccount`, `updateAccount`, `removeAccount`) hesab CRUD formunda istifadə olunur. **Diqqət**: `getAccount` `CargoScreen`-də artıq istifadə **olunmur** (əvvəllər olunurdu, sessiyalar `CargoSessionsContext`-ə keçəndən sonra silindi) — `getAccount` yalnız `CargoWebViewOverlay`-də qalıb.
- `CargoWebViewOverlay.tsx` — `getAccount(id)` hər sessiya tab-ı üçün, kredensial panelində username/password göstərmək üçün.

`#gotcha`: `CargoScreen` bir hesabı sildikdə (`confirmDelete`), eyni zamanda
`closeSession(account.id)` da çağırır — çünki silinən hesabın hələ açıq
WebView tab-ı qalıbsa, o, artıq mövcud olmayan bir hesaba istinad edərdi.
Yeni bir "hesabı sil" yolu yazsanız, bu iki addımı (sil + sessiyanı bağla)
birlikdə etməyi unutmayın, yoxsa `CargoWebViewOverlay` `getAccount(id)`-dən
`undefined` alıb, o tab-ı sükutla render etməyəcək (`if (!account || !company)
return null;`) — amma `sessionIds`-də "xəyalı" bir id qalacaq.
