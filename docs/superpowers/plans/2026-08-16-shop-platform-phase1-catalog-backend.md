# Shop Platform — Phase 1 Catalog Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `catalog` module end-to-end (categories with hierarchy, tags, products, images, per-branch stock) as backend API endpoints, callable via HTTP the same way Foundation's `GET /branches` and Customer Auth's `GET /customers/me` were. Third of the Phase 1 implementation plans, building on [Foundation](2026-08-15-shop-platform-phase1-foundation.md) and [Customer Auth](2026-08-15-shop-platform-phase1-customer-auth.md).

**Scope split note:** The design spec bundles "Catalog & Component System" as one area, but it's really two independent pieces of work — this plan is **catalog data only** (backend). The Component Registry / PageRenderer / Layout Config / Layout Editor / Next.js storefront scaffold is a separate plan (Storefront Scaffold + Component System) that consumes this one's API once it exists, not the other way around.

**Architecture:** Same shape as every prior module: `backend/src/modules/catalog/` with `domain/infrastructure/presentation` Clean Architecture layers, new `catalog.*` tables with the established RLS pattern, `withTenant` for every tenant-scoped query.

**Tech Stack:** No new dependencies — same TypeScript/Express/`pg`/Vitest/Supertest stack as the prior two plans.

## Global Constraints

- Every tenant-owned table has a `tenant_id` column; no query bypasses the repository layer (spec §3).
- `domain/` files never import Express or `pg` directly, only the interfaces they define (spec §7).
- A product's category may itself be a subcategory — one `category_id` field, hierarchy lives in `categories.parent_id`, not on `products` (spec §4).
- Tags are many-to-many with products via a join table (spec §4).
- Stock is a plain quantity per `(product, branch)`, no reservation/locking in Phase 1 (spec §2, §5).
- Out-of-stock display is a tenant-level setting: `hide` (core default) or `coming_soon` (optional) (spec §4's Core-vs-Optional table).
- The app connects as the non-superuser `shop_platform_app` role — extend `backend/src/db/setup-role.sql` for the new `catalog` schema and re-run it against both databases (same pattern as the `customers` schema in the prior plan).
- Repository layer throws (never silently returns unscoped data) if called without a `tenantId` (spec §8).

---

## File Structure

```
backend/src/
├── db/
│   ├── migrations/
│   │   └── 0005_catalog_tables.sql
│   └── setup-role.sql                          # extended: grants for the catalog schema
└── modules/
    └── catalog/
        ├── domain/
        │   ├── category.ts
        │   ├── tag.ts
        │   ├── product.ts
        │   ├── categoryRepository.ts
        │   ├── tagRepository.ts
        │   ├── productRepository.ts
        │   ├── productService.ts               # price formatting, availability (stock + out_of_stock_display)
        │   └── tenantSettingsRepository.ts      # small, catalog-scoped — see Task 5's self-review note
        ├── infrastructure/
        │   ├── pgCategoryRepository.ts
        │   ├── pgCategoryRepository.test.ts
        │   ├── pgTagRepository.ts
        │   ├── pgTagRepository.test.ts
        │   ├── pgProductRepository.ts
        │   ├── pgProductRepository.test.ts
        │   └── pgTenantSettingsRepository.ts
        └── presentation/
            ├── categoryRoutes.ts                # GET /categories (tree)
            ├── categoryRoutes.test.ts
            ├── productRoutes.ts                 # GET /products (filters), GET /products/:id
            └── productRoutes.test.ts

packages/shared-types/src/
├── catalog.ts                                   # Category/Tag/Product types
└── catalog.test.ts
```

---

## Task 1: Shared Catalog types

**Files:**
- Create: `packages/shared-types/src/catalog.ts`
- Create: `packages/shared-types/src/catalog.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Category`, `Tag`, `Product` types + `categorySchema`/`tagSchema`/`productSchema` zod schemas from `@shop-platform/shared-types`. Later domain files re-export these.

- [ ] **Step 1: Write the failing test**

`packages/shared-types/src/catalog.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { categorySchema, tagSchema, productSchema } from './catalog';

describe('categorySchema', () => {
  it('accepts a top-level category (parentId null)', () => {
    const result = categorySchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111', tenantId: 't1', parentId: null, name: 'Elektronika',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a subcategory (parentId set)', () => {
    const result = categorySchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111', tenantId: 't1', parentId: '22222222-2222-2222-2222-222222222222', name: 'Telefonlar',
    });
    expect(result.success).toBe(true);
  });
});

describe('tagSchema', () => {
  it('accepts a valid tag', () => {
    const result = tagSchema.safeParse({ id: '1', tenantId: 't1', name: 'Yeni' });
    expect(result.success).toBe(true);
  });
});

describe('productSchema', () => {
  it('accepts a valid product with tags/images/stock', () => {
    const result = productSchema.safeParse({
      id: 'p1', tenantId: 't1', categoryId: 'c1', name: 'iPhone 15', description: 'Yeni model',
      priceCents: 250000, tags: [{ id: 't1', tenantId: 'tenant1', name: 'Yeni' }],
      images: [{ id: 'i1', url: 'https://example.com/a.jpg', sortOrder: 0 }],
      totalStock: 5, isAvailable: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative priceCents', () => {
    const result = productSchema.safeParse({
      id: 'p1', tenantId: 't1', categoryId: 'c1', name: 'X', description: null,
      priceCents: -100, tags: [], images: [], totalStock: 0, isAvailable: false,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from repo root): `npm test --workspace=packages/shared-types -- catalog.test`
Expected: FAIL with "Cannot find module './catalog'"

- [ ] **Step 3: Write minimal implementation**

`packages/shared-types/src/catalog.ts`:
```typescript
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  parentId: z.string().nullable(),
  name: z.string().min(1),
});
export type Category = z.infer<typeof categorySchema>;

export const tagSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
});
export type Tag = z.infer<typeof tagSchema>;

export const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  sortOrder: z.number().int(),
});
export type ProductImage = z.infer<typeof productImageSchema>;

export const productSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  priceCents: z.number().int().nonnegative(),
  tags: z.array(tagSchema),
  images: z.array(productImageSchema),
  totalStock: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});
export type Product = z.infer<typeof productSchema>;
```

`packages/shared-types/src/index.ts` (append):
```typescript
export * from './tenant';
export * from './customer';
export * from './catalog';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=packages/shared-types -- catalog.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared Category/Tag/Product types"
git push origin develop
```

---

## Task 2: Catalog schema migration (categories, tags, products, images, stock) + role grants

**Files:**
- Create: `backend/src/db/migrations/0005_catalog_tables.sql`
- Modify: `backend/src/db/setup-role.sql`
- Test: `backend/src/db/migrations.catalog.test.ts`

**Interfaces:**
- Produces: `catalog.categories` (`parent_id` self-ref), `catalog.tags`, `catalog.product_tags` (join), `catalog.products`, `catalog.product_images`, `catalog.product_stock`; plus `tenants.tenants.out_of_stock_display` column (`'hide' | 'coming_soon'`, default `'hide'`). All tenant-owned tables get the same RLS policy as `tenants.branches`/`customers.customers`.

- [ ] **Step 1: Write the failing test**

`backend/src/db/migrations.catalog.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });

let tenantAId: string;
let tenantBId: string;
let branchId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('catalog-tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('catalog-tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;
  const branch = await withTenant(pool, tenantAId, (client) =>
    client.query(`INSERT INTO tenants.branches (tenant_id, name, address) VALUES ($1, 'Main', 'Bakı') RETURNING id`, [tenantAId])
  );
  branchId = branch.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('catalog schema', () => {
  it('tenants.tenants gets an out_of_stock_display column defaulting to hide', async () => {
    const { rows } = await pool.query('SELECT out_of_stock_display FROM tenants.tenants WHERE id = $1', [tenantAId]);
    expect(rows[0].out_of_stock_display).toBe('hide');
  });

  it('supports a category hierarchy (parent_id self-reference)', async () => {
    const parent = await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Elektronika') RETURNING id`, [tenantAId])
    );
    const child = await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, $2, 'Telefonlar') RETURNING id`, [tenantAId, parent.rows[0].id])
    );
    expect(child.rows[0].id).toBeTruthy();
  });

  it('a product can have multiple tags and multiple images, and RLS isolates it from other tenants', async () => {
    const category = await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantAId])
    );
    const product = await withTenant(pool, tenantAId, (client) =>
      client.query(
        `INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'Product A', NULL, 1000) RETURNING id`,
        [tenantAId, category.rows[0].id]
      )
    );
    const tag = await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.tags (tenant_id, name) VALUES ($1, 'Yeni') RETURNING id`, [tenantAId])
    );
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.product_tags (product_id, tag_id) VALUES ($1, $2)`, [product.rows[0].id, tag.rows[0].id])
    );
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.product_images (tenant_id, product_id, url, sort_order) VALUES ($1, $2, 'https://x/a.jpg', 0)`, [tenantAId, product.rows[0].id])
    );
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO catalog.product_stock (tenant_id, product_id, branch_id, quantity) VALUES ($1, $2, $3, 5)`, [tenantAId, product.rows[0].id, branchId])
    );

    const asTenantB = await withTenant(pool, tenantBId, (client) => client.query('SELECT * FROM catalog.products'));
    expect(asTenantB.rows).toEqual([]);

    const tagged = await withTenant(pool, tenantAId, (client) =>
      client.query(
        `SELECT p.name FROM catalog.products p
         JOIN catalog.product_tags pt ON pt.product_id = p.id
         JOIN catalog.tags t ON t.id = pt.tag_id
         WHERE t.name = 'Yeni'`
      )
    );
    expect(tagged.rows.map((r) => r.name)).toEqual(['Product A']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.catalog.test`
Expected: FAIL — `relation "catalog.categories" does not exist`

- [ ] **Step 3: Write the migration**

`backend/src/db/migrations/0005_catalog_tables.sql`:
```sql
ALTER TABLE tenants.tenants
    ADD COLUMN out_of_stock_display TEXT NOT NULL DEFAULT 'hide'
    CHECK (out_of_stock_display IN ('hide', 'coming_soon'));

CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES catalog.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_tenant_id ON catalog.categories (tenant_id);
CREATE INDEX idx_categories_parent_id ON catalog.categories (parent_id);
ALTER TABLE catalog.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog.categories
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE catalog.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tags_tenant_id ON catalog.tags (tenant_id);
ALTER TABLE catalog.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.tags FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog.tags
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE catalog.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES catalog.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_tenant_id ON catalog.products (tenant_id);
CREATE INDEX idx_products_category_id ON catalog.products (category_id);
ALTER TABLE catalog.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.products FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog.products
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE catalog.product_tags (
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES catalog.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
-- No tenant_id/RLS here by design: product_tags is a pure join table between
-- two already tenant-scoped tables (both FKs enforce the tenant boundary
-- transitively — you can't link a product and a tag from different tenants
-- without first getting past their own RLS to read/insert them).

CREATE TABLE catalog.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_tenant_id ON catalog.product_images (tenant_id);
CREATE INDEX idx_product_images_product_id ON catalog.product_images (product_id);
ALTER TABLE catalog.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.product_images FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog.product_images
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE catalog.product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES tenants.branches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    UNIQUE (product_id, branch_id)
);
CREATE INDEX idx_product_stock_tenant_id ON catalog.product_stock (tenant_id);
CREATE INDEX idx_product_stock_product_id ON catalog.product_stock (product_id);
ALTER TABLE catalog.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.product_stock FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON catalog.product_stock
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Extend the role-grants script**

Modify `backend/src/db/setup-role.sql` — add after the `customers` schema grants block:
```sql
-- catalog schema (added by the Catalog Backend plan)
GRANT USAGE ON SCHEMA catalog TO shop_platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog TO shop_platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_platform_app;
```

Then apply it:
```bash
psql -d shop_platform -f backend/src/db/setup-role.sql
psql -d shop_platform_test -f backend/src/db/setup-role.sql
```

- [ ] **Step 5: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.catalog.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/0005_catalog_tables.sql backend/src/db/setup-role.sql backend/src/db/migrations.catalog.test.ts
git commit -m "feat: add catalog schema migration (categories/tags/products/images/stock) with RLS"
git push origin develop
```

---

## Task 3: `catalog` module — domain layer (`productService`)

**Files:**
- Create: `backend/src/modules/catalog/domain/category.ts`
- Create: `backend/src/modules/catalog/domain/tag.ts`
- Create: `backend/src/modules/catalog/domain/product.ts`
- Create: `backend/src/modules/catalog/domain/categoryRepository.ts`
- Create: `backend/src/modules/catalog/domain/tagRepository.ts`
- Create: `backend/src/modules/catalog/domain/productRepository.ts`
- Create: `backend/src/modules/catalog/domain/productService.ts`
- Test: `backend/src/modules/catalog/domain/productService.test.ts`

**Interfaces:**
- Produces:
  - `CategoryRepository.findByTenant(tenantId): Promise<Category[]>`
  - `TagRepository.findByTenant(tenantId): Promise<Tag[]>`
  - `ProductRepository.findByTenant(tenantId, filters: {categoryId?, tagId?, search?}): Promise<ProductRow[]>` — `ProductRow` is the raw joined shape (product + tags + images + per-branch stock rows), not yet formatted
  - `ProductRepository.findById(tenantId, id): Promise<ProductRow | null>`
  - `ProductService.list(tenantId, filters): Promise<Product[]>` — applies price formatting + availability (stock total + tenant's `out_of_stock_display` setting), **filters out unavailable products when the tenant's setting is `hide`**
  - `ProductService.getById(tenantId, id): Promise<Product | null>` — always returns the product regardless of stock (detail pages show it either way; only the *list* hides it)

  Task 5's `PgProductRepository` implements `ProductRepository`/`CategoryRepository`/`TagRepository`. Task 6's routes call `ProductService`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/catalog/domain/productService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { ProductService } from './productService';
import type { ProductRepository, ProductRow } from './productRepository';

function row(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p1', tenantId: 't1', categoryId: 'c1', name: 'Product A', description: null, priceCents: 1000,
    tags: [], images: [], stockByBranch: [{ branchId: 'b1', quantity: 3 }],
    ...overrides,
  };
}

describe('ProductService.list', () => {
  it('marks a product with stock as available', async () => {
    const repo: ProductRepository = {
      findByTenant: vi.fn(async () => [row()]),
      findById: vi.fn(),
    };
    const service = new ProductService(repo);
    const [product] = await service.list('t1', {}, 'hide');
    expect(product.isAvailable).toBe(true);
    expect(product.totalStock).toBe(3);
  });

  it('sums stock across multiple branches', async () => {
    const repo: ProductRepository = {
      findByTenant: vi.fn(async () => [row({ stockByBranch: [{ branchId: 'b1', quantity: 3 }, { branchId: 'b2', quantity: 2 }] })]),
      findById: vi.fn(),
    };
    const service = new ProductService(repo);
    const [product] = await service.list('t1', {}, 'hide');
    expect(product.totalStock).toBe(5);
  });

  it('excludes an out-of-stock product from the list when the tenant setting is "hide"', async () => {
    const repo: ProductRepository = {
      findByTenant: vi.fn(async () => [row({ stockByBranch: [{ branchId: 'b1', quantity: 0 }] })]),
      findById: vi.fn(),
    };
    const service = new ProductService(repo);
    const products = await service.list('t1', {}, 'hide');
    expect(products).toEqual([]);
  });

  it('includes an out-of-stock product, marked unavailable, when the tenant setting is "coming_soon"', async () => {
    const repo: ProductRepository = {
      findByTenant: vi.fn(async () => [row({ stockByBranch: [{ branchId: 'b1', quantity: 0 }] })]),
      findById: vi.fn(),
    };
    const service = new ProductService(repo);
    const products = await service.list('t1', {}, 'coming_soon');
    expect(products).toHaveLength(1);
    expect(products[0].isAvailable).toBe(false);
  });

  it('formats priceCents onto the returned Product unchanged (integer cents, no currency logic yet)', async () => {
    const repo: ProductRepository = { findByTenant: vi.fn(async () => [row({ priceCents: 250000 })]), findById: vi.fn() };
    const service = new ProductService(repo);
    const [product] = await service.list('t1', {}, 'hide');
    expect(product.priceCents).toBe(250000);
  });
});

describe('ProductService.getById', () => {
  it('returns the product even when out of stock (detail pages always show it)', async () => {
    const repo: ProductRepository = {
      findByTenant: vi.fn(),
      findById: vi.fn(async () => row({ stockByBranch: [{ branchId: 'b1', quantity: 0 }] })),
    };
    const service = new ProductService(repo);
    const product = await service.getById('t1', 'p1', 'hide');
    expect(product?.isAvailable).toBe(false);
  });

  it('returns null for an unknown id', async () => {
    const repo: ProductRepository = { findByTenant: vi.fn(), findById: vi.fn(async () => null) };
    const service = new ProductService(repo);
    expect(await service.getById('t1', 'nope', 'hide')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- productService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/catalog/domain/category.ts`:
```typescript
export type { Category } from '@shop-platform/shared-types';
```

`backend/src/modules/catalog/domain/tag.ts`:
```typescript
export type { Tag } from '@shop-platform/shared-types';
```

`backend/src/modules/catalog/domain/product.ts`:
```typescript
export type { Product, ProductImage } from '@shop-platform/shared-types';
```

`backend/src/modules/catalog/domain/categoryRepository.ts`:
```typescript
import type { Category } from './category';

export interface CategoryRepository {
  findByTenant(tenantId: string): Promise<Category[]>;
}
```

`backend/src/modules/catalog/domain/tagRepository.ts`:
```typescript
import type { Tag } from './tag';

export interface TagRepository {
  findByTenant(tenantId: string): Promise<Tag[]>;
}
```

`backend/src/modules/catalog/domain/productRepository.ts`:
```typescript
import type { Tag } from './tag';
import type { ProductImage } from './product';

export interface ProductRow {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  tags: Tag[];
  images: ProductImage[];
  stockByBranch: { branchId: string; quantity: number }[];
}

export interface ProductFilters {
  categoryId?: string;
  tagId?: string;
  search?: string;
}

export interface ProductRepository {
  findByTenant(tenantId: string, filters: ProductFilters): Promise<ProductRow[]>;
  findById(tenantId: string, id: string): Promise<ProductRow | null>;
}
```

`backend/src/modules/catalog/domain/productService.ts`:
```typescript
import type { Product } from './product';
import type { ProductRepository, ProductRow, ProductFilters } from './productRepository';

type OutOfStockDisplay = 'hide' | 'coming_soon';

function toProduct(row: ProductRow): Product {
  const totalStock = row.stockByBranch.reduce((sum, s) => sum + s.quantity, 0);
  return {
    id: row.id,
    tenantId: row.tenantId,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    tags: row.tags,
    images: row.images,
    totalStock,
    isAvailable: totalStock > 0,
  };
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list(tenantId: string, filters: ProductFilters, outOfStockDisplay: OutOfStockDisplay): Promise<Product[]> {
    const rows = await this.repository.findByTenant(tenantId, filters);
    const products = rows.map(toProduct);
    if (outOfStockDisplay === 'hide') {
      return products.filter((p) => p.isAvailable);
    }
    return products;
  }

  async getById(tenantId: string, id: string, _outOfStockDisplay: OutOfStockDisplay): Promise<Product | null> {
    // Detail pages always show the product regardless of stock/display
    // setting — only the list view hides out-of-stock items. The setting
    // param is accepted for symmetry with list() and because a future
    // task may want it (e.g. showing a "Tezliklə" badge only when
    // coming_soon) without changing this method's signature again.
    const row = await this.repository.findById(tenantId, id);
    return row ? toProduct(row) : null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- productService.test`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/catalog/domain
git commit -m "feat: add catalog module domain layer (ProductService availability/list logic)"
git push origin develop
```

---

## Task 4: `catalog` module — infrastructure layer

**Files:**
- Create: `backend/src/modules/catalog/infrastructure/pgCategoryRepository.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgCategoryRepository.test.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgTagRepository.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgTagRepository.test.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgProductRepository.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgProductRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant`, `catalog.*` tables (Task 2).
- Produces: `PgCategoryRepository`, `PgTagRepository`, `PgProductRepository` implementing their respective domain interfaces. Task 6's routes wire these to `ProductService`.

- [ ] **Step 1: Write the failing tests**

`backend/src/modules/catalog/infrastructure/pgCategoryRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgCategoryRepository } from './pgCategoryRepository';
import { withTenant } from '../../../db/withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const categoryRepo = new PgCategoryRepository(pool);

let tenantId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'category-repo-test', name: 'Category Repo Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, (client) =>
    client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Elektronika')`, [tenantId])
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgCategoryRepository', () => {
  it('finds all categories for a tenant', async () => {
    const categories = await categoryRepo.findByTenant(tenantId);
    expect(categories.map((c) => c.name)).toEqual(['Elektronika']);
  });
});
```

`backend/src/modules/catalog/infrastructure/pgTagRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgTagRepository } from './pgTagRepository';
import { withTenant } from '../../../db/withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const tagRepo = new PgTagRepository(pool);

let tenantId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'tag-repo-test', name: 'Tag Repo Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, (client) => client.query(`INSERT INTO catalog.tags (tenant_id, name) VALUES ($1, 'Yeni')`, [tenantId]));
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgTagRepository', () => {
  it('finds all tags for a tenant', async () => {
    const tags = await tagRepo.findByTenant(tenantId);
    expect(tags.map((t) => t.name)).toEqual(['Yeni']);
  });
});
```

`backend/src/modules/catalog/infrastructure/pgProductRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgProductRepository } from './pgProductRepository';
import { withTenant } from '../../../db/withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const productRepo = new PgProductRepository(pool);

let tenantId: string;
let categoryId: string;
let branchId: string;
let productId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'product-repo-test', name: 'Product Repo Test' });
  tenantId = tenant.id;

  await withTenant(pool, tenantId, async (client) => {
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantId]);
    categoryId = cat.rows[0].id;
    const branch = await client.query(`INSERT INTO tenants.branches (tenant_id, name, address) VALUES ($1, 'Main', 'Bakı') RETURNING id`, [tenantId]);
    branchId = branch.rows[0].id;
    const tag = await client.query(`INSERT INTO catalog.tags (tenant_id, name) VALUES ($1, 'Yeni') RETURNING id`, [tenantId]);
    const product = await client.query(
      `INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'iPhone 15', 'Yeni model', 250000) RETURNING id`,
      [tenantId, categoryId]
    );
    productId = product.rows[0].id;
    await client.query(`INSERT INTO catalog.product_tags (product_id, tag_id) VALUES ($1, $2)`, [productId, tag.rows[0].id]);
    await client.query(`INSERT INTO catalog.product_images (tenant_id, product_id, url, sort_order) VALUES ($1, $2, 'https://x/a.jpg', 0)`, [tenantId, productId]);
    await client.query(`INSERT INTO catalog.product_stock (tenant_id, product_id, branch_id, quantity) VALUES ($1, $2, $3, 7)`, [tenantId, productId, branchId]);
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgProductRepository', () => {
  it('findByTenant returns the product with its tags, images, and per-branch stock joined', async () => {
    const [product] = await productRepo.findByTenant(tenantId, {});
    expect(product.name).toBe('iPhone 15');
    expect(product.tags.map((t) => t.name)).toEqual(['Yeni']);
    expect(product.images.map((i) => i.url)).toEqual(['https://x/a.jpg']);
    expect(product.stockByBranch).toEqual([{ branchId, quantity: 7 }]);
  });

  it('findByTenant filters by categoryId', async () => {
    const products = await productRepo.findByTenant(tenantId, { categoryId });
    expect(products).toHaveLength(1);
    const noMatch = await productRepo.findByTenant(tenantId, { categoryId: '00000000-0000-0000-0000-000000000000' });
    expect(noMatch).toHaveLength(0);
  });

  it('findByTenant filters by search (case-insensitive substring on name)', async () => {
    const products = await productRepo.findByTenant(tenantId, { search: 'iphone' });
    expect(products).toHaveLength(1);
    const noMatch = await productRepo.findByTenant(tenantId, { search: 'samsung' });
    expect(noMatch).toHaveLength(0);
  });

  it('findById returns the single product with joined data', async () => {
    const product = await productRepo.findById(tenantId, productId);
    expect(product?.name).toBe('iPhone 15');
  });

  it('findById returns null for an unknown id', async () => {
    expect(await productRepo.findById(tenantId, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/catalog/infrastructure`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the implementations**

`backend/src/modules/catalog/infrastructure/pgCategoryRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { Category } from '../domain/category';
import type { CategoryRepository } from '../domain/categoryRepository';
import { withTenant } from '../../../db/withTenant';

export class PgCategoryRepository implements CategoryRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenant(tenantId: string): Promise<Category[]> {
    if (!tenantId) throw new Error('CategoryRepository.findByTenant requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM catalog.categories WHERE tenant_id = $1 ORDER BY name', [tenantId]);
      return rows.map((r) => ({ id: r.id, tenantId: r.tenant_id, parentId: r.parent_id, name: r.name }));
    });
  }
}
```

`backend/src/modules/catalog/infrastructure/pgTagRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { Tag } from '../domain/tag';
import type { TagRepository } from '../domain/tagRepository';
import { withTenant } from '../../../db/withTenant';

export class PgTagRepository implements TagRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenant(tenantId: string): Promise<Tag[]> {
    if (!tenantId) throw new Error('TagRepository.findByTenant requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM catalog.tags WHERE tenant_id = $1 ORDER BY name', [tenantId]);
      return rows.map((r) => ({ id: r.id, tenantId: r.tenant_id, name: r.name }));
    });
  }
}
```

`backend/src/modules/catalog/infrastructure/pgProductRepository.ts`:
```typescript
import type { Pool, PoolClient } from 'pg';
import type { ProductRepository, ProductRow, ProductFilters } from '../domain/productRepository';
import { withTenant } from '../../../db/withTenant';

async function loadTagsImagesStock(client: PoolClient, tenantId: string, productIds: string[]): Promise<{
  tagsByProduct: Map<string, { id: string; tenantId: string; name: string }[]>;
  imagesByProduct: Map<string, { id: string; url: string; sortOrder: number }[]>;
  stockByProduct: Map<string, { branchId: string; quantity: number }[]>;
}> {
  const tagsByProduct = new Map<string, { id: string; tenantId: string; name: string }[]>();
  const imagesByProduct = new Map<string, { id: string; url: string; sortOrder: number }[]>();
  const stockByProduct = new Map<string, { branchId: string; quantity: number }[]>();
  if (productIds.length === 0) return { tagsByProduct, imagesByProduct, stockByProduct };

  const tagRows = await client.query(
    `SELECT pt.product_id, t.id, t.tenant_id, t.name FROM catalog.product_tags pt
     JOIN catalog.tags t ON t.id = pt.tag_id WHERE pt.product_id = ANY($1)`,
    [productIds]
  );
  for (const r of tagRows.rows) {
    const list = tagsByProduct.get(r.product_id) ?? [];
    list.push({ id: r.id, tenantId: r.tenant_id, name: r.name });
    tagsByProduct.set(r.product_id, list);
  }

  const imageRows = await client.query(
    `SELECT product_id, id, url, sort_order FROM catalog.product_images WHERE tenant_id = $1 AND product_id = ANY($2) ORDER BY sort_order`,
    [tenantId, productIds]
  );
  for (const r of imageRows.rows) {
    const list = imagesByProduct.get(r.product_id) ?? [];
    list.push({ id: r.id, url: r.url, sortOrder: r.sort_order });
    imagesByProduct.set(r.product_id, list);
  }

  const stockRows = await client.query(
    `SELECT product_id, branch_id, quantity FROM catalog.product_stock WHERE tenant_id = $1 AND product_id = ANY($2)`,
    [tenantId, productIds]
  );
  for (const r of stockRows.rows) {
    const list = stockByProduct.get(r.product_id) ?? [];
    list.push({ branchId: r.branch_id, quantity: r.quantity });
    stockByProduct.set(r.product_id, list);
  }

  return { tagsByProduct, imagesByProduct, stockByProduct };
}

function toRow(
  r: any,
  tagsByProduct: Map<string, any[]>,
  imagesByProduct: Map<string, any[]>,
  stockByProduct: Map<string, any[]>
): ProductRow {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description,
    priceCents: r.price_cents,
    tags: tagsByProduct.get(r.id) ?? [],
    images: imagesByProduct.get(r.id) ?? [],
    stockByBranch: stockByProduct.get(r.id) ?? [],
  };
}

export class PgProductRepository implements ProductRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenant(tenantId: string, filters: ProductFilters): Promise<ProductRow[]> {
    if (!tenantId) throw new Error('ProductRepository.findByTenant requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const conditions: string[] = ['p.tenant_id = $1'];
      const params: any[] = [tenantId];

      if (filters.categoryId) {
        params.push(filters.categoryId);
        conditions.push(`p.category_id = $${params.length}`);
      }
      if (filters.search) {
        params.push(`%${filters.search}%`);
        conditions.push(`p.name ILIKE $${params.length}`);
      }

      let query = `SELECT DISTINCT p.* FROM catalog.products p`;
      if (filters.tagId) {
        query += ` JOIN catalog.product_tags pt ON pt.product_id = p.id`;
        params.push(filters.tagId);
        conditions.push(`pt.tag_id = $${params.length}`);
      }
      query += ` WHERE ${conditions.join(' AND ')} ORDER BY p.name`;

      const { rows } = await client.query(query, params);
      const ids = rows.map((r) => r.id);
      const { tagsByProduct, imagesByProduct, stockByProduct } = await loadTagsImagesStock(client, tenantId, ids);
      return rows.map((r) => toRow(r, tagsByProduct, imagesByProduct, stockByProduct));
    });
  }

  async findById(tenantId: string, id: string): Promise<ProductRow | null> {
    if (!tenantId) throw new Error('ProductRepository.findById requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM catalog.products WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
      if (!rows[0]) return null;
      const { tagsByProduct, imagesByProduct, stockByProduct } = await loadTagsImagesStock(client, tenantId, [id]);
      return toRow(rows[0], tagsByProduct, imagesByProduct, stockByProduct);
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/catalog/infrastructure`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/catalog/infrastructure
git commit -m "feat: add catalog module infrastructure (Pg{Category,Tag,Product}Repository)"
git push origin develop
```

---

## Task 5: Category and Product routes (presentation layer)

**Files:**
- Create: `backend/src/modules/catalog/presentation/categoryRoutes.ts`
- Create: `backend/src/modules/catalog/presentation/categoryRoutes.test.ts`
- Create: `backend/src/modules/catalog/presentation/productRoutes.ts`
- Create: `backend/src/modules/catalog/presentation/productRoutes.test.ts`
- Create: `backend/src/modules/catalog/domain/tenantSettingsRepository.ts`
- Create: `backend/src/modules/catalog/infrastructure/pgTenantSettingsRepository.ts`

**Interfaces:**
- Consumes: `CategoryRepository`/`TagRepository` (Task 4), `ProductService` (Task 3).
- Produces: `categoryRoutes(categoryRepository): Router` mounting `GET /categories`; `productRoutes(productService, tenantSettingsRepository): Router` mounting `GET /products` and `GET /products/:id` (the new `TenantSettingsRepository`/`PgTenantSettingsRepository` — see Step 3 below — is introduced in this task, not Task 4, since it's needed for these routes to compile). Both scope strictly by `req.tenant.id`, never a client-supplied tenant id (same rule as `branchRoutes`). Task 6 mounts these in `server.ts`.

- [ ] **Step 1: Write the failing tests**

`backend/src/modules/catalog/presentation/categoryRoutes.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { errorHandler } from '../../../middleware/errorHandler';
import { categoryRoutes } from './categoryRoutes';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { CategoryRepository } from '../domain/categoryRepository';

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };

function buildApp() {
  const tenantRepository: TenantRepository = {
    findBySubdomain: vi.fn(async (sub) => (sub === 'shop-a' ? TENANT : null)),
    findById: vi.fn(),
    create: vi.fn(),
  };
  const categoryRepository: CategoryRepository = {
    findByTenant: vi.fn(async (tenantId) => (tenantId === 't1' ? [{ id: 'c1', tenantId: 't1', parentId: null, name: 'Elektronika' }] : [])),
  };

  const app = express();
  app.use(tenantResolve(tenantRepository));
  app.use(categoryRoutes(categoryRepository));
  app.use(errorHandler);
  return app;
}

describe('GET /categories', () => {
  it("returns the resolved tenant's categories", async () => {
    const app = buildApp();
    const res = await request(app).get('/categories').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ categories: [{ id: 'c1', tenantId: 't1', parentId: null, name: 'Elektronika' }] });
  });
});
```

`backend/src/modules/catalog/presentation/productRoutes.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { errorHandler } from '../../../middleware/errorHandler';
import { productRoutes } from './productRoutes';
import { ProductService } from '../domain/productService';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { ProductRepository, ProductRow } from '../domain/productRepository';
import type { TenantSettingsRepository } from '../domain/tenantSettingsRepository';

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };

function row(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p1', tenantId: 't1', categoryId: 'c1', name: 'iPhone 15', description: null, priceCents: 250000,
    tags: [], images: [], stockByBranch: [{ branchId: 'b1', quantity: 5 }],
    ...overrides,
  };
}

function fakeSettings(outOfStockDisplay: 'hide' | 'coming_soon' = 'hide'): TenantSettingsRepository {
  return { getOutOfStockDisplay: vi.fn(async () => outOfStockDisplay) };
}

function buildApp(products: ProductRow[]) {
  const tenantRepository: TenantRepository = {
    findBySubdomain: vi.fn(async (sub) => (sub === 'shop-a' ? TENANT : null)),
    findById: vi.fn(),
    create: vi.fn(),
  };
  const productRepository: ProductRepository = {
    findByTenant: vi.fn(async () => products),
    findById: vi.fn(async (_tenantId, id) => products.find((p) => p.id === id) ?? null),
  };
  const productService = new ProductService(productRepository);

  const app = express();
  app.use(tenantResolve(tenantRepository));
  app.use(productRoutes(productService, fakeSettings()));
  app.use(errorHandler);
  return app;
}

describe('GET /products', () => {
  it('returns the tenant\'s available products', async () => {
    const app = buildApp([row()]);
    const res = await request(app).get('/products').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('iPhone 15');
  });

  it('passes categoryId/tagId/search query params through as filters, ignoring any client-supplied tenantId', async () => {
    const productRepository: ProductRepository = { findByTenant: vi.fn(async () => []), findById: vi.fn() };
    const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
    const app = express();
    app.use(tenantResolve(tenantRepository));
    app.use(productRoutes(new ProductService(productRepository), fakeSettings()));
    app.use(errorHandler);

    await request(app).get('/products?categoryId=c1&tagId=t1&search=iphone&tenantId=attacker-supplied').set('Host', 'shop-a.platform.test');

    expect(productRepository.findByTenant).toHaveBeenCalledWith('t1', { categoryId: 'c1', tagId: 't1', search: 'iphone' });
  });

  it('excludes an out-of-stock product when the tenant setting is "hide" (fetched via TenantSettingsRepository, not hardcoded)', async () => {
    const productRepository: ProductRepository = { findByTenant: vi.fn(async () => [row({ stockByBranch: [{ branchId: 'b1', quantity: 0 }] })]), findById: vi.fn() };
    const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
    const app = express();
    app.use(tenantResolve(tenantRepository));
    app.use(productRoutes(new ProductService(productRepository), fakeSettings('hide')));
    app.use(errorHandler);

    const res = await request(app).get('/products').set('Host', 'shop-a.platform.test');
    expect(res.body.products).toEqual([]);
  });
});

describe('GET /products/:id', () => {
  it('returns a single product by id', async () => {
    const app = buildApp([row()]);
    const res = await request(app).get('/products/p1').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });

  it('returns 404 for an unknown product id', async () => {
    const app = buildApp([row()]);
    const res = await request(app).get('/products/does-not-exist').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=backend -- modules/catalog/presentation`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the routes**

`backend/src/modules/catalog/presentation/categoryRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { CategoryRepository } from '../domain/categoryRepository';
import { MissingTenantScopeError } from '../../../middleware/errors';

export function categoryRoutes(categoryRepository: CategoryRepository): Router {
  const router = Router();

  router.get('/categories', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('categoryRoutes: req.tenant not set');
    const categories = await categoryRepository.findByTenant(req.tenant.id);
    res.status(200).json({ categories });
  });

  return router;
}
```

`backend/src/modules/catalog/domain/tenantSettingsRepository.ts`:
```typescript
export type OutOfStockDisplay = 'hide' | 'coming_soon';

// Deliberately NOT added as a field on the core Tenant type (shared-types)
// or the existing TenantRepository interface — both are already relied on
// by every prior module's test fixtures (Foundation, Customer Auth), and
// widening either with a new required field would break all of them for
// a setting only the catalog module currently needs. A small, separate
// interface keeps this addition's blast radius to just this module.
export interface TenantSettingsRepository {
  getOutOfStockDisplay(tenantId: string): Promise<OutOfStockDisplay>;
}
```

`backend/src/modules/catalog/infrastructure/pgTenantSettingsRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { TenantSettingsRepository, OutOfStockDisplay } from '../domain/tenantSettingsRepository';

export class PgTenantSettingsRepository implements TenantSettingsRepository {
  constructor(private readonly pool: Pool) {}

  async getOutOfStockDisplay(tenantId: string): Promise<OutOfStockDisplay> {
    if (!tenantId) throw new Error('TenantSettingsRepository.getOutOfStockDisplay requires a tenantId');
    // Not tenant-scoped via withTenant/RLS on purpose: tenants.tenants itself
    // has no RLS policy (see Foundation Task 5 — it's the tenant list, not a
    // tenant-owned row), and the WHERE clause here already pins it to one id.
    const { rows } = await this.pool.query('SELECT out_of_stock_display FROM tenants.tenants WHERE id = $1', [tenantId]);
    return rows[0]?.out_of_stock_display ?? 'hide';
  }
}
```

`backend/src/modules/catalog/presentation/productRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ProductService } from '../domain/productService';
import type { TenantSettingsRepository } from '../domain/tenantSettingsRepository';
import { MissingTenantScopeError } from '../../../middleware/errors';

export function productRoutes(productService: ProductService, tenantSettingsRepository: TenantSettingsRepository): Router {
  const router = Router();

  router.get('/products', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('productRoutes: req.tenant not set');
    const { categoryId, tagId, search } = req.query;
    const filters = {
      ...(typeof categoryId === 'string' ? { categoryId } : {}),
      ...(typeof tagId === 'string' ? { tagId } : {}),
      ...(typeof search === 'string' ? { search } : {}),
    };
    const outOfStockDisplay = await tenantSettingsRepository.getOutOfStockDisplay(req.tenant.id);
    const products = await productService.list(req.tenant.id, filters, outOfStockDisplay);
    res.status(200).json({ products });
  });

  router.get('/products/:id', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('productRoutes: req.tenant not set');
    const outOfStockDisplay = await tenantSettingsRepository.getOutOfStockDisplay(req.tenant.id);
    const product = await productService.getById(req.tenant.id, req.params.id, outOfStockDisplay);
    if (!product) {
      res.status(404).json({ error: 'product_not_found' });
      return;
    }
    res.status(200).json(product);
  });

  return router;
}
```

- [ ] **Step 4: Run this task's tests to verify they pass**

Run: `npm test --workspace=backend -- modules/catalog/presentation`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/catalog/presentation backend/src/modules/catalog/domain/tenantSettingsRepository.ts backend/src/modules/catalog/infrastructure/pgTenantSettingsRepository.ts
git commit -m "feat: add category/product routes with a scoped TenantSettingsRepository for out-of-stock display"
git push origin develop
```

---

## Task 6: Wire into `server.ts` and manually verify live

**Files:**
- Modify: `backend/src/server.ts`

**Interfaces:**
- No new testable interface — wires Tasks 1-5 together and verifies manually, same pattern as the prior two plans' final task.

- [ ] **Step 1: Wire the catalog module into the app**

Modify `backend/src/server.ts` — add imports:
```typescript
import { PgCategoryRepository } from './modules/catalog/infrastructure/pgCategoryRepository';
import { PgTagRepository } from './modules/catalog/infrastructure/pgTagRepository';
import { PgProductRepository } from './modules/catalog/infrastructure/pgProductRepository';
import { PgTenantSettingsRepository } from './modules/catalog/infrastructure/pgTenantSettingsRepository';
import { ProductService } from './modules/catalog/domain/productService';
import { categoryRoutes } from './modules/catalog/presentation/categoryRoutes';
import { productRoutes } from './modules/catalog/presentation/productRoutes';
```

Add after the existing repository/service instantiations:
```typescript
const categoryRepository = new PgCategoryRepository(pool);
new PgTagRepository(pool); // instantiated for parity/future GET /tags route; not yet mounted (no task calls for it in Phase 1's route list)
const productRepository = new PgProductRepository(pool);
const productService = new ProductService(productRepository);
const tenantSettingsRepository = new PgTenantSettingsRepository(pool);
```

Add after the existing `app.use(customerRoutes(...))` line:
```typescript
app.use(categoryRoutes(categoryRepository));
app.use(productRoutes(productService, tenantSettingsRepository));
```

- [ ] **Step 2: Run the full backend test suite**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend`
Expected: all tests pass (Foundation's + Customer Auth's + this plan's)

- [ ] **Step 3: Seed a real category/product for live verification**

There's no seed script update in this plan (seeding richer catalog data is naturally the Storefront/Component System plan's job, once there's a UI to browse it) — insert one manually for this check:
```bash
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
psql -d shop_platform <<'SQL'
DO $$
DECLARE
  v_tenant_id UUID;
  v_category_id UUID;
  v_branch_id UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants.tenants WHERE subdomain = 'texnogallery';
  SELECT id INTO v_branch_id FROM tenants.branches WHERE tenant_id = v_tenant_id LIMIT 1;
  PERFORM set_config('app.tenant_id', v_tenant_id::text, false);
  INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES (v_tenant_id, NULL, 'Elektronika') RETURNING id INTO v_category_id;
  INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES (v_tenant_id, v_category_id, 'iPhone 15', 'Yeni model', 250000) RETURNING id INTO v_product_id;
  INSERT INTO catalog.product_stock (tenant_id, product_id, branch_id, quantity) VALUES (v_tenant_id, v_product_id, v_branch_id, 10);
END $$;
SQL
```

- [ ] **Step 4: Manually verify live**

```bash
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev &> /tmp/api.log &
for i in $(seq 1 30); do curl -sf http://localhost:8080/health > /dev/null && break; sleep 1; done

curl -s -H "Host: texnogallery.localhost" http://localhost:8080/categories
echo
curl -s -H "Host: texnogallery.localhost" http://localhost:8080/products
echo
curl -s -H "Host: texnogallery.localhost" "http://localhost:8080/products?search=iphone"
echo

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```
Expected: `/categories` returns the seeded "Elektronika" category; `/products` returns the iPhone 15 product with `totalStock: 10`, `isAvailable: true`; the search filter still returns it.

- [ ] **Step 5: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: wire catalog module into server.ts, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against spec §4/§5):
- Categories hierarchical, product has one `category_id`: Task 2 (`parent_id` self-ref), Task 4 ✅
- Tags many-to-many, tag filtering: Task 2 (`product_tags`), Task 5 (`?tagId=`) ✅
- Product images (for the future gallery slider): Task 2 (`product_images`), Task 4 ✅
- Per-branch stock, plain quantity: Task 2 (`product_stock`, `UNIQUE(product_id, branch_id)`) ✅
- Out-of-stock display tenant setting (hide/coming_soon): Task 2 (`tenants.tenants.out_of_stock_display`), Task 3 (`ProductService` filtering logic), Task 5 (`TenantSettingsRepository` fetches it per-request) ✅
- Search: Task 4/5 (`?search=`, `ILIKE`) — not explicitly named as a separate task in the spec's component list but implied by "Product search, Search results" (spec §4); implemented as a query param on the same `/products` endpoint rather than a separate route, since it's the same underlying filter mechanism.
- Product Card / Grid / detail page components themselves (frontend) — explicitly out of scope here, that's the Storefront + Component System plan.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `Category`/`Tag`/`Product` defined once in `packages/shared-types` (Task 1); `ProductRow` (raw joined DB shape) is a domain-internal type (Task 3), never exposed directly — `ProductService` always maps it to the public `Product` shape before returning. `CategoryRepository`/`TagRepository`/`ProductRepository` signatures declared in Task 3 are implemented with matching signatures in Task 4 and consumed unchanged by Task 5's routes.

**Self-review catch (fixed inline, not left as a note):** the first draft of Task 5 added `outOfStockDisplay` directly onto the shared `Tenant` type, requiring `req.tenant.outOfStockDisplay`. That would have broken every existing test fixture across the Foundation and Customer Auth plans that constructs a `Tenant` object (`tenantResolve.test.ts`, `customerRoutes.test.ts`, `branchRoutes.test.ts`, ...) once the field became required — a real cross-plan regression, not just a local one. Replaced with a small, catalog-scoped `TenantSettingsRepository` (Task 5) that routes call directly, leaving the core `Tenant` type and `TenantRepository` interface — and every prior plan's fixtures — untouched.
