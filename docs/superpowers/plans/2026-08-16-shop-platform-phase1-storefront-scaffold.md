# Shop Platform — Phase 1 Storefront Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js `storefront` workspace (port **7070**) and prove it can render real tenant data end-to-end — homepage listing real categories/products, a product detail page — by calling the existing backend API (port 8080). This is the first of two remaining Phase 1 plans covering what the design spec calls "Catalog & Component System" (the second, **Component Registry & Layout System**, builds the tenant-configurable template mechanism *on top of* the pages this plan creates — not the other way around, since the Registry needs an actual Next.js app to live in).

**Scope note:** No Component Registry, PageRenderer, Layout Config, or Layout Editor here — that's the next plan. This plan's pages are plain, hardcoded React (no template-swapping yet), exactly the same "prove the layer works before building the abstraction on top of it" approach every prior plan in this project has used.

**Architecture:** Next.js 15 App Router, Server Components fetch directly from the backend API at request time (no client-side data fetching needed for these pages). The critical piece: since tenants are resolved by subdomain and `.localhost` subdomains resolve to loopback automatically (no `/etc/hosts` edits needed), the storefront reads the **incoming request's own hostname** (via `next/headers`) and forwards it as the `Host` header on every backend API call — so visiting `http://texnogallery.localhost:7070` transparently gets `texnogallery`'s data from the backend, with no hardcoded tenant anywhere in the storefront's code.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript. `concurrently` added at the mono-repo root so `npm run dev` starts backend + storefront together (Foundation's Task 10 anticipated this). No new backend dependencies.

## Global Constraints

- No hardcoded tenant/subdomain anywhere in storefront code — always derived from the incoming request's `Host` header, forwarded verbatim to the backend.
- Storefront runs on port **7070** (not Next.js's default 3000) — backend's CORS `origin` must be updated to match, or browser requests would be blocked (moot for the Server-Component fetches in this plan, which are server-to-server, but matters the moment any client-side fetch is added later, and for correctness/consistency now).
- No new business logic duplicated in the storefront — it only calls the existing backend API and renders what comes back; price/availability/stock logic already lives in `productService` (backend), not re-implemented here.
- Every page in this plan is plain/hardcoded (no Registry) — do not reach for template-variant abstractions here, that's explicitly the next plan's job (YAGNI at the plan-boundary, not just within a plan).

---

## File Structure

```
storefront/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local.example              # NEXT_PUBLIC_-free; API base URL is server-only, never shipped to the browser
└── src/
    ├── lib/
    │   ├── api.ts                  # tenant-aware fetch wrapper
    │   └── api.test.ts
    └── app/
        ├── layout.tsx               # root layout, minimal
        ├── page.tsx                 # homepage: categories + product grid
        └── products/
            └── [id]/
                └── page.tsx         # product detail

package.json                         # root: add "concurrently", update "dev" script
backend/src/server.ts                # CORS origin -> http://localhost:7070
```

---

## Task 1: Scaffold the Next.js workspace + wire the root dev script + fix backend CORS

**Files:**
- Create: `storefront/package.json`
- Create: `storefront/tsconfig.json`
- Create: `storefront/next.config.ts`
- Create: `storefront/.env.local.example`
- Create: `storefront/src/app/layout.tsx`
- Create: `storefront/src/app/page.tsx` (placeholder, replaced in Task 3)
- Modify: `package.json` (root)
- Modify: `backend/src/server.ts`
- Test: `storefront/src/app/page.test.tsx` (a trivial smoke test proving the workspace's own test runner works, before real content exists)

**Interfaces:**
- Produces: a `storefront` npm workspace that `npm run dev` (root) starts alongside `backend`, listening on port 7070. Task 2 builds inside `storefront/src/lib/`.

- [ ] **Step 1: Create the Next.js package**

`storefront/package.json`:
```json
{
  "name": "storefront",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 7070",
    "build": "next build",
    "start": "next start -p 7070",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.12.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "typescript": "^6.0.3",
    "vitest": "^3.0.0"
  }
}
```

`storefront/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`storefront/next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Nothing custom yet — kept minimal on purpose. Image domains, i18n,
  // etc. get added when a task actually needs them (spec explicitly
  // defers i18n; images are same-origin via the backend for Phase 1).
};

export default nextConfig;
```

`storefront/.env.local.example`:
```
# Server-only (no NEXT_PUBLIC_ prefix — never sent to the browser). The
# storefront always talks to the backend server-to-server, so the base
# URL doesn't need to be, and shouldn't be, client-visible.
BACKEND_API_URL=http://localhost:8080
```

`storefront/src/app/layout.tsx`:
```tsx
export const metadata = {
  title: 'Shop Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
```

`storefront/src/app/page.tsx` (placeholder — Task 3 replaces this):
```tsx
export default function HomePage() {
  return <p>Storefront scaffold — homepage content lands in Task 3.</p>;
}
```

- [ ] **Step 2: Write the failing smoke test**

`storefront/src/app/page.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage (scaffold smoke test)', () => {
  it('is a function component (proves the workspace/test-runner wiring works)', () => {
    expect(typeof HomePage).toBe('function');
  });
});
```

`storefront/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node' },
  // The tsconfig's "jsx": "preserve" is for Next.js's own SWC build pipeline —
  // vitest uses esbuild directly and needs its own explicit JSX setting,
  // otherwise .tsx imports fail at runtime (raw JSX left untransformed).
  esbuild: { jsx: 'automatic' },
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from repo root): `npm install && npm test --workspace=storefront`
Expected: FAIL — `storefront` workspace doesn't exist in `node_modules` yet / files not found (this step mainly sanity-checks that `npm install` correctly picks up the new workspace once `package.json` exists; if Step 1's files are already in place when you first run `npm install`, this FAIL step effectively validates itself retroactively via Step 4's PASS — that's fine, note it and move on).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=storefront`
Expected: PASS (1 test)

- [ ] **Step 5: Wire the root dev script and fix backend CORS**

Add `concurrently` to root `package.json` `devDependencies`: `"concurrently": "^9.1.0"`. Modify root `package.json`'s `scripts`:
```json
{
  "scripts": {
    "setup": "npm install && npm run db:migrate --workspace=backend && npm run db:seed --workspace=backend",
    "dev": "concurrently -n backend,storefront -c blue,green \"npm run dev --workspace=backend\" \"npm run dev --workspace=storefront\""
  }
}
```

Modify `backend/src/server.ts` — change the CORS origin:
```typescript
app.use(cors({
    origin: 'http://localhost:7070',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
```
(was `'http://localhost:3000'` — the storefront runs on 7070 per this plan's Global Constraints, not Next.js's default port.)

- [ ] **Step 6: Manually verify the composite dev script starts both apps**

```bash
npm install
npm run dev &> /tmp/dev-both.log &
sleep 5
curl -sf http://localhost:8080/health && echo " <- backend OK"
curl -sf http://localhost:7070 > /dev/null && echo "storefront OK (placeholder page)"
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill
```
Expected: both curl checks succeed.

- [ ] **Step 7: Commit**

```bash
git add storefront package.json backend/src/server.ts package-lock.json
git commit -m "feat: scaffold Next.js storefront workspace on port 7070, wire composite dev script"
git push origin develop
```

---

## Task 2: Tenant-aware backend API client

**Files:**
- Create: `storefront/src/lib/api.ts`
- Create: `storefront/src/lib/api.test.ts`

**Interfaces:**
- Produces: `getTenantHost(): Promise<string>` (reads the incoming request's hostname via `next/headers`, strips the port) and `fetchFromBackend<T>(path: string, init?: RequestInit): Promise<T>` (forwards the resolved host as the `Host` header, prepends `BACKEND_API_URL`, throws a typed `BackendApiError` on non-2xx with the response's parsed error body). Tasks 3-4's pages call `fetchFromBackend`.

- [ ] **Step 1: Write the failing test**

`storefront/src/lib/api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('fetchFromBackend', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.BACKEND_API_URL;

  beforeEach(() => {
    process.env.BACKEND_API_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.BACKEND_API_URL = originalEnv;
    vi.clearAllMocks();
  });

  it('forwards the incoming request host (subdomain, port stripped) as the Host header to the backend', async () => {
    const { headers } = await import('next/headers');
    (headers as any).mockResolvedValue(new Map([['host', 'texnogallery.localhost:7070']]));
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as any;

    const { fetchFromBackend } = await import('./api');
    await fetchFromBackend('/categories');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/categories',
      expect.objectContaining({ headers: expect.objectContaining({ Host: 'texnogallery.localhost' }) })
    );
  });

  it('returns the parsed JSON body on success', async () => {
    const { headers } = await import('next/headers');
    (headers as any).mockResolvedValue(new Map([['host', 'texnogallery.localhost:7070']]));
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ categories: [] }), { status: 200 })) as any;

    const { fetchFromBackend } = await import('./api');
    const result = await fetchFromBackend<{ categories: unknown[] }>('/categories');
    expect(result).toEqual({ categories: [] });
  });

  it('throws BackendApiError with the parsed error body on a non-2xx response', async () => {
    const { headers } = await import('next/headers');
    (headers as any).mockResolvedValue(new Map([['host', 'unknown-shop.localhost:7070']]));
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'shop_not_found', subdomain: 'unknown-shop' }), { status: 404 })) as any;

    const { fetchFromBackend, BackendApiError } = await import('./api');
    await expect(fetchFromBackend('/categories')).rejects.toThrow(BackendApiError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=storefront -- api.test`
Expected: FAIL — `./api` doesn't exist yet

- [ ] **Step 3: Write minimal implementation**

`storefront/src/lib/api.ts`:
```typescript
import { headers } from 'next/headers';

export class BackendApiError extends Error {
  constructor(public readonly status: number, public readonly body: unknown) {
    super(`Backend API error ${status}: ${JSON.stringify(body)}`);
    this.name = 'BackendApiError';
  }
}

export async function getTenantHost(): Promise<string> {
  const h = await headers();
  const host = h.get('host') ?? '';
  return host.split(':')[0]!; // strip the port — the backend only cares about the subdomain
}

export async function fetchFromBackend<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tenantHost = await getTenantHost();
  const baseUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Host: tenantHost,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new BackendApiError(res.status, body);
  }
  return body as T;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=storefront -- api.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add storefront/src/lib
git commit -m "feat: add tenant-aware backend API client for the storefront"
git push origin develop
```

---

## Task 3: Homepage — real categories + products

**Files:**
- Modify: `storefront/src/app/page.tsx`

**Interfaces:**
- Consumes: `fetchFromBackend` (Task 2), `GET /categories` and `GET /products` (already-shipped backend routes).
- No new testable unit-level interface — this is an RSC page, verified per Step 2's manual check (matching Foundation/Customer Auth/Catalog Backend's own final-task pattern of ending in a live check, not a unit test, for the app-assembly step).

- [ ] **Step 1: Write the homepage**

`storefront/src/app/page.tsx`:
```tsx
import { fetchFromBackend, BackendApiError } from '@/lib/api';

interface Category {
  id: string;
  parentId: string | null;
  name: string;
}

interface Product {
  id: string;
  name: string;
  priceCents: number;
  totalStock: number;
  isAvailable: boolean;
}

export default async function HomePage() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let notFound = false;

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      fetchFromBackend<{ categories: Category[] }>('/categories'),
      fetchFromBackend<{ products: Product[] }>('/products'),
    ]);
    categories = categoriesRes.categories;
    products = productsRes.products;
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) {
      notFound = true;
    } else {
      throw err;
    }
  }

  if (notFound) {
    return <p>Bu ünvanda mağaza tapılmadı.</p>;
  }

  return (
    <main>
      <h1>Kateqoriyalar</h1>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>

      <h1>Məhsullar</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <a href={`/products/${p.id}`}>{p.name}</a> — {(p.priceCents / 100).toFixed(2)} AZN
            {!p.isAvailable && ' (tezliklə)'}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Manually verify live**

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
npm run dev &> /tmp/dev-both.log &
sleep 5
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'iPhone 15'
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill
```
Expected: `iPhone 15` found in the rendered HTML (the real seeded product from the Catalog Backend plan). Also open `http://texnogallery.localhost:7070` in a real browser to see it render (`.localhost` subdomains resolve to loopback automatically, no `/etc/hosts` edit needed).

- [ ] **Step 3: Commit**

```bash
git add storefront/src/app/page.tsx
git commit -m "feat: homepage renders real tenant categories and products"
git push origin develop
```

---

## Task 4: Product detail page

**Files:**
- Create: `storefront/src/app/products/[id]/page.tsx`

**Interfaces:**
- Consumes: `fetchFromBackend` (Task 2), `GET /products/:id`.

- [ ] **Step 1: Write the product detail page**

`storefront/src/app/products/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { fetchFromBackend, BackendApiError } from '@/lib/api';

interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  totalStock: number;
  isAvailable: boolean;
  tags: { id: string; name: string }[];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: ProductDetail;
  try {
    product = await fetchFromBackend<ProductDetail>(`/products/${id}`);
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <main>
      <a href="/">← Geri</a>
      <h1>{product.name}</h1>
      {product.description && <p>{product.description}</p>}
      <p>{(product.priceCents / 100).toFixed(2)} AZN</p>
      <p>{product.isAvailable ? `Stokda: ${product.totalStock}` : 'Tezliklə'}</p>
      <ul>
        {product.tags.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Manually verify live**

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
npm run dev &> /tmp/dev-both.log &
sleep 5

# find the real seeded product's id via the API first
PRODUCT_ID=$(curl -s -H "Host: texnogallery.localhost" http://localhost:8080/products | python3 -c 'import sys,json; print(json.load(sys.stdin)["products"][0]["id"])')
curl -s -H "Host: texnogallery.localhost" "http://localhost:7070/products/$PRODUCT_ID" | grep -o 'iPhone 15'
curl -s -o /dev/null -w "unknown id -> HTTP %{http_code}\n" -H "Host: texnogallery.localhost" http://localhost:7070/products/00000000-0000-0000-0000-000000000000

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill
```
Expected: real product page renders "iPhone 15"; an unknown id returns Next.js's 404 page (HTTP 404).

- [ ] **Step 3: Commit**

```bash
git add storefront/src/app/products
git commit -m "feat: add product detail page, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check:** This plan covers the *plumbing* only (storefront exists, calls the real API, renders real data) — none of spec §4's actual component list (Header/Nav/Hero/ProductGrid/ProductCard/etc. as swappable Registry entries) is built here on purpose; that's explicitly the next plan (Component Registry & Layout System), which will replace this plan's plain `page.tsx` content with Registry-driven rendering rather than building it twice.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `Category`/`Product`/`ProductDetail` types in Tasks 3-4 are minimal local interfaces (only the fields these pages actually render), not full re-imports of the backend's `@shop-platform/shared-types` shapes — deliberate: the storefront is a separate workspace/deployment from the backend, and importing `@shop-platform/shared-types` into it would also be reasonable, but these pages only need a handful of fields, so a narrow local type keeps each page's contract explicit and avoids over-fetching assumptions. `fetchFromBackend<T>`'s generic is used consistently across both call sites (Task 3, Task 4) with the shape each page actually needs.
