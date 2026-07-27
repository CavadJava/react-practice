# Sessions Context — `src/context/CargoSessionsContext.tsx`

`#context` `#runtime-state` `#architecture-core`

Bu fayl modulun **arxitektura mərkəzidir**. Kod özü qısadır (66 sətir), amma
niyə məhz belə yazıldığını başa düşmək bütün Kargo modulunun məntiqini
açır.

## Problem, bu fayl həll edir

React Navigation-da bir screen stack-dən "pop" olanda **unmount** olur.
Əgər WebView-lər `CargoScreen`-in daxilində render olunsaydı, istifadəçi
Kargo-dan çıxıb başqa bölməyə keçəndə bütün açıq sessiyalar (login
vəziyyəti, scroll mövqeyi) məhv olardı.

Həll: sessiya **metadata**-sını (hansı hesablar açıqdır, hansı aktivdir)
`CargoScreen`-dən tamam ayrı, `App.tsx`-in kökündə yaşayan bir Context-də
saxlamaq — bu context özü heç vaxt unmount olmur, çünki `RootNavigator`-ın
bir hissəsi deyil, onun **yanında** dayanır (bax [06-navigation.md](06-navigation.md)
və [08-webview-overlay.md](08-webview-overlay.md)).

**Diqqət**: bu context özü WebView-i render etmir — sadəcə "hansı tab-lar
açıqdır" məlumatını saxlayır. WebView-in özünü render edən
`CargoWebViewOverlay`-dir, o da eyni səbəbdən (unmount olmamaq üçün)
`App.tsx`-in kökündə yaşayır.

## İxrac olunan tip

```ts
type CargoSessionsContextValue = {
  sessionIds: string[];          // açıq "tab"-ların hesab id-ləri, sıra ilə
  activeId: string | null;       // hansı tab hazırda önə çəkilib
  overlayVisible: boolean;       // overlay ekranda görünürmü
  buttonEnabled: boolean;        // üzən "davam et" düyməsi aktivdirmi
  openSession: (accountId: string) => void;
  closeSession: (accountId: string) => void;
  setActiveId: (accountId: string) => void;
  showOverlay: () => void;
  hideOverlay: () => void;
  setButtonEnabled: (enabled: boolean) => void;
};
```

Dörd ayrı `useState` var, hamısı `CargoSessionsProvider` daxilində:

```ts
const [sessionIds, setSessionIds] = useState<string[]>([]);
const [activeId, setActiveIdState] = useState<string | null>(null);
const [overlayVisible, setOverlayVisible] = useState(false);
const [buttonEnabled, setButtonEnabled] = useState(true);
```

## ⚠️ Bu state `AsyncStorage`-a yazılmır — bu, bilərəkdən belədir

Companies/Accounts context-lərindən fərqli olaraq, burada **heç bir
`persist()` funksiyası yoxdur**. Səbəb: bu state sadəcə "hansı WebView-lər
canlıdır" məlumatıdır. Tətbiq tam bağlanıb (process öldürülüb) yenidən
açılanda, WebView-lərin özü artıq yoxdur — saxlanacaq WebView olmadan
"hansı tab açıqdır" məlumatını saxlamağın mənası yoxdur. Əgər gələcəkdə
"tətbiq restart olsa da, son açılan URL-ə avtomatik keç" kimi funksiya
istənsə, bunu **ayrı** bir `persist()` mexanizmi ilə (yalnız `sessionIds`
üçün, WebView-in öz session/cookie state-i yenə itəcək) etmək lazımdır —
hazırda bu, məqsədli şəkildə edilməyib.

## `openSession(accountId)`

```ts
const openSession = (accountId: string) => {
  setSessionIds(prev => (prev.includes(accountId) ? prev : [...prev, accountId]));
  setActiveIdState(accountId);
  setOverlayVisible(true);
};
```

Üç iş görür:

1. Əgər bu hesab artıq açıq deyilsə, `sessionIds`-ə əlavə edir (idempotent — eyni hesabı iki dəfə açmaq iki tab yaratmır).
2. Onu aktiv edir (yəni önə çəkir).
3. Overlay-i **məcburi görünən** edir (`overlayVisible = true`) — istifadəçi "aç" düyməsinə basanda WebView-i dərhal görsün deyə.

Çağırıldığı yer: `CargoScreen.tsx` → `openSession` (yerli funksiya, adı
təsadüfən eynidir amma fərqli funksiyadır — context-in funksiyası
`openSessionContext` adı ilə destructure olunub qarışıqlığın qarşısı
alınıb, bax [07-cargo-screen.md](07-cargo-screen.md)).

## `closeSession(accountId)` — funksional update-lərin iç-içə keçməsi

```ts
const closeSession = (accountId: string) => {
  setSessionIds(prev => {
    const next = prev.filter(id => id !== accountId);
    setActiveIdState(current => (current === accountId ? (next.length ? next[next.length - 1] : null) : current));
    return next;
  });
};
```

Bu, ilk baxışda qeyri-adi görünür: `setSessionIds`-in **daxilində**
`setActiveIdState`-i (özü də funksional formada) çağırır. Niyə belədir?

- Tab bağlananda, əgər bağlanan tab **aktiv olan** tab-dırsa, yeni aktiv
  tab təyin edilməlidir (son qalan tab, ya da heç nə qalmayıbsa `null`).
- Bunu etmək üçün "yeni siyahı" (`next`) lazımdır — həm `sessionIds`-i
  yeniləmək, həm də həmin **eyni** yeni siyahı əsasında `activeId`-ni
  düzəltmək lazımdır.
- İki ayrı `setState` çağırışı (biri digərindən asılı olaraq) əvəzinə,
  React-ın funksional updater-lərini iç-içə yazmaqla hər ikisi eyni
  render dövründə, düzgün "əvvəlki dəyər" ilə işləyir.

Bu, valid React pattern-idir (React sənədlərində açıq qadağan olunmayıb),
amma **stilistik olaraq qeyri-adi**dır — oxumaq çətindir. Alternativ,
daha oxunaqlı yazılış:

```ts
const closeSession = (accountId: string) => {
  setSessionIds(prev => prev.filter(id => id !== accountId));
  setActiveIdState(current => {
    if (current !== accountId) return current;
    const remaining = sessionIds.filter(id => id !== accountId); // ⚠️ köhnə closure-dan sessionIds
    return remaining.length ? remaining[remaining.length - 1] : null;
  });
};
```

Bu alternativ isə **daha səhv**dir, çünki `sessionIds` closure-dan gəlir və
köhnə ola bilər (stale closure) — məhz bu səbəbdən orijinal implementasiya
iç-içə funksional update-i seçib: yalnız `setSessionIds`-in updater-i
içində hesablanan `next` **həqiqətən doğru** yeni siyahıdır.

`#gotcha`: Bu funksiyanı "sadələşdirmək" istəsəniz, diqqətli olun — closure
stale-lik riski asanlıqla geri qayıda bilər.

## `showOverlay()` / `hideOverlay()` / `setActiveId`

```ts
setActiveId: setActiveIdState,
showOverlay: () => setOverlayVisible(true),
hideOverlay: () => setOverlayVisible(false),
```

Bunlar sadə "wrapper"-lardır — `CargoWebViewOverlay`-in header-indəki
"gizlət" düyməsi (`﹀`) `hideOverlay`-i, `CargoResumeButton` və
`CargoScreen`-dəki "davam et" banner-i `showOverlay`-i çağırır.
`setActiveId` isə overlay-dəki tab chip-lərinə basanda tab dəyişmək üçün.

## `buttonEnabled` / `setButtonEnabled`

Üzən "davam et" düyməsinin (bax [09-resume-button.md](09-resume-button.md))
görünüb-görünməyəcəyini idarə edir. `overlayVisible`-dan **tamam
asılı deyil** — iki fərqli konsept:

- `overlayVisible = false` + `buttonEnabled = true` → üzən düymə görünür (normal hal).
- `overlayVisible = false` + `buttonEnabled = false` → istifadəçi düyməni özü söndürüb, heç nə görünmür, amma sessiyalar hələ açıqdır.
- `overlayVisible = true` → düymənin dəyəri önəmsizdir, `CargoResumeButton` hər halda `null` render edir (overlay onsuz da ekrandadır).

## Çağırıldığı yerlər (tam siyahı)

| Fayl | İstifadə etdiyi sahə/funksiya |
|---|---|
| `CargoScreen.tsx` | `sessionIds`, `openSession`, `closeSession`, `showOverlay`, `buttonEnabled`, `setButtonEnabled` |
| `CargoWebViewOverlay.tsx` | `sessionIds`, `activeId`, `overlayVisible`, `closeSession`, `setActiveId`, `hideOverlay` |
| `CargoResumeButton.tsx` | `sessionIds`, `overlayVisible`, `buttonEnabled`, `showOverlay`, `setButtonEnabled` |
| `App.tsx` | `CargoSessionsProvider` — provider ağacına qoşulur |

`#gotcha`: Bu context-i `CargoScreen`-in **daxilinə** geri daşımayın (məsələn
"refactor edib sadələşdirək" düşüncəsi ilə) — bu, bilə-bilə edilmiş
arxitektura qərarının əksinədir və "sessiyalar Kargo-dan çıxanda bağlanmasın"
tələbini sındırar.
