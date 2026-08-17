# CargoScreen — `src/screens/CargoScreen.tsx`

`#screen` `#crud-ui` `#modal` `#backhandler`

556 sətirlik ekran, amma **artıq WebView göstərmir** — sadəcə: şirkət/hesab
CRUD-u, şirkət grid-i, sessiya-davam-et banner-i. WebView-in özü
[`CargoWebViewOverlay`](08-webview-overlay.md)-dədir.

## State-lərin tam siyahısı

```ts
// Picker modalı (şirkət → hesab siyahısı)
const [pickerOpen, setPickerOpen] = useState(false);
const [pickerCompanyId, setPickerCompanyId] = useState<string | null>(null);

// Hesab əlavə/redaktə formu
const [editingAccount, setEditingAccount] = useState<CargoAccount | { companyId: string } | null>(null);
const [formLabel, setFormLabel] = useState('');
const [formUsername, setFormUsername] = useState('');
const [formPassword, setFormPassword] = useState('');

// Şirkət əlavə/redaktə formu
const [editingCompany, setEditingCompany] = useState<CargoCompany | 'new' | null>(null);
const [formCompanyName, setFormCompanyName] = useState('');
const [formCompanyUrl, setFormCompanyUrl] = useState('');
const [formCompanyIcon, setFormCompanyIcon] = useState(ICON_CHOICES[0]);
const [formCompanyColor, setFormCompanyColor] = useState(COLOR_CHOICES[0]);
```

Diqqət yetirin: `editingAccount`-un tipi `CargoAccount | { companyId: string } | null`
— yəni ya **mövcud** bir hesabdır (redaktə rejimi, tam `CargoAccount`
sahələri var), ya da sadəcə `{ companyId }` (yeni hesab yaradılır, hələ `id`
yoxdur). Modal başlığı və "Yadda saxla" davranışı bu fərqə görə seçilir:

```ts
'id' in editingAccount ? t('cargo.editAccount') : t('cargo.addAccount')
```

Bu, TypeScript-in **discriminated union**-a bənzər bir yoxlama üsuludur —
`'id' in obj` runtime-da yoxlanır, `editingAccount`-un tipini həmin blokda
daraldır (narrow edir).

Eyni pattern `editingCompany: CargoCompany | 'new' | null` üçün də var, amma
sadə string literal (`'new'`) ilə fərqləndirilir (obyekt olmadığı üçün `in`
operatoru yox, `=== 'new'` müqayisəsi işlədilir).

## Modal-ların iç-içə açıla bilməmə qaydası

```ts
const startAdd = (companyId: string) => {
  // Close the picker modal first — RN's <Modal> doesn't support two
  // instances visible at once (taps land on the wrong layer and the form
  // becomes unresponsive), so only one can be open at a time.
  setPickerOpen(false);
  setEditingAccount({ companyId });
  ...
};
```

React Native-in `<Modal>` komponenti **eyni anda iki instans** görünən
olanda toxunuşları səhv qatda emal edir (əvvəllər bu modulda real bug kimi
tapılıb və düzəldilib). Ona görə **hər** "yeni forma aç" funksiyası
(`startAdd`, `startEdit`, `startAddCompany`, `startEditCompany`) əvvəlcə
`setPickerOpen(false)` çağırır.

`#gotcha`: Yeni bir modal əlavə edərkən bu qaydanı unutmayın — yeni modal
açmazdan əvvəl **bütün digər açıq modal-ları bağlayın**, əks halda toxunuş
bug-ları yenidən meydana çıxa bilər.

## Forma bağlananda "geri qayıtma" davranışı

Hesab formu (`cancelForm`, `saveForm`) bağlananda, istifadəçi **avtomatik
olaraq geri picker-ə** (həmin şirkətin hesab siyahısına) qaytarılır:

```ts
const returnToPicker = (companyId: string) => {
  setPickerCompanyId(companyId);
  setPickerOpen(true);
};

const cancelForm = useCallback(() => {
  const companyId = editingAccount?.companyId;
  setEditingAccount(null);
  if (companyId) returnToPicker(companyId);
}, [editingAccount]);
```

Bu, "drill-down" hissi saxlamaq üçündür — istifadəçi şirkət → hesab siyahısı
→ hesab formu yolunu izləyirdisə, forma bağlananda təpədən (şirkət grid-i)
başlamır, elə qaldığı yerdə davam edir.

**Şirkət formu isə fərqli davranır** — `cancelCompanyForm` heç yerə
"qaytarmır", sadəcə bağlanır:

```ts
// Unlike the account form, closing this one does NOT reopen the picker —
// it just closes, returning to whichever screen was already visible
// behind it (the company grid, or a session if any were open).
const cancelCompanyForm = useCallback(() => setEditingCompany(null), []);
```

## `useCallback` niyə var?

```ts
const cancelForm = useCallback(() => { ... }, [editingAccount]);
const cancelCompanyForm = useCallback(() => setEditingCompany(null), []);
```

Bu ikisi `useCallback` ilə sarınıb, çünki aşağıdakı `BackHandler`
`useEffect`-inin asılılıq massivində (`deps array`) istifadə olunurlar.
`useCallback` olmasaydı, hər render-də yeni funksiya referansı yaranar,
`useEffect` hər render-də təkrar-təkrar işə düşər (lint qaydası
`react-hooks/exhaustive-deps` bunu error kimi tutur — bu, əvvəlki bir
sessiyada real şəkildə qarşılaşılıb düzəldilib).

## `openSession` — `CargoScreen`-in Sessions Context-ə körpüsü

```ts
const openSession = (account: CargoAccount) => {
  openSessionContext(account.id);       // useCargoSessions()-dən gələn openSession, `openSessionContext` adı ilə destructure olunub
  setPickerOpen(false);
  navigation.getParent()?.goBack();     // Kargo full-screen modalını bağla
};
```

`#gotcha`: Adlandırma qarışıqlığına diqqət — `CargoScreen`-in öz lokal
`openSession` funksiyası var (bu), context-in funksiyası isə
`openSessionContext` kimi yenidən adlandırılıb (`const { ..., openSession:
openSessionContext, ... } = useCargoSessions();`). İkisini qarışdırmayın:
lokal `openSession` bir `CargoAccount` obyekti qəbul edir və **əlavə iş**
(picker-i bağlamaq, ekrandan çıxmaq) görür; context-in `openSessionContext`-i
isə sadəcə `accountId: string` qəbul edir və yalnız sessiya state-ini
dəyişir.

`navigation.getParent()?.goBack()` çağırılsa da, WebView **itmir** —
çünki artıq `CargoScreen`-dən tamam asılı olmayan yerdə
(`CargoWebViewOverlay`) yaşayır. Bu sətir sadəcə Kargo-nun full-screen
modalını bağlayır, istifadəçini əvvəlki ekrana (məs. Services grid) qaytarır
— overlay isə öz üzərində açıq qalır.

## Android `BackHandler` — addım-addım geri

```ts
useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (editingAccount)              { cancelForm(); return true; }
    if (editingCompany)              { cancelCompanyForm(); return true; }
    if (pickerOpen && pickerCompanyId) { setPickerCompanyId(null); return true; }
    if (pickerOpen)                  { setPickerOpen(false); return true; }
    return false; // heç biri açıq deyil → default davranışa icazə ver
  });
  return () => sub.remove();
}, [editingAccount, editingCompany, pickerOpen, pickerCompanyId, cancelForm, cancelCompanyForm]);
```

`BackHandler.addEventListener` callback-i `true` qaytarsa, React Native
bunu "mən geri düyməsini emal etdim, sən default davranışı (ekranı bağlamaq,
tətbiqdən çıxmaq) tətbiq etmə" kimi qəbul edir. `false` qaytarsa, default
davranış işə düşür (bu halda: `CargoScreen`-in özü bağlanır, çünki heç bir
modal açıq deyil).

Prioritet sırası **qəsdən belədir** (ən dərin modaldan ən dayaz-a): əvvəlcə
formlar (ən üstdə görünən), sonra hesab siyahısı, sonra şirkət siyahısı.
Bu, istifadəçinin gözlədiyi "əvvəl açdığını sonra bağla" (LIFO) davranışına
uyğundur.

`#gotcha`: `cleanup` funksiyası (`return () => sub.remove();`) vacibdir —
olmasaydı, hər render-də yeni bir listener qeydiyyatdan keçər, köhnələr
təmizlənmədən yığılardı (memory leak + çoxlu callback-in eyni anda işə
düşməsi).

## Render strukturu (yuxarıdan aşağı)

1. **Header** — brend adı + "+" (yeni şirkət/hesab əlavə et) + "✕" (bağla).
2. **`ScrollView` (`companyGrid`)** — əsas məzmun:
   - `emptyHint` mətni.
   - `sessionIds.length > 0` olduqda: "davam et" banner-i + üzən düymə on/off `Switch`-i.
   - Şirkət kartlarının siyahısı (`companies.map`).
   - "+ Şirkət əlavə et" düyməsi.
3. **Modal 1 — Picker** (`pickerOpen`): iki alt-görünüş, `pickerCompanyId`-nin `null`/dolu olmasına görə:
   - `null` — bütün şirkətlərin siyahısı (redaktə/sil düymələri ilə).
   - dolu — seçilmiş şirkətin hesab siyahısı (hər hesaba basanda `openSession` çağırılır).
4. **Modal 2 — Hesab formu** (`!!editingAccount`).
5. **Modal 3 — Şirkət formu** (`!!editingCompany`).

`KeyboardAvoidingView` hər iki formda `Platform.OS === 'ios' ? 'padding' :
undefined` behavior-u ilə işlədilir — bu, tətbiqin bütün formalarında
(AutoServiceProviderScreen, CarWashBookingScreen və s.) təkrarlanan
konvensiyadır.

## Toggle Switch (üzən düymənin on/off-u)

```tsx
<Switch
  value={buttonEnabled}
  onValueChange={setButtonEnabled}
  trackColor={{ false: CG_THEME.border, true: CG_THEME.primary }}
  thumbColor={CG_THEME.white}
/>
```

`buttonEnabled`/`setButtonEnabled` birbaşa [`CargoSessionsContext`](05-sessions-context.md)-dən
gəlir — bu ekranda öz lokal state-i yoxdur, sadəcə context-i UI-a bağlayır.
Yalnız `sessionIds.length > 0` olduqda göstərilir (açıq sessiya yoxdursa,
söndürüləcək bir düymə də yoxdur).

## Yeni bir CRUD sahəsi əlavə etmək istəyirsinizsə (checklist)

1. `CargoCompany`/`CargoAccount` tipinə yeni sahə əlavə edin ([01-data-model.md](01-data-model.md) / [04-accounts-context.md](04-accounts-context.md)).
2. Bu ekranda müvafiq `formXxx` state-i əlavə edin.
3. `startAdd`/`startEdit` (və ya `startAddCompany`/`startEditCompany`) funksiyalarında bu state-i sıfırlayın/doldurun.
4. Formun JSX-ində `TextInput`/seçici əlavə edin.
5. `saveForm`/`saveCompanyForm`-da `payload` obyektinə yeni sahəni əlavə edin.
6. İki dildə (`en`/`az`) lazımi `t('cargo.xxx')` açarlarını `src/i18n/translations.ts`-ə əlavə edin.
