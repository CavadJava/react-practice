# Təhlükəsizlik qeydləri (bütün modul üzrə toplu)

`#security` `#risk`

Bu sənəd əvvəlki fayllarda səpələnmiş bütün `#security` qeydlərini bir
yerə toplayır — kod review edərkən, ya da production-a çıxarmazdan əvvəl
sürətli yoxlama siyahısı kimi istifadə edin.

## 1. Şifrələr plaintext saxlanılır

**Harada**: [`CargoAccountsContext`](04-accounts-context.md) — `CargoAccount.password`
sahəsi heç bir şifrələmə olmadan `JSON.stringify` edilib `AsyncStorage`-a yazılır.

**Risk**: Cihaz root/jailbreak olubsa və ya fiziki girişi olan biri fayl
sistemə çata bilirsə, bütün Kargo hesablarının şifrələri oxuna bilər.
`AsyncStorage` özü heç bir şifrələmə təmin etmir (Android-də
`SharedPreferences`, iOS-da plist faylı — ikisi də sadə mətn formatındadır).

**Hazırkı qərar**: Tətbiq yalnız istifadəçinin öz şəxsi telefonunda,
tək-istifadəçili rejimdə işlədiyi üçün bu risk hazırda **şüurlu şəkildə
qəbul edilib**, düzəldilməyib.

**Tövsiyə olunan həll (edilməyib)**: `react-native-keychain` kitabxanası
ilə iOS Keychain / Android Keystore-a keçid — bu, OS səviyyəsində
şifrələnmiş, biometrik/PIN kilidli saxlama təmin edir.

## 2. Clipboard-a plaintext şifrə kopyalanır

**Harada**: [`CargoWebViewOverlay`](08-webview-overlay.md) — `copy()`
funksiyası `Clipboard.setString(activeAccount.password)` çağırır.

**Risk**: Bəzi Android versiyalarında/istehsalçı ROM-larında digər
tətbiqlər (icazə tələb etmədən) cihazın qlobal clipboard-unu oxuya bilir.
Kopyalanan şifrə 1.5 saniyəlik UI bildirişindən sonra da clipboard-da
qalır (tətbiq onu clipboard-dan silmir).

**Qismən qoruma**: Şifrə default gizlidir (`••••••••`), yalnız istifadəçi
göz ikonuna basanda görünür — amma "Kopyala" düyməsi göz ikonundan asılı
olmadan işləyir (gizli olsa belə kopyalana bilər).

## 3. Cookie izolyasiyası `incognito` prop-una bağlıdır

**Harada**: [`CargoWebViewOverlay`](08-webview-overlay.md) — hər `<WebView>`-də `incognito` prop-u.

**Risk**: Bu prop təsadüfən silinərsə (məs. refactor zamanı), bütün
hesabların WebView-ləri **ümumi cookie store** paylaşmağa başlayar — son
login olan hesab bütün açıq tab-ları öz sessiyasına "keçirər". Bu, gizlilik
pozuntusudur (bir istifadəçi başqasının hesabına təsadüfən giriş edə
bilər, əgər eyni cihazda paylaşılan tətbiqdirsə).

**Qoruma**: Kod review-də bu prop-un mövcudluğunu yoxlamaq tövsiyə olunur;
avtomatlaşdırılmış test yoxdur.

## 4. WebView-lərdə açıq `originWhitelist` və `onShouldStartLoadWithRequest`

**Harada**: [`CargoWebViewOverlay`](08-webview-overlay.md):

```tsx
originWhitelist={['*']}
onShouldStartLoadWithRequest={() => true}
```

**Risk**: `originWhitelist={['*']}` istənilən domenə keçidə icazə verir
(WebView daxilindəki bir link istifadəçini `company.url`-dan tamam fərqli,
zərərli bir sayta apara bilər). `onShouldStartLoadWithRequest={() => true}`
isə **hər** naviqasiya sorğusuna qeyd-şərtsiz icazə verir — heç bir domen
yoxlaması yoxdur.

**Kontekst**: Kargo şirkətlərinin URL-ləri istifadəçinin özü tərəfindən
əlavə olunur (bax [`CargoCompaniesContext`](03-companies-context.md)) —
yəni istifadəçi öz güvəndiyi saytları özü seçir, bu, "naməlum üçüncü tərəf
kontenti" ssenarisindən fərqlidir. Bununla belə, əgər kargo şirkətinin öz
saytı kompromis olubsa (məs. XSS vasitəsilə zərərli redirect), WebView bunu
maneəsiz izləyəcək.

**Tövsiyə**: Əgər gələcəkdə daha sərt təhlükəsizlik tələb olunarsa,
`onShouldStartLoadWithRequest`-i `company.url`-un domenini yoxlayan bir
funksiya ilə əvəz etmək (yalnız eyni domenə keçidlərə icazə vermək) mümkündür.

## 5. `AsyncStorage`-da korlanmış data səssizcə sıfırlanır

**Harada**: [`CargoCompaniesContext`](03-companies-context.md) və
[`CargoAccountsContext`](04-accounts-context.md) — hər ikisinin ilk yükləmə
effektində boş `catch` bloku var.

**Risk**: Bu, birbaşa təhlükəsizlik zəifliyi deyil, amma **məlumat itkisi**
riskidir — əgər storage nədənsə korlanarsa (məs. tətbiq yazma zamanı
qəflətən bağlanarsa), istifadəçi heç bir xəbərdarlıq almadan bütün
şirkət/hesab siyahısını itirə bilər (seed data ilə səssizcə əvəz olunur).

## Ümumi qiymətləndirmə

Bu risklərin əksəriyyəti **"tətbiq təkcə istifadəçinin öz telefonunda
işləyir"** fərziyyəsi əsasında qəbul edilib. Əgər tətbiq gələcəkdə:

- paylaşılan cihazlarda işləyəcəksə,
- bir backend/server ilə sinxronlaşacaqsa,
- ya da App Store/Play Store-a həssas kredensial saxlayan tətbiq kimi çıxacaqsa,

bu siyahı **yenidən nəzərdən keçirilməli** və ən azı #1 (plaintext
şifrələr) və #2 (clipboard) maddələri prioritet olaraq düzəldilməlidir.
