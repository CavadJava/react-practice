# Shop Platform — Phase 1 Layout Editor Admin App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `admin` workspace (Vite + React, port **7071**) — a minimal Layout Editor so a tenant's Layout Config (SHOP-6's `GET`/`PUT /page-layouts/:page`) can be edited through a form instead of raw `curl`, closing the gap SHOP-6 deliberately left open ("Layout Editor admin UI is explicitly NOT built").

**Architecture:** A single-page settings form, matching spec §4's explicit choice ("a settings form, not drag-and-drop"): the `home` page's slots listed in order, each with a componentType/variant dropdown (options sourced from `COMPONENT_MANIFEST`, the same shared manifest SHOP-6's backend validates against — so the dropdown can never even offer an invalid choice), up/down reorder buttons, and a Save button that `PUT`s the whole slot list back.

**Tenant resolution — reuses the exact lesson from the storefront's own Host-header bug (SHOP-5) and Swagger UI's identical one (SHOP-4):** the admin app never tries to set a `Host` header (forbidden in browser JS, confirmed twice already in this project). Instead, like the storefront, it's tenant-scoped by **its own URL** — visiting `http://texnogallery.localhost:7071` reads `window.location.hostname` client-side and targets backend requests directly at `http://texnogallery.localhost:8080/...`, so the browser's real, unspoofed `Host` header already carries the tenant. No admin-side tenant picker/dropdown needed for Phase 1 — you access the right tenant's editor via the right subdomain, same as the storefront.

**Auth:** none. This is an internal Phase 1 dev tool (per Foundation's own open question, resolved here: "can default to a simple internal login and revisit in Phase 3's full admin auth design" — Phase 1 defaults to *no* login at all, not even a shared password, since real admin auth is explicitly Phase 3's job and a fake placeholder auth would be worse than an honest "not yet secured, local-only" note in the README).

**Tech Stack:** Vite + React 19 (matching this user's other admin panels per the design spec's own tech-stack table), TypeScript, Vitest + React Testing Library for the one piece of real interactive logic (the slot-editing form state). No backend changes beyond a CORS origin addition.

## Global Constraints

- No `Host` header override anywhere in this app — tenant comes from `window.location.hostname`, requests target that hostname directly (same pattern as `storefront/src/lib/api.ts`).
- Every dropdown option for componentType/variant comes from `@shop-platform/shared-types`' `COMPONENT_MANIFEST` — never a separate hardcoded list that could drift from what the backend actually accepts.
- No authentication in Phase 1 — explicitly documented as a known gap, not silently omitted.
- Backend CORS must allow both `http://localhost:7070` (storefront) and `http://localhost:7071` (admin) — an array, not a single string.

---

## File Structure

```
admin/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── lib/
    │   └── api.ts                    # tenant-from-hostname API client, mirrors storefront's
    ├── lib/api.test.ts
    └── LayoutEditor.tsx               # the actual form: slot list, dropdowns, reorder, save
    └── LayoutEditor.test.tsx

package.json                          # root: admin already listed in workspaces (Foundation); add to composite dev script
backend/src/server.ts                 # CORS origin -> array of both storefront and admin origins
```

---

## Task 1: Scaffold the Vite admin workspace + wire the root dev script + fix backend CORS

**Files:**
- Create: `admin/package.json`
- Create: `admin/tsconfig.json`
- Create: `admin/vite.config.ts`
- Create: `admin/index.html`
- Create: `admin/src/main.tsx`
- Create: `admin/src/App.tsx` (placeholder, replaced in Task 3)
- Test: `admin/src/App.test.tsx`
- Modify: `package.json` (root)
- Modify: `backend/src/server.ts`

**Interfaces:**
- Produces: an `admin` npm workspace that `npm run dev` (root) starts alongside `backend`+`storefront`, listening on port 7071.

- [ ] **Step 1: Create the Vite package**

`admin/package.json`:
```json
{
  "name": "admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 7071",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 7071",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@shop-platform/shared-types": "*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^6.0.3",
    "vite": "^8.0.12",
    "vitest": "^3.0.0"
  }
}
```

`admin/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

`admin/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```
(Note: unlike the storefront, `jsx: 'react-jsx'` here — no `esbuild.jsx` override needed in the test config, because this project's `@vitejs/plugin-react` handles JSX transform for both dev and test the same way, unlike the storefront's Next.js-flavored `"jsx": "preserve"` tsconfig which needed vitest's esbuild option overridden separately. Confirm this assumption by actually running the tests in Step 4 — if it turns out wrong, add the same `esbuild: { jsx: 'automatic' }` override the storefront plan needed.)

`admin/index.html`:
```html
<!doctype html>
<html lang="az">
  <head>
    <meta charset="UTF-8" />
    <title>Shop Platform — Layout Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`admin/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`admin/src/App.tsx` (placeholder — Task 3 replaces this):
```tsx
export default function App() {
  return <p>Layout Editor scaffold — real content lands in Task 3.</p>;
}
```

- [ ] **Step 2: Write the failing smoke test**

`admin/src/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App (scaffold smoke test)', () => {
  it('is a function component (proves the workspace/test-runner wiring works)', () => {
    expect(typeof App).toBe('function');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from repo root): `npm install && npm test --workspace=admin`
Expected: FAIL — `admin` workspace doesn't exist in `node_modules` yet (same chicken-and-egg note as the storefront plan's Task 1 — if `npm install` already ran with these files present, this step self-validates retroactively via Step 4's PASS).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=admin`
Expected: PASS (1 test)

- [ ] **Step 5: Wire the root dev script and fix backend CORS**

Modify root `package.json`'s `dev` script:
```json
{
  "scripts": {
    "setup": "npm install && npm run db:migrate --workspace=backend && npm run db:seed --workspace=backend",
    "dev": "concurrently -n backend,storefront,admin -c blue,green,magenta \"npm run dev --workspace=backend\" \"npm run dev --workspace=storefront\" \"npm run dev --workspace=admin\""
  }
}
```

Modify `backend/src/server.ts` — change the CORS origin to accept both:
```typescript
app.use(cors({
    origin: ['http://localhost:7070', 'http://localhost:7071'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
```

- [ ] **Step 6: Manually verify the composite dev script starts all three apps**

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:7071 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm install
npm run dev &> /tmp/dev-all.log &
sleep 6
curl -sf http://localhost:8080/health && echo " <- backend OK"
curl -sf http://localhost:7070 > /dev/null && echo "storefront OK"
curl -sf http://localhost:7071 > /dev/null && echo "admin OK (placeholder page)"
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill
lsof -ti:7071 -sTCP:LISTEN | xargs -r kill
```
Expected: all three succeed.

- [ ] **Step 7: Commit**

```bash
git add admin package.json backend/src/server.ts package-lock.json
git commit -m "feat: scaffold Vite admin workspace on port 7071, wire composite dev script, update CORS"
git push origin develop
```

---

## Task 2: Tenant-aware admin API client

**Files:**
- Create: `admin/src/lib/api.ts`
- Create: `admin/src/lib/api.test.ts`

**Interfaces:**
- Produces: `getTenantHost(): string` (reads `window.location.hostname`), `fetchLayoutConfig(page: string): Promise<LayoutConfig>`, `saveLayoutConfig(page: string, slots: Slot[]): Promise<LayoutConfig>`. Task 3's `LayoutEditor` calls these.

- [ ] **Step 1: Write the failing test**

`admin/src/lib/api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('admin API client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'texnogallery.localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('getTenantHost reads window.location.hostname directly (no port stripping needed — hostname never includes it)', async () => {
    const { getTenantHost } = await import('./api');
    expect(getTenantHost()).toBe('texnogallery.localhost');
  });

  it('fetchLayoutConfig targets the request directly at the tenant hostname, never overrides a Host header', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ tenantId: 't1', page: 'home', slots: [] }), { status: 200 })) as any;
    const { fetchLayoutConfig } = await import('./api');
    await fetchLayoutConfig('home');

    expect(global.fetch).toHaveBeenCalledWith('http://texnogallery.localhost:8080/page-layouts/home', expect.not.objectContaining({ headers: expect.objectContaining({ Host: expect.anything() }) }));
  });

  it('saveLayoutConfig PUTs the slot list as JSON', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ tenantId: 't1', page: 'home', slots: [{ componentType: 'header', variant: 'minimal', settings: {} }] }), { status: 200 })) as any;
    const { saveLayoutConfig } = await import('./api');
    const result = await saveLayoutConfig('home', [{ componentType: 'header', variant: 'minimal', settings: {} }]);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://texnogallery.localhost:8080/page-layouts/home',
      expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
    expect(result.slots).toEqual([{ componentType: 'header', variant: 'minimal', settings: {} }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=admin -- api.test`
Expected: FAIL — `./api` doesn't exist yet

- [ ] **Step 3: Write minimal implementation**

`admin/src/lib/api.ts`:
```typescript
import type { LayoutConfig, Slot } from '@shop-platform/shared-types';

const BACKEND_PORT = 8080;

export function getTenantHost(): string {
  // window.location.hostname never includes the port (unlike .host), so no
  // stripping needed here — different from the storefront's server-side
  // next/headers equivalent, which reads the raw Host header including port.
  return window.location.hostname;
}

function backendUrl(path: string): string {
  return `http://${getTenantHost()}:${BACKEND_PORT}${path}`;
}

export async function fetchLayoutConfig(page: string): Promise<LayoutConfig> {
  const res = await fetch(backendUrl(`/page-layouts/${page}`));
  return res.json();
}

export async function saveLayoutConfig(page: string, slots: Slot[]): Promise<LayoutConfig> {
  const res = await fetch(backendUrl(`/page-layouts/${page}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  });
  return res.json();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=admin -- api.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add admin/src/lib
git commit -m "feat: add tenant-aware admin API client (hostname-derived, no Host override)"
git push origin develop
```

---

## Task 3: The Layout Editor form

**Files:**
- Modify: `admin/src/App.tsx`
- Create: `admin/src/LayoutEditor.tsx`
- Create: `admin/src/LayoutEditor.test.tsx`

**Interfaces:**
- Consumes: `fetchLayoutConfig`/`saveLayoutConfig` (Task 2), `COMPONENT_MANIFEST` (`@shop-platform/shared-types`, from the Component Registry plan).
- Produces: `<LayoutEditor page="home" />` — on mount, fetches the current config; renders each slot with a componentType `<select>` (options = `Object.keys(COMPONENT_MANIFEST)`) and a variant `<select>` (options = `COMPONENT_MANIFEST[componentType]`, recomputed whenever componentType changes), up/down reorder buttons per slot, a "Save" button that calls `saveLayoutConfig`.

- [ ] **Step 1: Write the failing test**

`admin/src/LayoutEditor.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LayoutEditor } from './LayoutEditor';
import * as api from './lib/api';

describe('LayoutEditor', () => {
  beforeEach(() => {
    vi.spyOn(api, 'fetchLayoutConfig').mockResolvedValue({
      tenantId: 't1',
      page: 'home',
      slots: [
        { componentType: 'header', variant: 'classic', settings: {} },
        { componentType: 'productGrid', variant: 'grid', settings: {} },
      ],
    });
    vi.spyOn(api, 'saveLayoutConfig').mockResolvedValue({ tenantId: 't1', page: 'home', slots: [] });
  });

  it('loads and displays the current slots with their variant selected', async () => {
    render(<LayoutEditor page="home" />);
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(4)); // 2 slots x (componentType + variant) selects

    const variantSelects = screen.getAllByLabelText(/variant/i);
    expect((variantSelects[0] as HTMLSelectElement).value).toBe('classic');
    expect((variantSelects[1] as HTMLSelectElement).value).toBe('grid');
  });

  it('only offers variants valid for the currently selected componentType (sourced from COMPONENT_MANIFEST, not a hardcoded list)', async () => {
    render(<LayoutEditor page="home" />);
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(4));

    const firstVariantSelect = screen.getAllByLabelText(/variant/i)[0] as HTMLSelectElement;
    const options = Array.from(firstVariantSelect.options).map((o) => o.value);
    expect(options).toEqual(['classic', 'minimal']); // header's variants, not productGrid's
  });

  it('changing a variant dropdown and saving calls saveLayoutConfig with the updated slots', async () => {
    render(<LayoutEditor page="home" />);
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(4));

    const firstVariantSelect = screen.getAllByLabelText(/variant/i)[0];
    fireEvent.change(firstVariantSelect, { target: { value: 'minimal' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(api.saveLayoutConfig).toHaveBeenCalledWith('home', [
        { componentType: 'header', variant: 'minimal', settings: {} },
        { componentType: 'productGrid', variant: 'grid', settings: {} },
      ])
    );
  });

  it('moving the second slot up swaps the order and Save persists the new order', async () => {
    render(<LayoutEditor page="home" />);
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(4));

    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    fireEvent.click(moveUpButtons[1]); // second slot's "move up" button
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(api.saveLayoutConfig).toHaveBeenCalledWith('home', [
        { componentType: 'productGrid', variant: 'grid', settings: {} },
        { componentType: 'header', variant: 'classic', settings: {} },
      ])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=admin -- LayoutEditor.test`
Expected: FAIL — `./LayoutEditor` doesn't exist yet

- [ ] **Step 3: Write the component**

`admin/src/LayoutEditor.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { COMPONENT_MANIFEST } from '@shop-platform/shared-types';
import type { Slot } from '@shop-platform/shared-types';
import { fetchLayoutConfig, saveLayoutConfig } from './lib/api';

interface LayoutEditorProps {
  page: string;
}

export function LayoutEditor({ page }: LayoutEditorProps) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLayoutConfig(page).then((config) => setSlots(config.slots));
  }, [page]);

  if (!slots) return <p>Yüklənir...</p>;

  function updateSlot(index: number, updates: Partial<Slot>) {
    setSlots((current) => {
      if (!current) return current;
      const next = [...current];
      const existing = next[index]!;
      const updated: Slot = { ...existing, ...updates };
      // Switching componentType invalidates the old variant — reset to that type's first valid variant.
      if (updates.componentType && updates.componentType !== existing.componentType) {
        updated.variant = COMPONENT_MANIFEST[updates.componentType]?.[0] ?? '';
      }
      next[index] = updated;
      return next;
    });
  }

  function moveSlot(index: number, direction: -1 | 1) {
    setSlots((current) => {
      if (!current) return current;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved!);
      return next;
    });
  }

  async function handleSave() {
    if (!slots) return;
    setSaving(true);
    try {
      await saveLayoutConfig(page, slots);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Layout Editor — {page}</h1>
      {slots.map((slot, index) => (
        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>
            Component
            <select
              aria-label="Component type"
              value={slot.componentType}
              onChange={(e) => updateSlot(index, { componentType: e.target.value })}
            >
              {Object.keys(COMPONENT_MANIFEST).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Variant
            <select
              aria-label="Variant"
              value={slot.variant}
              onChange={(e) => updateSlot(index, { variant: e.target.value })}
            >
              {(COMPONENT_MANIFEST[slot.componentType] ?? []).map((variant) => (
                <option key={variant} value={variant}>
                  {variant}
                </option>
              ))}
            </select>
          </label>
          <button type="button" aria-label={`Move up ${index}`} onClick={() => moveSlot(index, -1)} disabled={index === 0}>
            Move up
          </button>
          <button type="button" aria-label={`Move down ${index}`} onClick={() => moveSlot(index, 1)} disabled={index === slots.length - 1}>
            Move down
          </button>
        </div>
      ))}
      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

Modify `admin/src/App.tsx`:
```tsx
import { LayoutEditor } from './LayoutEditor';

export default function App() {
  return <LayoutEditor page="home" />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=admin -- LayoutEditor.test`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add admin/src/LayoutEditor.tsx admin/src/LayoutEditor.test.tsx admin/src/App.tsx
git commit -m "feat: add Layout Editor form (dropdowns + reorder, manifest-driven)"
git push origin develop
```

---

## Task 4: Manually verify live end-to-end

**Files:** none — this task only runs and verifies, no new code.

**Interfaces:** none new — proves Tasks 1-3 work together against the real backend.

- [ ] **Step 1: Run the full test suites**

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend
npm test --workspace=storefront
npm test --workspace=admin
```
Expected: all green, no regressions across any epic.

- [ ] **Step 2: Manually verify live — edit via the admin UI, see it reflected in the storefront**

```bash
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:7071 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev &> /tmp/dev-all.log &
sleep 6

echo "--- before: default config ---"
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'iPhone 15'

echo "--- simulate the admin UI's save (same request the Save button makes) ---"
curl -s -X PUT -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"slots":[{"componentType":"header","variant":"minimal","settings":{}},{"componentType":"productGrid","variant":"list","settings":{}}]}' \
  http://localhost:8080/page-layouts/home > /dev/null

echo "--- after: storefront reflects it, no redeploy ---"
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'iPhone 15'

echo "--- restore default ---"
curl -s -X PUT -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"slots":[{"componentType":"header","variant":"classic","settings":{}},{"componentType":"productGrid","variant":"grid","settings":{}}]}' \
  http://localhost:8080/page-layouts/home > /dev/null
```

Also open `http://texnogallery.localhost:7071` in a real browser: confirm the form loads the real current slots, changing a dropdown + clicking Save actually persists (reload the page — the change should still be there), and the homepage at `http://texnogallery.localhost:7070` reflects it.

Expected: both curl checks find `iPhone 15` (the product itself doesn't disappear — only the surrounding markup changes, same proof as SHOP-6's own Task 7); the browser round-trip (edit → save → reload → still changed → visible on storefront) works end-to-end.

- [ ] **Step 3: Update the README with the new port and no-auth note**

Modify `README.md` — add a line noting `admin` runs on port 7071 alongside the existing backend/storefront ports, and an explicit line: "The Layout Editor has no authentication in Phase 1 — it's a local dev tool. Real admin auth is Phase 3's job."

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: note admin app port and Phase 1 no-auth status in README"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check:** spec §4's Layout Editor requirement ("a settings form, not drag-and-drop": dropdown + reorder) — Task 3 ✅. Foundation's open question about admin auth — resolved explicitly (no auth for Phase 1, documented not silently skipped) rather than left dangling.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `LayoutConfig`/`Slot` imported unchanged from `@shop-platform/shared-types` (same shape the backend and storefront already use, no admin-local redefinition). `COMPONENT_MANIFEST` is the same shared object the storefront's registry and the backend's `layoutConfigService` both already key off — the admin's dropdowns are the third and final consumer, closing the loop: the manifest now drives *validation* (backend), *rendering* (storefront), and *editing* (admin) from one definition.

**Consistency with prior gotchas:** Tenant resolution deliberately mirrors the storefront's `next/headers`-based fix (SHOP-5) and explicitly avoids the `Host`-header-override mistake documented twice already (storefront gotcha, Swagger UI gotcha) — `getTenantHost()`'s own docstring cross-references this.
