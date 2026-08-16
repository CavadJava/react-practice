# Shop Platform — Phase 1 API Documentation (Swagger/OpenAPI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve interactive Swagger UI + a raw OpenAPI 3 JSON document for every route that exists today (Foundation's `/health`/`/branches`, Customer Auth's `/customers/*`, Catalog Backend's `/categories`/`/products*`) — fulfilling the design spec §11 commitment ("README/Postman/Swagger get produced once Phase 1 implementation is done and the API surface has stopped moving") for the Swagger piece specifically, now that a real, live-verified API surface exists across three completed epics.

**Architecture:** A single new `backend/src/docs/` module builds an `OpenApiRegistry` (from `@asteasolutions/zod-to-openapi`) that **reuses the existing `@shop-platform/shared-types` zod schemas directly** — `tenantSchema`, `customerSchema`, `registerRequestSchema`, `loginRequestSchema`, `categorySchema`, `tagSchema`, `productSchema` — as the single source of truth for both runtime validation (already the case) and API documentation (new). No schema is redefined or hand-duplicated in YAML/JSDoc. `swagger-ui-express` serves the generated document at `/api-docs` (interactive UI) and `/api-docs.json` (raw document, importable into Postman directly — satisfying spec §11's Postman mention without separate work, since Postman natively imports OpenAPI 3).

**Tech Stack:** Adds `@asteasolutions/zod-to-openapi`, `swagger-ui-express` + `@types/swagger-ui-express` to the existing stack. No changes to `packages/shared-types` — registration happens entirely from the backend side, so existing schema files stay untouched (same non-invasive principle the Catalog Backend plan's self-review established for `Tenant`).

## Global Constraints

- Existing zod schemas in `@shop-platform/shared-types` are reused as-is (`registry.register(name, schema)`), never redefined — one schema shape, one source of truth, for both validation and docs.
- No route's actual request/response *code* changes — this plan is additive documentation only, verified against the real, already-shipped behavior, not the other way around.
- Every tenant-scoped route's documented `Host` header carries the real subdomain-resolution explanation (spec §3), not a generic placeholder.
- `GET /customers/me`'s documented security reflects both real auth mechanisms (cookie **or** bearer — spec §3a), not just one.
- `/api-docs` and `/api-docs.json` are mounted **before** `tenantResolve` (docs are not tenant-scoped — mounting them after would 404 with `shop_not_found` on any subdomain that isn't a real tenant, e.g. plain `localhost`).

---

## File Structure

```
backend/src/
├── docs/
│   ├── registry.ts            # extendZodWithOpenApi + shared OpenApiRegistry instance + common components (Host header, security schemes)
│   ├── registerRoutes.ts      # registry.registerPath(...) for all 8 existing routes
│   ├── registerRoutes.test.ts
│   ├── document.ts            # generates the final OpenAPI document object from the registry
│   ├── document.test.ts
│   └── swaggerRoutes.ts       # Express router: GET /api-docs (UI), GET /api-docs.json (raw)
└── server.ts                  # mount swaggerRoutes before tenantResolve
```

---

## Task 1: OpenAPI registry + common components

**Files:**
- Create: `backend/src/docs/registry.ts`
- Test: `backend/src/docs/registry.test.ts`
- Modify: `backend/package.json` (add `@asteasolutions/zod-to-openapi`, `swagger-ui-express`, `@types/swagger-ui-express`)

**Interfaces:**
- Produces: a shared `registry: OpenApiRegistry` instance, plus two exported helpers: `tenantHostHeader` (a zod object schema for the `Host` header, reused by every tenant-scoped route in Task 2) and `registerSecuritySchemes()` (registers `cookieAuth`/`bearerAuth`, called once). Task 2 imports `registry` and `tenantHostHeader` to register the 8 routes.

- [ ] **Step 1: Add the dependencies**

Add to `backend/package.json` `dependencies`: `"@asteasolutions/zod-to-openapi": "^7.3.0"`, `"swagger-ui-express": "^5.0.1"`; to `devDependencies`: `"@types/swagger-ui-express": "^4.1.8"`. Run `npm install` from repo root.

- [ ] **Step 2: Write the failing test**

`backend/src/docs/registry.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { registry, tenantHostHeader } from './registry';

describe('OpenAPI registry setup', () => {
  it('extends zod so .openapi() is callable on any schema (proves extendZodWithOpenApi ran)', () => {
    expect(() => z.object({ x: z.string() }).openapi('TestSchema')).not.toThrow();
  });

  it('exposes a shared registry that schemas can be registered on', () => {
    const before = registry.definitions.length;
    registry.register('TestRegistration', z.object({ y: z.number() }));
    expect(registry.definitions.length).toBe(before + 1);
  });

  it('tenantHostHeader documents the Host header with a real example subdomain', () => {
    const parsed = tenantHostHeader.safeParse({ host: 'texnogallery.localhost' });
    expect(parsed.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test --workspace=backend -- registry.test`
Expected: FAIL — `./registry` doesn't exist yet

- [ ] **Step 4: Write minimal implementation**

`backend/src/docs/registry.ts`:
```typescript
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Must run before any .openapi() call anywhere in the process — zod-to-openapi
// extends the shared zod prototype, so this one call also makes .openapi()
// available on schemas imported from @shop-platform/shared-types, without
// needing to touch that package at all.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const tenantHostHeader = z.object({
  host: z
    .string()
    .openapi({
      description:
        'Every route below (except /health and the docs routes themselves) resolves its tenant from the subdomain in this header — e.g. "texnogallery.localhost" resolves to the texnogallery tenant. An unresolvable subdomain returns 404 { error: "shop_not_found" }.',
      example: 'texnogallery.localhost',
    }),
});

export function registerSecuritySchemes(): void {
  registry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'customerAuth',
    description: 'Set automatically by POST /customers/login. Default mechanism for browser clients.',
  });
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    description: 'The same JWT login returns in its response body, sent as "Authorization: Bearer <token>". For non-browser clients — not mutually exclusive with cookieAuth (spec §3a).',
  });
}

export { OpenApiGeneratorV3 };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend -- registry.test`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/docs/registry.ts backend/src/docs/registry.test.ts
git commit -m "feat: add OpenAPI registry reusing shared-types zod schemas, common Host header + security schemes"
git push origin develop
```

---

## Task 2: Register all 8 existing routes

**Files:**
- Create: `backend/src/docs/registerRoutes.ts`
- Create: `backend/src/docs/registerRoutes.test.ts`

**Interfaces:**
- Consumes: `registry`/`tenantHostHeader`/`registerSecuritySchemes` (Task 1), every zod schema already exported from `@shop-platform/shared-types`.
- Produces: `registerAllRoutes(): void` — calling it populates `registry` with all 8 routes' paths/methods/request/response shapes. Task 3's document generator calls this once before generating.

- [ ] **Step 1: Write the failing test**

`backend/src/docs/registerRoutes.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { registry } from './registry';
import { registerAllRoutes } from './registerRoutes';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

beforeAll(() => {
  registerAllRoutes();
});

function generate() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'test', version: '0.0.0' },
  });
}

describe('registerAllRoutes', () => {
  it('registers all 8 existing routes with the correct methods', () => {
    const doc = generate();
    const expected: [string, string][] = [
      ['/health', 'get'],
      ['/branches', 'get'],
      ['/customers/register', 'post'],
      ['/customers/login', 'post'],
      ['/customers/me', 'get'],
      ['/categories', 'get'],
      ['/products', 'get'],
      ['/products/{id}', 'get'],
    ];
    for (const [path, method] of expected) {
      expect(doc.paths?.[path]?.[method as 'get' | 'post'], `${method.toUpperCase()} ${path}`).toBeDefined();
    }
  });

  it('documents POST /customers/register with the real registerRequestSchema request body', () => {
    const doc = generate();
    const op = doc.paths?.['/customers/register']?.post;
    const bodySchema = (op?.requestBody as any)?.content?.['application/json']?.schema;
    expect(bodySchema).toBeDefined();
  });

  it('documents GET /customers/me with both cookieAuth and bearerAuth as alternatives', () => {
    const doc = generate();
    const op = doc.paths?.['/customers/me']?.get;
    const security = op?.security ?? [];
    const schemeNames = security.flatMap((s: Record<string, unknown>) => Object.keys(s));
    expect(schemeNames).toContain('cookieAuth');
    expect(schemeNames).toContain('bearerAuth');
  });

  it('documents GET /health without a Host-header requirement (not tenant-scoped)', () => {
    const doc = generate();
    const op = doc.paths?.['/health']?.get;
    const params = (op?.parameters ?? []) as { name?: string }[];
    expect(params.some((p) => p.name === 'host')).toBe(false);
  });

  it('documents GET /branches WITH the Host-header requirement (tenant-scoped)', () => {
    const doc = generate();
    const op = doc.paths?.['/branches']?.get;
    const params = (op?.parameters ?? []) as { name?: string }[];
    expect(params.some((p) => p.name === 'host')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- registerRoutes.test`
Expected: FAIL — `./registerRoutes` doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/docs/registerRoutes.ts`:
```typescript
import { z } from 'zod';
import {
  tenantSchema,
  customerSchema,
  registerRequestSchema,
  loginRequestSchema,
  categorySchema,
  tagSchema,
  productSchema,
} from '@shop-platform/shared-types';
import { registry, tenantHostHeader, registerSecuritySchemes } from './registry';

const branchSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
});

const shopNotFoundSchema = z.object({ error: z.literal('shop_not_found'), subdomain: z.string() });

export function registerAllRoutes(): void {
  registerSecuritySchemes();

  registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['System'],
    description: 'Tenant-independent healthcheck — no Host-header resolution, always answers.',
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: z.object({ status: z.literal('ok') }) } } },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/branches',
    tags: ['Tenants'],
    description: "The resolved tenant's own branches — scoped strictly by the Host header, never a client-supplied id.",
    request: { headers: tenantHostHeader },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: z.object({ branches: z.array(branchSchema) }) } } },
      404: { description: 'Unresolvable subdomain', content: { 'application/json': { schema: shopNotFoundSchema } } },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/customers/register',
    tags: ['Customers'],
    description: 'Creates a customer under the resolved tenant. role defaults to "user", type to "physical" (Phase 1).',
    request: { headers: tenantHostHeader, body: { content: { 'application/json': { schema: registerRequestSchema } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: customerSchema } } },
      400: { description: 'Invalid request body' },
      409: { description: 'Email already registered for this tenant' },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/customers/login',
    tags: ['Customers'],
    description: 'Sets an httpOnly "customerAuth" cookie AND returns the same JWT as "token" in the body — use either mechanism on subsequent requests (spec §3a).',
    request: { headers: tenantHostHeader, body: { content: { 'application/json': { schema: loginRequestSchema } } } },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: customerSchema.extend({ token: z.string() }) } } },
      401: { description: 'Invalid credentials' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/customers/me',
    tags: ['Customers'],
    description: 'The logged-in customer, resolved from the session (cookie or bearer token) — never from a client-supplied id.',
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    request: { headers: tenantHostHeader },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: customerSchema } } },
      401: { description: 'No/invalid/expired session' },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/categories',
    tags: ['Catalog'],
    description: "The resolved tenant's categories, including subcategories (flat list — parentId links them).",
    request: { headers: tenantHostHeader },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: z.object({ categories: z.array(categorySchema) }) } } },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/products',
    tags: ['Catalog'],
    description: 'Filterable product list. Out-of-stock products are hidden or shown depending on the tenant\'s out_of_stock_display setting — never controllable by the caller.',
    request: {
      headers: tenantHostHeader,
      query: z.object({
        categoryId: z.string().optional().openapi({ description: 'Filter to one category' }),
        tagId: z.string().optional().openapi({ description: 'Filter to products carrying this tag' }),
        search: z.string().optional().openapi({ description: 'Case-insensitive substring match on product name' }),
      }),
    },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: z.object({ products: z.array(productSchema) }) } } },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/products/{id}',
    tags: ['Catalog'],
    description: 'A single product by id. Unlike the list, always returned regardless of stock/out_of_stock_display (detail pages always show the product).',
    request: { headers: tenantHostHeader, params: z.object({ id: z.string() }) },
    responses: {
      200: { description: 'OK', content: { 'application/json': { schema: productSchema } } },
      404: { description: 'Unknown product id for this tenant' },
    },
  });

  // tagSchema isn't attached to a route response directly yet (no GET /tags
  // route exists — see the Catalog Backend plan's Task 6 note), but register
  // it as a standalone component so it's still documented and ready for
  // when that route is added.
  registry.register('Tag', tagSchema);
  registry.register('Tenant', tenantSchema);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- registerRoutes.test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/docs/registerRoutes.ts backend/src/docs/registerRoutes.test.ts
git commit -m "feat: register all 8 existing routes in the OpenAPI registry"
git push origin develop
```

---

## Task 3: Serve Swagger UI + JSON, wire into `server.ts`, verify live

**Files:**
- Create: `backend/src/docs/document.ts`
- Create: `backend/src/docs/document.test.ts`
- Create: `backend/src/docs/swaggerRoutes.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `registry` (Task 1), `registerAllRoutes` (Task 2).
- Produces: `buildOpenApiDocument(): OpenAPIObject` (Task 3's own); `swaggerRoutes(): Router` mounting `GET /api-docs` (Swagger UI HTML) and `GET /api-docs.json` (raw document). Mounted in `server.ts` **before** `tenantResolve`.

- [ ] **Step 1: Write the failing test**

`backend/src/docs/document.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildOpenApiDocument } from './document';

describe('buildOpenApiDocument', () => {
  it('produces a valid OpenAPI 3.0 document with the expected metadata and all 8 paths', () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe('3.0.0');
    expect(doc.info.title).toBe('Shop Platform API');
    expect(Object.keys(doc.paths ?? {})).toEqual(
      expect.arrayContaining(['/health', '/branches', '/customers/register', '/customers/login', '/customers/me', '/categories', '/products', '/products/{id}'])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- document.test`
Expected: FAIL — `./document` doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/docs/document.ts`:
```typescript
import { OpenApiGeneratorV3, registry } from './registry';
import { registerAllRoutes } from './registerRoutes';

let registered = false;

export function buildOpenApiDocument() {
  if (!registered) {
    registerAllRoutes();
    registered = true; // idempotent — registerAllRoutes() would otherwise duplicate path registrations if called twice (e.g. once by this module, once by a test that also imports registerAllRoutes directly)
  }
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Shop Platform API',
      version: '0.1.0',
      description:
        'Multi-tenant shop platform, Phase 1. Every route except /health and /api-docs* resolves its tenant from the Host header (subdomain-based) — see each route\'s description.',
    },
  });
}
```

`backend/src/docs/swaggerRoutes.ts`:
```typescript
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './document';

export function swaggerRoutes(): Router {
  const router = Router();
  const document = buildOpenApiDocument();

  router.get('/api-docs.json', (_req, res) => {
    res.status(200).json(document);
  });
  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(document));

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- document.test`
Expected: PASS

- [ ] **Step 5: Wire into `server.ts`**

Modify `backend/src/server.ts` — add import:
```typescript
import { swaggerRoutes } from './docs/swaggerRoutes';
```

Add **before** `app.use(tenantResolve(tenantRepository));` (docs are not tenant-scoped — this ordering matters, see Global Constraints):
```typescript
app.use(swaggerRoutes());
```

- [ ] **Step 6: Run the full backend test suite**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend`
Expected: all tests pass (all prior epics' + this plan's)

- [ ] **Step 7: Manually verify live**

```bash
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev &> /tmp/api.log &
for i in $(seq 1 30); do curl -sf http://localhost:8080/health > /dev/null && break; sleep 1; done

curl -s http://localhost:8080/api-docs.json | head -c 300
echo
curl -s -o /dev/null -w "Swagger UI HTTP %{http_code}, content-type: %{content_type}\n" http://localhost:8080/api-docs

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```
Expected: `/api-docs.json` starts with `{"openapi":"3.0.0",...`; `/api-docs` returns HTTP 200 with `content-type: text/html`. Open `http://localhost:8080/api-docs` in a real browser to confirm the interactive UI renders and lists all 8 routes under their tags (System/Tenants/Customers/Catalog).

- [ ] **Step 8: Commit**

```bash
git add backend/src/docs/document.ts backend/src/docs/document.test.ts backend/src/docs/swaggerRoutes.ts backend/src/server.ts
git commit -m "feat: serve Swagger UI + OpenAPI JSON at /api-docs, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against spec §11): Swagger/OpenAPI — done, all 8 existing routes ✅. README — already exists (Foundation plan's Task 10), not touched here. Postman collection — not built separately; `/api-docs.json` is directly importable into Postman as an OpenAPI 3 source, which is how the note in this plan's Architecture section resolves that half of §11 without extra work. If the user wants a literal exported `.postman_collection.json` file committed to the repo (rather than "import the OpenAPI JSON yourself"), that's a small follow-up task, not done here since it wasn't explicitly requested.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** No new types introduced — every registered schema is imported unchanged from `@shop-platform/shared-types` or is a small local-only schema (`branchSchema`, `shopNotFoundSchema`) scoped to `registerRoutes.ts`, matching the file's own single responsibility. `registry`/`tenantHostHeader` from Task 1 are used with identical names/shapes in Task 2 and Task 3.
