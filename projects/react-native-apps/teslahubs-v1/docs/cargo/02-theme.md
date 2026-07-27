# Tema — `src/theme/cargoTheme.ts`

`#theme` `#design-tokens`

## Nə edir

Kargo modulunun bütün rəngləri üçün mərkəzi obyekt ixrac edir:

```ts
export const CG_THEME = {
  bg: '#0F1B2D',
  card: '#17253A',
  cardAlt: '#1E3350',
  primary: '#4F9DFF',
  primaryDark: '#3B82F6',
  text: '#F5F8FC',
  textMuted: '#9FB4CC',
  border: '#2A3F5A',
  white: '#FFFFFF',
  success: '#34D399',
  danger: '#FB7185',
} as const;
```

`as const` sayəsində TypeScript hər dəyəri `string` yox, dəqiq literal tip
kimi görür (məs. `'#0F1B2D'`), amma praktikada bu, sadəcə dəyərlərin
immutable olmasını təmin edir — heç bir fayl `CG_THEME.bg = ...` kimi yenidən
mənimsətmə etmir.

## Niyə `ThemeContext`-dən ayrıdır?

Tətbiqdə istifadəçinin dəyişə bildiyi ümumi bir `ThemeContext` (dark/light)
var, amma Kargo (və AvtoYuma, Tesla Service, Doctors, Restaurants kimi digər
"mini-app" modulları) **öz sabit brend paletini** işlədir — istifadəçi
tətbiqin əsas temini dəyişəndə belə, Kargo modulu həmişə eyni tünd
göy/dəniz-mavisi görünüşdə qalır. Bu, hər modulun "ayrı bir alt-tətbiq kimi
hiss olunması" məqsədi daşıyır (`CargoStackNavigator.tsx`-dəki şərh də bunu
qeyd edir).

## Harada istifadə olunur?

Praktik olaraq **hər Kargo faylında**: `CargoScreen.tsx`, `CargoWebViewOverlay.tsx`,
`CargoResumeButton.tsx` — bütün `StyleSheet.create({...})` bloklarında rəng
dəyərləri birbaşa `CG_THEME.xxx` kimi referans olunur, heç bir yerdə hex
kod hardcode olunmayıb (bu, konvensiyadır — yeni stil yazarkən də saxlanmalıdır).

## Rəng-məna cütləri (semantika)

| Açar | İstifadə yeri | Məna |
|---|---|---|
| `bg` | Ekran/overlay fonu | Ən tünd səviyyə |
| `card` / `cardAlt` | Kartlar, tab chip-lər, input-lar | `cardAlt` — aktiv/seçili vəziyyət üçün bir az açıq |
| `primary` / `primaryDark` | Düymələr, aktiv border-lər | `primary` — əsas CTA rəngi |
| `text` / `textMuted` | Əsas mətn / ikinci dərəcəli mətn | Kontrast iyerarxiyası |
| `border` | Bütün border-lər | Kartları fondan ayırmaq üçün |
| `success` / `danger` | Hazırda birbaşa istifadə olunmur (gələcək status göstəriciləri üçün ehtiyat) | — |

`#gotcha`: `success`/`danger` hazırda kodun heç yerində çağırılmır (yalnız
tərif olunub) — gələcəkdə "sessiya uğursuz oldu" kimi status
göstəriciləri üçün nəzərdə tutulub. Silsəniz TypeScript xəta verməz, amma
gələcək iş üçün saxlamaq daha yaxşıdır.

## Bu rəngləri dəyişəndə diqqət ediləcək

Rənglər 2026-cı ilin əvvəlində "user-friendly" olsun deyə bir dəfə
yenilənib (orijinal dəyərlər daha tünd/neon idi: `bg: '#0B1420'`,
`primary: '#3B82F6'`, `danger: '#F87171'` və s.). Əgər yenidən dəyişəcəksinizsə:

- Kontrastı `text`/`textMuted` ilə `bg`/`card` arasında yoxlayın (WCAG AA
  minimum ~4.5:1 mətn üçün).
- `primary` rəngi həm düymə fonunda (üstündəağ mətn), həm də border rəngi
  kimi (tünd fon üstündə) işlədilir — hər iki kontekstdə oxunaqlı olmalıdır.
