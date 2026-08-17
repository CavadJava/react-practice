# WebView Overlay — `src/components/CargoWebViewOverlay.tsx`

`#webview` `#overlay` `#architecture-core` `#backhandler`

Modulun **ikinci** arxitektura-mərkəzi faylı ([Sessions Context](05-sessions-context.md)
ilə birlikdə). Bura, real WebView instansiyalarını render edən yerdir.

## Harada mount olunur (çox vacib)

`App.tsx`-də:

```tsx
<CargoSessionsProvider>
  <RootNavigator />
  <CargoWebViewOverlay />   {/* RootNavigator-un YANINDA, içində DEYİL */}
  <CargoResumeButton />
</CargoSessionsProvider>
```

`CargoWebViewOverlay` `RootNavigator`-ın bir **sibling**-idir (bacı
komponentdir), onun daxilində bir route/ekran deyil. Bu, komponentin
**heç vaxt unmount olmamasını** təmin edir — React Navigation-un
stack-push/pop məntiqi bu komponentə heç toxunmur, çünki o, naviqasiya
ağacının bir hissəsi deyil.

## Görünürlük necə idarə olunur: `zIndex` + `pointerEvents`, YOX `display:'none'`

```tsx
<View
  style={[StyleSheet.absoluteFill, { zIndex: overlayVisible ? 1000 : -1 }]}
  pointerEvents={overlayVisible ? 'auto' : 'none'}
>
  {/* bütün overlay məzmunu */}
</View>
```

- `overlayVisible = true` → `zIndex: 1000` (hər şeyin üstündə), `pointerEvents: 'auto'` (toxunuşlar keçir).
- `overlayVisible = false` → `zIndex: -1` (bütün digər ekranların arxasında), `pointerEvents: 'none'` (toxunuşlar arxadakı ekrana keçir, sanki bu View heç yoxdur).

**Niyə `display: 'none'` işlədilmir?** Android-də `display:'none'` ilə
gizlədilən `WebView`-lər bəzən geri görünən olanda **donub qalır** — native
surface düzgün "reattach" olmur. `zIndex`/`pointerEvents` kombinasiyası isə
View-ni DOM/render ağacından **çıxarmır**, sadəcə vizual olaraq arxaya
keçirir və toxunuş qəbulunu deaktiv edir — WebView-in native görüntüsü tam
canlı qalır, heç nə "unmount" olmur.

**Eyni texnika iki səviyyədə** işlədilir:

1. Bütün overlay-in özünün görünürlüyü (yuxarıdakı kod).
2. Overlay daxilindəki **hər bir tab-ın** WebView-i arasında keçid (aşağıda).

```tsx
{sessionIds.map(id => {
  ...
  const isActive = activeId === id;
  return (
    <View key={id} style={[StyleSheet.absoluteFill, { zIndex: isActive ? 1 : 0 }]} pointerEvents={isActive ? 'auto' : 'none'}>
      <WebView ... />
    </View>
  );
})}
```

Yəni: açıq olan **hər** hesab üçün **ayrıca** bir `<WebView>` instansı
DOM-da qalır (heç vaxt unmount olmur), sadəcə aktiv olmayanlar arxa plana
keçib toxunuşları bloklanır. Bu səbəbdən 5 tab açsanız, yaddaşda 5 WebView
canlı qalır — performans/yaddaş dəyər-dəyiş (trade-off) budur (aşağıda
"Diqqət ediləcək məhdudiyyətlər"ə baxın).

## `incognito` prop-u — hesablar arası cookie izolyasiyası

```tsx
<WebView
  incognito
  source={{ uri: company.url }}
  ...
/>
```

`incognito={true}` hər `WebView` instansının **öz** (paylaşılmayan)
cookie/local-storage "jar"-ına malik olmasını təmin edir. Bu, "eyni şirkətin
iki fərqli hesabı" ssenarisi üçün **məcburidir**: `incognito` olmasaydı,
bütün WebView-lər **ümumi** bir cookie store paylaşardı, və son login olan
hesab avtomatik olaraq **bütün** tab-ları öz sessiyasına köçürərdi (çünki
sayt cookie-yə görə "kim login olub" deyə bilir, WebView instansına görə
yox).

`#gotcha`: Bu prop-u silməyin — silsəniz, çoxhesablı istifadə tamam sınar,
amma xəta build zamanı görünməz, yalnız runtime-da (ikinci hesabı açanda
birincinin sessiyasının "üstünə düşməsi" kimi) üzə çıxar.

## Hardware back → WebView-in öz tarixçəsi

```ts
const webviewRefs = useRef<Record<string, { goBack: () => void } | null>>({});
const canGoBackRef = useRef<Record<string, boolean>>({});

useEffect(() => {
  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (!overlayVisible) return false;
    const activeWebview = activeId ? webviewRefs.current[activeId] : null;
    if (activeId && canGoBackRef.current[activeId] && activeWebview) {
      activeWebview.goBack();
      return true;
    }
    hideOverlay();
    return true;
  });
  return () => sub.remove();
}, [overlayVisible, activeId, hideOverlay]);
```

Axın:

1. Overlay görünmürsə (`!overlayVisible`) → bu handler heç nə etmir (`false`), geri düyməsi başqa yerdə (məs. `CargoScreen`-in öz `BackHandler`-i, ya da default naviqasiya) emal olunur.
2. Overlay görünürsə → əvvəlcə aktiv WebView-in **öz brauzer tarixçəsində** geri getməyə cəhd edilir (`webview.goBack()`), brauzerdəki "geri" düyməsi kimi.
3. WebView-in geri gedəcək yeri qalmayıbsa (`canGoBack === false`) → overlay gizlədilir (`hideOverlay()`), **tətbiqdən çıxılmır**.

İki `useRef` niyə istifadə olunur, `useState` yox?

- `webviewRefs` — hər `WebView` instansına imperativ müraciət (`.goBack()`
  çağırmaq) üçün DOM/native ref-lərdir, bunlar render-ə səbəb olmamalıdır.
- `canGoBackRef` — `onNavigationStateChange` **çox tez-tez** (demək olar
  hər səhifə keçidində) atəşlənir. Bunu `useState` etsəniz, hər keçiddə
  təkrar-təkrar render tətikləyər (performans itkisi). `useRef` ilə isə
  dəyər sükutla yenilənir, yalnız `BackHandler` çağırılanda oxunur —
  render lazım deyil, çünki bu məlumat UI-da göstərilmir, yalnız gələcək bir
  hadisə (geri düyməsi) üçün "yaddaşda saxlanılır".

```tsx
<WebView
  ref={ref => { webviewRefs.current[id] = ref; }}
  ...
  onNavigationStateChange={(navState: { canGoBack: boolean }) => {
    canGoBackRef.current[id] = navState.canGoBack;
  }}
/>
```

Hər WebView öz `id`-si (hesab id-si) altında ref-ini və `canGoBack`
vəziyyətini saxlayır — beləliklə fərqli tab-lar bir-birinin tarixçə
vəziyyətini qarışdırmır.

`#gotcha`: `ref` callback-inin TypeScript tipi ilə bağlı diqqət — birbaşa
`WebView | null` kimi annotasiya etmək generic konflikt yaradıb (`tsc`
xətası: "Type ... is not assignable to type 'never'"). Ona görə
`webviewRefs`-in tipi `Record<string, { goBack: () => void } | null>`
kimi **minimal** (yalnız lazım olan metodla) tərif olunub — WebView-in tam
tipini import etmək əvəzinə, sadəcə işlədilən interfeysi təsvir edir.
Bu, "structural typing" adlanan TypeScript pattern-idir.

## Kredensial paneli və kopyalama

```tsx
const copy = (text: string, field: 'username' | 'password') => {
  if (!text) return;
  Clipboard.setString(text);
  setCopiedField(field);
  setTimeout(() => setCopiedField(null), 1500);
};
```

`Clipboard.setString` — `react-native`-in **köhnəlmiş (deprecated)** API-si
(yeni layihələrdə `@react-native-clipboard/clipboard` tövsiyə olunur), amma
bu tətbiqdə hələ `react-native`-in daxili `Clipboard`-u işlədilir (digər
ekranlarda da eyni pattern var, konvensiya saxlanıb). 1.5 saniyəlik
"✓ Kopyalandı" bildirişi `setCopiedField`/`setTimeout` ilə idarə olunur.

`#security`: `copy('password', ...)` çağırışı **plaintext şifrəni** cihazın
**qlobal clipboard-ına** yazır — bu, başqa tətbiqlərin (clipboard-a icazəsi
olan) bu şifrəni oxuya bilməsi riski yaradır (bax
[10-security.md](10-security.md)). Şifrə default `••••••••` kimi gizlidir,
göz ikonu (`👁️`/`🙈`) ilə açılıb-bağlanır (`showPassword` state-i).

## Diqqət ediləcək məhdudiyyətlər

- **Yaddaş**: hər açıq tab bir tam WebView instansı deməkdir (JS engine +
  DOM + şəkillər və s. hamısı yaddaşda qalır). İstifadəçi çoxlu tab açsa
  (məs. 10+), tətbiqin yaddaş istifadəsi əhəmiyyətli dərəcədə artar. Hazırda
  tab sayına heç bir limit qoyulmayıb.
- **Bir aktiv `overlayVisible`/`activeId`** — eyni anda yalnız bir tab
  "aktiv" ola bilər, `sessionIds` sırası isə açılma ardıcıllığını əks
  etdirir (LIFO deyil, sadəcə array-ə append).

## Çağırıldığı yerlər / asılı olduğu context-lər

- [`useCargoSessions`](05-sessions-context.md) — bütün sessiya state-i.
- [`useCargoAccounts`](04-accounts-context.md) — `getAccount` (kredensial paneli, tab label/ikon).
- [`useCargoCompanies`](03-companies-context.md) — `getCompany` (WebView `source.uri`, tab rəngi/ikonu).
