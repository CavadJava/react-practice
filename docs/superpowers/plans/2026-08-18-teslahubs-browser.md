# teslahubs.browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tab-based mini-browser web app (max 3 tabs) where switching tabs never reloads or freezes content, using a Node.js proxy to bypass iframe-blocking headers.

**Architecture:** A vanilla HTML/CSS/JS frontend renders a browser chrome (tab bar, address bar, back/forward/refresh) and keeps one `<iframe>` per tab permanently mounted in the DOM, toggling visibility with CSS only. An Express backend proxies all iframe traffic through `/proxy?url=...`, stripping `X-Frame-Options`/`frame-ancestors` CSP headers and rewriting resource URLs so third-party pages (including ones that normally refuse to be framed) render inside the app.

**Tech Stack:** Node.js (v18+), Express, `node-fetch` (or built-in `fetch`), vanilla JS/HTML/CSS (no frontend framework), `cheerio` for HTML rewriting.

## Global Constraints

- Repo: `https://github.com/CavadJava/teslahubs.browser`, local clone at `/Users/frontend/workspace/me-github/teslahubs.browser`
- Max 3 tabs — a 4th tab attempt is blocked with a visible message, no tab is created
- All 3 tabs' iframes stay mounted in the DOM at all times; tab switch is CSS-only (no `src` reset, no iframe re-creation)
- Proxy fetch timeout: 10 seconds
- No server-side session/auth, no cookie-login support — proxy handles simple GET HTML pages only
- No production deploy in this plan — local `npm start` only

---

## File Structure

```
teslahubs.browser/
  package.json
  server.js                  # Express app: static file serving + /proxy route
  lib/
    proxy.js                 # fetch + header stripping + HTML rewriting logic
  public/
    index.html                # app shell: tab bar, address bar, iframe container
    style.css                 # browser-chrome styling
    app.js                     # tab state, iframe pool, address bar/back/forward wiring
  test/
    proxy.test.js              # unit tests for lib/proxy.js (header stripping, URL rewriting)
  .gitignore
  README.md
```

`lib/proxy.js` is isolated from `server.js` so the header-stripping/URL-rewriting logic can be unit tested without spinning up a real HTTP server.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Produces: an `npm install`-able project with `npm start` and `npm test` scripts defined; later tasks assume `express`, `node-fetch`, `cheerio` are dependencies and `jest` (or `node:test`) is the test runner.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "teslahubs-browser",
  "version": "1.0.0",
  "description": "Tab-based mini-browser with iframe proxy",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node --test test/"
  },
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.2",
    "node-fetch": "^3.3.2",
    "cheerio": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 3: Create `README.md`**

```markdown
# teslahubs.browser

Tab-based mini-browser web app. Max 3 tabs, no freeze on tab switch — each
tab's iframe stays mounted in the DOM and is toggled with CSS only.

## Run

\`\`\`bash
npm install
npm start
\`\`\`

Then open http://localhost:3000
```

- [ ] **Step 4: Install dependencies**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm install`
Expected: `node_modules/` created, `package-lock.json` created, no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add package.json package-lock.json .gitignore README.md
git commit -m "chore: scaffold project"
```

---

### Task 2: Proxy logic (`lib/proxy.js`) — header stripping and URL rewriting

**Files:**
- Create: `lib/proxy.js`
- Test: `test/proxy.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure module, only depends on `node-fetch`, `cheerio`)
- Produces:
  - `async function fetchProxied(targetUrl)` → returns `{ status: number, contentType: string, body: string }` on success, or throws an `Error` with `.code` set to one of `'TIMEOUT' | 'FETCH_FAILED'`
  - `function stripFrameHeaders(headers)` → takes a `Headers`-like object (or plain object), returns a plain object with `x-frame-options` and `content-security-policy` removed (case-insensitive keys)
  - `function rewriteHtml(html, baseUrl, proxyPrefix)` → takes raw HTML string, the original page's absolute URL, and a proxy path prefix (e.g. `/proxy?url=`); returns HTML string with a `<base>` tag injected pointing at `baseUrl`'s origin, and all `<a href>`, `<link href>`, `<script src>`, `<img src>` absolute/relative URLs rewritten to go through `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`

- [ ] **Step 1: Write the failing tests**

Create `test/proxy.test.js`:

```javascript
const { test } = require('node:test');
const assert = require('node:assert');
const { stripFrameHeaders, rewriteHtml } = require('../lib/proxy');

test('stripFrameHeaders removes x-frame-options and content-security-policy', () => {
  const input = {
    'x-frame-options': 'DENY',
    'content-security-policy': "frame-ancestors 'self'",
    'content-type': 'text/html'
  };
  const result = stripFrameHeaders(input);
  assert.strictEqual(result['x-frame-options'], undefined);
  assert.strictEqual(result['content-security-policy'], undefined);
  assert.strictEqual(result['content-type'], 'text/html');
});

test('stripFrameHeaders is case-insensitive', () => {
  const input = {
    'X-Frame-Options': 'SAMEORIGIN',
    'Content-Type': 'text/html'
  };
  const result = stripFrameHeaders(input);
  assert.strictEqual(Object.keys(result).some(k => k.toLowerCase() === 'x-frame-options'), false);
});

test('rewriteHtml injects a base tag pointing at the origin', () => {
  const html = '<html><head></head><body>hi</body></html>';
  const out = rewriteHtml(html, 'https://example.com/page', '/proxy?url=');
  assert.ok(out.includes('<base href="https://example.com/">'));
});

test('rewriteHtml rewrites relative script src through the proxy prefix', () => {
  const html = '<html><head><script src="/app.js"></script></head><body></body></html>';
  const out = rewriteHtml(html, 'https://example.com/page', '/proxy?url=');
  const expected = '/proxy?url=' + encodeURIComponent('https://example.com/app.js');
  assert.ok(out.includes(expected), `expected to find ${expected} in ${out}`);
});

test('rewriteHtml rewrites absolute link href through the proxy prefix', () => {
  const html = '<html><head><link href="https://cdn.example.com/style.css"></head></html>';
  const out = rewriteHtml(html, 'https://example.com/page', '/proxy?url=');
  const expected = '/proxy?url=' + encodeURIComponent('https://cdn.example.com/style.css');
  assert.ok(out.includes(expected));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && node --test test/proxy.test.js`
Expected: FAIL — `Cannot find module '../lib/proxy'`

- [ ] **Step 3: Write minimal implementation**

Create `lib/proxy.js`:

```javascript
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const FRAME_BLOCKING_HEADERS = new Set(['x-frame-options', 'content-security-policy']);

function stripFrameHeaders(headers) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!FRAME_BLOCKING_HEADERS.has(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return result;
}

function toAbsolute(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

function rewriteHtml(html, baseUrl, proxyPrefix) {
  const $ = cheerio.load(html);
  const origin = new URL(baseUrl).origin + '/';

  if ($('head base').length === 0) {
    $('head').prepend(`<base href="${origin}">`);
  }

  const attrByTag = {
    a: 'href',
    link: 'href',
    script: 'src',
    img: 'src'
  };

  for (const [tag, attr] of Object.entries(attrByTag)) {
    $(tag).each((_, el) => {
      const raw = $(el).attr(attr);
      if (!raw || raw.startsWith('data:') || raw.startsWith('#')) return;
      const absolute = toAbsolute(raw, baseUrl);
      if (!absolute) return;
      $(el).attr(attr, `${proxyPrefix}${encodeURIComponent(absolute)}`);
    });
  }

  return $.html();
}

async function fetchProxied(targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(targetUrl, { signal: controller.signal });
    const body = await response.text();
    return {
      status: response.status,
      contentType: response.headers.get('content-type') || 'text/html',
      body
    };
  } catch (err) {
    const error = new Error(`Failed to fetch ${targetUrl}: ${err.message}`);
    error.code = err.name === 'AbortError' ? 'TIMEOUT' : 'FETCH_FAILED';
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchProxied, stripFrameHeaders, rewriteHtml };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && node --test test/proxy.test.js`
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add lib/proxy.js test/proxy.test.js
git commit -m "feat: add proxy header-stripping and HTML-rewriting logic"
```

---

### Task 3: Express server with `/proxy` route

**Files:**
- Create: `server.js`
- Test: `test/server.test.js`

**Interfaces:**
- Consumes: `fetchProxied`, `stripFrameHeaders`, `rewriteHtml` from `lib/proxy.js` (Task 2)
- Produces: an Express app exported as `module.exports = app` from `server.js` for testability, with:
  - `GET /proxy?url=<encoded-url>` → proxies the target, strips frame headers, rewrites HTML, responds with `text/html`
  - Missing/invalid `url` query param → responds `400` with JSON `{ error: 'missing or invalid url parameter' }`
  - Upstream fetch failure/timeout → responds `502` with a minimal HTML error page (so it renders inside the tab's iframe instead of a raw JSON blob)
  - Serves `public/` as static files at `/`
  - When run directly (`node server.js`), listens on `process.env.PORT || 3000`

- [ ] **Step 1: Write the failing tests**

Create `test/server.test.js`:

```javascript
const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../server');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function get(server, path) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

test('GET /proxy without url param returns 400', async () => {
  const server = await startServer();
  const res = await get(server, '/proxy');
  assert.strictEqual(res.status, 400);
  const parsed = JSON.parse(res.body);
  assert.strictEqual(parsed.error, 'missing or invalid url parameter');
  server.close();
});

test('GET /proxy with invalid url param returns 400', async () => {
  const server = await startServer();
  const res = await get(server, '/proxy?url=not-a-url');
  assert.strictEqual(res.status, 400);
  server.close();
});

test('GET / serves the static index.html', async () => {
  const server = await startServer();
  const res = await get(server, '/');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.includes('<html'));
  server.close();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && node --test test/server.test.js`
Expected: FAIL — `Cannot find module '../server'` (or 404 on `/` since `public/index.html` doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

Create `server.js`:

```javascript
const express = require('express');
const path = require('node:path');
const { fetchProxied, stripFrameHeaders, rewriteHtml } = require('./lib/proxy');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'missing or invalid url parameter' });
  }

  try {
    const { status, contentType, body } = await fetchProxied(parsed.href);
    const headers = stripFrameHeaders({ 'content-type': contentType });

    let responseBody = body;
    if (contentType.includes('text/html')) {
      responseBody = rewriteHtml(body, parsed.href, '/proxy?url=');
    }

    res.status(status).set(headers).send(responseBody);
  } catch (err) {
    res.status(502).set({ 'content-type': 'text/html' }).send(
      `<html><body><p>Could not load page: ${err.message}</p></body></html>`
    );
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`teslahubs.browser listening on :${port}`));
}

module.exports = app;
```

Also create a minimal placeholder `public/index.html` so the static-file test passes (full UI comes in Task 4):

```html
<!doctype html>
<html>
<head><title>teslahubs.browser</title></head>
<body>Loading...</body>
</html>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && node --test test/server.test.js`
Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add server.js test/server.test.js public/index.html
git commit -m "feat: add Express server with /proxy route"
```

---

### Task 4: Browser chrome UI — tab bar, address bar, iframe pool

**Files:**
- Modify: `public/index.html`
- Create: `public/style.css`
- Create: `public/app.js`

**Interfaces:**
- Consumes: `/proxy?url=<encoded-url>` route from Task 3
- Produces: a working UI. No later task depends on this one's internals — it's the top of the stack. Internal contract used within this task:
  - Tab state shape: `{ id: string, url: string | null, title: string, history: string[], historyIndex: number }`
  - Global array `tabs` (max length 3), `activeTabId` string
  - `function createTab()`, `function closeTab(id)`, `function activateTab(id)`, `function navigate(id, url)`, `function goBack(id)`, `function goForward(id)` — all defined in `app.js`

- [ ] **Step 1: Write `public/index.html`**

```html
<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <title>teslahubs.browser</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div id="chrome">
    <div id="tab-bar">
      <div id="tabs"></div>
      <button id="new-tab-btn" title="Yeni tab">+</button>
    </div>
    <div id="nav-bar">
      <button id="back-btn" title="Geri">&#8592;</button>
      <button id="forward-btn" title="İrəli">&#8594;</button>
      <button id="refresh-btn" title="Yenilə">&#8635;</button>
      <input id="address-bar" type="text" placeholder="URL daxil edin (məs. https://example.com)">
      <button id="go-btn">Get</button>
    </div>
    <div id="tab-limit-banner" hidden>Maksimum 3 tab icazə verilir. Yeni tab açmaq üçün əvvəlcə birini bağlayın.</div>
  </div>
  <div id="iframe-container"></div>
  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `public/style.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; font-family: system-ui, sans-serif; }

#chrome {
  background: #2b2b2b;
  color: #eee;
  padding: 6px 8px;
}

#tab-bar { display: flex; align-items: center; gap: 4px; }
#tabs { display: flex; gap: 4px; flex: 1; overflow-x: auto; }

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #3c3c3c;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab.active { background: #555; font-weight: bold; }
.tab .close-btn { margin-left: auto; opacity: 0.7; }
.tab .close-btn:hover { opacity: 1; }

#new-tab-btn, #back-btn, #forward-btn, #refresh-btn, #go-btn {
  background: #444;
  color: #eee;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
}

#nav-bar { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
#address-bar { flex: 1; padding: 6px 10px; border-radius: 4px; border: none; }

#tab-limit-banner {
  background: #7a2e2e;
  color: #fff;
  padding: 6px 10px;
  margin-top: 6px;
  border-radius: 4px;
}

#iframe-container { position: relative; height: calc(100% - 96px); }

.tab-frame {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border: none;
  visibility: hidden;
}

.tab-frame.active { visibility: visible; }
```

- [ ] **Step 3: Write `public/app.js`**

```javascript
const PROXY_PREFIX = '/proxy?url=';
const MAX_TABS = 3;

const tabs = [];
let activeTabId = null;
let nextTabNum = 1;

const tabsEl = document.getElementById('tabs');
const newTabBtn = document.getElementById('new-tab-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const addressBar = document.getElementById('address-bar');
const goBtn = document.getElementById('go-btn');
const limitBanner = document.getElementById('tab-limit-banner');
const iframeContainer = document.getElementById('iframe-container');

function makeTabId() {
  return 'tab-' + (nextTabNum++);
}

function createTab() {
  if (tabs.length >= MAX_TABS) {
    limitBanner.hidden = false;
    return null;
  }
  limitBanner.hidden = true;

  const id = makeTabId();
  const tab = { id, url: null, title: 'Yeni tab', history: [], historyIndex: -1 };
  tabs.push(tab);

  const iframe = document.createElement('iframe');
  iframe.className = 'tab-frame';
  iframe.id = 'frame-' + id;
  iframeContainer.appendChild(iframe);

  renderTabBar();
  activateTab(id);
  return id;
}

function closeTab(id) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tabs.splice(idx, 1);

  const frame = document.getElementById('frame-' + id);
  if (frame) frame.remove();

  limitBanner.hidden = true;

  if (activeTabId === id) {
    const next = tabs[idx] || tabs[idx - 1];
    if (next) activateTab(next.id);
    else activeTabId = null;
  }
  renderTabBar();
}

function activateTab(id) {
  activeTabId = id;
  for (const tab of tabs) {
    const frame = document.getElementById('frame-' + tab.id);
    frame.classList.toggle('active', tab.id === id);
  }
  const tab = getTab(id);
  addressBar.value = tab.url || '';
  updateNavButtons();
  renderTabBar();
}

function getTab(id) {
  return tabs.find((t) => t.id === id);
}

function navigate(id, url) {
  const tab = getTab(id);
  if (!tab) return;

  let absoluteUrl = url;
  if (!/^https?:\/\//i.test(absoluteUrl)) {
    absoluteUrl = 'https://' + absoluteUrl;
  }

  tab.history = tab.history.slice(0, tab.historyIndex + 1);
  tab.history.push(absoluteUrl);
  tab.historyIndex = tab.history.length - 1;
  tab.url = absoluteUrl;
  tab.title = absoluteUrl;

  const frame = document.getElementById('frame-' + id);
  frame.src = PROXY_PREFIX + encodeURIComponent(absoluteUrl);

  if (id === activeTabId) {
    addressBar.value = absoluteUrl;
    updateNavButtons();
  }
  renderTabBar();
}

function goBack(id) {
  const tab = getTab(id);
  if (!tab || tab.historyIndex <= 0) return;
  tab.historyIndex -= 1;
  applyHistoryEntry(tab);
}

function goForward(id) {
  const tab = getTab(id);
  if (!tab || tab.historyIndex >= tab.history.length - 1) return;
  tab.historyIndex += 1;
  applyHistoryEntry(tab);
}

function applyHistoryEntry(tab) {
  const url = tab.history[tab.historyIndex];
  tab.url = url;
  const frame = document.getElementById('frame-' + tab.id);
  frame.src = PROXY_PREFIX + encodeURIComponent(url);
  if (tab.id === activeTabId) {
    addressBar.value = url;
    updateNavButtons();
  }
}

function refresh(id) {
  const tab = getTab(id);
  if (!tab || !tab.url) return;
  const frame = document.getElementById('frame-' + id);
  frame.src = PROXY_PREFIX + encodeURIComponent(tab.url);
}

function updateNavButtons() {
  const tab = getTab(activeTabId);
  if (!tab) {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    return;
  }
  backBtn.disabled = tab.historyIndex <= 0;
  forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
}

function renderTabBar() {
  tabsEl.innerHTML = '';
  for (const tab of tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');
    el.textContent = tab.title;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'x';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    el.appendChild(closeBtn);
    el.addEventListener('click', () => activateTab(tab.id));
    tabsEl.appendChild(el);
  }
}

newTabBtn.addEventListener('click', createTab);

goBtn.addEventListener('click', () => {
  if (activeTabId && addressBar.value.trim()) {
    navigate(activeTabId, addressBar.value.trim());
  }
});

addressBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && activeTabId && addressBar.value.trim()) {
    navigate(activeTabId, addressBar.value.trim());
  }
});

backBtn.addEventListener('click', () => activeTabId && goBack(activeTabId));
forwardBtn.addEventListener('click', () => activeTabId && goForward(activeTabId));
refreshBtn.addEventListener('click', () => activeTabId && refresh(activeTabId));

createTab();
```

- [ ] **Step 4: Manual verification**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm start`

Open `http://localhost:3000` in a browser and verify:
1. One tab is open by default
2. Typing a URL (e.g. `example.com`) and pressing Enter loads it inside the tab
3. Opening 2 more tabs (3 total) works; a 4th tab attempt shows the limit banner and does not create a tab
4. Switching between tabs is instant with no reload (check Network tab in devtools — no new request fires on tab switch, only on navigate)
5. Back/forward buttons work after navigating to 2+ URLs in one tab
6. Closing a tab removes it and its iframe from the DOM

Stop the server with Ctrl+C when done.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add public/index.html public/style.css public/app.js
git commit -m "feat: add tab-bar/address-bar UI with persistent iframe pool"
```

---

### Task 5: End-to-end manual verification against real-world blocked sites

**Files:**
- None (verification-only task, no code changes expected unless a bug is found)

**Interfaces:**
- Consumes: full app from Tasks 1–4
- Produces: confirmation the spec's test plan passes, or bug-fix commits if it doesn't

- [ ] **Step 1: Start the server**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm start`

- [ ] **Step 2: Verify a normally iframe-blocking site loads through the proxy**

In the app's address bar, navigate a tab to `https://www.wikipedia.org` (a site with permissive framing, to confirm the pipeline end-to-end first). Confirm the page renders inside the iframe with visible content (not a blank frame).

Then try a site known to send `X-Frame-Options: DENY` in normal (non-proxied) browsing, e.g. `https://www.google.com`. Confirm it renders inside the tab instead of being blocked — this validates the header-stripping in Task 2/3 actually works against a real adversarial target, not just the unit-test fixtures.

- [ ] **Step 3: Verify 3-tab limit and rapid tab switching under real load**

Open 3 tabs, each pointed at a different real site. Switch between them rapidly (10+ times). Confirm via browser devtools Network tab that no new HTTP requests fire during switching — only CSS visibility changes.

- [ ] **Step 4: Verify proxy failure handling**

Navigate a tab to an unreachable address, e.g. `http://localhost:9999/nonexistent`. Confirm the tab shows the minimal HTML error page from `server.js`'s 502 handler instead of crashing the app or leaving the tab blank forever.

- [ ] **Step 5: Fix any bugs found, then final commit**

If Steps 2–4 reveal bugs (e.g. a resource type Task 2's `rewriteHtml` doesn't cover, like `<form action>` or CSS `@import`/`url()` references), fix them in `lib/proxy.js` or `public/app.js`, re-run the relevant unit tests (`node --test test/`), re-verify manually, then commit:

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add -A
git commit -m "fix: address issues found in end-to-end verification"
```

If no bugs are found, no commit is needed for this task.

---

## Self-Review Notes

- **Spec coverage:** proxy server (Task 2/3), max-3-tabs UI (Task 4), always-mounted iframes toggled by CSS (Task 4), full mini-browser chrome — address bar + back/forward/refresh (Task 4), error handling per-tab (Task 3 step 3 + Task 5 step 4), manual test plan from spec (Task 5) — all covered.
- **Out of scope per spec** (not included, correctly): server-side session/auth, cookie-login support, production VPS deploy.
- **Type/name consistency checked:** `fetchProxied`/`stripFrameHeaders`/`rewriteHtml` signatures match between Task 2 definition and Task 3 usage; `PROXY_PREFIX` value `/proxy?url=` matches the route defined in Task 3 and the prefix argument used in Task 2's `rewriteHtml` tests.
