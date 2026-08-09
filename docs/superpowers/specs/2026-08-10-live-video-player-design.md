# Live Video Player — Phase A Design

**Date:** 2026-08-10
**Status:** Approved for planning
**Scope:** Custom high-performance rendering/playback engine for a self-hosted live video stream, delivered over WebSocket (WebTransport-ready). YouTube search/playback is explicitly deferred (Phase B, not designed here).

## 1. Problem

The existing browser implementation renders live video by blitting frames onto a `<canvas>` (CPU-side, main-thread `drawImage`/`putImageData` per frame). This freezes and stutters under load and burns CPU. This design replaces it with a GPU-driven, off-main-thread pipeline that never uses an HTML `<video>` element and never does per-frame 2D canvas blitting.

## 2. Hard constraints

- No `<video>` element anywhere in the DOM.
- No `<audio>` element either — audio goes through Web Audio API.
- No per-frame CPU pixel copy (no `drawImage`/`putImageData` loop). The only canvas involved is a GPU rendering surface (WebGPU/WebGL2), touched via direct texture upload of `VideoFrame`, not 2D blitting.
- Decode + render must not run on the same thread as React — a slow React re-render or GC pause must never visibly affect playback.
- Real-time, low-latency, continuous streaming; minimal CPU and minimal frame copies.

## 3. Architecture overview

```
[ffmpeg mock server] --WS/WebTransport--> [Transport] -> [Protocol framer/demuxer]
                                                              |
                                            (all inside one dedicated Worker)
                                                              v
                                    [VideoDecoder] --VideoFrame--> [WebGPU/WebGL2 renderer] -> OffscreenCanvas
                                    [AudioDecoder] --PCM------------------------------------> AudioWorklet ring buffer -> AudioContext (main thread)
                                                              |
                                          PlayerState (status/buffering/live/quality/error/secondsBehindLive)
                                                              v
                                postMessage — state deltas only, never raw frames — React (useSyncExternalStore)
```

React owns exactly one `<canvas>` DOM node. On mount, its control is transferred once via `canvas.transferControlToOffscreen()` into a dedicated Worker and never touched by React again. All decode and render work — transport consumption, demuxing, `VideoDecoder`, `AudioDecoder`, GPU renderer — lives inside that Worker. The main thread only ever receives small `PlayerState` deltas (status, error, buffering, isLive, quality, volume, muted, fullscreen, secondsBehindLive), bridged into React via `useSyncExternalStore`, so React re-renders on state transitions, never per frame.

## 4. Wire protocol (new)

Fixed binary framing, codec-agnostic, identical over WebSocket and WebTransport so the transport is swappable without touching decode/render code:

```
[1 byte type][1 byte flags][8 byte timestamp µs][4 byte payload length][payload]
type:  0 = video chunk, 1 = audio chunk, 2 = metadata/control
flags: bit0 = keyframe (video only)
```

Video and audio chunks share the same source clock (µs timestamp), which is what makes A/V sync possible downstream. A `SeekRequest` control message is defined for backend-supported historical seek (see §6), but no backend support is assumed in this phase.

## 5. Rendering path

Each `VideoFrame` produced by `VideoDecoder` is uploaded directly to a GPU texture — `device.importExternalTexture()` on WebGPU, or `texImage2D()`/`texSubImage2D()` with the `VideoFrame` as source on WebGL2 fallback — with no intermediate CPU-side pixel copy. A minimal fullscreen-quad shader paints that texture onto the `OffscreenCanvas`. Renderer choice is feature-detected at startup: WebGPU if `navigator.gpu` is available, else WebGL2.

Presentation is paced by comparing each frame's own timestamp against a running presentation clock, not "draw whatever arrived this tick" — this is what keeps playback smooth under bursty network delivery instead of naively following network jitter.

**Pause:** stop advancing the presentation clock and stop feeding the decoder. No extra work is needed to "hold" the frame — the canvas keeps showing whatever was last painted since nothing clears it.

## 6. Audio path and A/V sync

`AudioDecoder` runs in the same Worker, producing PCM that is transferred to an `AudioWorkletProcessor` ring buffer (~100–200ms) on the main thread's `AudioContext` (audio output must live on the main thread's audio graph; this is the one piece of decoded data that crosses back out of the Worker, and it's a small fixed-size ring buffer copy, not a frame-sized copy).

**Audio is the sync master.** `AudioContext.currentTime` is the stable, hardware-driven clock. Before painting each video frame, the renderer compares that frame's timestamp to the current audio playback position: behind → drop the frame and advance to the next one; ahead → hold the previous frame and wait. Video always tracks audio; it never free-runs against it. If a stream carries no audio track (or audio init fails), the renderer falls back to a clock anchored to the first video frame.

The ring buffer's ~100–200ms window doubles as jitter tolerance for both streams.

## 7. Pause/resume and DVR buffering

While paused, the transport connection is **not** torn down — it keeps receiving and buffering incoming chunks into a local DVR ring buffer (default window: 30s, configurable).

- **Resume within the buffer window:** playback continues from the exact paused frame at normal 1x speed — no keyframe wait, no buffering spinner, since the data is already local. The viewer is now behind live by however long the pause lasted; the UI shows this as "N seconds behind — Jump to live" instead of the live badge. Tapping it drops the backlog and jumps to the freshest buffered data (may require waiting for the next keyframe). Automatic catch-up-by-speedup was considered and rejected: it requires pitch-preserving time-stretch (e.g. WSOLA) to avoid audible artifacts, which is meaningful added complexity for a live-monitoring use case where "behind live + manual jump-to-live" (the YouTube Live/Twitch pattern) is simpler, predictable, and sufficient.
- **Resume after the buffer window is exceeded (long pause):** the ring buffer evicts old data by a single shared timestamp cutoff applied uniformly to both the audio and video streams (not independent per-stream limits) — this guarantees the buffer always spans the same time window for both. Because video can only resume decoding from a keyframe (codec constraint; audio has no equivalent restriction), the resume timestamp is dictated by the first available video keyframe still in the buffer, and audio playback is started from that exact same timestamp rather than from audio's own independently-available oldest sample. This guarantees the two streams start back up from one common point and stay aligned via the §6 mechanism from then on — audio and video are never allowed to resume from two different points in time.

## 8. Seeking and quality

**Seeking** is scoped to the local DVR ring buffer from §7. The `SeekRequest` protocol message exists for a backend that supports serving historical chunks, but that capability is not assumed to exist yet — seeking beyond the local buffer is out of scope until a backend advertises it.

**Quality selection**: the client is built to switch renditions (tear down the current decoder, resubscribe the transport to a different stream, wait for the next keyframe) when the backend exposes multiple encoded renditions of the same source. Until the backend does that, the player is functionally single-quality — this is a backend capability gap, not something the client fakes.

## 9. React structure

```
live-video-player/
  src/
    components/   LiveVideoPlayer, Controls, ProgressBar, QualityMenu,
                  FullscreenButton, LiveBadge, BufferingSpinner, ErrorOverlay
    hooks/        usePlayerEngine, useFullscreen, useSyncedPlayerState
    player/       playerWorker.ts (worker entry)
                  renderer/webgpu.ts, renderer/webgl2.ts, renderer/quadShader.ts
                  decode/video.ts, decode/audio.ts
                  sync/avClock.ts
                  buffer/dvrRingBuffer.ts
                  state/machine.ts
    services/     transport/Transport.ts (interface), transport/websocket.ts,
                  transport/webtransport.ts, transport/protocol.ts
                  quality/QualityManager.ts
    workers/      worker bootstrap/registration glue
    utils/
  demo-server/    ffmpeg-based mock live source (Node + ws)
```

`LiveVideoPlayer` mounts the `<canvas>`, transfers it to the worker once, and exposes player controls backed by `usePlayerEngine` (owns the worker handle + typed message bus) and `useSyncedPlayerState` (bridges `PlayerState` into React via `useSyncExternalStore`).

## 10. Local demo/dev server

Phase A ships a small Node server (`demo-server/`) that spawns the system `ffmpeg` binary (confirmed present: 8.1.2 with libx264) to produce a continuous H.264 test-pattern stream, frames it per §4's protocol, and serves it over WebSocket (`ws` package) so the whole system is runnable end-to-end in this repo without any external backend. This is a dev-only tool; the production client only depends on whatever real backend implements the same wire protocol. A WebTransport demo server is not stood up in Phase A (local HTTP/3 + certificate setup is meaningfully heavier); the client's WebTransport transport implementation exists and auto-activates when `window.WebTransport` exists and the server advertises support — it's simply not exercised by the bundled demo yet.

## 11. Libraries — deliberately minimal

| Need | Choice | Why not something heavier |
|---|---|---|
| Cross-thread state in React | `useSyncExternalStore` (built-in) | `PlayerState` is ~8 fields; zustand/redux would be convenience overhead, not a missing capability. |
| Worker RPC | Hand-rolled ~40-line typed message bus | The message surface is small and fixed (a few commands out, one state-delta channel back); `comlink` adds a dependency for something this size. |
| Fullscreen | Native Fullscreen API, ~15-line hook | `screenfull` exists mainly for old-Safari prefixing this project's browser bar doesn't need to support. |
| Video/streaming | None — explicitly not hls.js/dash.js/shaka-player/video.js/mux.js | All of them are built around `<video>` or MSE; using any of them works against the no-`<video>` requirement, not for it. |
| Testing | `vitest` | Matches this repo's existing Vite setup. |
| Demo server transport | `ws` (Node) | Simplest correct WebSocket server; not part of the production client bundle. |
| Scaffolding | Vite + React 19 + TypeScript | Matches this repo's existing conventions (`admin-panel`, `exercise-typescript-app-01`). |

## 12. Browser compatibility and limitations

- **WebCodecs:** Chrome/Edge, Safari 16.4+, Firefox 130+. No legacy/IE support.
- **WebGPU:** broadly available on current Chromium and Safari; WebGL2 fallback covers the remaining gap (older Firefox in particular).
- **WebTransport:** Chromium-only in practice today; WebSocket is the universal path and the one the bundled demo uses.
- **OffscreenCanvas + Worker transfer:** supported in all evergreen browsers.
- **Quality selection** is architecturally present but functionally inert until a backend serves multiple renditions.
- **Seeking** is bounded to the local DVR window until a backend supports historical chunk serving.

## 13. Testing approach

`vitest` unit tests cover the pure, non-GPU logic: protocol framing (parse/serialize round-trip), DVR ring buffer eviction (including the shared-cutoff and video-keyframe-driven audio realignment logic from §7), the A/V sync clock's drop/hold decision function, and the player state machine's transitions. The GPU/WebCodecs decode-and-render path is not meaningfully testable under jsdom and is verified manually against the bundled demo server.

## 14. Deliverables and explicit non-goals for this phase

**Delivered in Phase A:** the engine described above, the React player shell and controls, the demo server, and — once the above is verified working — a Claude Code skill under `.claude/skills/` packaging this pattern (transport abstraction, WebCodecs+GPU render pipeline, off-main-thread player shell, DVR/A-V-sync logic) for reuse in future projects.

**Explicitly out of scope this phase:**
- YouTube search and playback (Phase B). Note for that future phase: YouTube exposes no official API for raw decodable frames, so YouTube playback there must go through the official IFrame Player API (Data API v3 for search) rather than any custom decode pipeline — this constrains what "GPU-accelerated custom rendering" can mean for YouTube content specifically.
- True multi-bitrate ABR (depends on a backend that doesn't exist yet).
- A WebTransport-serving demo server.
- Automatic playback-speed catch-up after pause (rejected in favor of the behind-live-badge pattern; see §7).
