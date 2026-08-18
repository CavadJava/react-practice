# EV Sound FX — Copy Rewrite Spec

**Tarix:** 2026-08-18
**Mənbə sayt:** https://evsoundfx.com/
**Məqsəd:** Mövcud saytın mətn kontentini (copy) konversiyanı artırmaq üçün yenidən yazmaq — struktur və dizayn dəyişmir, yalnız mətn.

## 1. Analiz — Mövcud vəziyyət

### Nə satırlar
EV Sound FX — elektrikli avtomobillər üçün abunəlik əsaslı (subscription) audio-effekt xidməti. Fiziki avadanlıq deyil, brauzer tabında işləyən proqram: real sürətə və viteslərə reaksiya verən mühərrik/jet/sci-fi səs effektləri yaradır.

### Texniki quruluş (script analizindən)
- Netlify-də host olunan tək-səhifəli JS tətbiq (React deyil, vanilla JS moduller)
- Stripe `pricing-table.js` — checkout
- Endorsely `endorsely.js` — affiliate tracking
- ~19 xüsusi modul: `engine-synth.js`, `studio-engine.js` (səs sintezi), `gps-service.js`, `eco-trip.js`, `eco-hud.js` (real-time GPS-based eco tracking), `badges.js`/`badges-ui.js` (gamification), `paywall.js` (abunə qapısı), `vehicle-profiles.js`, `speed-smoothing.js`
- Bu, sadəcə statik marketinq səhifəsi deyil — canlı interaktiv demo (Test Me/Rev düymələri, MPH/RPM göstəricisi) əsas diqqət mərkəzidir

### Mövcud mətn (tam çıxarılmış)
- **Title/meta:** "EV Sound FX — Bring Your EV To Life" / "Turn your EV's silence into an engine, jet, or sci-fi soundscape that reacts to your real speed and gear shifts."
- **Pricing:** Monthly $9.99/mo, Yearly $79.99/yr ("Just $6.67/mo — save 33%"), "Best Value" badge yearly-də
- **Dəyər çərçivəsi:** "Other exhaust sound systems start at $1,200+ in hardware alone — before installation. Get the full EV Sound FX experience, and more, for less than the cost of a tank of gas. Per month."
- **4 xüsusiyyət bulleti:** 15+ sound effects / Sound Studio / Eco Efficiency HUD / Constant updates
- **Affiliate CTA:** "💸 Love it, share it to get paid — Become an affiliate — grab your referral link"
- **Restore CTA:** "Already subscribed? Restore access"
- **Demo copy:** "Tap Test Me for the idle — hold Rev to hear it climb." + "CALM DRIVE" status label
- **Xəbərdarlıq:** "Keep this tab/screen active while driving — some browsers pause audio and sensors when fully backgrounded."

### Ən böyük boşluq
**Sosial sübut yoxdur** — heç bir rəy, istifadəçi sayı, reytinq, testimonial və ya trust nişanı səhifədə görünmür. Yalnız qiymət müqayisəsi ($1,200+ hardware vs abunə) etibar yaratmaq üçün istifadə olunur.

## 2. Rewrite əhatəsi

Struktur və layout **dəyişmir** (bu, bir konversiya audit deyil, copy tapşırığıdır). Yenidən yazılacaq mətn blokları:

1. **Hero** — başlıq + alt-başlıq (hazırkı "Bring Your EV To Life")
2. **Dəyər/pricing çərçivəsi** — $1,200+ müqayisə cümləsi, "tank of gas" analogiyası
3. **4 xüsusiyyət bulleti** — hər biri üçün başlıq + bir sətir izah
4. **Demo bölməsi mikro-copy** — "Tap Test Me..." təlimatı, "CALM DRIVE" statusu
5. **Affiliate CTA bloku**
6. **SEO meta** — `<title>`, `og:title`, `og:description`, meta description
7. **YENİ: Sosial sübut bloku** — mövcud saytda yoxdur, layihəyə əlavə ediləcək bir-iki cümləlik trust-signal copy (məs. istifadəçi sayı/reytinq üçün yer tutucu struktur — real rəqəm olmadan, ümumi "growing community of EV owners" tərzi ifadə, çünki real testimonial data yoxdur)

**Əhatə xaricində:** dizayn/layout dəyişikliyi, yeni səhifələr, çoxdilli versiya, backend/kod dəyişikliyi.

## 3. Ton və mesajlaşma istiqaməti

- **Saxlanılan:** "playful yet functional" — hazırkı yüngül, əyləncəli amma praktiki ton effektiv işləyir və EV həvəskarları auditoriyasına uyğundur
- **Gücləndirilən:**
  - Aciliyyət/emosional qarmaq hero-da daha güclü ("səssizliyi həyata çevir" konsepti saxlanılır, amma daha vivid dil)
  - Dəyər müqayisəsi daha kəskin kontrast ilə (rəqəm vs rəqəm)
  - CTA-lar passiv deyil, fəaliyyətə çağıran daha güclü feil ilə
  - Xüsusiyyət bulletləri fayda-yönümlü (nə etdiyi yox, istifadəçiyə nə verdiyi)

## 4. Çatdırılacaq (Deliverable)

Tək bir sənəd: **`evsoundfx-copy-v2.md`** — hər bir mövcud mətn bloku üçün:
- Orijinal mətn (referens üçün)
- Yeni təklif olunan mətn (ingilis dilində, sayt öz dilində olduğu üçün)
- Qısa əsaslandırma (nə üçün dəyişdi, 1 cümlə)

SEO meta blokları ayrıca qeyd olunacaq (title/description/og tags).

## 5. Uğur meyarı

- Bütün 7 blok üçün alternativ copy təklif olunub
- Original brend tonu qorunub, süni/generic "marketing speak" yoxdur
- Real, saytda mövcud olmayan məlumat (məs. konkret istifadəçi sayı, dəqiq reytinq) uydurulmayıb — yalnız ümumi, təsdiqlənə bilən dildə yazılıb
