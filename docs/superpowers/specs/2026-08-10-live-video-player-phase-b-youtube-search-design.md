# Live Video Player — Phase B Design: YouTube Search & Playback

**Date:** 2026-08-10
**Status:** Approved for planning
**Scope:** A personal, password-gated "search a song → play the YouTube result" page, added to the existing `live-video-player` project alongside Phase A's self-hosted live-stream engine. Replaces the current paste-URL/official-IFrame YouTube integration entirely.

## 1. Problem

Phase A's design explicitly deferred YouTube playback, noting that YouTube exposes no API for raw, decodable video frames — so a true WebCodecs+GPU custom decode pipeline (as built for the self-hosted stream) is not possible for YouTube content. The interim solution (`YouTubeSection`/`YouTubeEmbed`, shipped after Phase A) plays YouTube via the official IFrame Player embed, which is ToS-compliant but wraps YouTube's own hidden `<video>` element — it does not satisfy the "no `<video>` element, custom canvas/GPU rendering" goal at all, and only supports pasting a URL/ID, not searching.

This phase replaces that IFrame integration with a real canvas-rendered, GPU-accelerated (WebGL) player fed by search results, reusing a pattern already proven working in a sibling project, `react-native-practices/video-drive-copy` (a.k.a. `tesla-video-drive`): server-side `yt-dlp` (resolve + search) → `ffmpeg` (transcode to MPEG1-TS) → WebSocket → `JSMpeg` (pure-JS decode, WebGL render) → `<canvas>`.

## 2. Goals and hard constraints

- No `<video>` element and no `<audio>` element anywhere in the DOM for the YouTube playback path.
- The only canvas involved renders via WebGL (JSMpeg's renderer) — no `drawImage`/`putImageData` CPU 2D-blit loop. See §7 for an honest accounting of what "GPU-accelerated" means here versus Phase A's engine.
- Search by song/video name (not just paste-a-URL), with no YouTube Data API key required.
- Clicking a result opens the video centered on screen, video and audio playing together, synchronized, without stutter/freeze.
- Fullscreen support.
- Quality selection: 240p / 360p / 480p / 720p (720p default).
- Personal, password-gated page — not a public multi-tenant product.
- Explicitly NOT this phase: pause/resume and volume controls (UI groundwork may exist, but wiring them up is future work), Twitch support, a public "bait" landing page, and picking a production host/domain (the app is built deploy-ready; where it's deployed is a later decision).

## 3. Architecture overview

```
React app (live-video-player)
  ├─ Phase A view: existing self-hosted live-stream player (untouched)
  └─ Phase B view: "Axtar" (Search) — this design
        │
        │  GET /api/youtube/search?q=...
        ▼
   ┌───────────────────────────────────────────────┐
   │  youtube-server/  (new, sibling to demo-server) │
   │  - Express, password-gate (HMAC session cookie) │
   │  - GET /api/youtube/search → yt-dlp ytsearch    │
   │  - WS  /ws/mpeg1?url=...&quality=... →          │
   │      yt-dlp (resolve direct stream URL)         │
   │      → ffmpeg (video mpeg1video + audio mp2,    │
   │        ONE muxed mpegts stream)                 │
   │      → WebSocket binary                         │
   └───────────────────────────────────────────────┘
        │
        ▼  single WebSocket carrying muxed video+audio
   JSMpeg.Player (audio: true) — WebGL video render,
   Web Audio API audio output, internal A/V sync
        │
        ▼
   <canvas>  (the only DOM element for playback —
              no <video>, no <audio>)
```

The key difference from `video-drive-copy`'s approach: that project splits audio into a separate `<audio>` element fed by an independent HTTP MP3 stream, needing a manual ~5s delay-compensation hack (a Tesla-QtWebEngine-motivated workaround, not a technical requirement elsewhere). Here, video and audio are muxed into the *same* MPEG1-TS stream and decoded together by JSMpeg's own audio+video path, so sync is handled internally and no `<audio>` element or second HTTP endpoint exists at all.

## 4. Server (`youtube-server/`, new directory alongside `demo-server/`)

A new, independent Node/Express server — Phase A's `demo-server/` (fake camera/mic live source for the WebCodecs engine) is untouched.

**Endpoints:**
- `GET /api/youtube/search?q=<query>&n=<count>` → `{ results: [{ id, title, uploader, duration, thumbnail, url }] }`. Ported as-is from `video-drive-copy`'s `yt-dlp --flat-playlist ytsearch` implementation — no YouTube Data API key needed.
- `WS /ws/mpeg1?url=<youtube-url-or-id>&quality=240|360|480|720` → resolves the direct stream URL via `yt-dlp -g` (same bot-check-dodging args as the ported code: `--extractor-args youtube:player_client=android`, or `--cookies` if `YT_DLP_COOKIES` is set), then spawns `ffmpeg` to produce **one** MPEG1-TS stream containing both:
  - video: `-c:v mpeg1video`, scaled per the quality table in §9, `-bf 0` (no B-frames, matches `video-drive-copy`'s low-latency tuning)
  - audio: `-c:a mp2`, muxed into the same `-f mpegts` output (this is the change from `video-drive-copy`, which passes `-an` and streams audio separately)

  Binary chunks are forwarded to the client over the WebSocket as they're produced. Connection close kills the `ffmpeg` process (same cleanup pattern as the ported code).

**Auth:** the single-shared-password, HMAC-signed session cookie gate from `video-drive-copy`'s `server.js` is ported directly (`APP_PASSWORD` env var; a no-op pass-through if unset, so local dev needs no setup). `video-drive-copy`'s "public bait gallery" concept (an unauthenticated decoy page, with `/api/youtube/search` deliberately left open) is **not** ported — every route, including `GET /api/youtube/search`, sits behind the password gate here. No path is exempted.

**Not ported:** `/probe/` diagnostics, Twitch OAuth/follows/status endpoints, the separate `/api/live-audio` MP3 endpoint (superseded by muxed audio).

## 5. Client structure

`YouTubeSection.tsx` and `YouTubeEmbed.tsx` (the IFrame integration) are deleted entirely.

```
src/
  components/
    search/
      SearchBar.tsx        — text input, searches on Enter/button click (not live-as-you-type)
      SearchResults.tsx     — grid of result cards
      ResultCard.tsx        — thumbnail + duration badge + title + uploader
      VideoModal.tsx        — centered overlay, close button, fullscreen button, hosts the canvas
  hooks/
    useYouTubeSearch.ts     — calls /api/youtube/search, loading/error state
    useJsmpegPlayer.ts      — owns JSMpeg.Player lifecycle: construct against the canvas ref and
                              the /ws/mpeg1 URL on open, destroy on close/unmount
  views/
    MusicSearchPage.tsx     — composes SearchBar + SearchResults + VideoModal
  vendor/
    jsmpeg.min.js           — copied from video-drive-copy, loaded via a <script> tag in
                              index.html (matches how it's already used there); a small ambient
                              src/types/jsmpeg.d.ts declares the global `JSMpeg` namespace for TS
```

`App.tsx` gains a simple two-way view toggle (plain state, no router — YAGNI for two views): "Live Demo" (existing Phase A) and "Axtar" (this page).

**Fullscreen** reuses Phase A's existing `useFullscreen` hook unchanged.

## 6. Rendering path — what "GPU-accelerated canvas" means here

Being precise, since this differs from Phase A's engine: JSMpeg's MPEG1 bitstream decode (entropy decoding, IDCT, motion compensation) runs in JavaScript on the CPU — YouTube provides no raw-frame API, so `WebCodecs` hardware decode (used by Phase A for the self-hosted stream) is not an option here. What *is* GPU-accelerated is the render step: JSMpeg uploads decoded YCbCr planes as WebGL textures and does the colorspace conversion and final composite via a shader directly onto the `<canvas>` — not a CPU-side `drawImage`/`putImageData` loop. That CPU-blit loop was the actual, specific source of the stutter/freeze from the original problem statement, and it's what this path avoids. MPEG1 is a lightweight codec, so real-time JS decode at these resolutions/framerates is not a performance concern in practice (this is the same technique JSMpeg is widely used for elsewhere).

## 7. Audio path and sync

Audio (`mp2`) is muxed into the same `mpegts` stream as video and decoded by the same `JSMpeg.Player` instance, constructed with `audio: true` (`video-drive-copy` explicitly sets `audio: false` and splits audio out — a Tesla-specific workaround this project doesn't need). JSMpeg's own internal A/V sync (buffering both streams from one demuxed source, keyed to the container's own timestamps) handles alignment — no custom sync/compensation logic is written for this phase.

## 8. Error handling

- Search returns no results or the request fails → "Nəticə tapılmadı" message in `SearchResults`, no modal interaction attempted.
- Stream resolve or `ffmpeg` spawn fails (offline video, YouTube bot-check block, unsupported URL) → `VideoModal` shows an inline error state with a retry/close option, mirroring the WS `{ type: 'error', message }` pattern already used server-side in `video-drive-copy`.
- WebSocket drops mid-playback → automatic reconnect with exponential backoff, reusing Phase A's `reconnectDelayMs` function and a status indicator in `VideoModal` (adapted from Phase A's `ReconnectingIndicator`) instead of leaving the canvas frozen with no explanation.

## 9. Quality selection

| Quality | ffmpeg scale |
|---|---|
| 240p | 426:240 |
| 360p | 640:360 |
| 480p | 854:480 |
| 720p (default) | 1280:720 |

(`video-drive-copy`'s 1080p tier is dropped — not needed for this use case — and a 240p tier is added for constrained connections.) A quality selector in `VideoModal` re-requests the WebSocket at the new `quality` query param, tearing down and restarting the `JSMpeg.Player` (same coarse-grained approach Phase A uses for its own quality-switch scaffold).

## 10. Performance tuning

- ffmpeg: no B-frames (`-bf 0`), low mux delay (`-muxdelay 0.1 -muxpreload 0`), fixed output framerate — the same low-latency settings already tuned in `video-drive-copy`, applied to the now-muxed audio+video output.
- JSMpeg client-side buffer size (`maxBufferSize`/`chunkSize` equivalents) is tuned during implementation against real playback — large enough to absorb network jitter, small enough not to add perceptible lag; no fixed numbers are committed to in this design.
- WebSocket auto-reconnect (§8) so a transient network hiccup self-heals instead of a permanent freeze.

## 11. Visual design

YouTube-inspired, not a YouTube clone:
- **Search/results view**: light theme, YouTube red (`#FF0000`) accent color, results as a card grid (thumbnail with duration badge in the bottom-right corner, title, uploader).
- **Video modal**: centered overlay on a dark/theatre-style background around the canvas, with close and fullscreen controls only. Pause/resume and volume controls are not part of this phase's UI at all (§2, §14) — no stubbed/disabled placeholders for them, to avoid a UI that looks broken.

## 12. Testing approach

- **Server**: `vitest` unit tests for the pure logic — `resolveStreamUrl`'s branch selection (bare channel vs. URL vs. already-direct-media), the search-result mapping, and the HMAC session sign/verify functions — none of which require spawning real `yt-dlp`/`ffmpeg` processes.
- **Client**: `vitest` + testing-library for `useYouTubeSearch` (mocked `fetch`) and other non-rendering logic. As with Phase A's GPU renderer, JSMpeg's WebGL canvas output is not meaningfully testable under `jsdom` — verified manually against the real server, following the same manual-checklist approach used for Phase A (`README.md`).

## 13. Relationship to `video-drive-copy` — what's ported vs. not

| | `video-drive-copy` | This phase |
|---|---|---|
| Framing | Tesla Drive Mode bypass + browser probe | Personal YouTube search/player, no Tesla angle |
| Frontend | Vanilla HTML/JS | React + TypeScript, part of `live-video-player` |
| Sources | YouTube + Twitch (OAuth, follows) | YouTube only |
| Probe page | Yes (`/probe/`) | Not ported |
| Audio | Separate `<audio>` + HTTP MP3, ~5s manual sync compensation | Muxed into the same MPEG1-TS stream, JSMpeg's built-in sync |
| Quality tiers | 360/480/720/1080 | 240/360/480/720 |
| Fullscreen | Not present | Present (Phase A's `useFullscreen`) |
| WS reconnect | Basic (closes on error) | Exponential-backoff auto-reconnect (Phase A pattern) |
| Auth | Password gate + public "bait" decoy page | Password gate only, whole app gated |
| Visual design | Utilitarian, dark, Tesla-dashboard style | YouTube-inspired (light+red search, dark player) |
| Code location | Standalone repo | Inside `live-video-player`, sharing its React app and Phase A's hooks/patterns |

Search (`yt-dlp ytsearch`) and the core resolve→transcode→WebSocket→JSMpeg pipeline are ported close to as-is; everything else in the table above is a deliberate change for this project's actual use case.

## 14. Explicit non-goals for this phase

- Pause/resume and volume controls (future phase).
- Twitch support.
- A public unauthenticated "bait" landing page.
- Choosing a production host/domain (the app and its password gate are deploy-ready; deployment itself is a later, separate decision).
- 1080p quality tier.
