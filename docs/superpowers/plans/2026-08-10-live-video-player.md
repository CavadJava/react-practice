# Live Video Player (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GPU-accelerated, off-main-thread live video player (no `<video>`, no per-frame canvas blitting) for a self-hosted WebSocket/WebTransport stream, with a runnable local demo.

**Architecture:** A single dedicated Worker owns transport → WebCodecs decode → WebGPU/WebGL2 render into an `OffscreenCanvas`; audio decodes in the same Worker but plays out through a main-thread `AudioContext`/`AudioWorklet` (audio output must live on the main thread). React only exchanges small `PlayerState` deltas with the Worker via `postMessage`, bridged through `useSyncExternalStore` — it never sees a frame.

**Tech Stack:** Vite, React 19, TypeScript, vitest. WebCodecs, WebGPU (WebGL2 fallback), Web Audio API (`AudioWorklet`), `OffscreenCanvas`, native Fullscreen API. Demo server: Node + `ws` + system `ffmpeg`.

## Global Constraints

- No `<video>` element anywhere in the DOM. No `<audio>` element either.
- No per-frame CPU pixel copy — no `drawImage`/`putImageData` loop. The only canvas is a GPU rendering surface touched via direct `VideoFrame` texture upload.
- Decode and render must not share a thread with React.
- Project root: `/Users/frontend/workspace/react-native-practices/live-video-player/` (this is a plain browser web app placed in that directory, matching the existing precedent of `youtube-remote-webrtc` and `taobao-v1-admin` — both non-RN web projects already living there).
- Spec: `docs/superpowers/specs/2026-08-10-live-video-player-design.md` (in the `react-practice` repo) — every task below implements a section of it; section references are noted per task.
- DVR window default: 30 seconds. Sync tolerance: 150ms (matches the AudioWorklet ring buffer window).
- All timestamps in this codebase are in **microseconds** (`Us` suffix on every timestamp variable/field) unless explicitly named otherwise — this must stay consistent across every module below.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `index.html`, `vitest.config.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/App.css`
- Create: `src/smoke.test.ts`

**Interfaces:**
- Produces: a runnable `npm run dev` (Vite dev server) and `npm test` (vitest) at the project root, matching this monorepo's existing convention (`admin-panel`, `exercise-typescript-app-01`).

- [ ] **Step 1: Create the project directory and package.json**

```bash
mkdir -p /Users/frontend/workspace/react-native-practices/live-video-player/src
cd /Users/frontend/workspace/react-native-practices/live-video-player
```

`package.json`:
```json
{
  "name": "live-video-player",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.59.2",
    "vite": "^8.0.12",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create TypeScript configs**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create Vite and Vitest configs**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Note: `jsdom` needs to be present for the environment; add it to devDependencies too:

```bash
npm pkg set devDependencies.jsdom="^25.0.0"
```

- [ ] **Step 4: Create index.html and entry files**

`index.html`:
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
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx` (placeholder wired up fully in Task 13 — kept minimal here just to make the scaffold runnable):
```tsx
function App() {
  return (
    <div className="app">
      <h1>Live Video Player</h1>
    </div>
  );
}

export default App;
```

`src/App.css`:
```css
.app {
  color-scheme: dark;
  background: #0b0c10;
  color: #e8e8e8;
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}
```

- [ ] **Step 5: Create a smoke test**

`src/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('scaffold', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Install and verify**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
npm install
npm test
npm run build
```

Expected: `npm test` passes 1 test; `npm run build` completes with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/frontend/workspace/react-native-practices/live-video-player
git init
git add -A
git commit -m "chore: scaffold live-video-player project"
```

---

## Task 2: Wire protocol and frame stream reassembly

**Spec reference:** §4 (wire protocol).

**Files:**
- Create: `src/protocol/protocol.ts`
- Create: `src/protocol/protocol.test.ts`
- Create: `src/protocol/frameStreamReassembler.ts`
- Create: `src/protocol/frameStreamReassembler.test.ts`

**Interfaces:**
- Produces: `FRAME_TYPE` (`{ VIDEO: 0, AUDIO: 1, METADATA: 2 }`), `FrameType`, `ParsedFrame { type, keyframe, timestampUs, payload: Uint8Array }`, `encodeFrame(frame): ArrayBuffer`, `parseFrame(data: ArrayBuffer): ParsedFrame`, `HEADER_BYTES`, `peekFrameTotalLength(bytes: Uint8Array): number | null`, and `FrameStreamReassembler` with `push(chunk: Uint8Array): ArrayBuffer[]`. Later tasks (transport, DVR buffer, worker) import all of these.

- [ ] **Step 1: Write the failing tests for protocol.ts**

`src/protocol/protocol.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { encodeFrame, parseFrame, peekFrameTotalLength, FRAME_TYPE, HEADER_BYTES } from './protocol';

describe('encodeFrame/parseFrame', () => {
  it('round-trips a video keyframe', () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeFrame({ type: FRAME_TYPE.VIDEO, keyframe: true, timestampUs: 123456, payload });
    const parsed = parseFrame(encoded);
    expect(parsed.type).toBe(FRAME_TYPE.VIDEO);
    expect(parsed.keyframe).toBe(true);
    expect(parsed.timestampUs).toBe(123456);
    expect(Array.from(parsed.payload)).toEqual([1, 2, 3, 4, 5]);
  });

  it('round-trips a non-keyframe audio frame with empty payload', () => {
    const encoded = encodeFrame({ type: FRAME_TYPE.AUDIO, keyframe: false, timestampUs: 0, payload: new Uint8Array(0) });
    const parsed = parseFrame(encoded);
    expect(parsed.type).toBe(FRAME_TYPE.AUDIO);
    expect(parsed.keyframe).toBe(false);
    expect(parsed.payload.byteLength).toBe(0);
  });

  it('throws on a buffer shorter than the header', () => {
    expect(() => parseFrame(new ArrayBuffer(HEADER_BYTES - 1))).toThrow(/too short/i);
  });

  it('throws when declared length does not match buffer size', () => {
    const encoded = encodeFrame({ type: FRAME_TYPE.VIDEO, keyframe: true, timestampUs: 0, payload: new Uint8Array(10) });
    const truncated = encoded.slice(0, HEADER_BYTES + 5);
    expect(() => parseFrame(truncated)).toThrow(/length mismatch/i);
  });

  it('peekFrameTotalLength reports the full frame size before the payload has fully arrived', () => {
    const encoded = encodeFrame({ type: FRAME_TYPE.VIDEO, keyframe: true, timestampUs: 0, payload: new Uint8Array(20) });
    const bytes = new Uint8Array(encoded);
    expect(peekFrameTotalLength(bytes)).toBe(HEADER_BYTES + 20);
    expect(peekFrameTotalLength(bytes.slice(0, HEADER_BYTES - 1))).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- protocol.test.ts`
Expected: FAIL with "Cannot find module './protocol'" or similar.

- [ ] **Step 3: Implement protocol.ts**

`src/protocol/protocol.ts`:
```typescript
export const FRAME_TYPE = {
  VIDEO: 0,
  AUDIO: 1,
  METADATA: 2,
} as const;

export type FrameType = (typeof FRAME_TYPE)[keyof typeof FRAME_TYPE];

export interface ParsedFrame {
  type: FrameType;
  keyframe: boolean;
  timestampUs: number;
  payload: Uint8Array;
}

export interface EncodableFrame {
  type: FrameType;
  keyframe: boolean;
  timestampUs: number;
  payload: Uint8Array;
}

/** [1B type][1B flags(bit0=keyframe)][8B timestampUs][4B payload length][payload] */
export const HEADER_BYTES = 14;

export function encodeFrame(frame: EncodableFrame): ArrayBuffer {
  const buffer = new ArrayBuffer(HEADER_BYTES + frame.payload.byteLength);
  const view = new DataView(buffer);
  view.setUint8(0, frame.type);
  view.setUint8(1, frame.keyframe ? 1 : 0);
  view.setBigUint64(2, BigInt(Math.round(frame.timestampUs)), false);
  view.setUint32(10, frame.payload.byteLength, false);
  new Uint8Array(buffer, HEADER_BYTES).set(frame.payload);
  return buffer;
}

export function parseFrame(data: ArrayBuffer): ParsedFrame {
  if (data.byteLength < HEADER_BYTES) {
    throw new Error(`Frame too short: ${data.byteLength} bytes, need at least ${HEADER_BYTES}`);
  }
  const view = new DataView(data);
  const type = view.getUint8(0) as FrameType;
  const flags = view.getUint8(1);
  const timestampUs = Number(view.getBigUint64(2, false));
  const length = view.getUint32(10, false);
  if (HEADER_BYTES + length !== data.byteLength) {
    throw new Error(
      `Frame length mismatch: header declares ${length} byte payload, buffer has ${data.byteLength - HEADER_BYTES}`,
    );
  }
  const payload = new Uint8Array(data, HEADER_BYTES, length);
  return { type, keyframe: (flags & 1) === 1, timestampUs, payload };
}

/**
 * Reads just the header (if enough bytes are present) to report the total byte length of the
 * frame it belongs to, without requiring the payload to have fully arrived yet. Used to
 * reassemble frames out of a raw byte stream (see frameStreamReassembler.ts).
 */
export function peekFrameTotalLength(bytes: Uint8Array): number | null {
  if (bytes.byteLength < HEADER_BYTES) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = view.getUint32(10, false);
  return HEADER_BYTES + length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- protocol.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing test for frameStreamReassembler.ts**

`src/protocol/frameStreamReassembler.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { encodeFrame, parseFrame, FRAME_TYPE } from './protocol';
import { FrameStreamReassembler } from './frameStreamReassembler';

function frameBytes(timestampUs: number): Uint8Array {
  return new Uint8Array(
    encodeFrame({ type: FRAME_TYPE.VIDEO, keyframe: false, timestampUs, payload: new Uint8Array([9, 9]) }),
  );
}

describe('FrameStreamReassembler', () => {
  it('returns a complete frame fed in one chunk', () => {
    const reassembler = new FrameStreamReassembler();
    const frames = reassembler.push(frameBytes(1));
    expect(frames).toHaveLength(1);
    expect(parseFrame(frames[0]).timestampUs).toBe(1);
  });

  it('reassembles a frame split across two chunks', () => {
    const reassembler = new FrameStreamReassembler();
    const whole = frameBytes(2);
    const first = reassembler.push(whole.slice(0, 10));
    expect(first).toHaveLength(0);
    const second = reassembler.push(whole.slice(10));
    expect(second).toHaveLength(1);
    expect(parseFrame(second[0]).timestampUs).toBe(2);
  });

  it('extracts multiple frames delivered in a single chunk', () => {
    const reassembler = new FrameStreamReassembler();
    const combined = new Uint8Array([...frameBytes(3), ...frameBytes(4)]);
    const frames = reassembler.push(combined);
    expect(frames).toHaveLength(2);
    expect(parseFrame(frames[0]).timestampUs).toBe(3);
    expect(parseFrame(frames[1]).timestampUs).toBe(4);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- frameStreamReassembler.test.ts`
Expected: FAIL with "Cannot find module './frameStreamReassembler'".

- [ ] **Step 7: Implement frameStreamReassembler.ts**

`src/protocol/frameStreamReassembler.ts`:
```typescript
import { peekFrameTotalLength } from './protocol';

/**
 * Reassembles complete protocol frames out of a raw byte stream (e.g. a WebTransport
 * unidirectional stream, which delivers arbitrary-sized chunks with no message boundaries).
 * The protocol's own length-prefixed header makes this self-delimiting.
 */
export class FrameStreamReassembler {
  private pending = new Uint8Array(0);

  push(chunk: Uint8Array): ArrayBuffer[] {
    const combined = new Uint8Array(this.pending.byteLength + chunk.byteLength);
    combined.set(this.pending, 0);
    combined.set(chunk, this.pending.byteLength);

    const frames: ArrayBuffer[] = [];
    let offset = 0;
    for (;;) {
      const remaining = combined.subarray(offset);
      const frameLength = peekFrameTotalLength(remaining);
      if (frameLength === null || remaining.byteLength < frameLength) break;
      frames.push(remaining.slice(0, frameLength).buffer);
      offset += frameLength;
    }
    this.pending = combined.slice(offset);
    return frames;
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- frameStreamReassembler.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 9: Commit**

```bash
git add src/protocol
git commit -m "feat: wire protocol framing and stream reassembly"
```

---

## Task 3: DVR ring buffer

**Spec reference:** §7 (pause/resume DVR buffering, shared-cutoff eviction, keyframe-driven audio realignment).

**Files:**
- Create: `src/buffer/dvrRingBuffer.ts`
- Create: `src/buffer/dvrRingBuffer.test.ts`

**Interfaces:**
- Consumes: `FrameType`, `FRAME_TYPE` from `../protocol/protocol`.
- Produces: `DvrFrame { type: FrameType; keyframe: boolean; timestampUs: number; payload: Uint8Array }`, `DvrRingBuffer` class with `push(frame: DvrFrame, nowUs: number): void`, `framesFrom(timestampUs: number): DvrFrame[]`, `framesInRange(fromUs: number, toUs: number): DvrFrame[]`, `firstVideoKeyframeAtOrAfter(fromUs: number): number | null`, `resumePoint(pausedAtUs: number): number | null`, `get size(): number`. Task 11 (worker integration) is the consumer.

- [ ] **Step 1: Write the failing tests**

`src/buffer/dvrRingBuffer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { FRAME_TYPE } from '../protocol/protocol';
import { DvrRingBuffer, type DvrFrame } from './dvrRingBuffer';

function frame(type: DvrFrame['type'], timestampUs: number, keyframe = false): DvrFrame {
  return { type, keyframe, timestampUs, payload: new Uint8Array([1]) };
}

describe('DvrRingBuffer', () => {
  it('evicts frames older than the shared cutoff for both streams uniformly', () => {
    const dvr = new DvrRingBuffer(250);
    dvr.push(frame(FRAME_TYPE.VIDEO, 0, true), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 0), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 100), 100);
    dvr.push(frame(FRAME_TYPE.VIDEO, 150), 150);
    dvr.push(frame(FRAME_TYPE.AUDIO, 200), 200);
    dvr.push(frame(FRAME_TYPE.VIDEO, 300, true), 300);
    dvr.push(frame(FRAME_TYPE.AUDIO, 300), 300);
    dvr.push(frame(FRAME_TYPE.AUDIO, 400), 400); // cutoff = 400 - 250 = 150

    const remaining = dvr.framesFrom(0);
    const timestamps = remaining.map((f) => f.timestampUs);
    expect(timestamps).toEqual([150, 200, 300, 300, 400]);
  });

  it('resumePoint returns the exact paused timestamp when it is still buffered', () => {
    const dvr = new DvrRingBuffer(10_000);
    dvr.push(frame(FRAME_TYPE.VIDEO, 0, true), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 100), 100);
    dvr.push(frame(FRAME_TYPE.AUDIO, 200), 200);

    expect(dvr.resumePoint(100)).toBe(100);
  });

  it('resumePoint realigns audio to the next video keyframe when the paused point has been evicted', () => {
    const dvr = new DvrRingBuffer(250);
    dvr.push(frame(FRAME_TYPE.VIDEO, 0, true), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 0), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 100), 100);
    dvr.push(frame(FRAME_TYPE.VIDEO, 150), 150); // non-keyframe
    dvr.push(frame(FRAME_TYPE.AUDIO, 200), 200);
    dvr.push(frame(FRAME_TYPE.VIDEO, 300, true), 300); // next keyframe
    dvr.push(frame(FRAME_TYPE.AUDIO, 300), 300);
    dvr.push(frame(FRAME_TYPE.AUDIO, 400), 400); // cutoff = 150, oldest remaining is video@150

    const resumeUs = dvr.resumePoint(50); // 50 was evicted
    expect(resumeUs).toBe(300);

    const replay = dvr.framesFrom(resumeUs!);
    // Both streams must start from the SAME point - audio@200 must be excluded even
    // though it is still technically buffered, because it is older than the video keyframe.
    expect(replay.map((f) => f.timestampUs)).toEqual([300, 300, 400]);
    expect(replay.some((f) => f.type === FRAME_TYPE.VIDEO && f.keyframe)).toBe(true);
  });

  it('resumePoint returns null when the buffer is empty', () => {
    const dvr = new DvrRingBuffer(1000);
    expect(dvr.resumePoint(0)).toBeNull();
  });

  it('framesInRange returns only frames within the bounds, inclusive', () => {
    const dvr = new DvrRingBuffer(10_000);
    dvr.push(frame(FRAME_TYPE.AUDIO, 0), 0);
    dvr.push(frame(FRAME_TYPE.AUDIO, 100), 100);
    dvr.push(frame(FRAME_TYPE.AUDIO, 200), 200);
    dvr.push(frame(FRAME_TYPE.AUDIO, 300), 300);

    expect(dvr.framesInRange(100, 200).map((f) => f.timestampUs)).toEqual([100, 200]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- dvrRingBuffer.test.ts`
Expected: FAIL with "Cannot find module './dvrRingBuffer'".

- [ ] **Step 3: Implement dvrRingBuffer.ts**

`src/buffer/dvrRingBuffer.ts`:
```typescript
import { FRAME_TYPE, type FrameType } from '../protocol/protocol';

export interface DvrFrame {
  type: FrameType;
  keyframe: boolean;
  timestampUs: number;
  payload: Uint8Array;
}

/**
 * Local rolling buffer of recently-received frames, used for pause/resume and short seeks.
 *
 * IMPORTANT: `push` must be called with frames in non-decreasing `timestampUs` order across
 * BOTH streams combined (as delivered by the transport in a real-time protocol) - eviction
 * relies on the internal array staying sorted by arrival/timestamp order.
 */
export class DvrRingBuffer {
  private frames: DvrFrame[] = [];

  constructor(private readonly windowUs: number) {}

  push(frame: DvrFrame, nowUs: number): void {
    this.frames.push(frame);
    this.evictOlderThan(nowUs - this.windowUs);
  }

  evictOlderThan(cutoffUs: number): void {
    let i = 0;
    while (i < this.frames.length && this.frames[i].timestampUs < cutoffUs) i++;
    if (i > 0) this.frames.splice(0, i);
  }

  framesFrom(timestampUs: number): DvrFrame[] {
    return this.frames.filter((f) => f.timestampUs >= timestampUs);
  }

  framesInRange(fromUs: number, toUs: number): DvrFrame[] {
    return this.frames.filter((f) => f.timestampUs >= fromUs && f.timestampUs <= toUs);
  }

  firstVideoKeyframeAtOrAfter(fromUs: number): number | null {
    const kf = this.frames.find((f) => f.type === FRAME_TYPE.VIDEO && f.keyframe && f.timestampUs >= fromUs);
    return kf ? kf.timestampUs : null;
  }

  /**
   * Resume point after a pause of `pausedAtUs`. If that timestamp is still buffered, resume
   * from it exactly (both streams already share that point). If the buffer has since wrapped
   * past it, resume from the first available video keyframe instead (video cannot decode
   * mid-GOP) - the caller must then read BOTH streams via `framesFrom`/`framesInRange` starting
   * at this same returned timestamp, so audio realigns to the video keyframe rather than
   * resuming from its own, independently older, oldest buffered sample.
   */
  resumePoint(pausedAtUs: number): number | null {
    if (this.frames.length === 0) return null;
    const oldest = this.frames[0].timestampUs;
    if (pausedAtUs >= oldest) return pausedAtUs;
    return this.firstVideoKeyframeAtOrAfter(oldest);
  }

  get size(): number {
    return this.frames.length;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- dvrRingBuffer.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/buffer
git commit -m "feat: DVR ring buffer with shared-cutoff eviction and keyframe-aligned resume"
```

---

## Task 4: A/V sync clock

**Spec reference:** §6 (audio-master sync, drop/hold).

**Files:**
- Create: `src/sync/avClock.ts`
- Create: `src/sync/avClock.test.ts`
- Create: `src/sync/audioClockEstimator.ts`
- Create: `src/sync/audioClockEstimator.test.ts`

**Interfaces:**
- Produces: `SyncDecision = 'present' | 'drop' | 'hold'`, `decideSyncAction(frameTimestampUs, audioClockUs, toleranceUs): SyncDecision`, `FreeRunningClock` class (`start(firstFrameTimestampUs, nowMs)`, `currentUs(nowMs): number`), `AudioClockEstimator` class (`updateAnchor(audioTimeUs, wallTimeMs)`, `estimateUs(nowMs): number | null`). Task 11 (worker) is the consumer.

- [ ] **Step 1: Write the failing tests for avClock.ts**

`src/sync/avClock.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { decideSyncAction, FreeRunningClock } from './avClock';

describe('decideSyncAction', () => {
  it('presents a frame within tolerance of the audio clock', () => {
    expect(decideSyncAction(1_000_000, 1_000_050, 150_000)).toBe('present');
  });

  it('drops a frame that is behind the audio clock beyond tolerance', () => {
    expect(decideSyncAction(1_000_000, 1_300_000, 150_000)).toBe('drop');
  });

  it('holds a frame that is ahead of the audio clock beyond tolerance', () => {
    expect(decideSyncAction(1_500_000, 1_000_000, 150_000)).toBe('hold');
  });

  it('presents exactly at the tolerance boundary', () => {
    expect(decideSyncAction(1_150_000, 1_000_000, 150_000)).toBe('present');
  });
});

describe('FreeRunningClock', () => {
  it('advances at wall-clock rate from the anchor frame', () => {
    const clock = new FreeRunningClock();
    clock.start(5_000_000, 1000);
    expect(clock.currentUs(1000)).toBe(5_000_000);
    expect(clock.currentUs(1500)).toBe(5_500_000);
  });

  it('returns 0 before start() has been called', () => {
    const clock = new FreeRunningClock();
    expect(clock.currentUs(1000)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- avClock.test.ts`
Expected: FAIL with "Cannot find module './avClock'".

- [ ] **Step 3: Implement avClock.ts**

`src/sync/avClock.ts`:
```typescript
export type SyncDecision = 'present' | 'drop' | 'hold';

/**
 * Audio is the sync master (see spec §6). Given a decoded video frame's own timestamp and
 * the current estimated audio playback position, decide whether to show it now, skip it
 * because it is already stale, or hold the previous frame because this one isn't due yet.
 */
export function decideSyncAction(frameTimestampUs: number, audioClockUs: number, toleranceUs: number): SyncDecision {
  const drift = frameTimestampUs - audioClockUs;
  if (drift < -toleranceUs) return 'drop';
  if (drift > toleranceUs) return 'hold';
  return 'present';
}

/** Fallback clock for audio-less streams, anchored to the first video frame's own timestamp. */
export class FreeRunningClock {
  private anchorFrameUs: number | null = null;
  private anchorWallMs = 0;

  start(firstFrameTimestampUs: number, nowMs: number): void {
    this.anchorFrameUs = firstFrameTimestampUs;
    this.anchorWallMs = nowMs;
  }

  currentUs(nowMs: number): number {
    if (this.anchorFrameUs === null) return 0;
    return this.anchorFrameUs + (nowMs - this.anchorWallMs) * 1000;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- avClock.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the failing tests for audioClockEstimator.ts**

`src/sync/audioClockEstimator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { AudioClockEstimator } from './audioClockEstimator';

describe('AudioClockEstimator', () => {
  it('returns null before any anchor has been received', () => {
    const estimator = new AudioClockEstimator();
    expect(estimator.estimateUs(1000)).toBeNull();
  });

  it('extrapolates forward from the last anchor at wall-clock rate', () => {
    const estimator = new AudioClockEstimator();
    estimator.updateAnchor(2_000_000, 1000);
    expect(estimator.estimateUs(1000)).toBe(2_000_000);
    expect(estimator.estimateUs(1080)).toBe(2_080_000);
  });

  it('re-anchors on each update', () => {
    const estimator = new AudioClockEstimator();
    estimator.updateAnchor(2_000_000, 1000);
    estimator.updateAnchor(2_100_000, 1100);
    expect(estimator.estimateUs(1100)).toBe(2_100_000);
    expect(estimator.estimateUs(1150)).toBe(2_150_000);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- audioClockEstimator.test.ts`
Expected: FAIL with "Cannot find module './audioClockEstimator'".

- [ ] **Step 7: Implement audioClockEstimator.ts**

`src/sync/audioClockEstimator.ts`:
```typescript
/**
 * The Worker doesn't have direct access to the main thread's AudioContext.currentTime (audio
 * output lives on the main thread - see spec §6). The main thread periodically posts an
 * (audioTimeUs, wallTimeMs) anchor; this class extrapolates the current audio position between
 * anchors so the Worker's renderer always has an up-to-date estimate without a round trip per
 * video frame.
 */
export class AudioClockEstimator {
  private anchorAudioUs = 0;
  private anchorWallMs = 0;
  private hasAnchor = false;

  updateAnchor(audioTimeUs: number, wallTimeMs: number): void {
    this.anchorAudioUs = audioTimeUs;
    this.anchorWallMs = wallTimeMs;
    this.hasAnchor = true;
  }

  estimateUs(nowMs: number): number | null {
    if (!this.hasAnchor) return null;
    return this.anchorAudioUs + (nowMs - this.anchorWallMs) * 1000;
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- audioClockEstimator.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 9: Commit**

```bash
git add src/sync
git commit -m "feat: audio-master A/V sync clock and cross-thread audio clock estimator"
```

---

## Task 5: Player state machine

**Spec reference:** §7, §8 (player states, live/behind-live, quality, volume/mute/fullscreen).

**Files:**
- Create: `src/state/machine.ts`
- Create: `src/state/machine.test.ts`

**Interfaces:**
- Produces: `ConnectionStatus`, `PlayerState`, `INITIAL_PLAYER_STATE`, `PlayerEvent` (discriminated union), `reducePlayerState(state, event): PlayerState`. Consumed by Task 11 (worker, dispatches events) and Task 12 (`useSyncedPlayerState`, reads the resulting `PlayerState` shape).

- [ ] **Step 1: Write the failing tests**

`src/state/machine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { INITIAL_PLAYER_STATE, reducePlayerState } from './machine';

describe('reducePlayerState', () => {
  it('moves from idle to connecting to buffering to playing', () => {
    let state = INITIAL_PLAYER_STATE;
    state = reducePlayerState(state, { kind: 'connect' });
    expect(state.status).toBe('connecting');
    state = reducePlayerState(state, { kind: 'connected' });
    expect(state.status).toBe('buffering');
    state = reducePlayerState(state, { kind: 'bufferingEnd' });
    expect(state.status).toBe('playing');
  });

  it('tracks behind-live seconds and clears isLive while behind', () => {
    let state = INITIAL_PLAYER_STATE;
    state = reducePlayerState(state, { kind: 'behindLiveChanged', seconds: 12 });
    expect(state.secondsBehindLive).toBe(12);
    expect(state.isLive).toBe(false);
  });

  it('jumpToLive resets to live and goes back to buffering', () => {
    let state = reducePlayerState(INITIAL_PLAYER_STATE, { kind: 'behindLiveChanged', seconds: 12 });
    state = reducePlayerState(state, { kind: 'jumpToLive' });
    expect(state.secondsBehindLive).toBe(0);
    expect(state.isLive).toBe(true);
    expect(state.status).toBe('buffering');
  });

  it('records errors and preserves the message', () => {
    const state = reducePlayerState(INITIAL_PLAYER_STATE, { kind: 'error', message: 'decode failed' });
    expect(state.status).toBe('error');
    expect(state.error).toBe('decode failed');
  });

  it('updates volume and muted independently', () => {
    let state = reducePlayerState(INITIAL_PLAYER_STATE, { kind: 'volumeChanged', volume: 0.5 });
    state = reducePlayerState(state, { kind: 'muteChanged', muted: true });
    expect(state.volume).toBe(0.5);
    expect(state.muted).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- machine.test.ts`
Expected: FAIL with "Cannot find module './machine'".

- [ ] **Step 3: Implement machine.ts**

`src/state/machine.ts`:
```typescript
export type ConnectionStatus = 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'reconnecting' | 'error';

export interface PlayerState {
  status: ConnectionStatus;
  error: string | null;
  isLive: boolean;
  secondsBehindLive: number;
  quality: string | null;
  availableQualities: string[];
  volume: number;
  muted: boolean;
  fullscreen: boolean;
}

export const INITIAL_PLAYER_STATE: PlayerState = {
  status: 'idle',
  error: null,
  isLive: true,
  secondsBehindLive: 0,
  quality: null,
  availableQualities: [],
  volume: 1,
  muted: false,
  fullscreen: false,
};

export type PlayerEvent =
  | { kind: 'connect' }
  | { kind: 'connected' }
  | { kind: 'bufferingStart' }
  | { kind: 'bufferingEnd' }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'behindLiveChanged'; seconds: number }
  | { kind: 'jumpToLive' }
  | { kind: 'qualitiesAvailable'; qualities: string[] }
  | { kind: 'qualityChanged'; quality: string }
  | { kind: 'volumeChanged'; volume: number }
  | { kind: 'muteChanged'; muted: boolean }
  | { kind: 'fullscreenChanged'; fullscreen: boolean }
  | { kind: 'reconnecting' }
  | { kind: 'error'; message: string };

export function reducePlayerState(state: PlayerState, event: PlayerEvent): PlayerState {
  switch (event.kind) {
    case 'connect':
      return { ...state, status: 'connecting', error: null };
    case 'connected':
      return { ...state, status: 'buffering' };
    case 'bufferingStart':
      return { ...state, status: 'buffering' };
    case 'bufferingEnd':
      return { ...state, status: 'playing' };
    case 'pause':
      return { ...state, status: 'paused' };
    case 'resume':
      return { ...state, status: 'playing' };
    case 'behindLiveChanged':
      return { ...state, secondsBehindLive: event.seconds, isLive: event.seconds === 0 };
    case 'jumpToLive':
      return { ...state, secondsBehindLive: 0, isLive: true, status: 'buffering' };
    case 'qualitiesAvailable':
      return { ...state, availableQualities: event.qualities };
    case 'qualityChanged':
      return { ...state, quality: event.quality, status: 'buffering' };
    case 'volumeChanged':
      return { ...state, volume: event.volume };
    case 'muteChanged':
      return { ...state, muted: event.muted };
    case 'fullscreenChanged':
      return { ...state, fullscreen: event.fullscreen };
    case 'reconnecting':
      return { ...state, status: 'reconnecting' };
    case 'error':
      return { ...state, status: 'error', error: event.message };
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- machine.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "feat: player state machine"
```

---

## Task 6: Transport layer (WebSocket + WebTransport)

**Spec reference:** §4 (protocol is transport-agnostic), §12 (WebSocket universal, WebTransport opportunistic).

**Files:**
- Create: `src/transport/Transport.ts`
- Create: `src/transport/websocket.ts`
- Create: `src/transport/websocket.test.ts`
- Create: `src/transport/webtransport.ts`
- Create: `src/transport/createTransport.ts`

**Interfaces:**
- Consumes: `FrameStreamReassembler` from `../protocol/frameStreamReassembler`.
- Produces: `TransportEvents { onFrame(data: ArrayBuffer): void; onStatusChange(status: 'connecting'|'open'|'closed'|'reconnecting'): void; onError(error: Error): void }`, `Transport { connect(url, events): void; send(data: ArrayBuffer): void; close(): void }`, `WebSocketTransport`, `WebTransportTransport`, `reconnectDelayMs(attempt: number): number`, `createTransport(): Transport`. Task 11 (worker) is the consumer via `createTransport()`.

- [ ] **Step 1: Implement Transport.ts (interfaces only, no test needed)**

`src/transport/Transport.ts`:
```typescript
export interface TransportEvents {
  onFrame: (data: ArrayBuffer) => void;
  onStatusChange: (status: 'connecting' | 'open' | 'closed' | 'reconnecting') => void;
  onError: (error: Error) => void;
}

export interface Transport {
  connect(url: string, events: TransportEvents): void;
  send(data: ArrayBuffer): void;
  close(): void;
}
```

- [ ] **Step 2: Write the failing tests for websocket.ts**

`src/transport/websocket.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketTransport, reconnectDelayMs } from './websocket';

describe('reconnectDelayMs', () => {
  it('grows exponentially and caps at 30s', () => {
    expect(reconnectDelayMs(0)).toBe(500);
    expect(reconnectDelayMs(1)).toBe(1000);
    expect(reconnectDelayMs(6)).toBe(30000);
    expect(reconnectDelayMs(10)).toBe(30000);
  });
});

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  binaryType = '';
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(): void {}

  close(): void {
    this.closed = true;
    this.onclose?.();
  }

  triggerOpen(): void {
    this.onopen?.();
  }

  triggerMessage(data: ArrayBuffer): void {
    this.onmessage?.({ data });
  }
}

describe('WebSocketTransport', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports open and forwards binary messages as frames', () => {
    const transport = new WebSocketTransport();
    const onFrame = vi.fn();
    const onStatusChange = vi.fn();
    transport.connect('ws://example.test', { onFrame, onStatusChange, onError: vi.fn() });

    const socket = FakeWebSocket.instances[0];
    socket.triggerOpen();
    expect(onStatusChange).toHaveBeenCalledWith('open');

    const payload = new ArrayBuffer(4);
    socket.triggerMessage(payload);
    expect(onFrame).toHaveBeenCalledWith(payload);
  });

  it('does not reconnect after an explicit close()', () => {
    const transport = new WebSocketTransport();
    const onStatusChange = vi.fn();
    transport.connect('ws://example.test', { onFrame: vi.fn(), onStatusChange, onError: vi.fn() });
    transport.close();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(onStatusChange).toHaveBeenCalledWith('closed');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- websocket.test.ts`
Expected: FAIL with "Cannot find module './websocket'".

- [ ] **Step 4: Implement websocket.ts**

`src/transport/websocket.ts`:
```typescript
import type { Transport, TransportEvents } from './Transport';

export function reconnectDelayMs(attempt: number): number {
  return Math.min(30000, 500 * 2 ** attempt);
}

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null;
  private events: TransportEvents | null = null;
  private url = '';
  private reconnectAttempt = 0;
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(url: string, events: TransportEvents): void {
    this.url = url;
    this.events = events;
    this.closedByUser = false;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  private openSocket(): void {
    const events = this.events;
    if (!events) return;
    events.onStatusChange(this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

    const ws = new WebSocket(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempt = 0;
      events.onStatusChange('open');
    };
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) events.onFrame(event.data);
    };
    ws.onerror = () => {
      events.onError(new Error('WebSocket error'));
    };
    ws.onclose = () => {
      if (this.closedByUser) {
        events.onStatusChange('closed');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    const events = this.events;
    if (!events) return;
    events.onStatusChange('reconnecting');
    const delayMs = reconnectDelayMs(this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delayMs);
  }

  send(data: ArrayBuffer): void {
    this.ws?.send(data);
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- websocket.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Implement webtransport.ts (no automated test - WebTransport does not exist in jsdom/Node; the reassembly logic it depends on is already covered by Task 2's tests)**

`src/transport/webtransport.ts`:
```typescript
import type { Transport, TransportEvents } from './Transport';
import { FrameStreamReassembler } from '../protocol/frameStreamReassembler';

export class WebTransportTransport implements Transport {
  private wt: InstanceType<typeof globalThis.WebTransport> | null = null;
  private closedByUser = false;

  connect(url: string, events: TransportEvents): void {
    this.closedByUser = false;
    void this.connectInternal(url, events);
  }

  private async connectInternal(url: string, events: TransportEvents): Promise<void> {
    events.onStatusChange('connecting');
    try {
      const wt = new globalThis.WebTransport(url);
      this.wt = wt;
      await wt.ready;
      events.onStatusChange('open');
      void wt.closed.then(() => {
        if (!this.closedByUser) events.onStatusChange('reconnecting');
      });
      await this.pump(wt, events);
    } catch (err) {
      events.onError(err instanceof Error ? err : new Error(String(err)));
      if (!this.closedByUser) events.onStatusChange('reconnecting');
    }
  }

  private async pump(wt: InstanceType<typeof globalThis.WebTransport>, events: TransportEvents): Promise<void> {
    const reader = wt.incomingUnidirectionalStreams.getReader();
    for (;;) {
      const { value: stream, done } = await reader.read();
      if (done) break;
      void this.readStream(stream, events);
    }
  }

  private async readStream(stream: ReadableStream<Uint8Array>, events: TransportEvents): Promise<void> {
    const reader = stream.getReader();
    const reassembler = new FrameStreamReassembler();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const frame of reassembler.push(value)) events.onFrame(frame);
    }
  }

  send(): void {
    // No control channel needed for this read-only live demo path yet.
  }

  close(): void {
    this.closedByUser = true;
    this.wt?.close();
  }
}
```

- [ ] **Step 7: Implement createTransport.ts**

`src/transport/createTransport.ts`:
```typescript
import type { Transport } from './Transport';
import { WebSocketTransport } from './websocket';
import { WebTransportTransport } from './webtransport';

/** WebTransport when the browser has it, WebSocket otherwise (see spec §12). */
export function createTransport(): Transport {
  if (typeof globalThis.WebTransport === 'function') {
    return new WebTransportTransport();
  }
  return new WebSocketTransport();
}
```

Note: TypeScript's DOM lib may not yet declare `WebTransport` depending on the installed `typescript` version. If `tsc` reports `WebTransport` as undefined in `tsconfig.app.json`'s build, add this ambient declaration file:

`src/webtransport.d.ts`:
```typescript
declare class WebTransport {
  constructor(url: string);
  ready: Promise<void>;
  closed: Promise<void>;
  incomingUnidirectionalStreams: ReadableStream<ReadableStream<Uint8Array>>;
  close(): void;
}
```

- [ ] **Step 8: Run the full test suite and build to confirm nothing broke**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds (add the `webtransport.d.ts` from Step 7 if the build fails on `WebTransport`).

- [ ] **Step 9: Commit**

```bash
git add src/transport
git commit -m "feat: WebSocket and WebTransport transport implementations"
```

---

## Task 7: Demo server (ffmpeg mock live source)

**Spec reference:** §10.

**Files:**
- Create: `demo-server/package.json`
- Create: `demo-server/server.mjs`
- Create: `demo-server/README.md`

**Interfaces:**
- Produces: a WebSocket server on `ws://localhost:8765` that frames an ffmpeg-generated H.264 test-pattern stream per the Task 2 wire protocol (video type=0, one NAL-unit-aligned chunk per frame, keyframe flag set on IDR frames) plus a synthetic Opus audio tone (type=1), so Task 1's app has something real to connect to end-to-end.

- [ ] **Step 1: Create the demo server package**

`demo-server/package.json`:
```json
{
  "name": "live-video-player-demo-server",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.mjs"
  },
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

- [ ] **Step 2: Implement server.mjs**

`demo-server/server.mjs`:
```javascript
import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';

const PORT = 8765;
const FRAME_TYPE = { VIDEO: 0, AUDIO: 1, METADATA: 2 };
const HEADER_BYTES = 14;

function encodeFrame(type, keyframe, timestampUs, payload) {
  const buffer = Buffer.alloc(HEADER_BYTES + payload.byteLength);
  buffer.writeUInt8(type, 0);
  buffer.writeUInt8(keyframe ? 1 : 0, 1);
  buffer.writeBigUInt64BE(BigInt(Math.round(timestampUs)), 2);
  buffer.writeUInt32BE(payload.byteLength, 10);
  payload.copy(buffer, HEADER_BYTES);
  return buffer;
}

/** Splits a raw H.264 Annex-B byte stream into NAL units (start-code delimited). */
function splitAnnexB(chunk, leftover) {
  const data = leftover.length ? Buffer.concat([leftover, chunk]) : chunk;
  const units = [];
  let start = -1;
  let i = 0;
  while (i < data.length - 3) {
    const isStartCode = data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 1;
    if (isStartCode) {
      if (start >= 0) units.push(data.subarray(start, i));
      start = i + 3;
      i += 3;
    } else {
      i += 1;
    }
  }
  const newLeftover = start >= 0 ? data.subarray(start) : data;
  return { units, leftover: Buffer.from(newLeftover) };
}

function isKeyframeNal(nal) {
  if (nal.length === 0) return false;
  const nalType = nal[0] & 0x1f;
  return nalType === 5; // IDR slice
}

const wss = new WebSocketServer({ port: PORT });
console.log(`Demo live source listening on ws://localhost:${PORT}`);

const AUDIO_SAMPLE_RATE = 48000;
const AUDIO_CHANNELS = 2;
const AUDIO_BYTES_PER_SAMPLE = 4; // f32le
const AUDIO_CHUNK_FRAMES = 960; // 20ms at 48kHz
const AUDIO_CHUNK_BYTES = AUDIO_CHUNK_FRAMES * AUDIO_CHANNELS * AUDIO_BYTES_PER_SAMPLE;

wss.on('connection', (socket) => {
  console.log('Client connected');
  const startUs = Date.now() * 1000;

  // --- Video: H.264 Annex-B over stdout, framed per-NAL-unit ---
  const ffmpegVideo = spawn('ffmpeg', [
    '-re',
    '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
    '-x264-params', 'keyint=60:scenecut=0',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-f', 'h264', 'pipe:1',
  ]);

  let videoLeftover = Buffer.alloc(0);
  let videoFrameIndex = 0;

  ffmpegVideo.stdout.on('data', (chunk) => {
    const { units, leftover } = splitAnnexB(chunk, videoLeftover);
    videoLeftover = leftover;
    for (const nal of units) {
      const timestampUs = startUs + Math.round((videoFrameIndex * 1_000_000) / 30);
      videoFrameIndex += 1;
      const withStartCode = Buffer.concat([Buffer.from([0, 0, 0, 1]), nal]);
      const frame = encodeFrame(FRAME_TYPE.VIDEO, isKeyframeNal(nal), timestampUs, withStartCode);
      if (socket.readyState === socket.OPEN) socket.send(frame);
    }
  });

  ffmpegVideo.stderr.on('data', () => {
    // ffmpeg logs progress to stderr by default; swallow it to keep the demo server's own
    // logs readable. Remove this handler if you need to debug the video ffmpeg pipeline.
  });
  ffmpegVideo.on('error', (err) => {
    console.error('Failed to start video ffmpeg - is it installed and on PATH?', err);
  });

  // --- Audio: raw interleaved f32le PCM over stdout, chunked to 20ms and framed directly -
  // this matches the client's 'pcm-f32' AudioDecoder config (see codecs.ts), which sidesteps
  // needing an Opus encoder just to exercise the real decode -> AudioWorklet -> sync pipeline
  // end-to-end in this demo. Swap to a real Opus-encoding backend for production.
  const ffmpegAudio = spawn('ffmpeg', [
    '-re',
    '-f', 'lavfi', '-i', `sine=frequency=440:sample_rate=${AUDIO_SAMPLE_RATE}`,
    '-f', 'f32le',
    '-ar', String(AUDIO_SAMPLE_RATE),
    '-ac', String(AUDIO_CHANNELS),
    'pipe:1',
  ]);

  let audioLeftover = Buffer.alloc(0);
  let audioChunkIndex = 0;

  ffmpegAudio.stdout.on('data', (chunk) => {
    const data = audioLeftover.length ? Buffer.concat([audioLeftover, chunk]) : chunk;
    let offset = 0;
    while (data.length - offset >= AUDIO_CHUNK_BYTES) {
      const slice = data.subarray(offset, offset + AUDIO_CHUNK_BYTES);
      offset += AUDIO_CHUNK_BYTES;
      const timestampUs = startUs + Math.round((audioChunkIndex * AUDIO_CHUNK_FRAMES * 1_000_000) / AUDIO_SAMPLE_RATE);
      audioChunkIndex += 1;
      const frame = encodeFrame(FRAME_TYPE.AUDIO, false, timestampUs, Buffer.from(slice));
      if (socket.readyState === socket.OPEN) socket.send(frame);
    }
    audioLeftover = Buffer.from(data.subarray(offset));
  });

  ffmpegAudio.stderr.on('data', () => {
    // Swallow ffmpeg's progress logging on this pipeline too; see the video handler above.
  });
  ffmpegAudio.on('error', (err) => {
    console.error('Failed to start audio ffmpeg - is it installed and on PATH?', err);
  });

  socket.on('close', () => {
    console.log('Client disconnected, stopping ffmpeg');
    ffmpegVideo.kill('SIGKILL');
    ffmpegAudio.kill('SIGKILL');
  });
});
```

`demo-server/README.md`:
```markdown
# Demo live source

Streams a synthetic H.264 test-pattern video (via ffmpeg) plus a 440Hz sine-wave audio tone
(raw f32le PCM, matching the client's 'pcm-f32' AudioDecoder config), both framed per the
project's wire protocol (see `docs/superpowers/specs/2026-08-10-live-video-player-design.md`
§4) over WebSocket - so the client app has a real audio+video live stream to connect to
without needing any real backend.

Requires the system `ffmpeg` binary (with `libx264`) on PATH.

    npm install
    npm start

Serves `ws://localhost:8765`. Swap the audio pipeline to a real Opus encoder (and the
client's `AUDIO_CODEC_CONFIG.codec` to `'opus'`) when wiring this up to a production
backend - nothing else in the decode/render/sync pipeline needs to change to make that swap.
```

- [ ] **Step 3: Install and manually verify**

```bash
cd demo-server
npm install
npm start
```

Expected: logs `Demo live source listening on ws://localhost:8765` and, once a client connects (Task 13 will provide one; for now verify manually with a scratch script), streams binary frames continuously without erroring. Stop with Ctrl-C.

Manual verification without a client yet - confirm ffmpeg itself produces output:
```bash
ffmpeg -f lavfi -i testsrc=size=1280x720:rate=30 -c:v libx264 -preset ultrafast -t 2 -f h264 /tmp/test.h264 && ls -la /tmp/test.h264 && rm /tmp/test.h264
```
Expected: a non-empty file is created.

- [ ] **Step 4: Commit**

```bash
git add demo-server
git commit -m "feat: ffmpeg-based demo live source server"
```

---

## Task 8: WebCodecs decoder wrappers

**Spec reference:** §5 (video decode), §6 (audio decode).

**Files:**
- Create: `src/player/decode/videoDecoder.ts`
- Create: `src/player/decode/audioDecoder.ts`
- Create: `src/player/decode/codecs.ts`

**Interfaces:**
- Produces: `createVideoDecoder(codec, onFrame, onError): VideoDecoderHandle` (`decode(chunk), close()`), `createAudioDecoder(config, onFrame, onError): AudioDecoderHandle` (`decode(chunk), close()`), `VIDEO_CODEC`, `AUDIO_CODEC_CONFIG` constants. Task 11 (worker) is the consumer.
- Note: `VideoDecoder`/`AudioDecoder` do not exist in jsdom, so these wrappers are verified manually (Task 14's end-to-end checklist), matching spec §13.

- [ ] **Step 1: Implement codecs.ts**

`src/player/decode/codecs.ts`:
```typescript
/** avc1.42001f = H.264 Constrained Baseline Profile, level 3.1 - matches the demo server's libx264 output. */
export const VIDEO_CODEC = 'avc1.42001f';

/**
 * 'pcm-f32' is one of WebCodecs' Linear PCM passthrough codecs (decode is just a reformat,
 * no real codec work) - the bundled demo server (Task 7) sends raw PCM so the demo doesn't
 * need an Opus encoder. Point this at 'opus' (with a real Opus-encoding backend) for production;
 * nothing else in the decode/render/sync pipeline needs to change to make that switch.
 */
export const AUDIO_CODEC_CONFIG = {
  codec: 'pcm-f32',
  sampleRate: 48000,
  numberOfChannels: 2,
} as const;
```

- [ ] **Step 2: Implement videoDecoder.ts**

`src/player/decode/videoDecoder.ts`:
```typescript
export interface VideoChunkInput {
  keyframe: boolean;
  timestampUs: number;
  data: Uint8Array;
}

export interface VideoDecoderHandle {
  decode(chunk: VideoChunkInput): void;
  close(): void;
}

export function createVideoDecoder(
  codec: string,
  onFrame: (frame: VideoFrame) => void,
  onError: (error: Error) => void,
): VideoDecoderHandle {
  const decoder = new VideoDecoder({
    output: (frame) => onFrame(frame),
    error: (e) => onError(e instanceof Error ? e : new Error(String(e))),
  });
  decoder.configure({ codec });

  return {
    decode(chunk) {
      if (decoder.state !== 'configured') return;
      decoder.decode(
        new EncodedVideoChunk({
          type: chunk.keyframe ? 'key' : 'delta',
          timestamp: chunk.timestampUs,
          data: chunk.data,
        }),
      );
    },
    close() {
      if (decoder.state !== 'closed') decoder.close();
    },
  };
}
```

- [ ] **Step 3: Implement audioDecoder.ts**

`src/player/decode/audioDecoder.ts`:
```typescript
export interface AudioChunkInput {
  timestampUs: number;
  data: Uint8Array;
}

export interface AudioDecoderConfigInput {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
}

export interface AudioDecoderHandle {
  decode(chunk: AudioChunkInput): void;
  close(): void;
}

export function createAudioDecoder(
  config: AudioDecoderConfigInput,
  onFrame: (data: AudioData) => void,
  onError: (error: Error) => void,
): AudioDecoderHandle {
  const decoder = new AudioDecoder({
    output: (data) => onFrame(data),
    error: (e) => onError(e instanceof Error ? e : new Error(String(e))),
  });
  decoder.configure(config);

  return {
    decode(chunk) {
      if (decoder.state !== 'configured') return;
      decoder.decode(
        new EncodedAudioChunk({
          type: 'key',
          timestamp: chunk.timestampUs,
          data: chunk.data,
        }),
      );
    },
    close() {
      if (decoder.state !== 'closed') decoder.close();
    },
  };
}
```

- [ ] **Step 4: Build to confirm types are correct**

Run: `npm run build`
Expected: succeeds (the `WebWorker` lib added in Task 1's `tsconfig.app.json` provides `VideoDecoder`/`AudioDecoder`/`VideoFrame`/`AudioData` types).

- [ ] **Step 5: Commit**

```bash
git add src/player/decode
git commit -m "feat: WebCodecs video/audio decoder wrappers"
```

---

## Task 9: GPU renderers (WebGPU + WebGL2)

**Spec reference:** §5 (direct VideoFrame texture upload, no CPU blit).

**Files:**
- Create: `src/player/renderer/Renderer.ts`
- Create: `src/player/renderer/webgl2Renderer.ts`
- Create: `src/player/renderer/webgpuRenderer.ts`
- Create: `src/player/renderer/createRenderer.ts`

**Interfaces:**
- Produces: `Renderer { renderFrame(frame: VideoFrame): void; destroy(): void }`, `WebGL2Renderer`, `WebGpuRenderer` (with static `create(canvas)`), `createRenderer(canvas: OffscreenCanvas): Promise<Renderer>`. Task 11 (worker) is the consumer.
- No automated tests: neither WebGPU nor WebGL2 contexts exist in jsdom/Node (spec §13). Verified manually in Task 14 against the demo server in a real browser.

- [ ] **Step 1: Implement Renderer.ts**

`src/player/renderer/Renderer.ts`:
```typescript
export interface Renderer {
  /** Uploads the frame straight to a GPU texture and paints it - no CPU pixel copy. */
  renderFrame(frame: VideoFrame): void;
  destroy(): void;
}
```

- [ ] **Step 2: Implement webgl2Renderer.ts**

`src/player/renderer/webgl2Renderer.ts`:
```typescript
import type { Renderer } from './Renderer';

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_frame;
out vec4 outColor;
void main() {
  outColor = texture(u_frame, v_texCoord);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

export class WebGL2Renderer implements Renderer {
  private gl: WebGL2RenderingContext;
  private texture: WebGLTexture;
  private program: WebGLProgram;

  constructor(canvas: OffscreenCanvas) {
    const gl = canvas.getContext('webgl2', { alpha: false, desynchronized: true }) as WebGL2RenderingContext | null;
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
    }
    this.program = program;
    gl.useProgram(program);

    // Fullscreen quad: two triangles, [x, y, u, v] interleaved.
    const quad = new Float32Array([
      -1, -1, 0, 1,
      1, -1, 1, 1,
      -1, 1, 0, 0,
      -1, 1, 0, 0,
      1, -1, 1, 1,
      1, 1, 1, 0,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create texture');
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  renderFrame(frame: VideoFrame): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // texImage2D accepts a VideoFrame directly - the upload happens on the GPU, no CPU pixel copy.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy(): void {
    this.gl.deleteTexture(this.texture);
    this.gl.deleteProgram(this.program);
  }
}
```

- [ ] **Step 3: Implement webgpuRenderer.ts**

`src/player/renderer/webgpuRenderer.ts`:
```typescript
import type { Renderer } from './Renderer';

const SHADER = `
struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
};

@vertex
fn vertexMain(@builtin(vertex_index) i: u32) -> VertexOut {
  var pos = array<vec2f, 6>(
    vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
    vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1)
  );
  var uv = array<vec2f, 6>(
    vec2f(0, 1), vec2f(1, 1), vec2f(0, 0),
    vec2f(0, 0), vec2f(1, 1), vec2f(1, 0)
  );
  var out: VertexOut;
  out.position = vec4f(pos[i], 0.0, 1.0);
  out.texCoord = uv[i];
  return out;
}

@group(0) @binding(0) var frameSampler: sampler;
@group(0) @binding(1) var frameTexture: texture_external;

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
  return textureSampleBaseClampToEdge(frameTexture, frameSampler, in.texCoord);
}
`;

export class WebGpuRenderer implements Renderer {
  private constructor(
    private device: GPUDevice,
    private context: GPUCanvasContext,
    private pipeline: GPURenderPipeline,
    private sampler: GPUSampler,
  ) {}

  static async create(canvas: OffscreenCanvas): Promise<WebGpuRenderer> {
    const gpu = navigator.gpu;
    if (!gpu) throw new Error('WebGPU not available');
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter');
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext | null;
    if (!context) throw new Error('Failed to get webgpu context');
    const format = gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const module = device.createShaderModule({ code: SHADER });
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vertexMain' },
      fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    return new WebGpuRenderer(device, context, pipeline, sampler);
  }

  renderFrame(frame: VideoFrame): void {
    const externalTexture = this.device.importExternalTexture({ source: frame });
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: externalTexture },
      ],
    });
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.draw(6);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  destroy(): void {
    this.device.destroy();
  }
}
```

- [ ] **Step 4: Implement createRenderer.ts**

`src/player/renderer/createRenderer.ts`:
```typescript
import type { Renderer } from './Renderer';
import { WebGL2Renderer } from './webgl2Renderer';
import { WebGpuRenderer } from './webgpuRenderer';

/** WebGPU when available, WebGL2 fallback otherwise (see spec §12). */
export async function createRenderer(canvas: OffscreenCanvas): Promise<Renderer> {
  if (navigator.gpu) {
    try {
      return await WebGpuRenderer.create(canvas);
    } catch (err) {
      console.warn('WebGPU renderer failed to initialize, falling back to WebGL2', err);
    }
  }
  return new WebGL2Renderer(canvas);
}
```

- [ ] **Step 5: Build to confirm types are correct**

Run: `npm run build`
Expected: succeeds. If `navigator.gpu`/`GPUDevice`/etc. are not recognized by the installed TypeScript's DOM lib, add `@webgpu/types` as a devDependency (`npm install -D @webgpu/types`) and add `"types": ["@webgpu/types"]` to `tsconfig.app.json`'s `compilerOptions`.

- [ ] **Step 6: Commit**

```bash
git add src/player/renderer
git commit -m "feat: WebGPU and WebGL2 direct-texture-upload renderers"
```

---

## Task 10: Audio output (AudioWorklet ring buffer)

**Spec reference:** §6 (audio path, main-thread AudioContext).

**Files:**
- Create: `src/player/audio/ring-buffer-processor.js`
- Create: `src/player/audio/audioOutput.ts`

**Interfaces:**
- Produces: `AudioOutput` class (`constructor(sampleRate)`, `init(workletUrl): Promise<void>`, `push(channelData: Float32Array[]): void`, `currentTimeUs(): number`, `setVolume(volume: number): void`, `setMuted(muted: boolean): void`, `close(): void`). Task 12 (`workerClient.ts`, main thread) is the consumer.
- No automated tests: `AudioContext`/`AudioWorklet` are not available in jsdom. Verified manually in Task 14.

- [ ] **Step 1: Implement the AudioWorklet processor**

`src/player/audio/ring-buffer-processor.js`:
```javascript
class RingBufferProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.capacity = sampleRate * 2; // 2 seconds of headroom per channel
    this.channels = [new Float32Array(this.capacity), new Float32Array(this.capacity)];
    this.writeIndex = 0;
    this.readIndex = 0;
    this.available = 0;
    this.port.onmessage = (event) => {
      const channelData = event.data.channelData;
      const frames = channelData[0].length;
      for (let ch = 0; ch < this.channels.length; ch++) {
        const src = channelData[ch] ?? channelData[0];
        for (let i = 0; i < frames; i++) {
          this.channels[ch][(this.writeIndex + i) % this.capacity] = src[i];
        }
      }
      this.writeIndex = (this.writeIndex + frames) % this.capacity;
      this.available = Math.min(this.capacity, this.available + frames);
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const frames = output[0].length;
    for (let i = 0; i < frames; i++) {
      const hasData = this.available > 0;
      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = hasData ? this.channels[ch % this.channels.length][(this.readIndex + i) % this.capacity] : 0;
      }
    }
    const consumed = Math.min(frames, this.available);
    this.readIndex = (this.readIndex + consumed) % this.capacity;
    this.available -= consumed;
    return true;
  }
}

registerProcessor('ring-buffer-processor', RingBufferProcessor);
```

- [ ] **Step 2: Implement audioOutput.ts**

`src/player/audio/audioOutput.ts`:
```typescript
export class AudioOutput {
  private context: AudioContext;
  private node: AudioWorkletNode | null = null;
  private gain: GainNode;
  private volume = 1;
  private muted = false;

  constructor(sampleRate: number) {
    this.context = new AudioContext({ sampleRate });
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
  }

  async init(workletUrl: string): Promise<void> {
    await this.context.audioWorklet.addModule(workletUrl);
    const node = new AudioWorkletNode(this.context, 'ring-buffer-processor', { outputChannelCount: [2] });
    node.connect(this.gain);
    this.node = node;
  }

  push(channelData: Float32Array[]): void {
    this.node?.port.postMessage({ channelData });
  }

  /** Current audio playback position - this is the sync master clock (spec §6). */
  currentTimeUs(): number {
    return this.context.currentTime * 1_000_000;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (!this.muted) this.gain.gain.value = volume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.gain.gain.value = muted ? 0 : this.volume;
  }

  close(): void {
    this.node?.disconnect();
    void this.context.close();
  }
}
```

- [ ] **Step 3: Build to confirm types are correct**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/player/audio
git commit -m "feat: AudioWorklet ring buffer output with volume/mute"
```

---

## Task 11: Worker integration (the core engine)

**Spec reference:** §3, §5, §6, §7 in full - this task wires every prior module together.

**Files:**
- Create: `src/player/workerProtocol.ts`
- Create: `src/player/playerWorker.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–10.
- Produces: `MainToWorkerMessage`, `WorkerToMainMessage` (the postMessage contract), and the Worker entry module itself (instantiated by Task 12's `workerClient.ts` via `new Worker(new URL('../player/playerWorker.ts', import.meta.url), { type: 'module' })`).
- No automated tests: this file only runs inside a real Worker with real WebCodecs/GPU contexts (spec §13). Verified manually in Task 14.

- [ ] **Step 1: Implement workerProtocol.ts**

`src/player/workerProtocol.ts`:
```typescript
import type { PlayerState } from '../state/machine';

export type MainToWorkerMessage =
  | { kind: 'init'; canvas: OffscreenCanvas; streamUrl: string }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'jumpToLive' }
  | { kind: 'setQuality'; quality: string }
  | { kind: 'setVolume'; volume: number }
  | { kind: 'setMuted'; muted: boolean }
  | { kind: 'audioClockUpdate'; audioTimeUs: number; wallTimeMs: number }
  | { kind: 'destroy' };

export type WorkerToMainMessage =
  | { kind: 'state'; state: PlayerState }
  | { kind: 'audioFrame'; channelData: Float32Array[] };
```

- [ ] **Step 2: Implement playerWorker.ts**

`src/player/playerWorker.ts`:
```typescript
/// <reference lib="webworker" />
import type { MainToWorkerMessage, WorkerToMainMessage } from './workerProtocol';
import { createTransport } from '../transport/createTransport';
import { parseFrame, FRAME_TYPE } from '../protocol/protocol';
import { DvrRingBuffer, type DvrFrame } from '../buffer/dvrRingBuffer';
import { createVideoDecoder, type VideoDecoderHandle } from './decode/videoDecoder';
import { createAudioDecoder, type AudioDecoderHandle } from './decode/audioDecoder';
import { VIDEO_CODEC, AUDIO_CODEC_CONFIG } from './decode/codecs';
import { createRenderer } from './renderer/createRenderer';
import type { Renderer } from './renderer/Renderer';
import { decideSyncAction } from '../sync/avClock';
import { AudioClockEstimator } from '../sync/audioClockEstimator';
import { reducePlayerState, INITIAL_PLAYER_STATE, type PlayerState, type PlayerEvent } from '../state/machine';

const DVR_WINDOW_US = 30_000_000; // 30s (spec §7 default)
const SYNC_TOLERANCE_US = 150_000; // matches the AudioWorklet ring buffer window (spec §6)
const CURSOR_TICK_MS = 40;

let state: PlayerState = INITIAL_PLAYER_STATE;
let renderer: Renderer | null = null;
let videoDecoder: VideoDecoderHandle | null = null;
let audioDecoder: AudioDecoderHandle | null = null;
const dvr = new DvrRingBuffer(DVR_WINDOW_US);
const audioClock = new AudioClockEstimator();

let paused = false;
let pausedAtUs = 0;
let latestTimestampUs = 0;
let pendingVideoFrame: VideoFrame | null = null;

// 'live': frames are fed to the decoders the instant they arrive.
// 'cursor': replaying from a pause point at 1x wall-clock rate, staying behind live until
// the user explicitly jumps to live (spec §7 - auto catch-up-by-speedup was rejected).
let mode: 'live' | 'cursor' = 'live';
let cursorUs = 0;
let cursorWallAnchorMs = 0;
let cursorTimer: ReturnType<typeof setTimeout> | null = null;

function dispatch(event: PlayerEvent): void {
  state = reducePlayerState(state, event);
  postToMain({ kind: 'state', state });
}

function postToMain(message: WorkerToMainMessage, transfer: Transferable[] = []): void {
  (self as unknown as Worker).postMessage(message, transfer);
}

function feedDecoder(frame: DvrFrame): void {
  if (frame.type === FRAME_TYPE.VIDEO) {
    videoDecoder?.decode({ keyframe: frame.keyframe, timestampUs: frame.timestampUs, data: frame.payload });
  } else if (frame.type === FRAME_TYPE.AUDIO) {
    audioDecoder?.decode({ timestampUs: frame.timestampUs, data: frame.payload });
  }
}

function handleParsedFrame(raw: ArrayBuffer): void {
  const parsed = parseFrame(raw);
  const dvrFrame: DvrFrame = {
    type: parsed.type,
    keyframe: parsed.keyframe,
    timestampUs: parsed.timestampUs,
    payload: parsed.payload,
  };
  latestTimestampUs = Math.max(latestTimestampUs, parsed.timestampUs);
  dvr.push(dvrFrame, parsed.timestampUs);

  if (paused) return; // keep buffering into the DVR window; nothing decoded while paused
  if (mode === 'live') feedDecoder(dvrFrame); // in 'cursor' mode, the cursor pulls from the DVR buffer instead
}

function onVideoFrame(frame: VideoFrame): void {
  if (state.status === 'buffering' || state.status === 'connecting') {
    dispatch({ kind: 'bufferingEnd' });
  }

  const audioTimeUs = audioClock.estimateUs(performance.now());
  if (audioTimeUs !== null) {
    const decision = decideSyncAction(frame.timestamp, audioTimeUs, SYNC_TOLERANCE_US);
    if (decision === 'drop') {
      frame.close();
      return;
    }
  }
  renderer?.renderFrame(frame);
  pendingVideoFrame?.close();
  pendingVideoFrame = frame;
}

function onAudioFrame(audioData: AudioData): void {
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < audioData.numberOfChannels; ch++) {
    const buffer = new Float32Array(audioData.numberOfFrames);
    audioData.copyTo(buffer, { planeIndex: ch });
    channelData.push(buffer);
  }
  audioData.close();
  postToMain(
    { kind: 'audioFrame', channelData },
    channelData.map((c) => c.buffer),
  );
}

function startCursor(fromUs: number): void {
  mode = 'cursor';
  cursorUs = fromUs;
  cursorWallAnchorMs = performance.now();
  tickCursor();
}

function tickCursor(): void {
  if (mode !== 'cursor') return;
  const nowMs = performance.now();
  const targetUs = cursorUs + (nowMs - cursorWallAnchorMs) * 1000;
  for (const frame of dvr.framesInRange(cursorUs, targetUs)) feedDecoder(frame);
  cursorUs = targetUs;
  cursorWallAnchorMs = nowMs;
  dispatch({ kind: 'behindLiveChanged', seconds: Math.max(0, Math.round((latestTimestampUs - cursorUs) / 1_000_000)) });
  cursorTimer = setTimeout(tickCursor, CURSOR_TICK_MS);
}

function stopCursor(): void {
  mode = 'live';
  if (cursorTimer) clearTimeout(cursorTimer);
  cursorTimer = null;
}

async function handleInit(canvas: OffscreenCanvas, streamUrl: string): Promise<void> {
  renderer = await createRenderer(canvas);
  videoDecoder = createVideoDecoder(VIDEO_CODEC, onVideoFrame, (error) =>
    dispatch({ kind: 'error', message: error.message }),
  );
  audioDecoder = createAudioDecoder(AUDIO_CODEC_CONFIG, onAudioFrame, (error) =>
    dispatch({ kind: 'error', message: error.message }),
  );

  const transport = createTransport();
  dispatch({ kind: 'connect' });
  transport.connect(streamUrl, {
    onFrame: handleParsedFrame,
    onStatusChange: (status) => {
      if (status === 'open') dispatch({ kind: 'connected' });
      else if (status === 'reconnecting') dispatch({ kind: 'reconnecting' });
    },
    onError: (error) => dispatch({ kind: 'error', message: error.message }),
  });
}

function handlePause(): void {
  paused = true;
  pausedAtUs = pendingVideoFrame?.timestamp ?? latestTimestampUs;
  stopCursor();
  dispatch({ kind: 'pause' });
}

function handleResume(): void {
  paused = false;
  const resumeUs = dvr.resumePoint(pausedAtUs);
  if (resumeUs !== null && resumeUs < latestTimestampUs) {
    startCursor(resumeUs);
  } else {
    mode = 'live';
    dispatch({ kind: 'behindLiveChanged', seconds: 0 });
  }
  dispatch({ kind: 'resume' });
}

function handleJumpToLive(): void {
  stopCursor();
  mode = 'live';
  dispatch({ kind: 'jumpToLive' });
}

function handleDestroy(): void {
  stopCursor();
  videoDecoder?.close();
  audioDecoder?.close();
  renderer?.destroy();
  pendingVideoFrame?.close();
  pendingVideoFrame = null;
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const message = event.data;
  switch (message.kind) {
    case 'init':
      void handleInit(message.canvas, message.streamUrl);
      break;
    case 'pause':
      handlePause();
      break;
    case 'resume':
      handleResume();
      break;
    case 'jumpToLive':
      handleJumpToLive();
      break;
    case 'audioClockUpdate':
      audioClock.updateAnchor(message.audioTimeUs, message.wallTimeMs);
      break;
    case 'setVolume':
    case 'setMuted':
      // Applied directly on the main-thread GainNode by workerClient.ts (Task 12) - this
      // branch exists purely so the switch stays exhaustive over MainToWorkerMessage.
      break;
    case 'setQuality':
      // Rendition switching is architecturally wired for a backend that serves multiple
      // renditions; no such backend exists yet (spec §8), so this is a documented no-op.
      break;
    case 'destroy':
      handleDestroy();
      break;
  }
};
```

- [ ] **Step 3: Build to confirm types are correct**

Run: `npm run build`
Expected: succeeds. This file will only be runtime-exercised once Task 12 instantiates it as a real Worker.

- [ ] **Step 4: Commit**

```bash
git add src/player/workerProtocol.ts src/player/playerWorker.ts
git commit -m "feat: worker integration - transport, decode, render, sync, DVR pause/resume"
```

---

## Task 12: Main-thread worker client and React hooks

**Spec reference:** §3 (React only exchanges state deltas), §6 (AudioContext on main thread).

**Files:**
- Create: `src/workers/workerClient.ts`
- Create: `src/hooks/usePlayerEngine.ts`
- Create: `src/hooks/useSyncedPlayerState.ts`
- Create: `src/hooks/useFullscreen.ts`

**Interfaces:**
- Consumes: `AudioOutput` (Task 10), `MainToWorkerMessage`/`WorkerToMainMessage` (Task 11), `PlayerState`/`INITIAL_PLAYER_STATE` (Task 5).
- Produces: `WorkerClient` class (`init`, `pause`, `resume`, `jumpToLive`, `setQuality`, `setVolume`, `setMuted`, `onState`, `destroy`), `usePlayerEngine(streamUrl): { canvasRef, controls }`, `useSyncedPlayerState(client): PlayerState`, `useFullscreen(elementRef): { isFullscreen, toggle }`. Task 13 (React components) is the consumer.

- [ ] **Step 1: Implement workerClient.ts**

`src/workers/workerClient.ts`:
```typescript
import type { MainToWorkerMessage, WorkerToMainMessage } from '../player/workerProtocol';
import type { PlayerState } from '../state/machine';
import { AudioOutput } from '../player/audio/audioOutput';

const AUDIO_CLOCK_UPDATE_MS = 100;
const AUDIO_SAMPLE_RATE = 48000;

export class WorkerClient {
  private worker: Worker;
  private audioOutput: AudioOutput | null = null;
  private listeners = new Set<(state: PlayerState) => void>();
  private audioClockTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.worker = new Worker(new URL('../player/playerWorker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const message = event.data;
      if (message.kind === 'state') {
        for (const listener of this.listeners) listener(message.state);
      } else if (message.kind === 'audioFrame') {
        this.audioOutput?.push(message.channelData);
      }
    };
  }

  onState(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async init(canvas: HTMLCanvasElement, streamUrl: string): Promise<void> {
    this.audioOutput = new AudioOutput(AUDIO_SAMPLE_RATE);
    const workletUrl = new URL('../player/audio/ring-buffer-processor.js', import.meta.url);
    await this.audioOutput.init(workletUrl.toString());

    this.audioClockTimer = setInterval(() => {
      if (!this.audioOutput) return;
      this.post({
        kind: 'audioClockUpdate',
        audioTimeUs: this.audioOutput.currentTimeUs(),
        wallTimeMs: performance.now(),
      });
    }, AUDIO_CLOCK_UPDATE_MS);

    const offscreen = canvas.transferControlToOffscreen();
    this.post({ kind: 'init', canvas: offscreen, streamUrl }, [offscreen]);
  }

  pause(): void {
    this.post({ kind: 'pause' });
  }

  resume(): void {
    this.post({ kind: 'resume' });
  }

  jumpToLive(): void {
    this.post({ kind: 'jumpToLive' });
  }

  setQuality(quality: string): void {
    this.post({ kind: 'setQuality', quality });
  }

  setVolume(volume: number): void {
    this.audioOutput?.setVolume(volume);
    this.post({ kind: 'setVolume', volume });
  }

  setMuted(muted: boolean): void {
    this.audioOutput?.setMuted(muted);
    this.post({ kind: 'setMuted', muted });
  }

  destroy(): void {
    if (this.audioClockTimer) clearInterval(this.audioClockTimer);
    this.post({ kind: 'destroy' });
    this.worker.terminate();
    this.audioOutput?.close();
  }

  private post(message: MainToWorkerMessage, transfer: Transferable[] = []): void {
    this.worker.postMessage(message, transfer);
  }
}
```

- [ ] **Step 2: Implement useSyncedPlayerState.ts**

`src/hooks/useSyncedPlayerState.ts`:
```typescript
import { useCallback, useRef, useSyncExternalStore } from 'react';
import type { WorkerClient } from '../workers/workerClient';
import { INITIAL_PLAYER_STATE, type PlayerState } from '../state/machine';

/** Bridges the Worker's PlayerState deltas into React without React ever seeing a frame. */
export function useSyncedPlayerState(client: WorkerClient | null): PlayerState {
  const stateRef = useRef<PlayerState>(INITIAL_PLAYER_STATE);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!client) return () => {};
      return client.onState((next) => {
        stateRef.current = next;
        onStoreChange();
      });
    },
    [client],
  );

  const getSnapshot = useCallback(() => stateRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
```

- [ ] **Step 3: Implement usePlayerEngine.ts**

`src/hooks/usePlayerEngine.ts`:
```typescript
import { useEffect, useRef, useState } from 'react';
import { WorkerClient } from '../workers/workerClient';

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  jumpToLive: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
}

export function usePlayerEngine(streamUrl: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<WorkerClient | null>(null);
  const [client, setClient] = useState<WorkerClient | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const workerClient = new WorkerClient();
    clientRef.current = workerClient;
    void workerClient.init(canvas, streamUrl).then(() => setClient(workerClient));

    return () => {
      workerClient.destroy();
      clientRef.current = null;
      setClient(null);
    };
  }, [streamUrl]);

  const controls: PlayerControls = {
    play: () => clientRef.current?.resume(),
    pause: () => clientRef.current?.pause(),
    jumpToLive: () => clientRef.current?.jumpToLive(),
    setVolume: (volume) => clientRef.current?.setVolume(volume),
    setMuted: (muted) => clientRef.current?.setMuted(muted),
    setQuality: (quality) => clientRef.current?.setQuality(quality),
  };

  return { canvasRef, client, controls };
}
```

- [ ] **Step 4: Implement useFullscreen.ts**

`src/hooks/useFullscreen.ts`:
```typescript
import { useCallback, useEffect, useState, type RefObject } from 'react';

export function useFullscreen(elementRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === elementRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [elementRef]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void elementRef.current?.requestFullscreen();
    }
  }, [elementRef]);

  return { isFullscreen, toggle };
}
```

- [ ] **Step 5: Build to confirm types are correct**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/workers src/hooks
git commit -m "feat: main-thread worker client and React player hooks"
```

---

## Task 13: React UI components and app wiring

**Spec reference:** §3 (single canvas, no per-frame React re-renders), §7/§8 (controls surface).

**Files:**
- Create: `src/components/LiveVideoPlayer.tsx`
- Create: `src/components/Controls.tsx`
- Create: `src/components/LiveBadge.tsx`
- Create: `src/components/BufferingSpinner.tsx`
- Create: `src/components/ErrorOverlay.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePlayerEngine`, `useSyncedPlayerState`, `useFullscreen` (Task 12).

- [ ] **Step 1: Implement LiveBadge.tsx**

`src/components/LiveBadge.tsx`:
```tsx
interface LiveBadgeProps {
  isLive: boolean;
  secondsBehindLive: number;
  onJumpToLive: () => void;
}

export function LiveBadge({ isLive, secondsBehindLive, onJumpToLive }: LiveBadgeProps) {
  if (isLive) {
    return <span className="badge badge--live">● LIVE</span>;
  }
  return (
    <button type="button" className="badge badge--behind" onClick={onJumpToLive}>
      {secondsBehindLive}s behind — Jump to live
    </button>
  );
}
```

- [ ] **Step 2: Implement BufferingSpinner.tsx and ErrorOverlay.tsx**

`src/components/BufferingSpinner.tsx`:
```tsx
export function BufferingSpinner() {
  return (
    <div className="overlay overlay--buffering">
      <div className="spinner" />
    </div>
  );
}
```

`src/components/ErrorOverlay.tsx`:
```tsx
interface ErrorOverlayProps {
  message: string;
}

export function ErrorOverlay({ message }: ErrorOverlayProps) {
  return (
    <div className="overlay overlay--error">
      <p>Playback error: {message}</p>
    </div>
  );
}
```

- [ ] **Step 3: Implement Controls.tsx**

`src/components/Controls.tsx`:
```tsx
import type { PlayerState } from '../state/machine';
import type { PlayerControls } from '../hooks/usePlayerEngine';
import { LiveBadge } from './LiveBadge';

interface ControlsProps {
  state: PlayerState;
  controls: PlayerControls;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function Controls({ state, controls, isFullscreen, onToggleFullscreen }: ControlsProps) {
  const isPaused = state.status === 'paused';

  return (
    <div className="controls">
      <button type="button" onClick={() => (isPaused ? controls.play() : controls.pause())}>
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>

      <LiveBadge isLive={state.isLive} secondsBehindLive={state.secondsBehindLive} onJumpToLive={controls.jumpToLive} />

      <label className="volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={state.muted ? 0 : state.volume}
          onChange={(e) => controls.setVolume(Number(e.target.value))}
        />
        <button type="button" onClick={() => controls.setMuted(!state.muted)}>
          {state.muted ? '🔇' : '🔊'}
        </button>
      </label>

      {state.availableQualities.length > 0 && (
        <select value={state.quality ?? ''} onChange={(e) => controls.setQuality(e.target.value)}>
          {state.availableQualities.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      )}

      <button type="button" onClick={onToggleFullscreen}>
        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement LiveVideoPlayer.tsx**

`src/components/LiveVideoPlayer.tsx`:
```tsx
import { useRef } from 'react';
import { usePlayerEngine } from '../hooks/usePlayerEngine';
import { useSyncedPlayerState } from '../hooks/useSyncedPlayerState';
import { useFullscreen } from '../hooks/useFullscreen';
import { Controls } from './Controls';
import { BufferingSpinner } from './BufferingSpinner';
import { ErrorOverlay } from './ErrorOverlay';

interface LiveVideoPlayerProps {
  streamUrl: string;
}

export function LiveVideoPlayer({ streamUrl }: LiveVideoPlayerProps) {
  const { canvasRef, client, controls } = usePlayerEngine(streamUrl);
  const state = useSyncedPlayerState(client);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);

  return (
    <div ref={containerRef} className="player">
      {/* This is the ONLY canvas in the app, and it is never drawn to with a 2D context -
          its control is transferred to the Worker on mount (see usePlayerEngine), which
          owns it as a WebGPU/WebGL2 GPU surface for the rest of its life. */}
      <canvas ref={canvasRef} className="player__canvas" />

      {state.status === 'buffering' && <BufferingSpinner />}
      {state.status === 'error' && state.error && <ErrorOverlay message={state.error} />}

      <Controls state={state} controls={controls} isFullscreen={isFullscreen} onToggleFullscreen={toggle} />
    </div>
  );
}
```

- [ ] **Step 5: Wire App.tsx**

`src/App.tsx`:
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

- [ ] **Step 6: Add minimal styling**

Append to `src/App.css`:
```css
.player {
  position: relative;
  width: 100%;
  max-width: 960px;
  aspect-ratio: 16 / 9;
  background: black;
}

.player__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.badge--live {
  color: #ff4444;
  font-weight: bold;
}

.badge--behind {
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}
```

- [ ] **Step 7: Build and verify**

Run: `npm run build && npm test`
Expected: both succeed.

- [ ] **Step 8: Commit**

```bash
git add src/components src/App.tsx src/App.css
git commit -m "feat: React player UI - controls, live badge, buffering/error overlays"
```

---

## Task 14: End-to-end manual verification and README

**Files:**
- Create: `README.md`

**Interfaces:**
- No new code interfaces - this task is a verification pass plus documentation.

- [ ] **Step 1: Write the project README**

`README.md`:
```markdown
# Live Video Player

GPU-accelerated live video player: no `<video>` element, no per-frame canvas blitting. See
`docs/superpowers/specs/2026-08-10-live-video-player-design.md` in the `react-practice` repo
for the full design.

## Run the demo

Terminal 1:

    cd demo-server
    npm install
    npm start

Terminal 2:

    npm install
    npm run dev

Open the printed Vite URL. You should see a live test-pattern video within a second or two.

## Manual verification checklist

- [ ] Open browser DevTools → Elements. Confirm there is no `<video>` and no `<audio>` tag
      anywhere in the DOM - only one `<canvas>`.
- [ ] Video plays smoothly with no visible stutter, and you can continuously hear the
      440Hz tone with no gaps, clicks, or crackling (confirms the AudioWorklet ring buffer
      is neither starving nor overflowing).
- [ ] Click Pause. The last frame stays frozen on screen and audio stops immediately (no
      trailing buffered audio playing after pause).
- [ ] Wait 5 seconds, click Play. Playback resumes from the paused frame (not from live) with
      audio and video both restarting together, and the badge shows "Ns behind - jump to live".
      (Frame-accurate audio/video alignment itself is covered by Task 4's unit tests - `decideSyncAction`/
      `AudioClockEstimator` - and Task 3's keyframe-realignment test; this manual step is checking
      that the two streams audibly/visibly start together, not measuring drift precisely.)
- [ ] Click "Jump to live". Badge returns to "LIVE".
- [ ] Toggle mute / drag the volume slider - audio responds immediately.
- [ ] Click Fullscreen - the player fills the screen; click again (or Esc) to exit.
- [ ] Stop the demo server (Ctrl-C) while the client is connected - the badge/status should
      reflect a "reconnecting" state, and playback should resume automatically once the
      server is restarted.
- [ ] Open DevTools → Performance, record 5s of playback, confirm the main thread is not
      the one doing decode/render work (should show idle React thread with occasional small
      state-update tasks, not a continuous per-frame workload).

## Browser support

WebCodecs + WebGPU/WebGL2 + OffscreenCanvas + AudioWorklet: current Chrome/Edge, Safari
16.4+ (WebGPU 17.4+, WebGL2 fallback used automatically before that), Firefox 130+. See
spec §12 for the full compatibility table.
```

- [ ] **Step 2: Run the demo end-to-end and walk the checklist above**

```bash
cd demo-server && npm start &
cd .. && npm run dev
```

Manually work through every item in the README's checklist in a real browser (Chrome or
Edge recommended for first verification - broadest WebCodecs/WebGPU support). Fix anything
that doesn't match before proceeding - this is the task where integration bugs across
Tasks 2–13 will surface.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README and manual verification checklist"
```

---

## Task 15: Package as a Claude Code skill

**Spec reference:** §14 (skill packaging deliverable).

**Files:**
- Create: `.claude/skills/live-video-engine/SKILL.md` (exact structure determined by the `superpowers:writing-skills` skill's own conventions).

- [ ] **Step 1: Invoke superpowers:writing-skills**

Use the `superpowers:writing-skills` skill to create a new skill named `live-video-engine`
(or the name that skill's own naming convention produces) that documents this pattern for
reuse: transport abstraction (WebSocket/WebTransport behind one interface), the
self-delimiting binary framing protocol, WebCodecs → GPU-texture-upload rendering (WebGPU
with WebGL2 fallback) with no `<video>` and no per-frame CPU blit, the audio-master A/V sync
algorithm, and the DVR ring buffer's shared-cutoff-eviction + keyframe-driven-audio-realignment
pause/resume logic. Point it at this project's `src/` as the reference implementation and at
`docs/superpowers/specs/2026-08-10-live-video-player-design.md` as the design rationale.

- [ ] **Step 2: Verify the skill per writing-skills' own verification process**

Follow whatever verification steps `superpowers:writing-skills` itself prescribes (that
skill owns its own quality bar - do not improvise a different one here).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/live-video-engine
git commit -m "docs: package the live-video engine pattern as a reusable skill"
```

---

## Self-review notes

- **Spec coverage:** §3 architecture → Tasks 9–12; §4 protocol → Task 2; §5 render path → Task 9; §6 audio/sync → Tasks 4, 10; §7 pause/resume/DVR → Tasks 3, 11; §8 seek/quality → Task 5 (state) + Task 11 (wiring, quality flagged as backend-dependent no-op per spec); §9 structure → all tasks follow it; §10 demo server → Task 7; §11 libraries → Task 1's `package.json` (no extra libraries beyond `ws` in the demo server); §12 compatibility → documented in README (Task 14) and inline fallback code (Tasks 6, 9); §14 skill packaging → Task 15.
- **Type consistency verified:** `DvrFrame`, `PlayerState`/`PlayerEvent`, `Transport`/`TransportEvents`, `Renderer`, `MainToWorkerMessage`/`WorkerToMainMessage` are each defined exactly once (Tasks 2–5, 11) and imported by name (not redefined) everywhere else they're used.
- **Audio is exercised end-to-end by the bundled demo**, not just unit-tested in isolation: Task 7's demo server streams a real 440Hz PCM tone alongside the video, using the `'pcm-f32'` WebCodecs passthrough codec (Task 8) specifically so the full decode → `AudioWorklet` → `AudioContext` → sync (Tasks 4, 10, 11) path runs for real in Task 14's manual checklist, without needing an Opus encoder in the demo server. Swapping to a production backend that encodes Opus only requires changing `AUDIO_CODEC_CONFIG.codec` (Task 8) — the rest of the pipeline is codec-agnostic.
