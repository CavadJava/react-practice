# teslahubs.browser Electron/webview Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second run mode to teslahubs.browser — an Electron desktop app where each tab is a native `<webview>` instead of an iframe, eliminating the iframe+proxy pipeline's vulnerability to JS-driven navigation bypassing the proxy (the root cause of the Google-search-breaks-out-of-proxy bug).

**Architecture:** A new `electron/` directory holds a minimal Electron main process that loads the existing `public/index.html` via `loadFile` (no Express server involved in this mode). A preload script exposes `window.teslahubsBrowser.isElectron = true` so `public/app.js` can detect Electron at runtime. `app.js` is modified (not duplicated) to branch on that flag: in Electron mode it creates `<webview>` elements with direct `src` URLs (no `/proxy?url=` prefix); in browser mode, behavior is byte-for-byte unchanged from what exists today.

**Tech Stack:** Electron (devDependency), same vanilla JS/HTML/CSS frontend, no new frontend framework.

## Global Constraints

- The existing browser mode (`npm start`, iframe + Express proxy) must keep working unmodified — this plan only adds a parallel mode, never removes or breaks the existing one
- Max 3 tabs — same limit, same enforcement logic, in both modes
- Every tab's content element (`<iframe>` in browser mode, `<webview>` in Electron mode) stays permanently mounted in the DOM; tab switch is CSS-only in both modes
- Electron mode uses `contextIsolation: true`, `nodeIntegration: false`, `webviewTag: true` in `webPreferences` — no Node access exposed to loaded web content
- Electron mode does not use the proxy — `<webview>` `src` is set directly to the target URL, unencoded, no `/proxy?url=` prefix
- No packaging/distribution (electron-builder etc.) in this plan — `npm run electron:start` only

---

## File Structure

```
teslahubs.browser/
  package.json                # MODIFY: add electron devDependency + electron:start script
  electron/
    main.js                   # NEW: Electron main process
    preload.js                 # NEW: exposes window.teslahubsBrowser.isElectron
  public/
    index.html                 # unchanged
    style.css                  # MODIFY: extend .tab-frame selector to cover webview
    app.js                     # MODIFY: branch on IS_ELECTRON for element creation + src assignment
  test/
    proxy.test.js               # unchanged
    server.test.js              # unchanged
```

`electron/main.js` and `electron/preload.js` are new, isolated files — they don't touch `server.js` or `lib/proxy.js` at all, keeping the two modes' backends fully independent.

---

### Task 1: Electron main process and preload script

**Files:**
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Modify: `package.json` (add `electron` devDependency, add `electron:start` script)

**Interfaces:**
- Consumes: `public/index.html` (existing, unchanged) as the window's loaded content
- Produces: a `window.teslahubsBrowser.isElectron === true` global available to `public/app.js` when running under Electron (Task 2 consumes this)

- [ ] **Step 1: Add the `electron` devDependency and `electron:start` script**

Read the current `package.json` first (it already has `express`, `cheerio`, `start`, `test`). Add to it:

```json
{
  "scripts": {
    "start": "node server.js",
    "test": "node --test 'test/*.test.js'",
    "electron:start": "electron electron/main.js"
  },
  "devDependencies": {
    "electron": "^32.0.0"
  }
}
```

Merge this into the existing `package.json` — keep all existing fields (`name`, `version`, `dependencies`, etc.) untouched, only add `devDependencies` and the `electron:start` script line.

- [ ] **Step 2: Install the dependency**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm install`
Expected: `electron` appears under `node_modules/`, `package-lock.json` updates, no errors. This may take a minute (Electron downloads a bundled Chromium binary).

- [ ] **Step 3: Write `electron/main.js`**

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '..', 'public', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 4: Write `electron/preload.js`**

```javascript
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('teslahubsBrowser', {
  isElectron: true
});
```

- [ ] **Step 5: Manual verification**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm run electron:start`

Expected: an Electron window opens showing the existing tab-bar/address-bar UI from `public/index.html` (it will look identical to browser mode at this point — Task 2 makes the tabs actually use `<webview>`). Open the DevTools console in the Electron window (View > Toggle Developer Tools, or right-click > Inspect) and run `window.teslahubsBrowser.isElectron` — expected: `true`.

Close the window when done (Cmd+Q or the window close button).

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add package.json package-lock.json electron/main.js electron/preload.js
git commit -m "feat: add Electron main process and preload script"
```

---

### Task 2: Wire `app.js` to use `<webview>` in Electron mode

**Files:**
- Modify: `public/app.js`
- Modify: `public/style.css`

**Interfaces:**
- Consumes: `window.teslahubsBrowser.isElectron` (from Task 1's preload script; `undefined` in browser mode since that script never loads there)
- Produces: no new exported interface — this is the top of the stack, consumed only by the browser/Electron runtime itself

The current `public/app.js` (read it in full before editing — it's short, ~185 lines) has exactly three places that create or set `src` on a tab's content element:
- `createTab()`: `const iframe = document.createElement('iframe'); iframe.className = 'tab-frame'; iframe.id = 'frame-' + id; iframeContainer.appendChild(iframe);`
- `navigate()`: `frame.src = PROXY_PREFIX + encodeURIComponent(absoluteUrl);`
- `applyHistoryEntry()`: `frame.src = PROXY_PREFIX + encodeURIComponent(url);`
- `refresh()`: `frame.src = PROXY_PREFIX + encodeURIComponent(tab.url);`

- [ ] **Step 1: Add the `IS_ELECTRON` flag and a `setFrameSrc` helper at the top of `public/app.js`**

Add right after the existing `const PROXY_PREFIX = '/proxy?url=';` and `const MAX_TABS = 3;` lines:

```javascript
const IS_ELECTRON = typeof window.teslahubsBrowser !== 'undefined' && window.teslahubsBrowser.isElectron === true;

function setFrameSrc(frame, url) {
  frame.src = IS_ELECTRON ? url : PROXY_PREFIX + encodeURIComponent(url);
}
```

- [ ] **Step 2: Change element creation in `createTab()`**

Find:
```javascript
  const iframe = document.createElement('iframe');
  iframe.className = 'tab-frame';
  iframe.id = 'frame-' + id;
  iframeContainer.appendChild(iframe);
```

Replace with:
```javascript
  const frame = document.createElement(IS_ELECTRON ? 'webview' : 'iframe');
  frame.className = 'tab-frame';
  frame.id = 'frame-' + id;
  iframeContainer.appendChild(frame);
```

(Renamed the local variable `iframe` → `frame` since it's no longer always an iframe; this is just the local var in `createTab()`, other functions already use `frame` as their local name.)

- [ ] **Step 3: Replace the three `frame.src = PROXY_PREFIX + encodeURIComponent(...)` call sites**

In `navigate()`, find:
```javascript
  const frame = document.getElementById('frame-' + id);
  frame.src = PROXY_PREFIX + encodeURIComponent(absoluteUrl);
```
Replace with:
```javascript
  const frame = document.getElementById('frame-' + id);
  setFrameSrc(frame, absoluteUrl);
```

In `applyHistoryEntry()`, find:
```javascript
  const frame = document.getElementById('frame-' + tab.id);
  frame.src = PROXY_PREFIX + encodeURIComponent(url);
```
Replace with:
```javascript
  const frame = document.getElementById('frame-' + tab.id);
  setFrameSrc(frame, url);
```

In `refresh()`, find:
```javascript
  const frame = document.getElementById('frame-' + id);
  frame.src = PROXY_PREFIX + encodeURIComponent(tab.url);
```
Replace with:
```javascript
  const frame = document.getElementById('frame-' + id);
  setFrameSrc(frame, tab.url);
```

- [ ] **Step 4: Update `public/style.css` to cover both tag names**

Find:
```css
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

Replace with:
```css
iframe.tab-frame,
webview.tab-frame {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border: none;
  visibility: hidden;
}

iframe.tab-frame.active,
webview.tab-frame.active { visibility: visible; }
```

(`class` selectors already matched any element regardless of tag, so this change is not strictly required for the CSS to keep working — but `<webview>` is a custom element Chromium sizes specially, and being explicit here documents that both tags are intentionally styled identically. Also: `<webview>` needs `display: flex` internally to fill its bounding box in some Electron versions — add `display: flex;` to the shared rule to be safe.)

Final block:
```css
iframe.tab-frame,
webview.tab-frame {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: flex;
  visibility: hidden;
}

iframe.tab-frame.active,
webview.tab-frame.active { visibility: visible; }
```

- [ ] **Step 5: Manual verification — browser mode unaffected**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm start`

Open `http://localhost:3000`. Verify:
1. Default tab opens, `window.teslahubsBrowser` is `undefined` in the browser devtools console (confirms `IS_ELECTRON` is `false`)
2. Navigating a tab to a URL still works exactly as before (goes through `/proxy?url=...`) — check the Network tab shows a request to `/proxy?url=...`, not a direct request to the target site
3. 3-tab limit, tab switching, back/forward all still work as before

Stop the server (Ctrl+C) when done.

- [ ] **Step 6: Manual verification — Electron mode uses webview with direct URLs**

Run: `cd /Users/frontend/workspace/me-github/teslahubs.browser && npm run electron:start`

In the Electron window:
1. Confirm a tab opens by default and its content element is a `<webview>` — open DevTools (View > Toggle Developer Tools) and inspect the DOM under `#iframe-container`; expect `<webview class="tab-frame active" id="frame-tab-1">`, not `<iframe>`
2. Type `https://www.google.com` in the address bar, press Enter. Confirm the page loads directly (no `/proxy?url=` involved) — inspect the `<webview>` element's `src` attribute, expect it to be exactly `https://www.google.com`, not a `/proxy?url=...`-prefixed value
3. **The core regression this mode exists to fix:** type a search query into Google's search box inside the webview and submit it. Confirm the search results page loads successfully with no "requested URL /proxy was not found" error and no broken navigation — this is the JS-driven-navigation-bypasses-proxy bug from browser mode, and it must not reproduce here since there is no proxy in this mode at all
4. Open 2 more tabs (3 total), each with a different site. Switch between them rapidly. Confirm no reload/flicker (same CSS-only switching as browser mode)
5. Try opening a 4th tab — confirm the limit banner appears and no 4th tab is created

Close the window when done.

- [ ] **Step 7: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add public/app.js public/style.css
git commit -m "feat: use native webview instead of iframe+proxy in Electron mode"
```

---

### Task 3: README update for the new run mode

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing (documentation only)
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Read the current `README.md` in full**, then add a new section after the existing "Run" section:

```markdown
## Run (Electron mode)

An alternative run mode using Electron's native `<webview>` per tab instead
of the iframe+proxy pipeline. No proxy server is used in this mode — each
tab loads its target URL directly, so sites with JS-driven navigation
(e.g. search forms that submit via `fetch`/`history.pushState`) work
correctly, unlike in browser mode where such navigation can bypass the
proxy.

\`\`\`bash
npm install
npm run electron:start
\`\`\`

Browser mode (`npm start`) and Electron mode (`npm run electron:start`)
are independent and both remain fully functional — pick whichever suits
your use case.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/frontend/workspace/me-github/teslahubs.browser
git add README.md
git commit -m "docs: document Electron run mode"
```

---

## Self-Review Notes

- **Spec coverage:** `electron/main.js` + `webviewTag: true` (Task 1), preload exposing `isElectron` (Task 1), `app.js` branching on the flag for both element creation and `src` assignment across all three call sites (Task 2), CSS covering both tag names (Task 2), browser-mode-unaffected regression check (Task 2 Step 5), the actual Google-search-JS-bypass fix verified end-to-end (Task 2 Step 6.3), README documentation (Task 3) — all covered. No packaging/distribution task, matching the spec's explicit exclusion.
- **Placeholder scan:** no TBD/TODO, all steps contain literal code or exact verification commands.
- **Type/name consistency:** `IS_ELECTRON` and `setFrameSrc(frame, url)` introduced in Task 2 Step 1 are used identically in Steps 2–3; `window.teslahubsBrowser.isElectron` matches exactly between Task 1's preload script and Task 2's flag-detection code.
