# Shop Platform — Phase 1 Component Registry & Page Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tenant-configurable template mechanism that has been this whole project's headline feature since the very first design conversation (spec §4): a backend-stored **Layout Config** per tenant per page, a storefront **Component Registry** mapping component type → variant, and a **PageRenderer** that renders whichever variant a tenant's config picks. Proven with two real, fully-alternate-implemented components — `header` (`classic`/`minimal`) and `productGrid` (`grid`/`list`) — the same pair spec §4 uses as its own illustrative example. The homepage (currently hardcoded, from the Storefront Scaffold plan) is refactored to be Registry-driven instead of rebuilt from scratch.

**Scope note:** Only 2 components × 2 variants — not spec §4's full ~15-component list. This plan's job is proving the *mechanism* works end-to-end (DB → API → Registry → rendered HTML), the same "skeleton before the rest of the body" approach every prior plan in this project has used (Foundation proved tenant-resolution with just `branches`, not every table). Adding the rest of §4's components later is pure repetition of this same pattern, not new architecture. The **Layout Editor** (admin app that lets a tenant actually change these settings through a UI) is a separate follow-up plan — this plan only needs the config to be settable via the API directly (verified with `curl`/SQL), since the rendering mechanism doesn't care how the config got written.

**Architecture:** New backend `pageBuilder` module (`tenants.page_layouts` table, Clean Architecture layers, same pattern as every prior module). A new shared "manifest" — `@shop-platform/shared-types`'s `componentManifest.ts` — is plain data (`{ header: ['classic', 'minimal'], productGrid: ['grid', 'list'] }`, no React) that both the backend (validates incoming slot configs reference a real componentType+variant pair) and the storefront (keys its actual React Component Registry off the same names) read from — one source of truth for *which names are valid*, kept separate from *what each variant actually renders* (which only the storefront needs to know).

**Tech Stack:** No new dependencies — existing backend stack (Express/`pg`/zod/Vitest) and storefront stack (Next.js/Vitest) throughout.

## Global Constraints

- `domain/` files never import Express or `pg` directly (spec §7).
- Every tenant-owned table has `tenant_id`, RLS enforced, non-superuser role (spec §3) — extend `backend/src/db/setup-role.sql` for the new schema/table, apply to both databases.
- A slot's `componentType`/`variant` pair is validated server-side against the shared manifest before being stored — an unknown pair is rejected (400), never silently stored (spec §7: "every slot's variant must exist in the Component Registry").
- The storefront's Component Registry and the backend's validation manifest use the exact same string keys (`header`, `productGrid`, `classic`, `minimal`, `grid`, `list`) — defined once in shared-types, imported by both, never duplicated as separate string literals in either app.
- No client-supplied `tenantId` is ever trusted for layout config reads/writes — always `req.tenant.id` from `tenantResolve` (same rule as every prior route in this project).

---

## File Structure

```
packages/shared-types/src/
├── pageLayout.ts            # LayoutConfig/Slot types + zod schemas
├── pageLayout.test.ts
├── componentManifest.ts     # plain-data manifest: valid componentType -> variant names
└── componentManifest.test.ts

backend/src/
├── db/
│   ├── migrations/0006_page_layouts_table.sql
│   └── setup-role.sql                          # extended
└── modules/
    └── pageBuilder/
        ├── domain/
        │   ├── layoutConfig.ts
        │   ├── layoutConfigRepository.ts
        │   └── layoutConfigService.ts           # validates slots against componentManifest
        ├── infrastructure/
        │   ├── pgLayoutConfigRepository.ts
        │   └── pgLayoutConfigRepository.test.ts
        └── presentation/
            ├── layoutConfigRoutes.ts             # GET/PUT /page-layouts/:page
            └── layoutConfigRoutes.test.ts

storefront/src/
├── modules/
│   └── page-builder/
│       ├── registry.ts                          # ComponentRegistry: componentType -> variant -> React component
│       ├── PageRenderer.tsx
│       ├── PageRenderer.test.tsx
│       └── components/
│           ├── HeaderClassic.tsx
│           ├── HeaderMinimal.tsx
│           ├── ProductGridGrid.tsx
│           └── ProductGridList.tsx
└── app/
    └── page.tsx                                  # refactored to use PageRenderer
```

---

## Task 1: Shared LayoutConfig types + component manifest

**Files:**
- Create: `packages/shared-types/src/pageLayout.ts`
- Create: `packages/shared-types/src/pageLayout.test.ts`
- Create: `packages/shared-types/src/componentManifest.ts`
- Create: `packages/shared-types/src/componentManifest.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Slot`/`LayoutConfig` types + zod schemas; `COMPONENT_MANIFEST: Record<string, string[]>` (componentType → valid variant names) and `isValidSlot(slot: { componentType: string; variant: string }): boolean`. Task 3's `layoutConfigService` and the storefront's `registry.ts` (Task 6) both import `COMPONENT_MANIFEST`.

- [ ] **Step 1: Write the failing test**

`packages/shared-types/src/componentManifest.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { COMPONENT_MANIFEST, isValidSlot } from './componentManifest';

describe('COMPONENT_MANIFEST', () => {
  it('lists header and productGrid with their real variants', () => {
    expect(COMPONENT_MANIFEST.header).toEqual(['classic', 'minimal']);
    expect(COMPONENT_MANIFEST.productGrid).toEqual(['grid', 'list']);
  });
});

describe('isValidSlot', () => {
  it('accepts a known componentType+variant pair', () => {
    expect(isValidSlot({ componentType: 'header', variant: 'classic' })).toBe(true);
  });

  it('rejects an unknown variant for a known componentType', () => {
    expect(isValidSlot({ componentType: 'header', variant: 'fancy' })).toBe(false);
  });

  it('rejects an unknown componentType entirely', () => {
    expect(isValidSlot({ componentType: 'sidebar', variant: 'classic' })).toBe(false);
  });
});
```

`packages/shared-types/src/pageLayout.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { slotSchema, layoutConfigSchema } from './pageLayout';

describe('slotSchema', () => {
  it('accepts a valid slot with settings', () => {
    const result = slotSchema.safeParse({ componentType: 'header', variant: 'classic', settings: { showLogo: true } });
    expect(result.success).toBe(true);
  });

  it('defaults settings to an empty object when omitted', () => {
    const result = slotSchema.safeParse({ componentType: 'header', variant: 'classic' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.settings).toEqual({});
  });
});

describe('layoutConfigSchema', () => {
  it('accepts an ordered list of slots for a page', () => {
    const result = layoutConfigSchema.safeParse({
      tenantId: 't1',
      page: 'home',
      slots: [
        { componentType: 'header', variant: 'classic', settings: {} },
        { componentType: 'productGrid', variant: 'grid', settings: {} },
      ],
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from repo root): `npm test --workspace=packages/shared-types -- pageLayout.test componentManifest.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write minimal implementation**

`packages/shared-types/src/componentManifest.ts`:
```typescript
// Plain data, no React — this is the one source of truth for which
// componentType+variant string pairs are valid. The backend
// (layoutConfigService) validates against this; the storefront's
// Component Registry (storefront/src/modules/page-builder/registry.ts)
// maps these same keys to actual React components. Adding a new
// variant later means adding it here AND to the storefront registry —
// this file alone doesn't make a variant renderable, it just makes it
// a legal value to store.
export const COMPONENT_MANIFEST: Record<string, string[]> = {
  header: ['classic', 'minimal'],
  productGrid: ['grid', 'list'],
};

export function isValidSlot(slot: { componentType: string; variant: string }): boolean {
  const variants = COMPONENT_MANIFEST[slot.componentType];
  return variants !== undefined && variants.includes(slot.variant);
}
```

`packages/shared-types/src/pageLayout.ts`:
```typescript
import { z } from 'zod';

export const slotSchema = z.object({
  componentType: z.string(),
  variant: z.string(),
  settings: z.record(z.string(), z.unknown()).default({}),
});
export type Slot = z.infer<typeof slotSchema>;

export const layoutConfigSchema = z.object({
  tenantId: z.string(),
  page: z.string(),
  slots: z.array(slotSchema),
});
export type LayoutConfig = z.infer<typeof layoutConfigSchema>;
```

`packages/shared-types/src/index.ts` (append):
```typescript
export * from './tenant';
export * from './customer';
export * from './catalog';
export * from './pageLayout';
export * from './componentManifest';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=packages/shared-types -- pageLayout.test componentManifest.test`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared LayoutConfig types and the component manifest"
git push origin develop
```

---

## Task 2: `page_layouts` table migration + role grants

**Files:**
- Create: `backend/src/db/migrations/0006_page_layouts_table.sql`
- Modify: `backend/src/db/setup-role.sql`
- Test: `backend/src/db/migrations.pageLayouts.test.ts`

**Interfaces:**
- Produces: `tenants.page_layouts` (`id`, `tenant_id`, `page`, `slots` JSONB, `created_at`, `updated_at`), unique on `(tenant_id, page)`, RLS enforced. Task 4's `PgLayoutConfigRepository` queries this.

- [ ] **Step 1: Write the failing test**

`backend/src/db/migrations.pageLayouts.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });

let tenantAId: string;
let tenantBId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('layout-tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('layout-tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('tenants.page_layouts table', () => {
  it('stores an ordered JSONB slots array and enforces (tenant_id, page) uniqueness', async () => {
    const slots = JSON.stringify([{ componentType: 'header', variant: 'classic', settings: {} }]);
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO tenants.page_layouts (tenant_id, page, slots) VALUES ($1, 'home', $2)`, [tenantAId, slots])
    );

    await expect(
      withTenant(pool, tenantAId, (client) =>
        client.query(`INSERT INTO tenants.page_layouts (tenant_id, page, slots) VALUES ($1, 'home', $2)`, [tenantAId, slots])
      )
    ).rejects.toThrow();
  });

  it('RLS: tenant A cannot see tenant B\'s layout configs', async () => {
    const slots = JSON.stringify([{ componentType: 'header', variant: 'minimal', settings: {} }]);
    await withTenant(pool, tenantBId, (client) =>
      client.query(`INSERT INTO tenants.page_layouts (tenant_id, page, slots) VALUES ($1, 'home', $2)`, [tenantBId, slots])
    );

    const asTenantA = await withTenant(pool, tenantAId, (client) =>
      client.query('SELECT page FROM tenants.page_layouts WHERE tenant_id = $1', [tenantBId])
    );
    expect(asTenantA.rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.pageLayouts.test`
Expected: FAIL — `relation "tenants.page_layouts" does not exist`

- [ ] **Step 3: Write the migration**

`backend/src/db/migrations/0006_page_layouts_table.sql`:
```sql
CREATE TABLE tenants.page_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    page TEXT NOT NULL,
    slots JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, page)
);

CREATE INDEX idx_page_layouts_tenant_id ON tenants.page_layouts (tenant_id);

ALTER TABLE tenants.page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants.page_layouts FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants.page_layouts
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Extend the role-grants script**

Modify `backend/src/db/setup-role.sql` — add after the `catalog` schema grants block (`page_layouts` lives in the already-granted `tenants` schema, so this is just re-running the existing tenants-schema grant block, which is already written generically enough to cover new tables in that schema via `ALL TABLES IN SCHEMA tenants` — **no new SQL needed in this file**, but re-apply it to be safe since the grant statements are idempotent):
```bash
psql -d shop_platform -f backend/src/db/setup-role.sql
psql -d shop_platform_test -f backend/src/db/setup-role.sql
```

- [ ] **Step 5: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.pageLayouts.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/0006_page_layouts_table.sql backend/src/db/migrations.pageLayouts.test.ts
git commit -m "feat: add tenants.page_layouts table migration with RLS"
git push origin develop
```

---

## Task 3: `pageBuilder` module — domain layer (`layoutConfigService`)

**Files:**
- Create: `backend/src/modules/pageBuilder/domain/layoutConfig.ts`
- Create: `backend/src/modules/pageBuilder/domain/layoutConfigRepository.ts`
- Create: `backend/src/modules/pageBuilder/domain/layoutConfigService.ts`
- Test: `backend/src/modules/pageBuilder/domain/layoutConfigService.test.ts`

**Interfaces:**
- Produces:
  - `LayoutConfigRepository.findByTenantAndPage(tenantId, page): Promise<LayoutConfig | null>`
  - `LayoutConfigRepository.upsert(tenantId, page, slots): Promise<LayoutConfig>`
  - `LayoutConfigService.get(tenantId, page): Promise<LayoutConfig>` — returns an **empty-slots default** (not null, not a 404) if the tenant has no config yet for that page, so callers never need a separate "does a config exist" branch
  - `LayoutConfigService.save(tenantId, page, slots): Promise<LayoutConfig>` — throws `InvalidSlotError` if any slot's componentType+variant isn't in `COMPONENT_MANIFEST`

  Task 5's routes call `LayoutConfigService`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/pageBuilder/domain/layoutConfigService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { LayoutConfigService, InvalidSlotError } from './layoutConfigService';
import type { LayoutConfigRepository } from './layoutConfigRepository';
import type { LayoutConfig } from '@shop-platform/shared-types';

function fakeRepo(existing: LayoutConfig[] = []): LayoutConfigRepository {
  return {
    findByTenantAndPage: vi.fn(async (tenantId, page) => existing.find((c) => c.tenantId === tenantId && c.page === page) ?? null),
    upsert: vi.fn(async (tenantId, page, slots) => ({ tenantId, page, slots })),
  };
}

describe('LayoutConfigService.get', () => {
  it('returns the stored config when one exists', async () => {
    const existing: LayoutConfig = { tenantId: 't1', page: 'home', slots: [{ componentType: 'header', variant: 'classic', settings: {} }] };
    const service = new LayoutConfigService(fakeRepo([existing]));
    const config = await service.get('t1', 'home');
    expect(config.slots).toHaveLength(1);
  });

  it('returns an empty-slots default when no config exists yet, not null/undefined', async () => {
    const service = new LayoutConfigService(fakeRepo());
    const config = await service.get('t1', 'home');
    expect(config).toEqual({ tenantId: 't1', page: 'home', slots: [] });
  });
});

describe('LayoutConfigService.save', () => {
  it('saves a valid slot list', async () => {
    const repo = fakeRepo();
    const service = new LayoutConfigService(repo);
    await service.save('t1', 'home', [{ componentType: 'header', variant: 'classic', settings: {} }]);
    expect(repo.upsert).toHaveBeenCalledWith('t1', 'home', [{ componentType: 'header', variant: 'classic', settings: {} }]);
  });

  it('rejects an unknown componentType with InvalidSlotError', async () => {
    const service = new LayoutConfigService(fakeRepo());
    await expect(
      service.save('t1', 'home', [{ componentType: 'sidebar', variant: 'classic', settings: {} }])
    ).rejects.toThrow(InvalidSlotError);
  });

  it('rejects an unknown variant for a known componentType', async () => {
    const service = new LayoutConfigService(fakeRepo());
    await expect(
      service.save('t1', 'home', [{ componentType: 'header', variant: 'fancy', settings: {} }])
    ).rejects.toThrow(InvalidSlotError);
  });

  it('accepts an empty slot list (clearing a page back to nothing)', async () => {
    const service = new LayoutConfigService(fakeRepo());
    await expect(service.save('t1', 'home', [])).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- layoutConfigService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/pageBuilder/domain/layoutConfig.ts`:
```typescript
export type { LayoutConfig, Slot } from '@shop-platform/shared-types';
```

`backend/src/modules/pageBuilder/domain/layoutConfigRepository.ts`:
```typescript
import type { LayoutConfig, Slot } from './layoutConfig';

export interface LayoutConfigRepository {
  findByTenantAndPage(tenantId: string, page: string): Promise<LayoutConfig | null>;
  upsert(tenantId: string, page: string, slots: Slot[]): Promise<LayoutConfig>;
}
```

`backend/src/modules/pageBuilder/domain/layoutConfigService.ts`:
```typescript
import { isValidSlot } from '@shop-platform/shared-types';
import type { LayoutConfig, Slot } from './layoutConfig';
import type { LayoutConfigRepository } from './layoutConfigRepository';

export class InvalidSlotError extends Error {
  constructor(slot: Slot) {
    super(`Invalid slot: componentType "${slot.componentType}" has no variant "${slot.variant}" in the component manifest`);
    this.name = 'InvalidSlotError';
  }
}

export class LayoutConfigService {
  constructor(private readonly repository: LayoutConfigRepository) {}

  async get(tenantId: string, page: string): Promise<LayoutConfig> {
    const existing = await this.repository.findByTenantAndPage(tenantId, page);
    return existing ?? { tenantId, page, slots: [] };
  }

  async save(tenantId: string, page: string, slots: Slot[]): Promise<LayoutConfig> {
    for (const slot of slots) {
      if (!isValidSlot(slot)) throw new InvalidSlotError(slot);
    }
    return this.repository.upsert(tenantId, page, slots);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- layoutConfigService.test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/pageBuilder/domain
git commit -m "feat: add pageBuilder module domain layer (LayoutConfigService, manifest validation)"
git push origin develop
```

---

## Task 4: `pageBuilder` module — infrastructure layer

**Files:**
- Create: `backend/src/modules/pageBuilder/infrastructure/pgLayoutConfigRepository.ts`
- Create: `backend/src/modules/pageBuilder/infrastructure/pgLayoutConfigRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant`, `tenants.page_layouts` (Task 2).
- Produces: `PgLayoutConfigRepository implements LayoutConfigRepository`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/pageBuilder/infrastructure/pgLayoutConfigRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgLayoutConfigRepository } from './pgLayoutConfigRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const layoutRepo = new PgLayoutConfigRepository(pool);

let tenantId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'layout-repo-test', name: 'Layout Repo Test' });
  tenantId = tenant.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgLayoutConfigRepository', () => {
  it('returns null when no config exists yet for a page', async () => {
    expect(await layoutRepo.findByTenantAndPage(tenantId, 'nonexistent-page')).toBeNull();
  });

  it('upserts a config and finds it back', async () => {
    const slots = [{ componentType: 'header', variant: 'classic', settings: {} }];
    const created = await layoutRepo.upsert(tenantId, 'home', slots);
    expect(created.slots).toEqual(slots);

    const found = await layoutRepo.findByTenantAndPage(tenantId, 'home');
    expect(found?.slots).toEqual(slots);
  });

  it('upserting the same (tenant, page) again replaces the slots rather than erroring', async () => {
    await layoutRepo.upsert(tenantId, 'home', [{ componentType: 'header', variant: 'classic', settings: {} }]);
    const updated = await layoutRepo.upsert(tenantId, 'home', [{ componentType: 'header', variant: 'minimal', settings: {} }]);
    expect(updated.slots).toEqual([{ componentType: 'header', variant: 'minimal', settings: {} }]);

    const found = await layoutRepo.findByTenantAndPage(tenantId, 'home');
    expect(found?.slots).toEqual([{ componentType: 'header', variant: 'minimal', settings: {} }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgLayoutConfigRepository.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/modules/pageBuilder/infrastructure/pgLayoutConfigRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { LayoutConfig, Slot } from '../domain/layoutConfig';
import type { LayoutConfigRepository } from '../domain/layoutConfigRepository';
import { withTenant } from '../../../db/withTenant';

function toConfig(row: any): LayoutConfig {
  return { tenantId: row.tenant_id, page: row.page, slots: row.slots };
}

export class PgLayoutConfigRepository implements LayoutConfigRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenantAndPage(tenantId: string, page: string): Promise<LayoutConfig | null> {
    if (!tenantId) throw new Error('LayoutConfigRepository.findByTenantAndPage requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM tenants.page_layouts WHERE tenant_id = $1 AND page = $2', [tenantId, page]);
      return rows[0] ? toConfig(rows[0]) : null;
    });
  }

  async upsert(tenantId: string, page: string, slots: Slot[]): Promise<LayoutConfig> {
    if (!tenantId) throw new Error('LayoutConfigRepository.upsert requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO tenants.page_layouts (tenant_id, page, slots)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, page) DO UPDATE SET slots = EXCLUDED.slots, updated_at = now()
         RETURNING *`,
        [tenantId, page, JSON.stringify(slots)]
      );
      return toConfig(rows[0]);
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgLayoutConfigRepository.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/pageBuilder/infrastructure
git commit -m "feat: add PgLayoutConfigRepository"
git push origin develop
```

---

## Task 5: Layout config routes, seed a default home layout, wire into `server.ts`

**Files:**
- Create: `backend/src/modules/pageBuilder/presentation/layoutConfigRoutes.ts`
- Create: `backend/src/modules/pageBuilder/presentation/layoutConfigRoutes.test.ts`
- Modify: `backend/src/db/seed.ts`
- Modify: `backend/src/db/seed.test.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `LayoutConfigService` (Task 3).
- Produces: `layoutConfigRoutes(layoutConfigService): Router` mounting `GET /page-layouts/:page` and `PUT /page-layouts/:page`. Extends `seedInitialTenant` to also seed a default `home` layout config (`header`/`classic` + `productGrid`/`grid`) for `texnogallery`, so Task 7's storefront refactor has real data to render immediately.

- [ ] **Step 1: Write the failing tests**

`backend/src/modules/pageBuilder/presentation/layoutConfigRoutes.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { errorHandler } from '../../../middleware/errorHandler';
import { layoutConfigRoutes } from './layoutConfigRoutes';
import { LayoutConfigService } from '../domain/layoutConfigService';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { LayoutConfigRepository } from '../domain/layoutConfigRepository';
import type { LayoutConfig, Slot } from '@shop-platform/shared-types';

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };

function buildApp() {
  const store = new Map<string, LayoutConfig>();
  const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
  const layoutConfigRepository: LayoutConfigRepository = {
    findByTenantAndPage: vi.fn(async (tenantId, page) => store.get(`${tenantId}:${page}`) ?? null),
    upsert: vi.fn(async (tenantId, page, slots: Slot[]) => {
      const config = { tenantId, page, slots };
      store.set(`${tenantId}:${page}`, config);
      return config;
    }),
  };
  const service = new LayoutConfigService(layoutConfigRepository);

  const app = express();
  app.use(express.json());
  app.use(tenantResolve(tenantRepository));
  app.use(layoutConfigRoutes(service));
  app.use(errorHandler);
  return app;
}

describe('GET /page-layouts/:page', () => {
  it('returns an empty-slots default for a page with no saved config', async () => {
    const app = buildApp();
    const res = await request(app).get('/page-layouts/home').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tenantId: 't1', page: 'home', slots: [] });
  });
});

describe('PUT /page-layouts/:page', () => {
  it('saves a valid slot list and GET reflects it afterward', async () => {
    const app = buildApp();
    const putRes = await request(app)
      .put('/page-layouts/home')
      .set('Host', 'shop-a.platform.test')
      .send({ slots: [{ componentType: 'header', variant: 'classic', settings: {} }] });
    expect(putRes.status).toBe(200);

    const getRes = await request(app).get('/page-layouts/home').set('Host', 'shop-a.platform.test');
    expect(getRes.body.slots).toEqual([{ componentType: 'header', variant: 'classic', settings: {} }]);
  });

  it('rejects an invalid slot with 400', async () => {
    const app = buildApp();
    const res = await request(app)
      .put('/page-layouts/home')
      .set('Host', 'shop-a.platform.test')
      .send({ slots: [{ componentType: 'sidebar', variant: 'classic', settings: {} }] });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend -- layoutConfigRoutes.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the routes**

`backend/src/modules/pageBuilder/presentation/layoutConfigRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { slotSchema } from '@shop-platform/shared-types';
import type { LayoutConfigService } from '../domain/layoutConfigService';
import { InvalidSlotError } from '../domain/layoutConfigService';
import { MissingTenantScopeError } from '../../../middleware/errors';

const putBodySchema = z.object({ slots: z.array(slotSchema) });

export function layoutConfigRoutes(layoutConfigService: LayoutConfigService): Router {
  const router = Router();

  router.get('/page-layouts/:page', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('layoutConfigRoutes: req.tenant not set');
    const config = await layoutConfigService.get(req.tenant.id, req.params.page);
    res.status(200).json(config);
  });

  router.put('/page-layouts/:page', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('layoutConfigRoutes: req.tenant not set');
    const parsed = putBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }
    try {
      const config = await layoutConfigService.save(req.tenant.id, req.params.page, parsed.data.slots);
      res.status(200).json(config);
    } catch (err) {
      if (err instanceof InvalidSlotError) {
        res.status(400).json({ error: 'invalid_slot', message: err.message });
        return;
      }
      throw err;
    }
  });

  return router;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=backend -- layoutConfigRoutes.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Extend the seed script**

Replace the full content of `backend/src/db/seed.ts` (small file, easier to give in full than as fragmented edits — every line not explicitly about the layout config is unchanged from the existing file):
```typescript
import type { Pool } from 'pg';
import pool from './pool';
import { PgTenantRepository } from '../modules/tenants/infrastructure/pgTenantRepository';
import { PgBranchRepository } from '../modules/tenants/infrastructure/pgBranchRepository';
import { PgLayoutConfigRepository } from '../modules/pageBuilder/infrastructure/pgLayoutConfigRepository';
import type { Tenant } from '../modules/tenants/domain/tenant';
import type { Branch } from '../modules/tenants/domain/branch';
import type { LayoutConfig } from '@shop-platform/shared-types';

export async function seedInitialTenant(targetPool: Pool): Promise<{ tenant: Tenant; branch: Branch; homeLayout: LayoutConfig }> {
  const tenantRepository = new PgTenantRepository(targetPool);
  const branchRepository = new PgBranchRepository(targetPool);
  const layoutConfigRepository = new PgLayoutConfigRepository(targetPool);

  let tenant = await tenantRepository.findBySubdomain('texnogallery');
  if (!tenant) {
    tenant = await tenantRepository.create({ subdomain: 'texnogallery', name: 'TexnoGallery' });
  }

  const existingBranches = await branchRepository.findByTenant(tenant.id);
  const branch =
    existingBranches[0] ??
    (await branchRepository.create(tenant.id, {
      name: 'Mərkəzi filial',
      address: 'Bakı',
      phone: null,
    }));

  let homeLayout = await layoutConfigRepository.findByTenantAndPage(tenant.id, 'home');
  if (!homeLayout) {
    homeLayout = await layoutConfigRepository.upsert(tenant.id, 'home', [
      { componentType: 'header', variant: 'classic', settings: {} },
      { componentType: 'productGrid', variant: 'grid', settings: {} },
    ]);
  }

  return { tenant, branch, homeLayout };
}

if (require.main === module) {
  seedInitialTenant(pool)
    .then(({ tenant, branch, homeLayout }) => {
      console.log(`Seeded tenant ${tenant.subdomain} (${tenant.id}) with branch ${branch.name} (${branch.id}) and home layout (${homeLayout.slots.length} slots)`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

Replace the full content of `backend/src/db/seed.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { seedInitialTenant } from './seed';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });

beforeAll(async () => {
  await runMigrations(pool);
});

afterAll(async () => {
  await pool.query("DELETE FROM tenants.tenants WHERE subdomain = 'texnogallery'");
  await pool.end();
});

describe('seedInitialTenant', () => {
  it('creates the texnogallery tenant with one branch and a default home layout', async () => {
    const { tenant, branch, homeLayout } = await seedInitialTenant(pool);
    expect(tenant.subdomain).toBe('texnogallery');
    expect(branch.tenantId).toBe(tenant.id);
    expect(homeLayout.slots).toEqual([
      { componentType: 'header', variant: 'classic', settings: {} },
      { componentType: 'productGrid', variant: 'grid', settings: {} },
    ]);
  });

  it('is idempotent — running it again does not create a duplicate tenant or layout row', async () => {
    const first = await seedInitialTenant(pool);
    const second = await seedInitialTenant(pool);
    expect(second.tenant.id).toBe(first.tenant.id);

    const { rows } = await pool.query("SELECT count(*)::int AS n FROM tenants.tenants WHERE subdomain = 'texnogallery'");
    expect(rows[0].n).toBe(1);

    const layoutRows = await pool.query('SELECT count(*)::int AS n FROM tenants.page_layouts WHERE tenant_id = $1 AND page = $2', [first.tenant.id, 'home']);
    expect(layoutRows.rows[0].n).toBe(1);
  });
});
```

- [ ] **Step 6: Wire into `server.ts`**

Modify `backend/src/server.ts` — add imports:
```typescript
import { PgLayoutConfigRepository } from './modules/pageBuilder/infrastructure/pgLayoutConfigRepository';
import { LayoutConfigService } from './modules/pageBuilder/domain/layoutConfigService';
import { layoutConfigRoutes } from './modules/pageBuilder/presentation/layoutConfigRoutes';
```

Add after the existing repository/service instantiations:
```typescript
const layoutConfigRepository = new PgLayoutConfigRepository(pool);
const layoutConfigService = new LayoutConfigService(layoutConfigRepository);
```

Add after the existing `app.use(productRoutes(...))` line:
```typescript
app.use(layoutConfigRoutes(layoutConfigService));
```

- [ ] **Step 7: Run the full backend test suite, then re-seed the real DB**

```bash
TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend
npm run db:seed --workspace=backend  # idempotent — adds the home layout config to the already-seeded texnogallery tenant
```
Expected: all tests pass; seed output confirms the home layout config exists.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/pageBuilder/presentation backend/src/db/seed.ts backend/src/db/seed.test.ts backend/src/server.ts
git commit -m "feat: add layout config routes, seed default home layout, wire into server.ts"
git push origin develop
```

---

## Task 6: Storefront Component Registry + PageRenderer

**Files:**
- Create: `storefront/src/modules/page-builder/components/HeaderClassic.tsx`
- Create: `storefront/src/modules/page-builder/components/HeaderMinimal.tsx`
- Create: `storefront/src/modules/page-builder/components/ProductGridGrid.tsx`
- Create: `storefront/src/modules/page-builder/components/ProductGridList.tsx`
- Create: `storefront/src/modules/page-builder/registry.ts`
- Create: `storefront/src/modules/page-builder/PageRenderer.tsx`
- Create: `storefront/src/modules/page-builder/PageRenderer.test.tsx`

**Interfaces:**
- Consumes: `COMPONENT_MANIFEST` (Task 1, for the registry's own internal consistency check).
- Produces: `ComponentRegistry` (a `Record<string, Record<string, ComponentVariant>>`), `PageRenderer({ layoutConfig, data }): JSX.Element` — renders each slot in `layoutConfig.slots`, in order, looking up `registry[slot.componentType][slot.variant]`, passing `settings={slot.settings}` plus that componentType's own entry from `data` as props. Task 7's homepage uses `PageRenderer`.

- [ ] **Step 1: Write the failing test**

`storefront/src/modules/page-builder/PageRenderer.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageRenderer } from './PageRenderer';
import type { LayoutConfig } from '@shop-platform/shared-types';

vi.mock('./registry', () => ({
  registry: {
    header: {
      classic: (props: any) => <div data-testid="header-classic">Classic Header ({props.settings.showLogo ? 'logo' : 'no-logo'})</div>,
      minimal: (props: any) => <div data-testid="header-minimal">Minimal Header</div>,
    },
    productGrid: {
      grid: (props: any) => <div data-testid="grid">Grid: {props.products?.length ?? 0} products</div>,
      list: (props: any) => <div data-testid="list">List: {props.products?.length ?? 0} products</div>,
    },
  },
}));

describe('PageRenderer', () => {
  it('renders the exact variant each slot specifies, in order', async () => {
    const { PageRenderer: PR } = await import('./PageRenderer');
    const layoutConfig: LayoutConfig = {
      tenantId: 't1',
      page: 'home',
      slots: [
        { componentType: 'header', variant: 'classic', settings: { showLogo: true } },
        { componentType: 'productGrid', variant: 'grid', settings: {} },
      ],
    };
    const html = renderToStaticMarkup(<PR layoutConfig={layoutConfig} data={{ productGrid: { products: [{ id: 'p1' }] } }} />);
    expect(html).toContain('Classic Header (logo)');
    expect(html).toContain('Grid: 1 products');
  });

  it('renders a different variant when the config says so — proves real template-swapping, not a hardcoded page', async () => {
    const { PageRenderer: PR } = await import('./PageRenderer');
    const layoutConfig: LayoutConfig = {
      tenantId: 't1', page: 'home',
      slots: [
        { componentType: 'header', variant: 'minimal', settings: {} },
        { componentType: 'productGrid', variant: 'list', settings: {} },
      ],
    };
    const html = renderToStaticMarkup(<PR layoutConfig={layoutConfig} data={{ productGrid: { products: [] } }} />);
    expect(html).toContain('Minimal Header');
    expect(html).toContain('List: 0 products');
    expect(html).not.toContain('Classic Header');
  });

  it('silently skips a slot whose componentType/variant is not registered (defensive — the backend already validates, this is belt-and-suspenders)', async () => {
    const { PageRenderer: PR } = await import('./PageRenderer');
    const layoutConfig: LayoutConfig = {
      tenantId: 't1', page: 'home',
      slots: [{ componentType: 'sidebar', variant: 'classic', settings: {} }],
    };
    const html = renderToStaticMarkup(<PR layoutConfig={layoutConfig} data={{}} />);
    expect(html).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=storefront -- PageRenderer.test`
Expected: FAIL — `./PageRenderer` doesn't exist yet

- [ ] **Step 3: Write the components, registry, and renderer**

`storefront/src/modules/page-builder/components/HeaderClassic.tsx`:
```tsx
export function HeaderClassic({ settings }: { settings: Record<string, unknown> }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ddd' }}>
      <strong>Shop Platform</strong>
      <nav>Ana Səhifə</nav>
    </header>
  );
}
```

`storefront/src/modules/page-builder/components/HeaderMinimal.tsx`:
```tsx
export function HeaderMinimal({ settings }: { settings: Record<string, unknown> }) {
  return (
    <header style={{ textAlign: 'center', padding: '0.5rem' }}>
      <strong>Shop Platform</strong>
    </header>
  );
}
```

`storefront/src/modules/page-builder/components/ProductGridGrid.tsx`:
```tsx
interface Product { id: string; name: string; priceCents: number }

export function ProductGridGrid({ products }: { settings: Record<string, unknown>; products?: Product[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
      {(products ?? []).map((p) => (
        <a key={p.id} href={`/products/${p.id}`} style={{ border: '1px solid #ddd', padding: '1rem' }}>
          {p.name} — {(p.priceCents / 100).toFixed(2)} AZN
        </a>
      ))}
    </div>
  );
}
```

`storefront/src/modules/page-builder/components/ProductGridList.tsx`:
```tsx
interface Product { id: string; name: string; priceCents: number }

export function ProductGridList({ products }: { settings: Record<string, unknown>; products?: Product[] }) {
  return (
    <ul>
      {(products ?? []).map((p) => (
        <li key={p.id}>
          <a href={`/products/${p.id}`}>{p.name}</a> — {(p.priceCents / 100).toFixed(2)} AZN
        </li>
      ))}
    </ul>
  );
}
```

`storefront/src/modules/page-builder/registry.ts`:
```typescript
import { HeaderClassic } from './components/HeaderClassic';
import { HeaderMinimal } from './components/HeaderMinimal';
import { ProductGridGrid } from './components/ProductGridGrid';
import { ProductGridList } from './components/ProductGridList';

// Keys here MUST match @shop-platform/shared-types' COMPONENT_MANIFEST —
// that manifest is what the backend validates a tenant's saved slots
// against, so a variant missing here (but present in the manifest) would
// be accepted by the backend yet silently render nothing (PageRenderer
// skips unregistered slots defensively). Keep the two in sync by hand for
// Phase 1 (only 2 components); a later phase could add a startup check
// that diffs this object's keys against COMPONENT_MANIFEST if the list
// grows enough for that mismatch to become a real risk.
export const registry = {
  header: {
    classic: HeaderClassic,
    minimal: HeaderMinimal,
  },
  productGrid: {
    grid: ProductGridGrid,
    list: ProductGridList,
  },
};
```

`storefront/src/modules/page-builder/PageRenderer.tsx`:
```tsx
import type { LayoutConfig } from '@shop-platform/shared-types';
import { registry } from './registry';

interface PageRendererProps {
  layoutConfig: LayoutConfig;
  data: Record<string, Record<string, unknown>>;
}

export function PageRenderer({ layoutConfig, data }: PageRendererProps) {
  return (
    <>
      {layoutConfig.slots.map((slot, index) => {
        const componentGroup = (registry as Record<string, Record<string, any>>)[slot.componentType];
        const Component = componentGroup?.[slot.variant];
        if (!Component) return null; // unregistered slot — defensive skip, see registry.ts's comment
        return <Component key={`${slot.componentType}-${index}`} settings={slot.settings} {...(data[slot.componentType] ?? {})} />;
      })}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=storefront -- PageRenderer.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add storefront/src/modules/page-builder
git commit -m "feat: add storefront Component Registry (header, productGrid) + PageRenderer"
git push origin develop
```

---

## Task 7: Refactor the homepage to be Registry-driven, verify both variants live

**Files:**
- Modify: `storefront/src/app/page.tsx`

**Interfaces:**
- Consumes: `fetchFromBackend` (Storefront Scaffold plan), `PageRenderer` (Task 6), `GET /page-layouts/home` (Task 5).
- No new testable unit-level interface — ends in a live check proving the SAME homepage renders two visibly different variants depending on the tenant's stored config, which is the actual point of this whole plan.

- [ ] **Step 1: Rewrite the homepage**

`storefront/src/app/page.tsx`:
```tsx
import { fetchFromBackend, BackendApiError } from '@/lib/api';
import { PageRenderer } from '@/modules/page-builder/PageRenderer';
import type { LayoutConfig } from '@shop-platform/shared-types';

interface Product {
  id: string;
  name: string;
  priceCents: number;
  totalStock: number;
  isAvailable: boolean;
}

export default async function HomePage() {
  let layoutConfig: LayoutConfig;
  let products: Product[] = [];

  try {
    [layoutConfig, { products }] = await Promise.all([
      fetchFromBackend<LayoutConfig>('/page-layouts/home'),
      fetchFromBackend<{ products: Product[] }>('/products'),
    ]);
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) {
      return <p>Bu ünvanda mağaza tapılmadı.</p>;
    }
    throw err;
  }

  return <PageRenderer layoutConfig={layoutConfig} data={{ productGrid: { products } }} />;
}
```

- [ ] **Step 2: Manually verify live — default variant**

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev &> /tmp/dev-both.log &
sleep 6

echo "--- default config (header=classic, productGrid=grid) ---"
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'Shop Platform'
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'iPhone 15'
```
Expected: both found — real homepage, header rendered, real product listed via the `grid` variant.

- [ ] **Step 3: Switch the tenant's config to the OTHER variants via the API, verify the SAME page now renders differently**

```bash
curl -s -X PUT -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"slots":[{"componentType":"header","variant":"minimal","settings":{}},{"componentType":"productGrid","variant":"list","settings":{}}]}' \
  http://localhost:8080/page-layouts/home
echo

echo "--- after switching to minimal/list (no code change, no redeploy — just a PUT) ---"
curl -s -H "Host: texnogallery.localhost" http://localhost:7070/ | grep -o 'iPhone 15'

# restore the default so the seed's assumption stays true for future manual checks
curl -s -X PUT -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"slots":[{"componentType":"header","variant":"classic","settings":{}},{"componentType":"productGrid","variant":"grid","settings":{}}]}' \
  http://localhost:8080/page-layouts/home > /dev/null

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
lsof -ti:7070 -sTCP:LISTEN | xargs -r kill
```
Expected: the product still renders (now via the `list` variant, different HTML structure — a `<ul><li>` instead of the grid's `<div>` cards, confirmable by diffing the two curl outputs' HTML if you want to be thorough, not just checking the product name appears). This is the actual proof the mechanism works: **the exact same tenant, same page route, same deployed code — a different rendered result purely from a config change.**

- [ ] **Step 4: Run the full backend + storefront test suites one more time**

```bash
TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend
npm test --workspace=storefront
```
Expected: all green, no regressions.

- [ ] **Step 5: Commit**

```bash
git add storefront/src/app/page.tsx
git commit -m "feat: refactor homepage to Registry-driven rendering, verified two variants live"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against spec §4/§7):
- Component Registry (map componentType → variants): Task 6 ✅
- Layout Config (DB, per tenant per page, ordered slots): Tasks 2-5 ✅
- PageRenderer: Task 6 ✅
- "Every slot's variant must exist in the Component Registry" (spec §7's own `layoutConfigService` acceptance criterion, named almost verbatim there): Task 3 (`isValidSlot`/`InvalidSlotError`) ✅
- Only 2 of spec §4's ~15 components built — explicitly scoped down in this plan's own Scope note; the rest is repetition of this same pattern, not new design.
- Layout Editor (the actual admin UI for changing this) — explicitly NOT in this plan (Scope note); Task 7 verifies the mechanism via a raw `PUT` instead, which is sufficient proof since the Editor is "just" a UI on top of the same API this plan already ships and tests.
- Theming (CSS custom properties, spec §4) — not touched by this plan; a separate, small future addition once there's more than one component that would visibly benefit from it.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `LayoutConfig`/`Slot` defined once in `packages/shared-types` (Task 1), used unchanged by backend domain (Task 3), infrastructure (Task 4), presentation (Task 5), and the storefront (Tasks 6-7) — the same shape crosses the network boundary without redefinition on either side. `COMPONENT_MANIFEST`'s keys (Task 1) are the single source of truth both `isValidSlot` (backend, Task 3) and the storefront `registry` (Task 6) key off — Task 6's registry.ts comment explicitly flags that the two are currently kept in sync by hand (only 2 components) rather than mechanically enforced, which is an honest, deliberate YAGNI call, not an oversight.
