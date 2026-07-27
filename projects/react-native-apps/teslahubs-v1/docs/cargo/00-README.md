# Kargo (Cargo) modulu — texniki sənədləşdirmə indeksi

`#cargo` `#index` `#onboarding`

Bu qovluq Teslahubs tətbiqinin **Kargo** modulunu fayl-fayl, texniki
detallarla izah edir. Hər sənəd bir alt-modula uyğundur: nə edir, hansı
tip/funksiyaları ixrac edir, hardan çağırılır, niyə məhz belə yazılıb və
hansı tələlərə (gotcha) diqqət etmək lazımdır.

Auditoriya: junior/middle React Native developer. React, hook-lar,
`AsyncStorage`, React Navigation haqqında əsas bilik fərz olunur; Kargo
modulunun özünə aid heç nə fərz olunmur.

## Necə oxumalı?

Sıra ilə oxumaq tövsiyə olunur — hər sənəd əvvəlkinə istinad edir:

| # | Sənəd | Fayl(lar) | Tag-lər |
|---|---|---|---|
| 1 | [Data modeli](01-data-model.md) | `src/data/cargo.ts` | `#types` `#seed-data` |
| 2 | [Tema (rənglər)](02-theme.md) | `src/theme/cargoTheme.ts` | `#theme` `#design-tokens` |
| 3 | [Companies Context](03-companies-context.md) | `src/context/CargoCompaniesContext.tsx` | `#context` `#crud` `#async-storage` |
| 4 | [Accounts Context](04-accounts-context.md) | `src/context/CargoAccountsContext.tsx` | `#context` `#crud` `#async-storage` `#security` |
| 5 | [Sessions Context](05-sessions-context.md) | `src/context/CargoSessionsContext.tsx` | `#context` `#runtime-state` `#architecture-core` |
| 6 | [Naviqasiya](06-navigation.md) | `src/navigation/CargoStackNavigator.tsx`, `types.ts` | `#navigation` `#react-navigation` |
| 7 | [CargoScreen](07-cargo-screen.md) | `src/screens/CargoScreen.tsx` | `#screen` `#crud-ui` `#modal` `#backhandler` |
| 8 | [WebView Overlay](08-webview-overlay.md) | `src/components/CargoWebViewOverlay.tsx` | `#webview` `#overlay` `#architecture-core` `#backhandler` |
| 9 | [Resume düyməsi](09-resume-button.md) | `src/components/CargoResumeButton.tsx` | `#floating-ui` `#ux` |
| 10 | [Təhlükəsizlik qeydləri](10-security.md) | (bir neçə fayl üzrə) | `#security` `#risk` |
| 11 | [Giriş nöqtəsi / App wiring](11-app-wiring.md) | `App.tsx`, `RootNavigator.tsx`, `ServicesGridScreen.tsx`, `translations.ts` | `#wiring` `#i18n` `#entry-point` |

## Ən vacib bir cümlə

> WebView-lər `CargoScreen`-in **daxilində deyil**, `App.tsx`-də
> `RootNavigator`-ın **yanında** yaşayır — buna görə Kargo modulundan
> çıxsan belə, açıq sessiyalar bağlanmır.

Əgər tələsirsinizsə, birbaşa [05-sessions-context.md](05-sessions-context.md)
və [08-webview-overlay.md](08-webview-overlay.md) sənədlərinə keçin — modulun
"əsas" (core) memarlıq qərarı elə oradadır, qalan fayllar onun ətrafında UI
təmin edir.

## Tag lüğəti

- `#architecture-core` — bu faylı dəyişmək bütün modulun davranışına təsir edir, ehtiyatlı olun.
- `#context` — React Context + custom hook (`useXxx`) pattern-i.
- `#async-storage` — `@react-native-async-storage/async-storage` ilə fiziki cihazda saxlanılan data.
- `#runtime-state` — yalnız yaddaşda yaşayır, restart-da itir (qəsdəndir).
- `#security` — istifadəçi məlumatlarının qorunması ilə bağlı qeydlər.
- `#backhandler` — Android hardware back düyməsi ilə bağlı davranış.
- `#gotcha` — "bunu dəyişsən sınar" xəbərdarlığı (hər sənədin sonunda).

## Modulun bir cümləlik icması

İstifadəçi Kargo şirkətlərinin (166 Karqo, Elpost və s.) saytlarına
tətbiq daxilində, bir neçə hesabla paralel, sessiyaları itirmədən daxil ola
bilsin deyə: (a) hesab/şirkət CRUD-u AsyncStorage-da saxlanılır, (b) açıq
"tab"-ların WebView-ləri isə tətbiqin kökündə, naviqasiyadan asılı olmayan
bir overlay-də canlı saxlanılır.
