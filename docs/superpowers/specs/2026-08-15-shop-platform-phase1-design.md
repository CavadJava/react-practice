# Multi-Tenant Shop Platform — Phase 1 Design

**Status:** Draft, awaiting spec review
**Date:** 2026-08-15
**Related:** `projects/texnogallery.az` (Vite+React storefront, first real tenant to migrate onto this platform), `projects/bk_texnogallery.az/backend` (Express+`pg` API, already anticipates a Next.js frontend — becomes this platform's backend)

## 1. Overview

A **multi-tenant e-commerce SaaS platform**: one shared deployment that can host many independent online shops ("tenants"), each with its own catalog, branding, and page layout, without a separate codebase or deployment per shop. The core idea driving Phase 1: every visible piece of a storefront (header, product grid, footer, etc.) is a **swappable, template-based component**, and each tenant controls which template variant is used where via a simple settings UI — not by editing code.

Built as a single **mono-repo** (`projects/shop-platform/`, npm workspaces) holding the backend API, storefront, admin app, and a shared-types package — see §7 for the full layout.

This is a large product (self-signup, billing, tenant admin, platform admin, storefront). This spec covers **only Phase 1**: the multi-tenant skeleton and the component/template system. Later phases (self-signup + billing, full admin suites) are separate specs, summarized in §9 for context.

## 2. Scope

**In scope (Phase 1):**
- Multi-tenant storefront: product browsing, product detail, search, cart, checkout, generic content pages (About/Contact/etc.)
- Customer order history: a read-only "my orders" list/detail view for the customer who placed them (no status changes, no tenant-side management — that's Phase 3)
- Component Registry + Template Variant system (multiple templates per component type)
- Layout Config system: per-tenant, per-page slot arrangement, editable via a simple settings form (dropdown + reorder — no drag-and-drop)
- Tenant-aware theming (colors/fonts/logo) via CSS custom properties
- Subdomain-based tenant resolution (`tenant-slug.platform-domain`)
- Shared Postgres database, `tenant_id`-scoped, with Row-Level Security
- Manual tenant provisioning (seed script / internal admin action — no public signup yet)
- Migrating `texnogallery.az` onto the platform as the first tenant

**Out of scope (deferred to later phases):**
- Public self-signup, subscription plans, billing/payment for platform usage (Phase 2)
- Full Tenant Admin suite (product CRUD, order management dashboard) and Platform Super-Admin UI (Phase 3) — Phase 1 ships only the minimal Layout Editor needed to prove the template-swapping value prop, plus bare-bones product seeding
- Drag-and-drop visual page builder (explicitly rejected for now — settings form is enough)
- Per-tenant custom domains (subdomain only in Phase 1)
- Schema-per-tenant / DB-per-tenant isolation (Approach B) — the shared-DB design keeps this door open (see §3) but it isn't built now
- i18n/multi-language, product reviews/ratings, recommendation/ML features

## 3. Tenancy Model

**Shared-DB multi-tenant** (chosen over DB-per-tenant and over independent per-shop deploys):
- One Postgres database. Every tenant-owned table carries a `tenant_id` column plus Row-Level Security policies.
- Tenant resolved per-request from the subdomain by Next.js middleware, attached to request context, and threaded through every backend call.
- All data access goes through a **repository layer** (`productRepository.findAll(tenantId, filters)`, never raw ad-hoc queries) — this is the discipline that keeps a future move to isolated-DB-per-tenant cheap.

**Why not DB-per-tenant now:** it multiplies migration/connection/ops complexity per tenant — unjustified before there are paying tenants at scale.

**Migration path kept open (future, not Phase 1 work):** because every query is tenant-scoped through one layer and storage is namespaced (`/tenants/{tenantId}/...`), a specific tenant can later be moved to an isolated schema/DB via a connection router, without touching business logic. Four rules that must hold from day one to keep this true:
1. No query bypasses the repository layer.
2. Every tenant-owned table has `tenant_id`; no cross-tenant joins.
3. File/image storage is namespaced by tenant.
4. Migrations are written to be replayable against an arbitrary target DB.

## 4. Component / Template System

This is the headline feature: components are pluggable, and their placement is tenant-configurable.

- **Component Registry** — a map from component type to its available variants:
  ```
  { header: { classic: HeaderClassic, minimal: HeaderMinimal },
    footer: { simple: FooterSimple, expanded: FooterExpanded },
    productGrid: { grid: ProductGridCards, list: ProductGridList },
    ... }
  ```
- **Layout Config** — stored per tenant per page in the DB: an ordered list of slots, each `{ componentType, variant, settings }`.
- **PageRenderer** — a generic component that reads a tenant's Layout Config and renders the registered variant for each slot, passing `settings` as props.
- **Layout Editor** (minimal, Phase 1) — a settings form (not drag-and-drop): pick a variant per slot from a dropdown, reorder slots with up/down controls. Ships as part of the Phase 1 admin app (see §6) so the core value prop is actually demonstrable, even though the full Tenant Admin suite is Phase 3.
- **Theming** — CSS custom properties (`--primary-color`, `--font-family`, `--logo-url`, …) generated from the tenant's theme row and injected at the root; components consume the variables, so no rebuild is needed to restyle a tenant.

**Component list (Phase 1):**

| Category | Components |
|---|---|
| Navigation | Header+Navigation, Footer, Breadcrumb |
| Discovery | Hero/Banner, Product category menu, Category/filter panel, Product search, Search results |
| Product | Product Card, Product detail page |
| Shopping | Cart, Checkout flow, My Orders (read-only history/detail) |
| Content | Generic CMS Page (About/Contact/Terms — one template, tenant-supplied content) |
| Theme | Color/font/logo override (CSS custom properties) |

## 5. Data Model (high level)

Organized as **domain-based Postgres schemas**, mirroring the code's module boundaries (see §7):

- `tenants.*` — `tenants`, `page_layouts` (slot config), `theme_settings`
- `catalog.*` — `products`, `categories`
- `cart.*` — `carts`, `cart_items`
- `orders.*` — `orders`, `order_items`

Every table in `catalog`, `cart`, and `orders` carries `tenant_id`; RLS policies enforce it can't be queried across tenants even if application code has a bug.

## 6. Architecture & Tech Stack

| Part | Stack | Why |
|---|---|---|
| Storefront (customer-facing) | **Next.js (App Router)**, React | Needs SSR/ISR for SEO — this is how shoppers find listings |
| Layout Editor / minimal admin | **Vite + React** SPA | No SEO need; matches the pattern already used for this user's other admin panels (`taobao-v1-admin`, `service-admin`) |
| Backend API | **Express + Node**, `pg` (raw SQL via repository layer, no ORM) | Extends `bk_texnogallery.az/backend`, which already exists and already anticipates a Next.js frontend (its CORS config names `localhost:3000`) |
| Database | Postgres, shared, `tenant_id` + RLS | See §3 |
| Repo layout | **Mono-repo**, npm workspaces | One repo, one `npm install`, shared types across all three apps — see §7 |

Both the storefront and the Layout Editor call the same Express API.

**Single API, module-based internally** — this is one Express application (not one microservice per module). §7's `/modules` folder structure lives inside this single API; modules never become separate deployable services in Phase 1. Splitting into real microservices, if ever needed, is a future-phase decision, not a Phase 1 concern.

**Local development script** — a single command (e.g. `npm run dev` from a root script, or a shell script under `scripts/`) starts the full local stack: Postgres (if not already running), the Express API, the Next.js storefront, and the Vite admin app together, so a fresh checkout is runnable without manually starting four things by hand. Exact tooling (concurrently/turborepo/plain shell script) is an implementation detail for the plan.

## 7. Repo Structure

**Mono-repo, npm workspaces** (not pnpm/Turborepo/Nx — those are additive later if build times ever justify them, not needed to start):

```
projects/shop-platform/
├── package.json                    (workspaces: ["backend","storefront","admin","packages/*"])
│
├── backend/                        (Express API — single app, module-based internally)
│   ├── package.json
│   └── src/
│       ├── server.ts
│       ├── middleware/             (tenant-resolve, auth, error-handler)
│       ├── db/                     (pool, migrations)
│       └── modules/
│           ├── tenants/
│           ├── catalog/
│           ├── cart/
│           ├── orders/
│           └── page-builder/
│
├── storefront/                     (Next.js App Router)
│   ├── package.json
│   ├── middleware.ts               (subdomain → tenant resolve)
│   ├── app/                        (routes: home, products/[slug], search, cart, checkout, [cmsSlug])
│   └── modules/
│       ├── catalog/ , cart/
│       ├── page-builder/           (Component Registry + variants + PageRenderer)
│       └── theme/
│
├── admin/                          (Vite + React — Layout Editor)
│   ├── package.json
│   └── src/modules/
│       ├── page-builder/           (slot list + variant picker UI)
│       ├── tenants/                (tenant switcher)
│       └── auth/
│
└── packages/
    └── shared-types/               (Tenant/Product/LayoutConfig TS types + zod schemas — imported by all three apps)
        ├── package.json
        └── src/{tenant,product,layoutConfig}.ts
```

Each of `backend`, `storefront`, `admin` is a self-contained npm workspace package; the only intentional cross-package dependency is all three importing `packages/shared-types`. Module names (`tenants`, `catalog`, `cart`, `page-builder`) repeat identically across `backend/`, `storefront/`, and the Postgres schemas in §5 — the same domain boundary mirrored through every layer of the stack.

### Backend module internals — Clean Architecture (domain / infrastructure / presentation)

Dependencies point inward only: `presentation` → `domain` ← `infrastructure`. `domain/` never imports Express or `pg` — this is what makes tenant-scoping logic unit-testable without a DB, and what keeps the §3 migration-to-isolated-DB path cheap (only `infrastructure/` changes).

```
backend/src/modules/catalog/
├── domain/
│   ├── product.ts              (Product, Category entities — plain TS, zero dependencies)
│   ├── productRepository.ts    (interface: findAll(tenantId, filters), findBySlug(tenantId, slug))
│   └── productService.ts       (business rules: price formatting, availability)
├── infrastructure/
│   └── pgProductRepository.ts  (implements productRepository — raw `pg` queries, tenant_id in every WHERE)
└── presentation/
    ├── productRoutes.ts, productController.ts, productDto.ts (zod)

backend/src/modules/cart/        ← heaviest domain: real calculation logic
├── domain/
│   ├── cart.ts, cartItem.ts
│   ├── cartRepository.ts
│   └── cartService.ts          (total calculation, discount rules, stock check on add) — pure, DB-free, highest unit-test value
├── infrastructure/pgCartRepository.ts
└── presentation/cartRoutes.ts, cartController.ts

backend/src/modules/tenants/     ← lightest domain: mostly CRUD, no separate *Service file (YAGNI)
├── domain/
│   ├── tenant.ts
│   └── tenantRepository.ts     (findBySubdomain(slug), findById(id))
├── infrastructure/pgTenantRepository.ts
└── presentation/tenantRoutes.ts, tenantController.ts  (subdomain→tenant Factory logic lives here)

backend/src/modules/page-builder/  ← config + validation only; rendering itself lives in storefront's page-builder module
├── domain/
│   ├── layoutConfig.ts         (slot, variant, settings types)
│   ├── layoutConfigRepository.ts
│   └── layoutConfigService.ts  (rule: every slot's variant must exist in the Component Registry)
├── infrastructure/pgLayoutConfigRepository.ts
└── presentation/layoutConfigRoutes.ts   (called by the admin app's Layout Editor)
```

The three-layer shape is constant across modules; each module's `domain/` is only as "thick" as its real business logic — `tenants` has no standalone service file because it has no business rule beyond lookup, `cart` has the richest one because it does real calculation.

**Alternatives considered and deferred, not adopted:**
- **Feature-Sliced Design** for the frontend apps (`storefront`/`admin`) — stricter than the plain `modules/` folders above, valuable at larger team/codebase scale; unnecessary ceremony for Phase 1.
- **Vertical Slice Architecture** for the backend (one file per use-case, no domain/infra/presentation split) — rejected because it erodes the Repository-pattern discipline that tenant-isolation safety depends on.
- **CQRS** (separate read/write models) for `catalog` — deferred until read load actually demands it.
- **Turborepo/Nx** on top of npm workspaces — purely additive for build caching later; not needed to start.

**Design patterns used deliberately**, applied where they fit naturally rather than forced everywhere:

| Pattern | Where |
|---|---|
| Repository | Backend data-access layer, tenant-scoped queries |
| Registry | Component Registry (template variant lookup) |
| Strategy | PageRenderer picking/rendering a variant per slot |
| Factory | Building tenant context from the resolved subdomain |
| Middleware / Chain of Responsibility | Express pipeline: tenant-resolve → auth → route handler |
| Adapter | Reserved for Phase 2 payment-provider integration |

## 8. Error Handling

- Unknown/unresolvable subdomain → dedicated "shop not found" page, not a generic 404.
- Tenant has no Layout Config yet → PageRenderer falls back to a default built-in layout rather than rendering blank.
- Repository layer throws (not silently ignores) if called without a `tenant_id` — a missing tenant scope must fail loudly, never silently return unscoped/cross-tenant data.

## 9. Later Phases (context only, not designed here)

- **Phase 2:** Public tenant self-signup, subscription plans, billing/payment integration.
- **Phase 3:** Full Tenant Admin suite (product CRUD, order management) and Platform Super-Admin UI (tenant provisioning, cross-tenant oversight).
- **Phase 4:** AI shopping-assistant chatbot on the storefront (product Q&A, order status, recommendations) — one chatbot capability shared across tenants, tenant-scoped to that tenant's own catalog/orders like everything else in §3. Scope, model choice, and conversation UX need their own brainstorming session before a plan; not designed here.

Each gets its own spec when it's time to build it.

## 10. Testing

- Repository layer: unit tests asserting tenant scoping — a query for tenant A must never return tenant B's rows (highest-priority tests in the whole system, given the shared-DB model).
- Component Registry / PageRenderer: given a fixture Layout Config, renders the expected variant in the expected order.
- Integration: full page render for a seeded tenant (subdomain → middleware → API → PageRenderer → HTML).

## 11. Documentation & API Artifacts

The project needs a README (setup/local-run instructions), a Postman collection, and a Swagger/OpenAPI spec for the API. These are **not produced now** — per the user's instruction, they get asked about and added once Phase 1's implementation is actually complete and the API surface has stopped moving, so they document the real thing instead of a moving target. The implementation plan should end with a task to circle back on this rather than skip it silently.

## 12. Open Questions

- Exact auth mechanism for the Phase 1 Layout Editor (shared internal credential vs. lightweight per-tenant login) — can default to a simple internal login and revisit in Phase 3's full admin auth design.
- Where Phase 1's manual tenant/product seeding lives (SQL script vs. tiny internal CLI) — implementation detail, decide during planning.
- **How a customer is identified for "My Orders" without full customer accounts** (Phase 1 has no customer auth/signup): candidates are order lookup by email + order ID (no session needed), or a lightweight email magic-link session. Decide during planning — this determines whether `orders` needs a `customer_email` lookup index or a real session mechanism.
