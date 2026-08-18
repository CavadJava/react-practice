# teslahubs.browser — Electron/webview mode

## Məqsəd

Mövcud `teslahubs.browser` layihəsinə (iframe+proxy əsaslı) alternativ bir işə salma rejimi əlavə etmək: Electron desktop app, hər tab öz native `<webview>`-i ilə. Bu, iframe+proxy yanaşmasının kök problemini — Google kimi JS-heavy saytların form/JS-based naviqasiyasının server-side HTML-rewrite proxy-ni bypass etməsi (form submit real Google origininə düşür, `X-Frame-Options` yenidən effektiv olur) — kökündən aradan qaldırır, çünki `<webview>` iframe deyil, native browser instansıdır və heç bir sayt onu embedding-based həllərdə olduğu kimi bloklaya bilmir.

## Skop

- Mövcud `server.js`, `lib/proxy.js`, `public/` (browser rejimi) **toxunulmadan qalır** — iki rejim paralel yaşayır
- Yeni `electron/` qovluğu: Electron main process + minimal preload
- `public/app.js` runtime-da hansı rejimdə olduğunu aşkarlayır (`window.isElectron`/`navigator.userAgent` yoxlaması və ya Electron-un inject etdiyi bir global) və ona görə ya `<iframe src="/proxy?url=...">` (browser rejimi), ya da `<webview src="https://...">` (Electron rejimi, birbaşa URL, proxy-siz) yaradır
- Max 3 tab, hər `<webview>` daim DOM-da qalır, tab keçidi CSS-only — eyni prinsip browser rejimi ilə

## Arxitektura

### `electron/main.js`

- `app.whenReady()` → `BrowserWindow` yaradır, `webPreferences: { webviewTag: true, contextIsolation: true, nodeIntegration: false }`
- Pəncərə `public/index.html`-i fayl protokolu ilə (`loadFile`) yükləyir — Express server-ə ehtiyac yoxdur bu rejimdə
- Standart Electron lifecycle: `window-all-closed` → `app.quit()` (macOS xaric), `activate` → yeni pəncərə yaratma

### `electron/preload.js`

- Minimal: `contextBridge.exposeInMainWorld('teslahubsBrowser', { isElectron: true })` — `public/app.js`-in rejim aşkarlaması üçün etibarlı bir bayraq

### `public/app.js` dəyişiklikləri

- Fayl başında: `const IS_ELECTRON = typeof window.teslahubsBrowser !== 'undefined' && window.teslahubsBrowser.isElectron;`
- `createTab()`: `document.createElement(IS_ELECTRON ? 'webview' : 'iframe')`
- `navigate()`, `applyHistoryEntry()`, `refresh()`: `frame.src` təyin edilən yerlərdə, Electron rejimində `PROXY_PREFIX + encodeURIComponent(url)` əvəzinə birbaşa `url` yazılır
- CSS class-ları (`tab-frame`, `active`) hər iki tag üçün eyni işləyir — `style.css`-də `.tab-frame` selector-u `iframe.tab-frame, webview.tab-frame` olaraq genişlənir

### `package.json` dəyişiklikləri

- `devDependencies`-ə `electron` əlavə olunur
- Yeni script: `"electron:start": "electron electron/main.js"`

## Xəta idarəsi

- `<webview>`-in öz `did-fail-load` event-i varsa, minimal bir listener əlavə oluna bilər (konsola log) — bu versiyada UI-də əlavə error-page göstərmə tələb olunmur (native webview öz error səhifəsini göstərir, məs. Chromium-un "This site can't be reached")

## Test planı

- Manual: `npm run electron:start` ilə app-ı aç
- 3 tab aç, hər birində fərqli sayt (Google daxil)
- Google-da axtarış et, nəticə səhifəsinin problemsiz (proxy-bypass xətası olmadan) açıldığını təsdiqlə
- Tab-lar arası sürətli keçid, heç bir reload/donma olmadığını yoxla (native webview-lər üçün də eyni CSS-only prinsip tətbiq olunur)
- Browser rejiminin (`npm start`) hələ də işlədiyini təsdiqlə — regressiya yoxdur

## Skopdan kənar (bu versiyada yox)

- Electron app-ın paketlənməsi/distribution (electron-builder və s.) — yalnız `npm run electron:start` ilə lokal işə salma
- Preload vasitəsilə əlavə native funksionallıq (fayl sistemi, bildirişlər və s.)
- `<webview>`-ə xas performans tənzimləmələri (partition, session isolation)
