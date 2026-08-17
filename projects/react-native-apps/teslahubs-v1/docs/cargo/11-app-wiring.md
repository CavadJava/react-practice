# Giriş nöqtəsi və tam wiring — `App.tsx`, `RootNavigator`, i18n

`#wiring` `#i18n` `#entry-point`

Əvvəlki sənədlər (05, 08, 09) `App.tsx`-dəki provider ağacına parça-parça
toxunub — bu sənəd hamısını bir yerdə, uçdan-uca göstərir.

## İstifadəçi Kargo-ya necə çatır?

```
ServicesGridScreen (Xidmətlər tab-ı)
  → TILES massivində 'cargo' kartına basılır
  → nav.navigate('Cargo')
  → RootNavigator-dakı "Cargo" route-u açılır (fullScreenModal)
  → CargoStackNavigator → CargoScreen
```

`src/screens/ServicesGridScreen.tsx`:

```ts
{ key: 'cargo', icon: '📦', titleKey: 'cargo.entryTitle', subtitleKey: 'cargo.entrySubtitle', onPress: nav => nav.navigate('Cargo') },
```

`titleKey`/`subtitleKey` — kart üzərindəki mətn birbaşa i18n açarından
gəlir (`t('cargo.entryTitle')` = "Kargo" / "Cargo", `t('cargo.entrySubtitle')`).

`src/navigation/RootNavigator.tsx`:

```tsx
<Stack.Screen name="Cargo" component={CargoStackNavigator} options={{ presentation: 'fullScreenModal' }} />
```

Bax [06-navigation.md](06-navigation.md) — `CargoStackNavigator`-ın özü,
`fullScreenModal` təqdimatı, `CompositeScreenProps` üçün.

## `App.tsx` — tam provider ağacı (Kargo-ya aid hissə)

```tsx
<CargoCompaniesProvider>
  <CargoAccountsProvider>
    <CargoSessionsProvider>
      <RootNavigator />
      <CargoWebViewOverlay />
      <CargoResumeButton />
    </CargoSessionsProvider>
  </CargoAccountsProvider>
</CargoCompaniesProvider>
```

Sıralama **təsadüfi deyil**:

- `CargoCompaniesProvider` və `CargoAccountsProvider` ən xaricdə — çünki
  `CargoWebViewOverlay`/`CargoResumeButton` və `CargoScreen`-in hamısı
  onlardan (`useCargoCompanies`/`useCargoAccounts`) asılıdır, ona görə bu
  iki provider **hər ikisinin əhatə etdiyi ağacın kökündə** olmalıdır.
- `CargoSessionsProvider` bunların **daxilində**, amma `RootNavigator`,
  `CargoWebViewOverlay`, `CargoResumeButton` üçün **ortaq valideyn**
  olmalıdır — üçü də `useCargoSessions()` çağırır, ona görə bu üçünün də
  React ağacında `CargoSessionsProvider`-in nəvəsi/övladı olması şərtdir.
- `CargoWebViewOverlay` və `CargoResumeButton` `RootNavigator`-ın
  **sibling**-idir (bax [05](05-sessions-context.md), [08](08-webview-overlay.md),
  [09](09-resume-button.md)) — bu, bütün "sessiyalar ölməsin" memarlığının
  təməlidir.

`#gotcha`: Əgər `CargoWebViewOverlay`/`CargoResumeButton`-u yanlışlıqla
`RootNavigator`-ın **daxilinə** (məsələn bir ekranın componentinə) daşısanız,
onlar həmin ekranla birlikdə unmount olar və bütün memarlıq sınar. Bunlar
həmişə `RootNavigator` ilə **eyni səviyyədə**, JSX-də bacı elementlər kimi
qalmalıdır.

## i18n açarları — `src/i18n/translations.ts`

Bütün Kargo mətnləri `cargo.` prefiksi ilə, `en` və `az` obyektlərinin hər
ikisində **ayrı-ayrı** təyin olunur (avtomatik sinxronizasiya/tərcümə
yoxdur — `t()` funksiyası açar tapılmasa sükutla açarın özünü qaytarır,
`tsc` bunu xəta kimi tutmur, bax aşağıdakı `#gotcha`).

| Açar | İstifadə yeri |
|---|---|
| `cargo.entryTitle` / `entrySubtitle` | `ServicesGridScreen` kartı, `CargoScreen`/`CargoWebViewOverlay` header-i |
| `cargo.companies` | Picker modalının şirkət siyahısı başlığı |
| `cargo.emptyHint` | `CargoScreen` boş-vəziyyət ipucu |
| `cargo.resumeSessions` | "Davam et" banner-i (`{{count}}` interpolasiyası ilə) |
| `cargo.floatingButtonToggle` | Üzən düymənin on/off `Switch`-inin etiketi |
| `cargo.accountsCount` | Şirkət kartındakı "N hesab" sayğacı (`{{count}}`) |
| `cargo.addAccount` / `editAccount` / `addCompany` / `editCompany` | Modal başlıqları |
| `cargo.label` / `username` / `password` (+ `Placeholder` variantları) | Hesab formu sahə etiketləri |
| `cargo.companyName` / `companyUrlField` / `icon` / `color` | Şirkət formu sahə etiketləri |
| `cargo.notSet` | Kredensial panelində boş username/password üçün |
| `cargo.copy` / `copied` | Kopyalama düyməsi mətn/vəziyyəti |
| `cargo.deleteConfirmTitle` / `deleteConfirmMessage` (hesab) | Silmə təsdiq `Alert`-i |
| `cargo.deleteCompanyConfirmTitle` / `deleteCompanyConfirmMessage` | Şirkət silmə təsdiq `Alert`-i |
| `cargo.cancel` / `save` / `delete` | Ümumi düymə mətnləri |

`#gotcha`: `t('cargo.xxx')` bir string qəbul edir, `translations.ts`-in
tam formasına (`typeof en`) qarşı yoxlanmır — yəni **yeni açar əlavə
edəndə `en`-ə yazıb `az`-ı unutsanız, `tsc --noEmit` bunu tutmayacaq**,
yalnız runtime-da Azərbaycan dilində açarın özü (məs. `cargo.xxxNewKey`)
ekranda görünəcək. Yeni mətn əlavə edərkən **hər iki dili də** yeniləməyi
əl ilə yadda saxlamaq lazımdır.

## Kiçik təmizlik qeydi (kodun özündə, sənəddə yox)

`src/navigation/CargoStackNavigator.tsx:9`-dakı şərh **`CO_THEME`**-ə
istinad edir, amma faktiki export `CG_THEME`-dir (`src/theme/cargoTheme.ts`).
Funksionallığa təsiri yoxdur, sadəcə köhnə/səhv adlandırma izi — başqa bir
dəyişiklik zamanı düzəldilə bilər.
