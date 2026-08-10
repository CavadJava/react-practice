# Live Video Player — Phase B (YouTube Search & Playback) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personal, password-gated "search YouTube by name, play the result centered on screen" page to the existing `live-video-player` project, rendering video via `<canvas>` + JSMpeg (WebGL) — no `<video>`/`<audio>` element — replacing the current official-IFrame YouTube integration entirely.

**Architecture:** A new, independent Node/Express+`ws` server (`youtube-server/`) resolves and searches YouTube via `yt-dlp` and transcodes the resolved stream via `ffmpeg` into **one** muxed MPEG1-TS stream (video `mpeg1video` + audio `mp2`) sent over a single WebSocket. The client (`live-video-player`'s existing Vite/React app) proxies `/api/*` and `/ws/mpeg1` to this server (same-origin, so the password-gate session cookie works without CORS complications) and plays the stream with `JSMpeg.Player` (`audio: true`) directly onto a `<canvas>`.

**Tech Stack:** Node (ESM, `.mjs`), Express, `ws`, `yt-dlp`, `ffmpeg` (server). React 19, TypeScript, `vitest` (client — matches the existing project). `jsmpeg.min.js` vendored as a global script (no npm package).

## Global Constraints

- No `<video>` element and no `<audio>` element anywhere in the YouTube playback path — only a `<canvas>`.
- No YouTube Data API key — search goes through `yt-dlp ytsearch`.
- Every route on `youtube-server` requires the password-gate session cookie except `POST /api/login` itself — no unauthenticated "bait" pages (spec §4/§13).
- Quality tiers: 240p / 360p / 480p / 720p, default 720p (spec §9).
- Fullscreen supported (reuses the existing `useFullscreen` hook, unchanged).
- Pause/resume and volume controls, Twitch support, and choosing a production host/domain are explicitly OUT of scope this phase (spec §14).
- Spec: `docs/superpowers/specs/2026-08-10-live-video-player-phase-b-youtube-search-design.md` (in the `react-practice` repo) — every task below implements a section of it; section references are noted per task.
- Project root for all file paths below: `/Users/frontend/workspace/react-native-practices/live-video-player/` (existing repo; Phase A's files are untouched except where a task explicitly says otherwise).
- Reference implementation being ported from: `/Users/frontend/workspace/react-native-practices/video-drive-copy/server/server.js` and `/Users/frontend/workspace/react-native-practices/video-drive-copy/public/twitch-client/`.

---

## Task 1: `youtube-server` scaffold and auth module

**Spec reference:** §4 (password gate).

**Files:**
- Create: `youtube-server/package.json`, `youtube-server/vitest.config.mjs`, `youtube-server/.gitignore`
- Create: `youtube-server/auth.mjs`
- Create: `youtube-server/auth.test.mjs`

**Interfaces:**
- Produces: `signSession(expiryMs: number, password: string): string`, `verifySession(token: string, password: string): boolean`, `parseCookies(header: string | undefined): Record<string, string>`. Task 5 (server wiring) is the consumer.

- [ ] **Step 1: Create the directory, package.json, and .gitignore**

```bash
mkdir -p /Users/frontend/workspace/react-native-practices/live-video-player/youtube-server
cd /Users/frontend/workspace/react-native-practices/live-video-player/youtube-server
```

`.gitignore`:
```
node_modules
```

`package.json`:
```json
{
  "name": "youtube-server",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.21.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  }
}
```

`vitest.config.mjs`:
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
```

- [ ] **Step 2: Write the failing tests**

`youtube-server/auth.test.mjs`:
```javascript
import { describe, it, expect } from 'vitest';
import { signSession, verifySession, parseCookies } from './auth.mjs';

describe('signSession/verifySession', () => {
  it('verifies a freshly signed, unexpired session', () => {
    const expiry = Date.now() + 60_000;
    const token = signSession(expiry, 'secret');
    expect(verifySession(token, 'secret')).toBe(true);
  });

  it('rejects an expired session', () => {
    const expiry = Date.now() - 1000;
    const token = signSession(expiry, 'secret');
    expect(verifySession(token, 'secret')).toBe(false);
  });

  it('rejects a token signed with a different password', () => {
    const expiry = Date.now() + 60_000;
    const token = signSession(expiry, 'secret');
    expect(verifySession(token, 'wrong-secret')).toBe(false);
  });

  it('rejects a missing token or missing password', () => {
    expect(verifySession('', 'secret')).toBe(false);
    expect(verifySession('123.abc', '')).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const expiry = Date.now() + 60_000;
    const token = signSession(expiry, 'secret');
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifySession(tampered, 'secret')).toBe(false);
  });
});

describe('parseCookies', () => {
  it('parses a simple cookie header', () => {
    expect(parseCookies('session=abc123; other=xyz')).toEqual({ session: 'abc123', other: 'xyz' });
  });

  it('returns an empty object for an empty/missing header', () => {
    expect(parseCookies('')).toEqual({});
    expect(parseCookies(undefined)).toEqual({});
  });

  it('URL-decodes cookie values', () => {
    expect(parseCookies('session=a%20b')).toEqual({ session: 'a b' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd youtube-server && npm install && npm test`
Expected: FAIL with "Cannot find module './auth.mjs'".

- [ ] **Step 4: Implement auth.mjs**

`youtube-server/auth.mjs`:
```javascript
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Single-shared-password session scheme ported from video-drive-copy's server.js: no session
 * store needed, the expiry is stamped into the cookie value itself and HMAC-signed with the
 * app password so it can't be forged or extended by a client. `password` is passed as a
 * parameter (rather than read from an env var closure) so these stay pure, easily testable
 * functions - server.mjs is the only place that reads APP_PASSWORD.
 */
export function signSession(expiryMs, password) {
  const sig = createHmac('sha256', password).update(String(expiryMs)).digest('hex');
  return expiryMs + '.' + sig;
}

export function verifySession(token, password) {
  if (!token || !password) return false;
  const parts = token.split('.');
  const expiryMs = parseInt(parts[0], 10);
  const sig = parts[1] || '';
  if (!expiryMs || Date.now() > expiryMs) return false;
  const expected = signSession(expiryMs, password).split('.')[1];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((pair) => {
    const i = pair.indexOf('=');
    if (i === -1) return;
    out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git add youtube-server
git commit -m "feat: youtube-server scaffold and password-gate auth module"
```

---

## Task 2: Search module

**Spec reference:** §4 (search endpoint, `yt-dlp ytsearch`, no API key).

**Files:**
- Create: `youtube-server/search.mjs`
- Create: `youtube-server/search.test.mjs`

**Interfaces:**
- Produces: `ytBotCheckArgs(cookiesPath: string): string[]`, `buildSearchArgs(query: string, count: number, cookiesPath: string): string[]`, `parseSearchOutput(stdout: string): SearchResult[]` where `SearchResult = { id, title, uploader, duration, thumbnail, url }`. Task 3 (`resolveStreamUrl.mjs`, reuses `ytBotCheckArgs`) and Task 5 (server wiring) are the consumers.

- [ ] **Step 1: Write the failing tests**

`youtube-server/search.test.mjs`:
```javascript
import { describe, it, expect } from 'vitest';
import { parseSearchOutput, buildSearchArgs, ytBotCheckArgs } from './search.mjs';

describe('parseSearchOutput', () => {
  it('parses multiple lines into result objects', () => {
    const stdout = 'abc123|||Song One|||Artist A|||213\ndef456|||Song Two|||Artist B|||180\n';
    const results = parseSearchOutput(stdout);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      id: 'abc123',
      title: 'Song One',
      uploader: 'Artist A',
      duration: 213,
      thumbnail: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=abc123',
    });
  });

  it('returns an empty array for empty/blank output', () => {
    expect(parseSearchOutput('')).toEqual([]);
    expect(parseSearchOutput('   \n  ')).toEqual([]);
  });

  it('defaults a missing/non-numeric duration to 0', () => {
    const results = parseSearchOutput('abc123|||Title|||Uploader|||');
    expect(results[0].duration).toBe(0);
  });
});

describe('ytBotCheckArgs', () => {
  it('uses the android client trick with no cookies path', () => {
    expect(ytBotCheckArgs('')).toEqual(['--extractor-args', 'youtube:player_client=android']);
  });

  it('uses --cookies when a cookies path is given', () => {
    expect(ytBotCheckArgs('/path/to/cookies.txt')).toEqual(['--cookies', '/path/to/cookies.txt']);
  });
});

describe('buildSearchArgs', () => {
  it('builds the full yt-dlp arg list for a query', () => {
    const args = buildSearchArgs('lofi beats', 12, '');
    expect(args).toContain('ytsearch12:lofi beats');
    expect(args).toContain('--flat-playlist');
    expect(args).toContain('--extractor-args');
  });

  it('uses --cookies instead of the android trick when a cookies path is given', () => {
    const args = buildSearchArgs('lofi beats', 12, '/path/to/cookies.txt');
    expect(args).toContain('--cookies');
    expect(args).not.toContain('--extractor-args');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- search.test.mjs`
Expected: FAIL with "Cannot find module './search.mjs'".

- [ ] **Step 3: Implement search.mjs**

`youtube-server/search.mjs`:
```javascript
// On datacenter/cloud IPs, YouTube's bot-check ("Sign in to confirm you're not a bot") blocks
// yt-dlp outright regardless of client spoofing - a cookies.txt from a real logged-in session
// is the only fix there (same finding as youtube-remote-webrtc's ytdlp.go and
// video-drive-copy's server.js). On a residential IP the android-client trick alone is normally
// enough, so cookies stay opt-in via YT_DLP_COOKIES, not required.
export function ytBotCheckArgs(cookiesPath) {
  return cookiesPath ? ['--cookies', cookiesPath] : ['--extractor-args', 'youtube:player_client=android'];
}

export function buildSearchArgs(query, count, cookiesPath) {
  return [
    '--no-warnings',
    '--flat-playlist',
    ...ytBotCheckArgs(cookiesPath),
    '--print',
    '%(id)s|||%(title)s|||%(uploader)s|||%(duration)s',
    'ytsearch' + count + ':' + query,
  ];
}

export function parseSearchOutput(stdout) {
  return (stdout || '')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|||');
      const id = parts[0] || '';
      return {
        id,
        title: parts[1] || '',
        uploader: parts[2] || '',
        duration: parseInt(parts[3], 10) || 0,
        thumbnail: 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg',
        url: 'https://www.youtube.com/watch?v=' + id,
      };
    });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- search.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git add youtube-server/search.mjs youtube-server/search.test.mjs
git commit -m "feat: youtube-server search module (yt-dlp ytsearch, no API key)"
```

---

## Task 3: Stream resolution module

**Spec reference:** §4 (resolving a YouTube URL to a direct stream URL via `yt-dlp -g`).

**Files:**
- Create: `youtube-server/resolveStreamUrl.mjs`
- Create: `youtube-server/resolveStreamUrl.test.mjs`

**Interfaces:**
- Consumes: `ytBotCheckArgs` from `./search.mjs`.
- Produces: `classifyInput(input: string): { kind: 'direct-media' | 'youtube-url', target: string }`, `buildResolveArgs(target: string, cookiesPath: string): string[]`, `resolveStreamUrl(input: string, options: { ytDlpPath: string, cookiesPath: string }, execFileImpl: Function, callback: (err: Error | null, streamUrl?: string) => void): void`. Task 5 (server wiring) is the consumer.

- [ ] **Step 1: Write the failing tests**

`youtube-server/resolveStreamUrl.test.mjs`:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { classifyInput, buildResolveArgs, resolveStreamUrl } from './resolveStreamUrl.mjs';

describe('classifyInput', () => {
  it('classifies a youtube.com watch URL as a youtube-url to resolve', () => {
    expect(classifyInput('https://www.youtube.com/watch?v=abc123')).toEqual({
      kind: 'youtube-url',
      target: 'https://www.youtube.com/watch?v=abc123',
    });
  });

  it('classifies a youtu.be short URL as a youtube-url to resolve', () => {
    expect(classifyInput('https://youtu.be/abc123')).toEqual({
      kind: 'youtube-url',
      target: 'https://youtu.be/abc123',
    });
  });

  it('classifies an already-direct media URL as direct-media', () => {
    expect(classifyInput('https://rr1---sn-abc.googlevideo.com/videoplayback?id=xyz')).toEqual({
      kind: 'direct-media',
      target: 'https://rr1---sn-abc.googlevideo.com/videoplayback?id=xyz',
    });
  });
});

describe('buildResolveArgs', () => {
  it('includes -g and a height-limited format selector', () => {
    const args = buildResolveArgs('https://www.youtube.com/watch?v=abc', '');
    expect(args).toContain('-g');
    expect(args).toContain('https://www.youtube.com/watch?v=abc');
    expect(args.some((a) => a.includes('height<=720'))).toBe(true);
  });
});

describe('resolveStreamUrl', () => {
  it('resolves a youtube URL via the injected execFile, returning its first stdout line', () => {
    const fakeExecFile = (bin, args, opts, cb) => cb(null, 'https://resolved.example/stream\n');
    resolveStreamUrl(
      'https://www.youtube.com/watch?v=abc',
      { ytDlpPath: 'yt-dlp', cookiesPath: '' },
      fakeExecFile,
      (err, url) => {
        expect(err).toBeNull();
        expect(url).toBe('https://resolved.example/stream');
      },
    );
  });

  it('short-circuits already-direct media without invoking execFile', () => {
    const fakeExecFile = vi.fn();
    resolveStreamUrl(
      'https://cdn.example/video.mp4',
      { ytDlpPath: 'yt-dlp', cookiesPath: '' },
      fakeExecFile,
      (err, url) => {
        expect(err).toBeNull();
        expect(url).toBe('https://cdn.example/video.mp4');
      },
    );
    expect(fakeExecFile).not.toHaveBeenCalled();
  });

  it('calls back with an error when execFile fails', () => {
    const fakeExecFile = (bin, args, opts, cb) => cb(new Error('boom'), '');
    resolveStreamUrl(
      'https://www.youtube.com/watch?v=abc',
      { ytDlpPath: 'yt-dlp', cookiesPath: '' },
      fakeExecFile,
      (err, url) => {
        expect(err).toBeInstanceOf(Error);
        expect(url).toBeUndefined();
      },
    );
  });

  it('calls back with an error when execFile succeeds but produces empty stdout', () => {
    const fakeExecFile = (bin, args, opts, cb) => cb(null, '');
    resolveStreamUrl(
      'https://www.youtube.com/watch?v=abc',
      { ytDlpPath: 'yt-dlp', cookiesPath: '' },
      fakeExecFile,
      (err, url) => {
        expect(err).toBeInstanceOf(Error);
        expect(url).toBeUndefined();
      },
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- resolveStreamUrl.test.mjs`
Expected: FAIL with "Cannot find module './resolveStreamUrl.mjs'".

- [ ] **Step 3: Implement resolveStreamUrl.mjs**

`youtube-server/resolveStreamUrl.mjs`:
```javascript
import { ytBotCheckArgs } from './search.mjs';

/**
 * This phase is YouTube-only (Twitch support was explicitly dropped, spec §13), so the only
 * two cases are: a youtube.com/youtu.be page URL that still needs `yt-dlp -g` to resolve to a
 * direct stream, or an input that's already a direct media URL (e.g. a previously-resolved
 * googlevideo.com link) and needs no further resolution.
 */
export function classifyInput(input) {
  const looksLikeDirectMedia = /^https?:\/\//.test(input) && !/youtube\.com|youtu\.be/i.test(input);
  return looksLikeDirectMedia ? { kind: 'direct-media', target: input } : { kind: 'youtube-url', target: input };
}

export function buildResolveArgs(target, cookiesPath) {
  return [
    '--no-playlist',
    ...ytBotCheckArgs(cookiesPath),
    // Prefer a progressive (non-HLS) format when one exists - piping an HLS manifest through
    // ffmpeg with -re real-time pacing is flaky (segment-boundary reconnects), same finding as
    // video-drive-copy's server.js.
    '--format',
    'best[height<=720][protocol!*=m3u8]/best[height<=720]',
    '-g',
    target,
  ];
}

export function resolveStreamUrl(input, options, execFileImpl, callback) {
  const classified = classifyInput(input);
  if (classified.kind === 'direct-media') {
    callback(null, classified.target);
    return;
  }
  const args = buildResolveArgs(classified.target, options.cookiesPath);
  execFileImpl(options.ytDlpPath, args, { timeout: 20000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
    if (!err && stdout && stdout.trim()) {
      callback(null, stdout.trim().split('\n')[0]);
    } else {
      callback(err || new Error('No stream found'));
    }
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- resolveStreamUrl.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git add youtube-server/resolveStreamUrl.mjs youtube-server/resolveStreamUrl.test.mjs
git commit -m "feat: youtube-server stream resolution module"
```

---

## Task 4: Quality presets module

**Spec reference:** §9 (240p/360p/480p/720p, 720p default).

**Files:**
- Create: `youtube-server/quality.mjs`
- Create: `youtube-server/quality.test.mjs`

**Interfaces:**
- Produces: `QUALITY_PRESETS: Record<240|360|480|720, { scale: string, bitrate: string }>`, `resolveQuality(quality: number): { scale: string, bitrate: string }`. Task 5 (server wiring) is the consumer.

- [ ] **Step 1: Write the failing tests**

`youtube-server/quality.test.mjs`:
```javascript
import { describe, it, expect } from 'vitest';
import { QUALITY_PRESETS, resolveQuality } from './quality.mjs';

describe('resolveQuality', () => {
  it('returns the matching preset for each known quality', () => {
    expect(resolveQuality(240)).toEqual({ scale: '426:240', bitrate: '400k' });
    expect(resolveQuality(360)).toEqual({ scale: '640:360', bitrate: '800k' });
    expect(resolveQuality(480)).toEqual({ scale: '854:480', bitrate: '1200k' });
    expect(resolveQuality(720)).toEqual({ scale: '1280:720', bitrate: '2000k' });
  });

  it('falls back to 720p for an unknown or missing quality', () => {
    expect(resolveQuality(9999)).toEqual(QUALITY_PRESETS[720]);
    expect(resolveQuality(undefined)).toEqual(QUALITY_PRESETS[720]);
    expect(resolveQuality(NaN)).toEqual(QUALITY_PRESETS[720]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- quality.test.mjs`
Expected: FAIL with "Cannot find module './quality.mjs'".

- [ ] **Step 3: Implement quality.mjs**

`youtube-server/quality.mjs`:
```javascript
// 240/360/480/720 (spec §9) - video-drive-copy's 1080p tier is dropped, 240p is added.
export const QUALITY_PRESETS = {
  240: { scale: '426:240', bitrate: '400k' },
  360: { scale: '640:360', bitrate: '800k' },
  480: { scale: '854:480', bitrate: '1200k' },
  720: { scale: '1280:720', bitrate: '2000k' },
};

export function resolveQuality(quality) {
  return QUALITY_PRESETS[quality] || QUALITY_PRESETS[720];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- quality.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git add youtube-server/quality.mjs youtube-server/quality.test.mjs
git commit -m "feat: youtube-server quality presets module"
```

---

## Task 5: Server wiring (Express app, WebSocket handler, README)

**Spec reference:** §3, §4, §6 (muxed audio+video ffmpeg output), §7 (error handling), §10 (low-latency ffmpeg flags: `-bf 0`, `-muxdelay 0.1 -muxpreload 0`).

**Files:**
- Create: `youtube-server/server.mjs`
- Create: `youtube-server/.env.example`
- Create: `youtube-server/README.md`

**Interfaces:**
- Consumes: `signSession`, `verifySession`, `parseCookies` from `./auth.mjs`; `buildSearchArgs`, `parseSearchOutput` from `./search.mjs`; `resolveStreamUrl` from `./resolveStreamUrl.mjs`; `resolveQuality` from `./quality.mjs`.
- Produces: a runnable server exposing `GET /api/session`, `POST /api/login`, `GET /api/youtube/search`, `WS /ws/mpeg1`. No automated test - this is the integration point wiring together the already-tested pure modules with real `child_process`/`ws`/`express`, verified manually per Task 14.

- [ ] **Step 1: Implement server.mjs**

`youtube-server/server.mjs`:
```javascript
import express from 'express';
import { WebSocketServer } from 'ws';
import { spawn, execFile } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { signSession, verifySession, parseCookies } from './auth.mjs';
import { buildSearchArgs, parseSearchOutput } from './search.mjs';
import { resolveStreamUrl } from './resolveStreamUrl.mjs';
import { resolveQuality } from './quality.mjs';

const PORT = process.env.PORT || 8766;
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const YT_DLP = process.env.YT_DLP || 'yt-dlp';
const YT_DLP_COOKIES = process.env.YT_DLP_COOKIES || '';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function isAuthed(req) {
  if (!APP_PASSWORD) return true; // unconfigured checkout runs open, matches Phase A/demo-server precedent
  return verifySession(parseCookies(req.headers.cookie).session, APP_PASSWORD);
}

const app = express();

// Every route requires the session cookie except the login POST itself - no unauthenticated
// "bait" pages here (spec §4/§13 - that's a deliberate difference from video-drive-copy).
app.use((req, res, next) => {
  if (req.path === '/api/login' || isAuthed(req)) return next();
  res.status(401).json({ error: 'Unauthorized - log in first' });
});

// The client checks this on mount to decide whether to show the login form or the app.
app.get('/api/session', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', express.urlencoded({ extended: false }), (req, res) => {
  if (!APP_PASSWORD) return res.redirect('/?error=1');
  const pw = (req.body && req.body.password) || '';
  const a = Buffer.from(pw);
  const b = Buffer.from(APP_PASSWORD);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) return res.redirect('/?error=1');
  const expiryMs = Date.now() + SESSION_MAX_AGE;
  res.cookie('session', signSession(expiryMs, APP_PASSWORD), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    secure: req.protocol === 'https',
  });
  res.redirect('/');
});

app.get('/api/youtube/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ results: [] });
  const n = Math.min(parseInt(req.query.n, 10) || 12, 25);

  execFile(
    YT_DLP,
    buildSearchArgs(q, n, YT_DLP_COOKIES),
    { timeout: 25000, maxBuffer: 4 * 1024 * 1024 },
    (err, stdout) => {
      if (err && !stdout) return res.json({ results: [], error: 'Search failed' });
      res.json({ results: parseSearchOutput(stdout) });
    },
  );
});

const server = app.listen(PORT, () => {
  console.log(`youtube-server listening on http://localhost:${PORT}`);
});

// ============================================================
// WEBSOCKET: /ws/mpeg1 - muxed video(mpeg1video)+audio(mp2) as ONE mpegts stream, so JSMpeg's
// own audio:true mode decodes and syncs both from a single source (spec §6/§7 - this is the
// difference from video-drive-copy's split <audio>+HTTP-MP3 approach).
// ============================================================
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // WS upgrades never pass through Express's middleware stack, so the auth gate above doesn't
  // cover this - check it here too (same pattern as video-drive-copy's server.js).
  if (url.pathname !== '/ws/mpeg1' || !isAuthed({ headers: req.headers })) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, url);
  });
});

wss.on('connection', (ws, req, url) => {
  const videoUrl = url.searchParams.get('url') || '';
  const quality = parseInt(url.searchParams.get('quality'), 10) || 720;
  if (!videoUrl) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing ?url=' }));
    ws.close();
    return;
  }
  streamMpeg1(ws, videoUrl, quality);
});

function streamMpeg1(ws, videoUrl, quality) {
  const { scale, bitrate } = resolveQuality(quality);

  ws.send(JSON.stringify({ type: 'status', message: 'Resolving...' }));
  resolveStreamUrl(videoUrl, { ytDlpPath: YT_DLP, cookiesPath: YT_DLP_COOKIES }, execFile, (err, streamUrl) => {
    if (err || !streamUrl) {
      ws.send(JSON.stringify({ type: 'error', message: 'Offline, not found, or unsupported URL' }));
      ws.close();
      return;
    }
    doStream(streamUrl);
  });

  function doStream(streamUrl) {
    ws.send(JSON.stringify({ type: 'status', message: 'Starting stream...' }));
    let ffmpeg;
    try {
      ffmpeg = spawn(
        'ffmpeg',
        [
          '-re',
          '-reconnect', '1', '-reconnect_at_eof', '1',
          '-reconnect_streamed', '1', '-reconnect_delay_max', '30',
          '-i', streamUrl,
          '-c:v', 'mpeg1video', '-q:v', '5', '-b:v', bitrate, '-bf', '0',
          '-vf', `fps=30,scale=${scale}`,
          '-c:a', 'mp2', '-b:a', '128k', '-ar', '44100', '-ac', '2',
          '-f', 'mpegts',
          '-muxdelay', '0.1', '-muxpreload', '0',
          '-',
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: e.message.slice(0, 100) }));
      ws.close();
      return;
    }

    ffmpeg.stdout.on('data', (chunk) => {
      if (ws.readyState === 1) ws.send(chunk);
    });
    ffmpeg.stderr.on('data', () => {});
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        try {
          ws.send(JSON.stringify({ type: 'status', message: `Stream ended (code ${code})` }));
        } catch {
          // socket already closed
        }
      }
      try {
        ws.close();
      } catch {
        // already closed
      }
    });
    ffmpeg.on('error', (e) => {
      try {
        ws.send(JSON.stringify({ type: 'error', message: e.message.slice(0, 100) }));
      } catch {
        // already closed
      }
    });
    ws.on('close', () => {
      try {
        ffmpeg.kill();
      } catch {
        // already dead
      }
    });
  }
}
```

- [ ] **Step 2: Create .env.example**

`youtube-server/.env.example`:
```
PORT=8766

# Gates every route except POST /api/login. Leave unset to disable the gate entirely (fine for
# local dev).
APP_PASSWORD=

# yt-dlp options - see search.mjs's ytBotCheckArgs comment.
#YT_DLP=yt-dlp
#YT_DLP_COOKIES=
```

- [ ] **Step 3: Create README.md**

`youtube-server/README.md`:
```markdown
# youtube-server

Node/Express + `ws` backend for `live-video-player`'s YouTube search page. Searches YouTube via
`yt-dlp` (no API key) and streams playback as one muxed MPEG1-TS (video+audio) WebSocket, decoded
client-side by JSMpeg onto a `<canvas>` - no `<video>`/`<audio>` element.

## Requirements

- Node.js 18+
- `ffmpeg` (with `mpeg1video` and `mp2` support)
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) (`pip install yt-dlp` or `brew install yt-dlp`)

## Run

```bash
npm install
cp .env.example .env   # set APP_PASSWORD if you want the gate active
npm start
```

Listens on `http://localhost:8766` by default. The `live-video-player` Vite dev server proxies
`/api/*` and `/ws/mpeg1` here (see the root project's `vite.config.ts`) so the browser sees
everything as same-origin and the session cookie works without CORS configuration.

## Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:---:|---|
| `GET` | `/api/session` | required | `200 {ok:true}` if the session cookie is valid, `401` otherwise |
| `POST` | `/api/login` | open | Form POST (`password` field); sets the session cookie and redirects to `/` |
| `GET` | `/api/youtube/search?q=&n=` | required | `yt-dlp ytsearch`-backed search, no API key |
| `WS` | `/ws/mpeg1?url=&quality=` | required | Muxed MPEG1-TS (video `mpeg1video` + audio `mp2`) stream |

## Tests

```bash
npm test
```

Covers the pure logic (`auth.mjs`, `search.mjs`, `resolveStreamUrl.mjs`, `quality.mjs`) without
spawning real `yt-dlp`/`ffmpeg` processes. `server.mjs` itself is verified manually (see the root
project's README manual verification checklist).
```

- [ ] **Step 4: Install dependencies and verify the server starts**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player/youtube-server
npm install
node -e "console.log('syntax ok')" && node --check server.mjs
```

Expected: `node --check server.mjs` prints nothing (syntax valid). Starting it for real (`npm start`) requires `ffmpeg`/`yt-dlp` on PATH to be useful, but should print the "listening on" line regardless.

- [ ] **Step 5: Run the full youtube-server test suite**

Run: `npm test`
Expected: all prior tasks' tests still PASS (25 tests total: 8 `auth` + 7 `search` + 8 `resolveStreamUrl` + 2 `quality`).

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git add youtube-server/server.mjs youtube-server/.env.example youtube-server/README.md
git commit -m "feat: youtube-server Express app, WS muxed-stream handler, README"
```

---

## Task 6: Vite proxy configuration

**Spec reference:** §3 (client talks to `youtube-server` same-origin so the session cookie works).

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `/api/session`, `/api/login`, `/api/youtube` and `/ws/mpeg1` requests from the Vite dev server (default `http://localhost:5173`) are proxied to `youtube-server` (`http://localhost:8766` / `ws://localhost:8766`), making them same-origin from the browser's perspective. Task 9 (client API layer) and Task 11 (`useJsmpegPlayer`) rely on this - they call relative paths, not an absolute `youtube-server` URL.

- [ ] **Step 1: Modify vite.config.ts**

`vite.config.ts` (full file):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  server: {
    proxy: {
      '/api/youtube': 'http://localhost:8766',
      '/api/session': 'http://localhost:8766',
      '/api/login': 'http://localhost:8766',
      '/ws/mpeg1': {
        target: 'ws://localhost:8766',
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 2: Verify the build and existing tests still pass**

Run: `npm run build && npm test`
Expected: build succeeds, all existing tests PASS (this change doesn't touch any tested code path).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: proxy /api and /ws/mpeg1 to youtube-server in dev"
```

---

## Task 7: Vendor JSMpeg and its TypeScript ambient types

**Spec reference:** §5, §6 (JSMpeg renders MPEG1-TS via WebGL onto canvas; not an npm dependency).

**Files:**
- Create: `public/vendor/jsmpeg.min.js` (copied)
- Create: `src/types/jsmpeg.d.ts`
- Modify: `index.html`

**Interfaces:**
- Produces: a global `window.JSMpeg.Player` constructor, typed via the ambient declaration. Task 11 (`useJsmpegPlayer`) is the consumer.

- [ ] **Step 1: Copy jsmpeg.min.js from video-drive-copy**

```bash
mkdir -p /Users/frontend/workspace/react-native-practices/live-video-player/public/vendor
cp /Users/frontend/workspace/react-native-practices/video-drive-copy/public/twitch-client/jsmpeg.min.js \
   /Users/frontend/workspace/react-native-practices/live-video-player/public/vendor/jsmpeg.min.js
```

- [ ] **Step 2: Add the ambient type declaration**

`src/types/jsmpeg.d.ts`:
```typescript
interface JSMpegPlayerOptions {
  canvas: HTMLCanvasElement;
  audio?: boolean;
  streaming?: boolean;
  maxBufferSize?: number;
  onSourceEstablished?: () => void;
  onStalled?: () => void;
  onEnded?: () => void;
}

interface JSMpegPlayerInstance {
  destroy(): void;
  paused: boolean;
  volume: number;
}

interface JSMpegNamespace {
  Player: new (url: string, options: JSMpegPlayerOptions) => JSMpegPlayerInstance;
}

interface Window {
  JSMpeg: JSMpegNamespace;
}
```

(These members - `onSourceEstablished`, `onStalled`, `onEnded`, `.destroy()`, `.paused`, `.volume` - were confirmed present in `jsmpeg.min.js` via `grep -o "on[A-Z][a-zA-Z]*"` and `grep -o "\.destroy\|\.paused\|\.volume"` before writing this plan.)

- [ ] **Step 3: Load the script in index.html**

`index.html` (full file):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Live Video Player</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/vendor/jsmpeg.min.js"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Verify the build still succeeds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (the ambient `.d.ts` is picked up automatically by `tsconfig.app.json`'s `include: ["src"]`).

- [ ] **Step 5: Commit**

```bash
git add public/vendor/jsmpeg.min.js src/types/jsmpeg.d.ts index.html
git commit -m "feat: vendor JSMpeg and its TypeScript ambient types"
```

---

## Task 8: Remove the official-IFrame YouTube integration

**Spec reference:** §1 (this phase replaces it entirely).

**Files:**
- Delete: `src/components/YouTubeSection.tsx`, `src/components/YouTubeEmbed.tsx`, `src/utils/parseYouTubeId.ts`
- Modify: `src/App.tsx`, `src/App.css`

**Interfaces:**
- No new interfaces. This task only removes code; Task 13 rewires `App.tsx` for the new search page.

- [ ] **Step 1: Delete the IFrame integration files**

```bash
git rm src/components/YouTubeSection.tsx src/components/YouTubeEmbed.tsx src/utils/parseYouTubeId.ts
```

- [ ] **Step 2: Remove the YouTube section from App.tsx**

`src/App.tsx` (full file, temporarily just the Phase A view - Task 13 adds the search page/nav back):
```tsx
import { LiveVideoPlayer } from './components/LiveVideoPlayer';

const DEMO_STREAM_URL = 'ws://localhost:8765';

function App() {
  return (
    <div className="app">
      <h1>Live Video Player</h1>
      <LiveVideoPlayer streamUrl={DEMO_STREAM_URL} />
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Remove the now-unused YouTube embed styles from App.css**

Delete these blocks from `src/App.css` (the `.youtube-embed`, `.youtube-embed__frame`,
`.youtube-section__controls`, `.youtube-section__input`, `.youtube-section__error` rules - the
ones added when `YouTubeSection`/`YouTubeEmbed` were built):
```css
.youtube-embed {
  position: relative;
  width: 100%;
  max-width: 960px;
  aspect-ratio: 16 / 9;
}

.youtube-embed__frame {
  width: 100%;
  height: 100%;
  border: 0;
}

.youtube-section__controls {
  display: flex;
  gap: 8px;
  max-width: 960px;
  margin-bottom: 8px;
}

.youtube-section__input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1a1b1e;
  color: #e8e8e8;
}

.youtube-section__error {
  color: #ff6b6b;
  margin: 0 0 8px;
}
```

- [ ] **Step 4: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds (no remaining references to the deleted files).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove official-IFrame YouTube integration (replaced by Phase B)"
```

---

## Task 9: Client API layer (session check, search fetch)

**Spec reference:** §4 (session check), §4 (search).

**Files:**
- Create: `src/api/session.ts`
- Create: `src/api/session.test.ts`
- Create: `src/api/youtubeSearch.ts`
- Create: `src/api/youtubeSearch.test.ts`

**Interfaces:**
- Produces: `checkSession(fetchImpl?: typeof fetch): Promise<'authed' | 'unauthed' | 'offline'>`; `SearchResult { id, title, uploader, duration, thumbnail, url }`, `fetchSearchResults(query: string, fetchImpl?: typeof fetch): Promise<SearchResult[]>` (throws `Error` on failure). Task 10 (`useYouTubeSearch`) and Task 13 (`App.tsx`) are the consumers.

- [ ] **Step 1: Write the failing tests for session.ts**

`src/api/session.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { checkSession } from './session';

describe('checkSession', () => {
  it('returns "authed" when /api/session responds ok', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    expect(await checkSession(fetchImpl as unknown as typeof fetch)).toBe('authed');
    expect(fetchImpl).toHaveBeenCalledWith('/api/session', { credentials: 'same-origin' });
  });

  it('returns "unauthed" on a 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    expect(await checkSession(fetchImpl as unknown as typeof fetch)).toBe('unauthed');
  });

  it('returns "offline" on any other non-ok status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    expect(await checkSession(fetchImpl as unknown as typeof fetch)).toBe('offline');
  });

  it('returns "offline" when fetch itself rejects (server not running)', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network error'));
    expect(await checkSession(fetchImpl as unknown as typeof fetch)).toBe('offline');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- session.test.ts`
Expected: FAIL with "Cannot find module './session'".

- [ ] **Step 3: Implement session.ts**

`src/api/session.ts`:
```typescript
export type SessionState = 'authed' | 'unauthed' | 'offline';

/**
 * Checked once on App mount to decide whether to show the login form or the search page.
 * Proxied through Vite to youtube-server (see vite.config.ts) so this is a same-origin request
 * and the session cookie is sent automatically.
 */
export async function checkSession(fetchImpl: typeof fetch = fetch): Promise<SessionState> {
  try {
    const res = await fetchImpl('/api/session', { credentials: 'same-origin' });
    if (res.ok) return 'authed';
    if (res.status === 401) return 'unauthed';
    return 'offline';
  } catch {
    return 'offline';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- session.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing tests for youtubeSearch.ts**

`src/api/youtubeSearch.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchSearchResults } from './youtubeSearch';

function fakeFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

describe('fetchSearchResults', () => {
  it('returns parsed results on success', async () => {
    const fetchImpl = fakeFetch(200, {
      results: [{ id: 'abc', title: 'Song', uploader: 'Artist', duration: 200, thumbnail: 't', url: 'u' }],
    });
    const results = await fetchSearchResults('song name', fetchImpl as unknown as typeof fetch);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('abc');
    expect(fetchImpl).toHaveBeenCalledWith('/api/youtube/search?q=song%20name', { credentials: 'same-origin' });
  });

  it('throws a session-expired error on 401', async () => {
    const fetchImpl = fakeFetch(401, { error: 'Unauthorized' });
    await expect(fetchSearchResults('x', fetchImpl as unknown as typeof fetch)).rejects.toThrow(/sessiya/i);
  });

  it('throws a generic error on other failures', async () => {
    const fetchImpl = fakeFetch(500, {});
    await expect(fetchSearchResults('x', fetchImpl as unknown as typeof fetch)).rejects.toThrow(/uğursuz/i);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- youtubeSearch.test.ts`
Expected: FAIL with "Cannot find module './youtubeSearch'".

- [ ] **Step 7: Implement youtubeSearch.ts**

`src/api/youtubeSearch.ts`:
```typescript
export interface SearchResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

export async function fetchSearchResults(query: string, fetchImpl: typeof fetch = fetch): Promise<SearchResult[]> {
  const res = await fetchImpl(`/api/youtube/search?q=${encodeURIComponent(query)}`, {
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    throw new Error('Sessiya bitib - yenidən daxil ol.');
  }
  if (!res.ok) {
    throw new Error('Axtarış uğursuz oldu');
  }
  const data = (await res.json()) as SearchResponse;
  return data.results;
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- youtubeSearch.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 9: Commit**

```bash
git add src/api
git commit -m "feat: client API layer for session check and YouTube search"
```

---

## Task 10: Search UI — hook and components

**Spec reference:** §5 (search bar/results components), §11 (visual design).

**Files:**
- Create: `src/hooks/useYouTubeSearch.ts`
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/ResultCard.tsx`
- Create: `src/components/search/SearchResults.tsx`

**Interfaces:**
- Consumes: `fetchSearchResults`, `SearchResult` from `../api/youtubeSearch`.
- Produces: `useYouTubeSearch(): { results: SearchResult[], loading: boolean, error: string | null, hasSearched: boolean, search: (query: string) => void }`; `<SearchBar onSearch={(query: string) => void} />`; `<ResultCard result={SearchResult} onSelect={(result: SearchResult) => void} />`; `<SearchResults results={SearchResult[]} onSelect={(result: SearchResult) => void} />`. Task 13 (`MusicSearchPage`) is the consumer.

- [ ] **Step 1: Implement useYouTubeSearch.ts**

`src/hooks/useYouTubeSearch.ts` (no separate unit test - it's a thin `useState`/`useCallback` wrapper around the already-tested `fetchSearchResults`; the value being tested is in Task 9, same rationale Phase A used for not separately testing its own thin wrapper hooks):
```typescript
import { useCallback, useState } from 'react';
import { fetchSearchResults, type SearchResult } from '../api/youtubeSearch';

export function useYouTubeSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback((query: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    fetchSearchResults(query)
      .then((r) => setResults(r))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Axtarış uğursuz oldu'))
      .finally(() => setLoading(false));
  }, []);

  return { results, loading, error, hasSearched, search };
}
```

- [ ] **Step 2: Implement SearchBar.tsx**

`src/components/search/SearchBar.tsx`:
```tsx
import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

/** Searches on submit (Enter or button click) - not live-as-you-type. */
export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Mahnı adı yaz…"
        className="search-bar__input"
      />
      <button type="submit" className="search-bar__button">
        Axtar
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Implement ResultCard.tsx**

`src/components/search/ResultCard.tsx`:
```tsx
import type { SearchResult } from '../../api/youtubeSearch';

interface ResultCardProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ResultCard({ result, onSelect }: ResultCardProps) {
  return (
    <button type="button" className="result-card" onClick={() => onSelect(result)}>
      <span className="result-card__thumb-wrap">
        <img src={result.thumbnail} alt="" className="result-card__thumb" />
        {result.duration > 0 && <span className="result-card__duration">{formatDuration(result.duration)}</span>}
      </span>
      <span className="result-card__title">{result.title}</span>
      <span className="result-card__uploader">{result.uploader}</span>
    </button>
  );
}
```

- [ ] **Step 4: Implement SearchResults.tsx**

`src/components/search/SearchResults.tsx`:
```tsx
import type { SearchResult } from '../../api/youtubeSearch';
import { ResultCard } from './ResultCard';

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return <p className="search-results__empty">Nəticə tapılmadı</p>;
  }
  return (
    <div className="search-results">
      {results.map((r) => (
        <ResultCard key={r.id} result={r} onSelect={onSelect} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests PASS (no new tests added this task, but nothing should break), build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useYouTubeSearch.ts src/components/search/SearchBar.tsx src/components/search/ResultCard.tsx src/components/search/SearchResults.tsx
git commit -m "feat: search UI - useYouTubeSearch hook, SearchBar, ResultCard, SearchResults"
```

---

## Task 11: JSMpeg player hook and video modal

**Spec reference:** §3, §5 (fullscreen), §6 (rendering path), §7 (reconnect), §8 (audio sync via muxed stream), §9 (quality selector), §10 (JSMpeg client buffer size).

**Files:**
- Create: `src/hooks/useJsmpegPlayer.ts`
- Create: `src/components/search/VideoModal.tsx`

**Interfaces:**
- Consumes: `SearchResult` from `../api/youtubeSearch`; `reconnectDelayMs` from `../transport/websocket` (Phase A, already exists); `useFullscreen` from `../hooks/useFullscreen` (Phase A, already exists); the global `window.JSMpeg.Player` (Task 7).
- Produces: `useJsmpegPlayer(options: { canvasRef: RefObject<HTMLCanvasElement | null>, wsUrl: string | null }): { status: 'connecting' | 'playing' | 'reconnecting' }`; `<VideoModal video={SearchResult} onClose={() => void} />`. No automated test - depends on the real browser `WebSocket`/`canvas`/JSMpeg global, same category as Phase A's GPU renderer (spec §12) - verified manually in Task 14.

- [ ] **Step 1: Implement useJsmpegPlayer.ts**

`src/hooks/useJsmpegPlayer.ts`:
```typescript
import { useEffect, useRef, useState, type RefObject } from 'react';
import { reconnectDelayMs } from '../transport/websocket';

export type JsmpegStatus = 'connecting' | 'playing' | 'reconnecting';

interface UseJsmpegPlayerOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** null means "don't connect yet". */
  wsUrl: string | null;
}

/**
 * Owns a JSMpeg.Player's lifecycle against a canvas ref and a /ws/mpeg1 URL. JSMpeg manages its
 * own WebSocket internally (constructed from the URL string), decoding the muxed video+audio
 * MPEG1-TS stream and rendering directly onto the canvas - no <video>/<audio> element, see
 * spec §6. Reconnects on stall/end using Phase A's exponential-backoff delay function, since
 * JSMpeg itself has no built-in reconnect (confirmed via its onStalled/onEnded hooks, verified
 * present in jsmpeg.min.js - see Task 7).
 *
 * No-GPU machines: jsmpeg.min.js feature-detects WebGL itself at construction time and falls
 * back to its own Canvas2D renderer automatically when WebGL is unavailable (confirmed in its
 * source: `this.renderer = !options.disableGl && WebGL.IsSupported() ? new WebGL(...) : new
 * Canvas2D(...)`) - still the same <canvas> element, no option needed here to enable it, see
 * spec §6.
 */
export function useJsmpegPlayer({ canvasRef, wsUrl }: UseJsmpegPlayerOptions): { status: JsmpegStatus } {
  const [status, setStatus] = useState<JsmpegStatus>('connecting');
  const playerRef = useRef<JSMpegPlayerInstance | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!wsUrl) return;
    let cancelled = false;

    function connect() {
      if (cancelled || !canvasRef.current || !wsUrl) return;
      setStatus(attemptRef.current === 0 ? 'connecting' : 'reconnecting');
      playerRef.current = new window.JSMpeg.Player(wsUrl, {
        canvas: canvasRef.current,
        audio: true,
        streaming: true,
        // Starting point ported from video-drive-copy's proven usage; spec §10 leaves the
        // exact number open to tuning against real playback, not to omitting it entirely.
        maxBufferSize: 1024 * 1024,
        onSourceEstablished: () => {
          if (cancelled) return;
          attemptRef.current = 0;
          setStatus('playing');
        },
        onStalled: scheduleReconnect,
        onEnded: scheduleReconnect,
      });
    }

    function scheduleReconnect() {
      if (cancelled) return;
      playerRef.current?.destroy();
      playerRef.current = null;
      setStatus('reconnecting');
      const delay = reconnectDelayMs(attemptRef.current);
      attemptRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      attemptRef.current = 0;
    };
  }, [wsUrl, canvasRef]);

  return { status };
}
```

- [ ] **Step 2: Implement VideoModal.tsx**

`src/components/search/VideoModal.tsx`:
```tsx
import { useRef, useState } from 'react';
import type { SearchResult } from '../../api/youtubeSearch';
import { useJsmpegPlayer } from '../../hooks/useJsmpegPlayer';
import { useFullscreen } from '../../hooks/useFullscreen';

interface VideoModalProps {
  video: SearchResult;
  onClose: () => void;
}

const QUALITIES = [240, 360, 480, 720] as const;
type Quality = (typeof QUALITIES)[number];

function buildWsUrl(videoUrl: string, quality: Quality): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/mpeg1?url=${encodeURIComponent(videoUrl)}&quality=${quality}`;
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  const [quality, setQuality] = useState<Quality>(720);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(modalRef);
  const { status } = useJsmpegPlayer({ canvasRef, wsUrl: buildWsUrl(video.url, quality) });

  return (
    <div className="video-modal__backdrop" onClick={onClose}>
      <div className="video-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="video-modal__header">
          <span className="video-modal__title">{video.title}</span>
          <div className="video-modal__actions">
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value) as Quality)}
              aria-label="Keyfiyyət"
            >
              {QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {q}p
                </option>
              ))}
            </select>
            <button type="button" onClick={toggle}>
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
            <button type="button" onClick={onClose} aria-label="Bağla">
              ✕
            </button>
          </div>
        </div>
        <div className="video-modal__player">
          <canvas ref={canvasRef} className="video-modal__canvas" />
          {status === 'connecting' && (
            <div className="overlay">
              <div className="spinner" />
            </div>
          )}
          {status === 'reconnecting' && (
            <div className="overlay overlay--reconnecting">
              <div className="spinner" />
              <p>Yenidən qoşulur…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (`.destroy()`, `.paused`, `.volume`, `onSourceEstablished`, `onStalled`, `onEnded` all resolve against Task 7's ambient types).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useJsmpegPlayer.ts src/components/search/VideoModal.tsx
git commit -m "feat: JSMpeg player hook and centered video modal with fullscreen/quality"
```

---

## Task 12: Login page

**Spec reference:** §4 (password gate UI).

**Files:**
- Create: `src/components/LoginPage.tsx`

**Interfaces:**
- Produces: `<LoginPage loginError={boolean} />`. Task 13 (`App.tsx`) is the consumer.

- [ ] **Step 1: Implement LoginPage.tsx**

`src/components/LoginPage.tsx`:
```tsx
interface LoginPageProps {
  loginError: boolean;
}

/**
 * A plain HTML form POST (not fetch/XHR) to /api/login - the browser handles the redirect and
 * cookie exchange natively, which works correctly through the Vite proxy (same-origin, see
 * vite.config.ts) with zero custom auth JS. On success the server redirects to "/"; on failure,
 * to "/?error=1", which App.tsx reads on mount to set `loginError`.
 */
export function LoginPage({ loginError }: LoginPageProps) {
  return (
    <div className="login-page">
      <h1>Giriş</h1>
      <form method="POST" action="/api/login" className="login-page__form">
        <input type="password" name="password" placeholder="Parol" autoFocus required />
        <button type="submit">Daxil ol</button>
      </form>
      {loginError && <p className="login-page__error">Yanlış parol.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build succeeds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginPage.tsx
git commit -m "feat: login page (native form POST against /api/login)"
```

---

## Task 13: Compose the search page and wire up App.tsx

**Spec reference:** §3 (whole feature), §11 (visual design, nav).

**Files:**
- Create: `src/views/MusicSearchPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `useYouTubeSearch` (Task 10), `SearchBar`/`SearchResults` (Task 10), `VideoModal` (Task 11), `LoginPage` (Task 12), `checkSession` (Task 9).
- Produces: the composed `MusicSearchPage` and the final `App.tsx` with a Live Demo / Axtar toggle. This is the end-to-end integration point - manually verified in Task 14.

- [ ] **Step 1: Implement MusicSearchPage.tsx**

`src/views/MusicSearchPage.tsx`:
```tsx
import { useState } from 'react';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults } from '../components/search/SearchResults';
import { VideoModal } from '../components/search/VideoModal';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import type { SearchResult } from '../api/youtubeSearch';

export function MusicSearchPage() {
  const { results, loading, error, hasSearched, search } = useYouTubeSearch();
  const [activeVideo, setActiveVideo] = useState<SearchResult | null>(null);

  return (
    <div className="music-search-page">
      <SearchBar onSearch={search} />
      {hasSearched && loading && <p>Axtarılır…</p>}
      {hasSearched && !loading && error && <p className="search-results__error">{error}</p>}
      {hasSearched && !loading && !error && <SearchResults results={results} onSelect={setActiveVideo} />}
      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite App.tsx**

`src/App.tsx` (full file):
```tsx
import { useEffect, useState } from 'react';
import { LiveVideoPlayer } from './components/LiveVideoPlayer';
import { LoginPage } from './components/LoginPage';
import { MusicSearchPage } from './views/MusicSearchPage';
import { checkSession, type SessionState } from './api/session';

const DEMO_STREAM_URL = 'ws://localhost:8765';

type View = 'live' | 'search';

function App() {
  const [view, setView] = useState<View>('search');
  const [session, setSession] = useState<SessionState | 'checking'>('checking');
  const [loginError] = useState(() => new URLSearchParams(window.location.search).get('error') === '1');

  useEffect(() => {
    if (loginError) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    checkSession().then(setSession);
  }, [loginError]);

  return (
    <div className="app">
      <nav className="app__nav">
        <button type="button" onClick={() => setView('live')} className={view === 'live' ? 'active' : ''}>
          Live Demo
        </button>
        <button type="button" onClick={() => setView('search')} className={view === 'search' ? 'active' : ''}>
          Axtar
        </button>
      </nav>

      {view === 'live' && (
        <>
          <h1>Live Video Player</h1>
          <LiveVideoPlayer streamUrl={DEMO_STREAM_URL} />
        </>
      )}

      {view === 'search' && (
        <>
          {session === 'checking' && <p>Yüklənir…</p>}
          {session === 'offline' && <p>youtube-server-ə qoşulmaq olmur. Serverin işlədiyinə əmin ol.</p>}
          {session === 'unauthed' && <LoginPage loginError={loginError} />}
          {session === 'authed' && <MusicSearchPage />}
        </>
      )}
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Add the new CSS**

Append to `src/App.css`:
```css
.app__nav {
  display: flex;
  gap: 8px;
  padding: 12px;
}

.app__nav button {
  background: #1a1b1e;
  color: #e8e8e8;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
}

.app__nav button.active {
  background: #ff0000;
  border-color: #ff0000;
  color: white;
}

.music-search-page {
  background: #fff;
  color: #0f0f0f;
  border-radius: 8px;
  margin: 12px;
  padding: 16px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-bar__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.search-bar__button {
  background: #ff0000;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
}

.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.search-results__empty,
.search-results__error {
  color: #606060;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
}

.result-card__thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px;
  background: #eee;
}

.result-card__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-card__duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 0.75rem;
  padding: 2px 4px;
  border-radius: 2px;
}

.result-card__title {
  margin-top: 8px;
  font-weight: 600;
  font-size: 0.95rem;
}

.result-card__uploader {
  color: #606060;
  font-size: 0.85rem;
}

.video-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-modal {
  background: #0f0f0f;
  border-radius: 8px;
  width: min(960px, 92vw);
  overflow: hidden;
}

.video-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  color: white;
}

.video-modal__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.video-modal__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.video-modal__player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: black;
}

.video-modal__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.login-page {
  max-width: 320px;
  margin: 80px auto;
  text-align: center;
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-page__form input {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #444;
  background: #1a1b1e;
  color: #e8e8e8;
}

.login-page__error {
  color: #ff6b6b;
}
```

- [ ] **Step 4: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/views/MusicSearchPage.tsx src/App.tsx src/App.css
git commit -m "feat: compose music search page, wire up App.tsx nav and session gate"
```

---

## Task 14: README update and manual verification

**Spec reference:** §12 (testing approach - manual verification for the non-unit-testable path).

**Files:**
- Modify: `README.md`

**Interfaces:**
- None - this task documents how to run both servers together and walks the manual checklist. No further tasks depend on it.

- [ ] **Step 1: Add a "YouTube Search (Phase B)" section to README.md**

Append to `README.md`:
```markdown
## YouTube Search (Phase B)

Search YouTube by name and play a result centered on screen via canvas + JSMpeg (WebGL) - no
`<video>`/`<audio>` element. See
`docs/superpowers/specs/2026-08-10-live-video-player-phase-b-youtube-search-design.md` in the
`react-practice` repo for the full design.

### Run

Terminal 1 (youtube-server):

    cd youtube-server
    npm install
    cp .env.example .env   # set APP_PASSWORD if you want the gate active
    npm start

Terminal 2 (this app):

    npm install
    npm run dev

Open the printed Vite URL, click "Axtar", log in if `APP_PASSWORD` is set, search a song name,
and click a result.

### Manual verification checklist

- [ ] Open DevTools → Elements while a video is playing. Confirm there is no `<video>` and no
      `<audio>` tag anywhere in the DOM - only one `<canvas>` inside the modal.
- [ ] Search a song name, confirm results appear as a grid with thumbnail, duration badge,
      title, and uploader.
- [ ] Click a result. The modal opens centered, video and audio start together and stay in
      sync, with no visible stutter/freeze.
- [ ] Change the quality selector (240p/360p/480p/720p). Playback restarts at the new
      resolution.
- [ ] Click Fullscreen. The canvas fills the screen; click again (or Exit fullscreen) to return.
- [ ] Kill `youtube-server` mid-playback. The modal shows "Yenidən qoşulur…" and recovers
      automatically once the server is restarted.
- [ ] With `APP_PASSWORD` set: load the app in a fresh/incognito session, confirm the login form
      appears, submit the wrong password (confirm "Yanlış parol." appears), then the right one
      (confirm the search page loads and the session persists across a reload).
- [ ] With `APP_PASSWORD` unset: confirm the search page loads directly, no login form.
```

- [ ] **Step 2: Walk the manual verification checklist**

Run both servers as described above and go through each checklist item in a real (non-headless)
browser window - the GPU/WebGL rendering and native Fullscreen API behavior are not meaningfully
testable under `jsdom` (same category as Phase A's own manual checklist, spec §12). Note any
failures found and fix them before considering this task done.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: Phase B README section and manual verification checklist"
```
