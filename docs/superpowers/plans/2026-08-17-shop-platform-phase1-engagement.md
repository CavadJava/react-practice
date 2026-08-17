# Shop Platform — Phase 1 Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The last backend module of Phase 1 — `engagement` (favorites, reviews, inquiries/"Müraciət"), the three pieces spec §4/§5 grouped together as "customer engagement with a product." Closes out Phase 1's backend surface; what remains after this plan is storefront UI work (Profile page aggregation, sliders), not new backend modules.

**Scope note:** Backend API only, same pattern every module in this project has used — prove the mechanism via the API first, storefront UI is separate follow-up work. Tenant-side inquiry *response*/management is explicitly Phase 3 (spec §2) — this plan only lets a customer create an inquiry and see their own list, never lets anyone answer one.

**Architecture:** One `engagement` module (not three) — favorites/reviews/inquiries are all simple, independent, customer-owned records with no cross-cutting business logic between them (spec §7 already named this module as lighter-weight than `cart`), so one Clean-Architecture-layered module with three domain services is more proportionate than three near-empty modules. Every route is scoped by `req.tenant.id` + `req.customer.id` (all three require login — you can't favorite/review/inquire anonymously) except reading a product's reviews, which is public (anyone browsing sees them, only *writing* one requires login).

**Tech Stack:** No new dependencies — existing backend stack throughout.

## Global Constraints

- `domain/` files never import Express or `pg` directly (spec §7).
- `engagement` is a NEW schema — `shop_platform_app` creates and thus owns it (same as `customers`/`catalog`/`cart`/`orders`), so no special CREATE-grant step should be needed (unlike gotcha #12's `tenants`-schema situation) — still extend `setup-role.sql` for the standard USAGE/DML coverage.
- Writing a favorite/review/inquiry requires login (`customerAuth`); reading a product's own reviews does not (public, matches how product browsing itself is public).
- A customer can only ever see/toggle *their own* favorites and *their own* inquiries — never another customer's, and never via a client-supplied customerId.
- One review per (customer, product) — a second `POST` updates the existing review rather than creating a duplicate (upsert, same idiom already used for cart items and layout configs in prior plans).

---

## File Structure

```
packages/shared-types/src/
├── engagement.ts             # Favorite/Review/Inquiry types + write-request schemas
└── engagement.test.ts

backend/src/
├── db/
│   ├── migrations/0008_engagement_tables.sql
│   └── setup-role.sql                          # extended: engagement schema grants
└── modules/
    └── engagement/
        ├── domain/
        │   ├── favorite.ts / review.ts / inquiry.ts
        │   ├── engagementRepository.ts          # one repository interface, all three concerns
        │   └── engagementService.ts             # toggle-favorite, upsert-review, create-inquiry
        ├── infrastructure/
        │   ├── pgEngagementRepository.ts
        │   └── pgEngagementRepository.test.ts
        └── presentation/
            ├── engagementRoutes.ts
            └── engagementRoutes.test.ts
```

---

## Task 1: Shared Favorite/Review/Inquiry types

**Files:**
- Create: `packages/shared-types/src/engagement.ts`
- Create: `packages/shared-types/src/engagement.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Favorite`, `Review`, `Inquiry` types + `reviewRequestSchema` (rating 1-5, comment), `inquiryRequestSchema` (productId, message).

- [ ] **Step 1: Write the failing test**

`packages/shared-types/src/engagement.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { favoriteSchema, reviewSchema, reviewRequestSchema, inquirySchema, inquiryRequestSchema } from './engagement';

describe('favoriteSchema', () => {
  it('accepts a valid favorite', () => {
    expect(favoriteSchema.safeParse({ productId: 'p1', createdAt: '2026-08-17T00:00:00.000Z' }).success).toBe(true);
  });
});

describe('reviewRequestSchema', () => {
  it('accepts rating 1-5 with a comment', () => {
    expect(reviewRequestSchema.safeParse({ rating: 5, comment: 'Əla!' }).success).toBe(true);
  });

  it('rejects rating 0 and rating 6', () => {
    expect(reviewRequestSchema.safeParse({ rating: 0, comment: 'x' }).success).toBe(false);
    expect(reviewRequestSchema.safeParse({ rating: 6, comment: 'x' }).success).toBe(false);
  });
});

describe('reviewSchema', () => {
  it('accepts a full review record', () => {
    const result = reviewSchema.safeParse({
      id: 'r1', productId: 'p1', customerId: 'c1', customerName: 'Aygün', rating: 5, comment: 'Əla!', createdAt: '2026-08-17T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});

describe('inquiryRequestSchema', () => {
  it('accepts a productId and message', () => {
    expect(inquiryRequestSchema.safeParse({ productId: 'p1', message: 'Nə vaxt stokda olacaq?' }).success).toBe(true);
  });

  it('rejects an empty message', () => {
    expect(inquiryRequestSchema.safeParse({ productId: 'p1', message: '' }).success).toBe(false);
  });
});

describe('inquirySchema', () => {
  it('accepts a full inquiry record with status', () => {
    const result = inquirySchema.safeParse({
      id: 'i1', productId: 'p1', message: 'Nə vaxt stokda olacaq?', status: 'open', createdAt: '2026-08-17T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from repo root): `npm test --workspace=packages/shared-types -- engagement.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write minimal implementation**

`packages/shared-types/src/engagement.ts`:
```typescript
import { z } from 'zod';

export const favoriteSchema = z.object({
  productId: z.string(),
  createdAt: z.string().datetime(),
});
export type Favorite = z.infer<typeof favoriteSchema>;

export const reviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
});
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;

export const reviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string().datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

export const inquiryRequestSchema = z.object({
  productId: z.string(),
  message: z.string().min(1),
});
export type InquiryRequest = z.infer<typeof inquiryRequestSchema>;

export const inquiryStatusSchema = z.enum(['open', 'answered']);
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;

export const inquirySchema = z.object({
  id: z.string(),
  productId: z.string(),
  message: z.string(),
  status: inquiryStatusSchema,
  createdAt: z.string().datetime(),
});
export type Inquiry = z.infer<typeof inquirySchema>;
```

`packages/shared-types/src/index.ts` (append):
```typescript
export * from './tenant';
export * from './customer';
export * from './catalog';
export * from './pageLayout';
export * from './componentManifest';
export * from './cart';
export * from './order';
export * from './engagement';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=packages/shared-types -- engagement.test`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared Favorite/Review/Inquiry types"
git push origin develop
```

---

## Task 2: `engagement` schema migration + role grants

**Files:**
- Create: `backend/src/db/migrations/0008_engagement_tables.sql`
- Modify: `backend/src/db/setup-role.sql`
- Test: `backend/src/db/migrations.engagement.test.ts`

**Interfaces:**
- Produces: `engagement.favorites` (unique on `(customer_id, product_id)`), `engagement.reviews` (unique on `(customer_id, product_id)` — one review per customer per product), `engagement.inquiries` (`status` default `'open'`). All RLS-enforced, FK to `customers.customers`/`catalog.products`.

- [ ] **Step 1: Write the failing test**

`backend/src/db/migrations.engagement.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });

let tenantAId: string;
let tenantBId: string;
let customerId: string;
let productId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('engagement-tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('engagement-tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;
  await withTenant(pool, tenantAId, async (client) => {
    const cust = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'A','B','Bakı','engagement-test@example.com',NULL,'hash') RETURNING id`,
      [tenantAId]
    );
    customerId = cust.rows[0].id;
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantAId]);
    const product = await client.query(`INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'Product A', NULL, 1000) RETURNING id`, [tenantAId, cat.rows[0].id]);
    productId = product.rows[0].id;
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('engagement schema', () => {
  it('favorites: unique per (customer, product), RLS-isolated', async () => {
    await withTenant(pool, tenantAId, (client) =>
      client.query('INSERT INTO engagement.favorites (tenant_id, customer_id, product_id) VALUES ($1, $2, $3)', [tenantAId, customerId, productId])
    );
    await expect(
      withTenant(pool, tenantAId, (client) => client.query('INSERT INTO engagement.favorites (tenant_id, customer_id, product_id) VALUES ($1, $2, $3)', [tenantAId, customerId, productId]))
    ).rejects.toThrow();

    const asTenantB = await withTenant(pool, tenantBId, (client) => client.query('SELECT * FROM engagement.favorites'));
    expect(asTenantB.rows).toEqual([]);
  });

  it('reviews: rating CHECK constraint enforced, one per (customer, product)', async () => {
    await expect(
      withTenant(pool, tenantAId, (client) =>
        client.query('INSERT INTO engagement.reviews (tenant_id, customer_id, product_id, rating, comment) VALUES ($1, $2, $3, 6, $4)', [tenantAId, customerId, productId, 'bad rating'])
      )
    ).rejects.toThrow();

    await withTenant(pool, tenantAId, (client) =>
      client.query('INSERT INTO engagement.reviews (tenant_id, customer_id, product_id, rating, comment) VALUES ($1, $2, $3, 5, $4)', [tenantAId, customerId, productId, 'Əla!'])
    );
    await expect(
      withTenant(pool, tenantAId, (client) =>
        client.query('INSERT INTO engagement.reviews (tenant_id, customer_id, product_id, rating, comment) VALUES ($1, $2, $3, 4, $4)', [tenantAId, customerId, productId, 'Second review'])
      )
    ).rejects.toThrow();
  });

  it('inquiries: status defaults to open', async () => {
    const result = await withTenant(pool, tenantAId, (client) =>
      client.query('INSERT INTO engagement.inquiries (tenant_id, customer_id, product_id, message) VALUES ($1, $2, $3, $4) RETURNING status', [tenantAId, customerId, productId, 'Nə vaxt stokda olacaq?'])
    );
    expect(result.rows[0].status).toBe('open');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.engagement.test`
Expected: FAIL — relations don't exist

- [ ] **Step 3: Write the migration**

`backend/src/db/migrations/0008_engagement_tables.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS engagement;

CREATE TABLE engagement.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (customer_id, product_id)
);
CREATE INDEX idx_favorites_tenant_id ON engagement.favorites (tenant_id);
ALTER TABLE engagement.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement.favorites FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON engagement.favorites
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE engagement.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (customer_id, product_id)
);
CREATE INDEX idx_reviews_tenant_id ON engagement.reviews (tenant_id);
CREATE INDEX idx_reviews_product_id ON engagement.reviews (product_id);
ALTER TABLE engagement.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement.reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON engagement.reviews
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE engagement.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inquiries_tenant_id ON engagement.inquiries (tenant_id);
ALTER TABLE engagement.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement.inquiries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON engagement.inquiries
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Extend the role-grants script**

Modify `backend/src/db/setup-role.sql` — add after the `orders` schema grants block:
```sql
-- engagement schema (added by the Engagement plan)
GRANT USAGE ON SCHEMA engagement TO shop_platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA engagement TO shop_platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA engagement GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_platform_app;
```
New schema, `shop_platform_app` owns it (creates it itself) — no CREATE grant needed (not the gotcha #12 situation). Apply anyway for standard coverage:
```bash
psql -d shop_platform -f backend/src/db/setup-role.sql
psql -d shop_platform_test -f backend/src/db/setup-role.sql
```

- [ ] **Step 5: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.engagement.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/0008_engagement_tables.sql backend/src/db/setup-role.sql backend/src/db/migrations.engagement.test.ts
git commit -m "feat: add engagement schema migration (favorites/reviews/inquiries) with RLS"
git push origin develop
```

---

## Task 3: `engagement` module — domain layer

**Files:**
- Create: `backend/src/modules/engagement/domain/favorite.ts`, `review.ts`, `inquiry.ts`
- Create: `backend/src/modules/engagement/domain/engagementRepository.ts`
- Create: `backend/src/modules/engagement/domain/engagementService.ts`
- Test: `backend/src/modules/engagement/domain/engagementService.test.ts`

**Interfaces:**
- Produces:
  - `EngagementRepository.listFavorites/addFavorite/removeFavorite(tenantId, customerId, ...)`
  - `EngagementRepository.listReviewsForProduct(tenantId, productId)`, `upsertReview(tenantId, customerId, productId, input)`
  - `EngagementRepository.listInquiriesForCustomer(tenantId, customerId)`, `createInquiry(tenantId, customerId, input)`
  - `EngagementService` — thin pass-through for favorites/inquiries (no real business rule beyond scoping, matches spec's own "tenants module has no service file" precedent for lightweight modules — except reviews, which gets one real rule: a customer's own name is looked up and attached, never trusted from the request)

- [ ] **Step 1: Write the failing test**

`backend/src/modules/engagement/domain/engagementService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { EngagementService } from './engagementService';
import type { EngagementRepository } from './engagementRepository';

function fakeRepo(): EngagementRepository {
  return {
    listFavorites: vi.fn(async () => []),
    addFavorite: vi.fn(async () => ({ productId: 'p1', createdAt: '2026-08-17T00:00:00.000Z' })),
    removeFavorite: vi.fn(async () => {}),
    listReviewsForProduct: vi.fn(async () => []),
    upsertReview: vi.fn(async (tenantId, customerId, customerName, productId, input) => ({
      id: 'r1', productId, customerId, customerName, rating: input.rating, comment: input.comment, createdAt: '2026-08-17T00:00:00.000Z',
    })),
    listInquiriesForCustomer: vi.fn(async () => []),
    createInquiry: vi.fn(async (tenantId, customerId, input) => ({ id: 'i1', productId: input.productId, message: input.message, status: 'open', createdAt: '2026-08-17T00:00:00.000Z' })),
  };
}

describe('EngagementService.submitReview', () => {
  it('attaches the customer\'s own name to the review, never a client-supplied one', async () => {
    const repo = fakeRepo();
    const service = new EngagementService(repo);
    const review = await service.submitReview('t1', 'cust1', 'Aygün Məmmədova', 'p1', { rating: 5, comment: 'Əla!' });
    expect(repo.upsertReview).toHaveBeenCalledWith('t1', 'cust1', 'Aygün Məmmədova', 'p1', { rating: 5, comment: 'Əla!' });
    expect(review.customerName).toBe('Aygün Məmmədova');
  });
});

describe('EngagementService favorites/inquiries pass-through', () => {
  it('addFavorite/removeFavorite/createInquiry delegate directly to the repository, scoped by tenant+customer', async () => {
    const repo = fakeRepo();
    const service = new EngagementService(repo);
    await service.addFavorite('t1', 'cust1', 'p1');
    expect(repo.addFavorite).toHaveBeenCalledWith('t1', 'cust1', 'p1');

    await service.createInquiry('t1', 'cust1', { productId: 'p1', message: 'Nə vaxt stokda olacaq?' });
    expect(repo.createInquiry).toHaveBeenCalledWith('t1', 'cust1', { productId: 'p1', message: 'Nə vaxt stokda olacaq?' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- engagementService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/engagement/domain/favorite.ts`:
```typescript
export type { Favorite } from '@shop-platform/shared-types';
```

`backend/src/modules/engagement/domain/review.ts`:
```typescript
export type { Review, ReviewRequest } from '@shop-platform/shared-types';
```

`backend/src/modules/engagement/domain/inquiry.ts`:
```typescript
export type { Inquiry, InquiryRequest } from '@shop-platform/shared-types';
```

`backend/src/modules/engagement/domain/engagementRepository.ts`:
```typescript
import type { Favorite } from './favorite';
import type { Review, ReviewRequest } from './review';
import type { Inquiry, InquiryRequest } from './inquiry';

export interface EngagementRepository {
  listFavorites(tenantId: string, customerId: string): Promise<Favorite[]>;
  addFavorite(tenantId: string, customerId: string, productId: string): Promise<Favorite>;
  removeFavorite(tenantId: string, customerId: string, productId: string): Promise<void>;

  listReviewsForProduct(tenantId: string, productId: string): Promise<Review[]>;
  upsertReview(tenantId: string, customerId: string, customerName: string, productId: string, input: ReviewRequest): Promise<Review>;

  listInquiriesForCustomer(tenantId: string, customerId: string): Promise<Inquiry[]>;
  createInquiry(tenantId: string, customerId: string, input: InquiryRequest): Promise<Inquiry>;
}
```

`backend/src/modules/engagement/domain/engagementService.ts`:
```typescript
import type { Favorite } from './favorite';
import type { Review, ReviewRequest } from './review';
import type { Inquiry, InquiryRequest } from './inquiry';
import type { EngagementRepository } from './engagementRepository';

export class EngagementService {
  constructor(private readonly repository: EngagementRepository) {}

  listFavorites(tenantId: string, customerId: string): Promise<Favorite[]> {
    return this.repository.listFavorites(tenantId, customerId);
  }

  addFavorite(tenantId: string, customerId: string, productId: string): Promise<Favorite> {
    return this.repository.addFavorite(tenantId, customerId, productId);
  }

  removeFavorite(tenantId: string, customerId: string, productId: string): Promise<void> {
    return this.repository.removeFavorite(tenantId, customerId, productId);
  }

  listReviewsForProduct(tenantId: string, productId: string): Promise<Review[]> {
    return this.repository.listReviewsForProduct(tenantId, productId);
  }

  // customerName always comes from the caller's own req.customer record
  // (see engagementRoutes.ts), never from the request body — a reviewer
  // cannot post a review under someone else's display name.
  submitReview(tenantId: string, customerId: string, customerName: string, productId: string, input: ReviewRequest): Promise<Review> {
    return this.repository.upsertReview(tenantId, customerId, customerName, productId, input);
  }

  listInquiriesForCustomer(tenantId: string, customerId: string): Promise<Inquiry[]> {
    return this.repository.listInquiriesForCustomer(tenantId, customerId);
  }

  createInquiry(tenantId: string, customerId: string, input: InquiryRequest): Promise<Inquiry> {
    return this.repository.createInquiry(tenantId, customerId, input);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- engagementService.test`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/engagement/domain
git commit -m "feat: add engagement module domain layer (favorites/reviews/inquiries)"
git push origin develop
```

---

## Task 4: `engagement` module — infrastructure layer

**Files:**
- Create: `backend/src/modules/engagement/infrastructure/pgEngagementRepository.ts`
- Create: `backend/src/modules/engagement/infrastructure/pgEngagementRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant`, `engagement.*` tables (Task 2).
- Produces: `PgEngagementRepository implements EngagementRepository`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/engagement/infrastructure/pgEngagementRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { withTenant } from '../../../db/withTenant';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgEngagementRepository } from './pgEngagementRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const repo = new PgEngagementRepository(pool);

let tenantId: string;
let customerId: string;
let productId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'engagement-repo-test', name: 'Engagement Repo Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, async (client) => {
    const cust = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'A','B','Bakı','engagement-repo-test@example.com',NULL,'hash') RETURNING id`,
      [tenantId]
    );
    customerId = cust.rows[0].id;
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantId]);
    const product = await client.query(`INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'Product A', NULL, 1000) RETURNING id`, [tenantId, cat.rows[0].id]);
    productId = product.rows[0].id;
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgEngagementRepository — favorites', () => {
  it('adds, lists, and removes a favorite', async () => {
    await repo.addFavorite(tenantId, customerId, productId);
    const listed = await repo.listFavorites(tenantId, customerId);
    expect(listed.map((f) => f.productId)).toEqual([productId]);

    await repo.removeFavorite(tenantId, customerId, productId);
    expect(await repo.listFavorites(tenantId, customerId)).toEqual([]);
  });
});

describe('PgEngagementRepository — reviews', () => {
  it('upsertReview creates, then a second call updates rather than duplicating', async () => {
    const first = await repo.upsertReview(tenantId, customerId, 'Aygün', productId, { rating: 5, comment: 'Əla!' });
    const second = await repo.upsertReview(tenantId, customerId, 'Aygün', productId, { rating: 3, comment: 'Fikrimi dəyişdim' });
    expect(second.id).toBe(first.id);

    const reviews = await repo.listReviewsForProduct(tenantId, productId);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.rating).toBe(3);
  });
});

describe('PgEngagementRepository — inquiries', () => {
  it('creates an inquiry defaulting to open, listable for the customer', async () => {
    const inquiry = await repo.createInquiry(tenantId, customerId, { productId, message: 'Nə vaxt stokda olacaq?' });
    expect(inquiry.status).toBe('open');

    const listed = await repo.listInquiriesForCustomer(tenantId, customerId);
    expect(listed.some((i) => i.id === inquiry.id)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgEngagementRepository.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/modules/engagement/infrastructure/pgEngagementRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { EngagementRepository } from '../domain/engagementRepository';
import type { Favorite } from '../domain/favorite';
import type { Review, ReviewRequest } from '../domain/review';
import type { Inquiry, InquiryRequest } from '../domain/inquiry';
import { withTenant } from '../../../db/withTenant';

export class PgEngagementRepository implements EngagementRepository {
  constructor(private readonly pool: Pool) {}

  async listFavorites(tenantId: string, customerId: string): Promise<Favorite[]> {
    if (!tenantId) throw new Error('EngagementRepository.listFavorites requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT product_id, created_at FROM engagement.favorites WHERE tenant_id = $1 AND customer_id = $2', [tenantId, customerId]);
      return rows.map((r) => ({ productId: r.product_id, createdAt: r.created_at.toISOString() }));
    });
  }

  async addFavorite(tenantId: string, customerId: string, productId: string): Promise<Favorite> {
    if (!tenantId) throw new Error('EngagementRepository.addFavorite requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO engagement.favorites (tenant_id, customer_id, product_id) VALUES ($1, $2, $3)
         ON CONFLICT (customer_id, product_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id
         RETURNING product_id, created_at`,
        [tenantId, customerId, productId]
      );
      return { productId: rows[0].product_id, createdAt: rows[0].created_at.toISOString() };
    });
  }

  async removeFavorite(tenantId: string, customerId: string, productId: string): Promise<void> {
    if (!tenantId) throw new Error('EngagementRepository.removeFavorite requires a tenantId');
    await withTenant(this.pool, tenantId, (client) =>
      client.query('DELETE FROM engagement.favorites WHERE tenant_id = $1 AND customer_id = $2 AND product_id = $3', [tenantId, customerId, productId])
    );
  }

  async listReviewsForProduct(tenantId: string, productId: string): Promise<Review[]> {
    if (!tenantId) throw new Error('EngagementRepository.listReviewsForProduct requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `SELECT r.id, r.product_id, r.customer_id, c.name || ' ' || c.surname AS customer_name, r.rating, r.comment, r.created_at
         FROM engagement.reviews r JOIN customers.customers c ON c.id = r.customer_id
         WHERE r.tenant_id = $1 AND r.product_id = $2 ORDER BY r.created_at DESC`,
        [tenantId, productId]
      );
      return rows.map((r) => ({
        id: r.id, productId: r.product_id, customerId: r.customer_id, customerName: r.customer_name,
        rating: r.rating, comment: r.comment, createdAt: r.created_at.toISOString(),
      }));
    });
  }

  async upsertReview(tenantId: string, customerId: string, customerName: string, productId: string, input: ReviewRequest): Promise<Review> {
    if (!tenantId) throw new Error('EngagementRepository.upsertReview requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO engagement.reviews (tenant_id, customer_id, product_id, rating, comment) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (customer_id, product_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
         RETURNING id, created_at`,
        [tenantId, customerId, productId, input.rating, input.comment]
      );
      return {
        id: rows[0].id, productId, customerId, customerName,
        rating: input.rating, comment: input.comment, createdAt: rows[0].created_at.toISOString(),
      };
    });
  }

  async listInquiriesForCustomer(tenantId: string, customerId: string): Promise<Inquiry[]> {
    if (!tenantId) throw new Error('EngagementRepository.listInquiriesForCustomer requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM engagement.inquiries WHERE tenant_id = $1 AND customer_id = $2 ORDER BY created_at DESC', [tenantId, customerId]);
      return rows.map((r) => ({ id: r.id, productId: r.product_id, message: r.message, status: r.status, createdAt: r.created_at.toISOString() }));
    });
  }

  async createInquiry(tenantId: string, customerId: string, input: InquiryRequest): Promise<Inquiry> {
    if (!tenantId) throw new Error('EngagementRepository.createInquiry requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO engagement.inquiries (tenant_id, customer_id, product_id, message) VALUES ($1, $2, $3, $4) RETURNING *`,
        [tenantId, customerId, input.productId, input.message]
      );
      return { id: rows[0].id, productId: rows[0].product_id, message: rows[0].message, status: rows[0].status, createdAt: rows[0].created_at.toISOString() };
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgEngagementRepository.test`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/engagement/infrastructure
git commit -m "feat: add PgEngagementRepository (favorites/reviews/inquiries)"
git push origin develop
```

---

## Task 5: Engagement routes, wire into `server.ts`, verify live end-to-end

**Files:**
- Create: `backend/src/modules/engagement/presentation/engagementRoutes.ts`
- Create: `backend/src/modules/engagement/presentation/engagementRoutes.test.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `EngagementService` (Task 3), `customerAuth`.
- Produces: `engagementRoutes(engagementService): Router` mounting:
  - `GET /favorites`, `POST /favorites/:productId`, `DELETE /favorites/:productId` (all behind `customerAuth`)
  - `GET /products/:id/reviews` (public — no `customerAuth`), `POST /products/:id/reviews` (behind `customerAuth`)
  - `GET /inquiries`, `POST /inquiries` (behind `customerAuth`)

- [ ] **Step 1: Write the failing test**

`backend/src/modules/engagement/presentation/engagementRoutes.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { customerAuth } from '../../../middleware/customerAuth';
import { errorHandler } from '../../../middleware/errorHandler';
import { engagementRoutes } from './engagementRoutes';
import { EngagementService } from '../domain/engagementService';
import { signCustomerToken } from '../../../lib/jwt';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { CustomerRepository } from '../../customers/domain/customerRepository';
import type { EngagementRepository } from '../domain/engagementRepository';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };
const CUSTOMER = { id: 'cust1', tenantId: 't1', name: 'Aygün', surname: 'Məmmədova', address: 'Bakı', email: 'a@example.com', phone: null, passwordHash: 'h', role: 'user' as const, type: 'physical' as const, createdAt: '2026-08-15T00:00:00.000Z' };

function authHeader() {
  return { Authorization: `Bearer ${signCustomerToken({ customerId: 'cust1', tenantId: 't1' })}` };
}

function buildApp() {
  const favorites: any[] = [];
  const reviews: any[] = [];
  const inquiries: any[] = [];
  const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
  const customerRepository: CustomerRepository = { findByTenantAndEmail: vi.fn(), findById: vi.fn(async () => CUSTOMER), create: vi.fn() };
  const engagementRepository: EngagementRepository = {
    listFavorites: vi.fn(async () => favorites),
    addFavorite: vi.fn(async (tenantId, customerId, productId) => {
      const fav = { productId, createdAt: '2026-08-17T00:00:00.000Z' };
      favorites.push(fav);
      return fav;
    }),
    removeFavorite: vi.fn(async (tenantId, customerId, productId) => {
      const idx = favorites.findIndex((f) => f.productId === productId);
      if (idx >= 0) favorites.splice(idx, 1);
    }),
    listReviewsForProduct: vi.fn(async () => reviews),
    upsertReview: vi.fn(async (tenantId, customerId, customerName, productId, input) => {
      const review = { id: 'r1', productId, customerId, customerName, rating: input.rating, comment: input.comment, createdAt: '2026-08-17T00:00:00.000Z' };
      reviews.push(review);
      return review;
    }),
    listInquiriesForCustomer: vi.fn(async () => inquiries),
    createInquiry: vi.fn(async (tenantId, customerId, input) => {
      const inquiry = { id: 'i1', productId: input.productId, message: input.message, status: 'open' as const, createdAt: '2026-08-17T00:00:00.000Z' };
      inquiries.push(inquiry);
      return inquiry;
    }),
  };
  const engagementService = new EngagementService(engagementRepository);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantResolve(tenantRepository));
  app.use(engagementRoutes(engagementService, customerRepository));
  app.use(errorHandler);
  return app;
}

describe('favorites routes', () => {
  it('requires login for all favorites routes', async () => {
    const app = buildApp();
    expect((await request(app).get('/favorites').set('Host', 'shop-a.platform.test')).status).toBe(401);
    expect((await request(app).post('/favorites/p1').set('Host', 'shop-a.platform.test')).status).toBe(401);
  });

  it('add then list then remove a favorite', async () => {
    const app = buildApp();
    await request(app).post('/favorites/p1').set('Host', 'shop-a.platform.test').set(authHeader());
    const listed = await request(app).get('/favorites').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(listed.body.favorites).toHaveLength(1);

    await request(app).delete('/favorites/p1').set('Host', 'shop-a.platform.test').set(authHeader());
    const afterRemove = await request(app).get('/favorites').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(afterRemove.body.favorites).toHaveLength(0);
  });
});

describe('review routes', () => {
  it('GET /products/:id/reviews is public (no login required)', async () => {
    const app = buildApp();
    const res = await request(app).get('/products/p1/reviews').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(200);
  });

  it('POST /products/:id/reviews requires login and attaches the real customer name', async () => {
    const app = buildApp();
    const res = await request(app).post('/products/p1/reviews').set('Host', 'shop-a.platform.test').set(authHeader()).send({ rating: 5, comment: 'Əla!' });
    expect(res.status).toBe(200);
    expect(res.body.customerName).toBe('Aygün Məmmədova');
  });
});

describe('inquiry routes', () => {
  it('POST /inquiries requires login, GET /inquiries lists only the caller\'s own', async () => {
    const app = buildApp();
    const postRes = await request(app).post('/inquiries').set('Host', 'shop-a.platform.test').set(authHeader()).send({ productId: 'p1', message: 'Nə vaxt stokda olacaq?' });
    expect(postRes.status).toBe(201);

    const listRes = await request(app).get('/inquiries').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(listRes.body.inquiries).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- engagementRoutes.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the routes**

`backend/src/modules/engagement/presentation/engagementRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { reviewRequestSchema, inquiryRequestSchema } from '@shop-platform/shared-types';
import type { EngagementService } from '../domain/engagementService';
import type { CustomerRepository } from '../../customers/domain/customerRepository';
import { customerAuth } from '../../../middleware/customerAuth';
import { MissingTenantScopeError } from '../../../middleware/errors';

export function engagementRoutes(engagementService: EngagementService, customerRepository: CustomerRepository): Router {
  const router = Router();
  const requireAuth = customerAuth(customerRepository);

  function requireScope(req: Request): { tenantId: string; customerId: string } {
    if (!req.tenant) throw new MissingTenantScopeError('engagementRoutes: req.tenant not set');
    if (!req.customer) throw new Error('engagementRoutes: req.customer not set — is customerAuth mounted?');
    return { tenantId: req.tenant.id, customerId: req.customer.id };
  }

  router.get('/favorites', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const favorites = await engagementService.listFavorites(tenantId, customerId);
    res.status(200).json({ favorites });
  });

  router.post('/favorites/:productId', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const favorite = await engagementService.addFavorite(tenantId, customerId, req.params.productId);
    res.status(201).json(favorite);
  });

  router.delete('/favorites/:productId', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    await engagementService.removeFavorite(tenantId, customerId, req.params.productId);
    res.status(204).send();
  });

  router.get('/products/:id/reviews', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('engagementRoutes: req.tenant not set');
    const reviews = await engagementService.listReviewsForProduct(req.tenant.id, req.params.id);
    res.status(200).json({ reviews });
  });

  router.post('/products/:id/reviews', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const parsed = reviewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }
    // customerName always comes from req.customer (the verified session), never the request body.
    const customerName = `${req.customer!.name} ${req.customer!.surname}`;
    const review = await engagementService.submitReview(tenantId, customerId, customerName, req.params.id, parsed.data);
    res.status(200).json(review);
  });

  router.get('/inquiries', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const inquiries = await engagementService.listInquiriesForCustomer(tenantId, customerId);
    res.status(200).json({ inquiries });
  });

  router.post('/inquiries', requireAuth, async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const parsed = inquiryRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }
    const inquiry = await engagementService.createInquiry(tenantId, customerId, parsed.data);
    res.status(201).json(inquiry);
  });

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes, then wire into `server.ts`**

Run: `npm test --workspace=backend -- engagementRoutes.test`
Expected: PASS (6 tests)

Modify `backend/src/server.ts` — add imports:
```typescript
import { PgEngagementRepository } from './modules/engagement/infrastructure/pgEngagementRepository';
import { EngagementService } from './modules/engagement/domain/engagementService';
import { engagementRoutes } from './modules/engagement/presentation/engagementRoutes';
```

Add after the existing repository/service instantiations:
```typescript
const engagementRepository = new PgEngagementRepository(pool);
const engagementService = new EngagementService(engagementRepository);
```

Add after the existing order-routes line:
```typescript
app.use(engagementRoutes(engagementService, customerRepository));
```
(Unlike `cartRoutes`/`orderRoutes`, `engagementRoutes` takes `customerAuth` per-route internally rather than for the whole router — see Task 5 Step 3's code — because `GET /products/:id/reviews` must stay public while its sibling routes don't. Do NOT wrap this whole `app.use(...)` call in an app-level `customerAuth(...)` middleware the way the cart/order routes are — that would incorrectly require login just to read reviews.)

- [ ] **Step 5: Run the full test suite, then manually verify live**

```bash
TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend
```
Expected: all green, no regressions across all nine epics so far.

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev --workspace=backend &> /tmp/api.log &
for i in $(seq 1 30); do curl -sf http://localhost:8080/health > /dev/null && break; sleep 1; done

curl -s -c /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"correct horse battery"}' \
  http://localhost:8080/customers/login > /dev/null

PRODUCT_ID=$(curl -s -H "Host: texnogallery.localhost" http://localhost:8080/products | python3 -c 'import sys,json; print(json.load(sys.stdin)["products"][0]["id"])')

echo "--- favorite it ---"
curl -s -w "\nHTTP %{http_code}\n" -b /tmp/cookies.txt -H "Host: texnogallery.localhost" -X POST "http://localhost:8080/favorites/$PRODUCT_ID"

echo "--- review it ---"
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Əla məhsuldur!"}' \
  "http://localhost:8080/products/$PRODUCT_ID/reviews"
echo

echo "--- reviews are public (no cookie) ---"
curl -s -H "Host: texnogallery.localhost" "http://localhost:8080/products/$PRODUCT_ID/reviews"
echo

echo "--- send an inquiry ---"
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"message\":\"Bu məhsul başqa rəngdə varmı?\"}" \
  http://localhost:8080/inquiries
echo

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```
Expected: favorite returns 201; review returns 200 with the real customer's name attached (not client-supplied); the public reviews GET (no cookie) still returns the review; inquiry returns 201.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/engagement/presentation backend/src/server.ts
git commit -m "feat: add favorites/reviews/inquiries routes, wire into server.ts, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against spec §2/§4):
- Favorites (toggle + list): Tasks 2-5 ✅
- Reviews (comments + ratings, public read / authed write): Tasks 2-5 ✅ — one review per (customer, product), upsert semantics (spec didn't specify multiple reviews per customer per product, and allowing unlimited duplicates would be a stranger default)
- Product Inquiry ("Müraciət"): Tasks 2-5 ✅ — customer can create + see their own, tenant-side response explicitly NOT built (Phase 3, per spec §2's own scoping)
- "Profile" page (My Comments, My Favorites, My Requests) — explicitly NOT built here; this plan ships the APIs a Profile page would call (`GET /favorites`, `GET /inquiries`, and reviews are reachable per-product), the aggregating storefront UI itself is separate follow-up frontend work, consistent with every prior plan's backend-first pattern.
- Sliders (Hero/Product gallery) — explicitly NOT built here; these are Component Registry variants (new `hero`/`productGallery` component types + React implementations), a Component Registry & Layout System follow-up, not a new backend module.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `Favorite`/`Review`/`ReviewRequest`/`Inquiry`/`InquiryRequest` defined once in `packages/shared-types` (Task 1), used unchanged through domain → infrastructure → presentation. `EngagementRepository`'s 7 methods declared in Task 3 are implemented with matching signatures in Task 4 and consumed unchanged by Task 5's routes.
