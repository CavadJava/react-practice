# Multi-Tenant Shop Platform — Phase 1 Design

**Status:** Draft, awaiting spec review
**Date:** 2026-08-15
**Related:** `projects/texnogallery.az` (Vite+React storefront, first real tenant to migrate onto this platform), `projects/bk_texnogallery.az/backend` (Express+`pg` API, already anticipates a Next.js frontend — becomes this platform's backend)

## 1. Overview

A **multi-tenant e-commerce SaaS platform**: one shared deployment that can host many independent online shops ("tenants"), each with its own catalog, branding, and page layout, without a separate codebase or deployment per shop. The core idea driving Phase 1: every visible piece of a storefront (header, product grid, footer, etc.) is a **swappable, template-based component**, and each tenant controls which template variant is used where via a simple settings UI — not by editing code.

This is a large product (self-signup, billing, tenant admin, platform admin, storefront). This spec covers **only Phase 1**: the multi-tenant skeleton and the component/template system. Later phases (self-signup + billing, full admin suites) are separate specs, summarized in §9 for context.

## 2. Scope

**In scope (Phase 1):**
- Multi-tenant storefront: product browsing, product detail, search, cart, checkout, generic content pages (About/Contact/etc.)
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
- Schema-per-tenant / DB-per-tenant isolation (Approach B) — the shared-DB design keeps this door open (see §4) but it isn't built now
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
| Shopping | Cart, Checkout flow |
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

Both the storefront and the Layout Editor call the same Express API.

**Single API, module-based internally** — this is one Express application (not one microservice per module). §7's `/modules` folder structure lives inside this single API; modules never become separate deployable services in Phase 1. Splitting into real microservices, if ever needed, is a future-phase decision, not a Phase 1 concern.

**Local development script** — a single command (e.g. `npm run dev` from a root script, or a shell script under `scripts/`) starts the full local stack: Postgres (if not already running), the Express API, the Next.js storefront, and the Vite admin app together, so a fresh checkout is runnable without manually starting four things by hand. Exact tooling (concurrently/turborepo/plain shell script) is an implementation detail for the plan.

## 7. Code Organization Principle

**Module-based (domain-based) structure**, not type-based — code for one domain lives together instead of being split across global `components/`, `hooks/`, `services/` folders:

```
/modules
  /catalog        (products, categories: components, hooks, api, types)
  /cart
  /orders
  /tenants
  /page-builder   (Component Registry, PageRenderer, Layout Editor)
```

Each module is self-contained; cross-module communication happens only through explicitly exported interfaces. The Postgres schema boundaries in §5 mirror these modules 1:1.

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
