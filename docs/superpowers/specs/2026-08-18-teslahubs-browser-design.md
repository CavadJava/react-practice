# teslahubs.browser — Tab-Based Mini Browser App

## Məqsəd

HTML/CSS/JS ilə hazırlanan, tab arasında keçəndə donma/ilişmə olmayan bir mini-browser app. Ayrı repoda: `https://github.com/CavadJava/teslahubs.browser`.

## Skop

- Maksimum 3 tab
- Hər tab iframe daxilində xarici sayt göstərir
- Tam mini-browser UI: tab bar, address bar, geri/irəli/refresh
- Node.js proxy server, iframe-blok edən saytları (X-Frame-Options/CSP) keçmək üçün

## Arxitektura

### Backend: `server.js` (Node.js/Express)

- Endpoint: `GET /proxy?url=<encoded-target-url>`
- Hədəf URL-i fetch edir (Node `fetch` və ya `axios`)
- Cavab başlıqlarından `X-Frame-Options` və `Content-Security-Policy`-nin `frame-ancestors` direktivini çıxarır/təmizləyir
- HTML cavabına `<base href="<hədəf-origin>">` inject edir ki, nisbi linklər (CSS/JS/img) düzgün işləsin
- Alt-resurs sorğuları da eyni `/proxy` endpoint-dən keçir (browser öz-özünə nisbi URL-ləri `<base>` ilə tam URL-ə çevirir, sonra onlar da proxy-dən keçməlidir — buna görə frontend-də bir service-worker və ya server-də sadə path-based proxy rewrite tələb oluna bilər; ilk versiyada `<base>` + tam-proxy-URL-lərə sadə string-rewrite CSS/HTML daxilində kifayət edəcək)
- Timeout: 10s, fetch uğursuz olarsa JSON xəta qaytarır

### Frontend: `public/`

- `index.html` — tab bar + address bar + iframe container skeletonu
- `app.js`:
  - Tab state: `{ id, url, title, history: [], historyIndex }` massivi, max 3 element
  - Hər tab üçün bir `<iframe>` yaradılır və **heç vaxt DOM-dan silinmir** — yalnız `.active` class ilə göstərilir/gizlədilir (`display:none` deyil, `visibility:hidden` + `position:absolute` ki, render dayanmasın)
  - Yeni tab: boş/başlanğıc səhifə ilə açılır, 4-cü tab cəhdində xəbərdarlıq (`alert` və ya inline banner) göstərilir, tab açılmır
  - Address bar submit → aktiv tabın iframe `src`-i `/proxy?url=...` olaraq təyin olunur, history-ə əlavə olunur
  - Geri/irəli → `historyIndex` dəyişir, iframe `src` yenilənir
- `style.css` — browser-chrome görünüşü (tab bar, address bar, aktiv/qeyri-aktiv tab stilləri)

## Donma qarşısı əsas qərar

3 iframe də DOM-da daim mövcuddur. Tab keçidi sırf CSS görünürlük dəyişikliyidir — heç bir iframe reload olunmur, JS state/scroll mövqeyi saxlanılır.

## Xəta idarəsi

- Proxy fetch uğursuz (404/timeout/DNS) → həmin tabın iframe-i daxilində sadə xəta mesajı göstərilir (proxy `/proxy` endpoint-i xəta halında minimal HTML error page qaytarır), digər tablara təsir etmir.

## Test planı

- Manual: 3 fərqli sayt aç, aralarında sürətli keçid et, reload/donma olmadığını yoxla
- Manual: adətən iframe-bloklayan sayt (məs. YouTube) proxy ilə açılsın
- Manual: 4-cü tab açma cəhdi bloklanır
- Manual: proxy server dayandıqda tablar xəta göstərir, app çökmür

## Skopdan kənar (bu versiyada yox)

- Server-side session/auth
- Cookie/login tələb edən saytların tam dəstəyi (proxy sadə GET HTML üçündür)
- Production deploy (VPS) — hazırda yalnız lokal `npm start`
