# Shop Platform — Phase 1 Customer Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `customers` module end-to-end (registration, login, session verification) as backend API endpoints, callable and demonstrable via HTTP exactly like the Foundation plan's `GET /branches`. This is the second of 5 plans implementing the [Phase 1 design spec](../specs/2026-08-15-shop-platform-phase1-design.md), building on the [Foundation plan](2026-08-15-shop-platform-phase1-foundation.md)'s repo, migration runner, `withTenant`/RLS mechanism, and tenant-resolve middleware.

**Scope note:** This plan is **backend-only**. The storefront's actual Register/Login *pages* (spec §4's "Account" component category) are not built here — there is no Next.js `storefront` app yet (it's scaffolded in the next plan, Catalog & Component System, alongside the Component Registry those pages will be built with, so account pages aren't built once now and rebuilt later against that system). This plan ends with fully working, tested API endpoints a future storefront simply calls.

**Architecture:** Follows the Foundation plan's established shape exactly: a `customers` module under `backend/src/modules/customers/` with `domain/infrastructure/presentation` Clean Architecture layers, a new `customers.customers` table with the same RLS pattern as `tenants.branches`, and a new `customerAuth` middleware (parallel to `tenantResolve`) that later plans (Cart/Checkout/Orders, Engagement) will reuse to protect their own routes.

**Tech Stack:** Adds `bcryptjs` (pure-JS password hashing — no native compilation, avoids build-environment risk), `jsonwebtoken` (JWT sign/verify), `cookie-parser` (reads the httpOnly cookie `customerAuth` checks) to the existing TypeScript/Express/`pg`/Vitest/Supertest stack.

## Global Constraints

- Every tenant-owned table has a `tenant_id` column; no query bypasses the repository layer (spec §3).
- `domain/` files never import Express, `pg`, `bcryptjs`, or `jsonwebtoken` directly — only the interfaces they define; `infrastructure/` implements those interfaces (spec §7).
- Passwords are hashed before storage, never stored or logged in plaintext (spec §3a).
- `role` defaults to `user`, `type` defaults to `physical` for every Phase 1 registration — both fields exist but aren't user-selectable yet (spec §3a).
- Customer accounts are tenant-scoped: `(tenant_id, email)` unique, not `email` alone (spec §3a).
- JWT delivery is not locked to one mechanism — httpOnly cookie by default, `Authorization: Bearer` header also accepted on the same endpoints (spec §3a).
- The app connects to Postgres as the non-superuser `shop_platform_app` role (see Foundation plan's `backend/src/db/setup-role.sql`) — RLS must actually be exercised by tests, not bypassed.
- Repository layer throws (never silently returns unscoped data) if called without a `tenantId` (spec §8).

---

## File Structure

```
backend/
├── package.json                              # add bcryptjs, jsonwebtoken, cookie-parser + their @types
├── .env.example                               # add JWT_SECRET
└── src/
    ├── server.ts                              # mount cookie-parser + customerRoutes
    ├── lib/
    │   ├── jwt.ts                              # sign/verify wrapper
    │   └── jwt.test.ts
    ├── middleware/
    │   ├── customerAuth.ts                     # verifies JWT (cookie or header), attaches req.customer
    │   └── customerAuth.test.ts
    ├── db/
    │   ├── migrations/
    │   │   └── 0004_customers_table.sql
    │   └── setup-role.sql                      # extended: grants for the customers schema
    └── modules/
        └── customers/
            ├── domain/
            │   ├── customer.ts                 # public-safe Customer type (re-exports shared-types)
            │   ├── customerRecord.ts            # internal shape incl. passwordHash — domain-only, never serialized
            │   ├── customerRepository.ts
            │   ├── passwordHasher.ts            # interface
            │   └── customerService.ts           # register() + authenticate() business rules
            ├── infrastructure/
            │   ├── pgCustomerRepository.ts
            │   ├── pgCustomerRepository.test.ts
            │   ├── bcryptPasswordHasher.ts
            │   └── bcryptPasswordHasher.test.ts
            └── presentation/
                ├── customerDto.ts               # zod request schemas
                ├── customerController.ts        # register, login, me
                ├── customerRoutes.ts
                └── customerRoutes.test.ts

packages/shared-types/src/
├── customer.ts                                 # Customer type + registerRequestSchema/loginRequestSchema
└── customer.test.ts
```

---

## Task 1: Shared Customer types

**Files:**
- Create: `packages/shared-types/src/customer.ts`
- Create: `packages/shared-types/src/customer.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Customer` type (id, tenantId, name, surname, address, email, phone nullable, role, type, createdAt — **no passwordHash**), `registerRequestSchema`, `loginRequestSchema` zod schemas, exported from `@shop-platform/shared-types`. Task 5's domain layer and Task 9's DTO layer both import these.

- [ ] **Step 1: Write the failing test**

`packages/shared-types/src/customer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { customerSchema, registerRequestSchema, loginRequestSchema } from './customer';

describe('customerSchema', () => {
  it('accepts a valid customer with no phone', () => {
    const result = customerSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      name: 'Aygün',
      surname: 'Məmmədova',
      address: 'Bakı, Nərimanov r.',
      email: 'aygun@example.com',
      phone: null,
      role: 'user',
      type: 'physical',
      createdAt: '2026-08-15T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = customerSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      tenantId: '22222222-2222-2222-2222-222222222222',
      name: 'Aygün',
      surname: 'Məmmədova',
      address: 'Bakı',
      email: 'not-an-email',
      phone: null,
      role: 'user',
      type: 'physical',
      createdAt: '2026-08-15T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerRequestSchema', () => {
  it('accepts a valid registration payload with no phone', () => {
    const result = registerRequestSchema.safeParse({
      name: 'Aygün',
      surname: 'Məmmədova',
      address: 'Bakı, Nərimanov r.',
      email: 'aygun@example.com',
      password: 'correct horse battery staple',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerRequestSchema.safeParse({
      name: 'Aygün',
      surname: 'Məmmədova',
      address: 'Bakı',
      email: 'aygun@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginRequestSchema', () => {
  it('accepts email + password', () => {
    const result = loginRequestSchema.safeParse({ email: 'aygun@example.com', password: 'anything' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing password', () => {
    const result = loginRequestSchema.safeParse({ email: 'aygun@example.com' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from repo root): `npm test --workspace=packages/shared-types -- customer.test`
Expected: FAIL with "Cannot find module './customer'"

- [ ] **Step 3: Write minimal implementation**

`packages/shared-types/src/customer.ts`:
```typescript
import { z } from 'zod';

export const customerSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  surname: z.string().min(1),
  address: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.literal('user'),
  type: z.literal('physical'),
  createdAt: z.string().datetime(),
});

export type Customer = z.infer<typeof customerSchema>;

export const registerRequestSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  address: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  password: z.string().min(8),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
```

`packages/shared-types/src/index.ts` (append):
```typescript
export * from './tenant';
export * from './customer';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=packages/shared-types -- customer.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared Customer types and register/login request schemas"
git push origin develop
```

---

## Task 2: `customers.customers` table migration + RLS + role grants

**Files:**
- Create: `backend/src/db/migrations/0004_customers_table.sql`
- Modify: `backend/src/db/setup-role.sql`
- Test: `backend/src/db/migrations.customers.test.ts`

**Interfaces:**
- Produces: `customers.customers` table (`id`, `tenant_id`, `name`, `surname`, `address`, `email`, `phone` nullable, `password_hash`, `role`, `type`, `created_at`), unique on `(tenant_id, email)`, RLS enforced. Task 6's `PgCustomerRepository` queries this table.

- [ ] **Step 1: Write the failing test**

`backend/src/db/migrations.customers.test.ts`:
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
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('cust-tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('cust-tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('customers.customers table', () => {
  it('enforces (tenant_id, email) uniqueness but allows the same email across two different tenants', async () => {
    await withTenant(pool, tenantAId, (client) =>
      client.query(
        `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash, role, type)
         VALUES ($1, 'Aygün', 'Məmmədova', 'Bakı', 'shared@example.com', NULL, 'hash', 'user', 'physical')`,
        [tenantAId]
      )
    );

    // Same email, same tenant -> must fail
    await expect(
      withTenant(pool, tenantAId, (client) =>
        client.query(
          `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash, role, type)
           VALUES ($1, 'Someone', 'Else', 'Bakı', 'shared@example.com', NULL, 'hash', 'user', 'physical')`,
          [tenantAId]
        )
      )
    ).rejects.toThrow();

    // Same email, different tenant -> must succeed
    await expect(
      withTenant(pool, tenantBId, (client) =>
        client.query(
          `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash, role, type)
           VALUES ($1, 'Someone', 'Else', 'Gəncə', 'shared@example.com', NULL, 'hash', 'user', 'physical')`,
          [tenantBId]
        )
      )
    ).resolves.toBeDefined();
  });

  it('RLS: tenant A cannot see tenant B\'s customers', async () => {
    const asTenantA = await withTenant(pool, tenantAId, (client) =>
      client.query('SELECT email FROM customers.customers WHERE tenant_id = $1', [tenantBId])
    );
    expect(asTenantA.rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.customers.test`
Expected: FAIL — `relation "customers.customers" does not exist`

- [ ] **Step 3: Write the migration**

`backend/src/db/migrations/0004_customers_table.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS customers;

CREATE TABLE customers.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role = 'user'),
    type TEXT NOT NULL DEFAULT 'physical' CHECK (type = 'physical'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_customers_tenant_id ON customers.customers (tenant_id);

ALTER TABLE customers.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers.customers FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers.customers
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Extend the role-grants script**

Modify `backend/src/db/setup-role.sql` — add after the `tenants` schema grants block:
```sql
-- customers schema (added by the Customer Auth plan)
GRANT USAGE ON SCHEMA customers TO shop_platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA customers TO shop_platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA customers GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_platform_app;
```

Then apply it to both live databases (this script is meant to be re-run after schema-adding migrations, per its own header comment):
```bash
psql -d shop_platform -f backend/src/db/setup-role.sql
psql -d shop_platform_test -f backend/src/db/setup-role.sql
```

- [ ] **Step 5: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.customers.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/0004_customers_table.sql backend/src/db/setup-role.sql backend/src/db/migrations.customers.test.ts
git commit -m "feat: add customers.customers table migration with RLS and role grants"
git push origin develop
```

---

## Task 3: Password hasher (domain interface + bcryptjs infrastructure)

**Files:**
- Create: `backend/src/modules/customers/domain/passwordHasher.ts`
- Create: `backend/src/modules/customers/infrastructure/bcryptPasswordHasher.ts`
- Test: `backend/src/modules/customers/infrastructure/bcryptPasswordHasher.test.ts`
- Modify: `backend/package.json` (add `bcryptjs`, `@types/bcryptjs`)

**Interfaces:**
- Produces: `PasswordHasher { hash(plain: string): Promise<string>; verify(plain: string, hash: string): Promise<boolean> }` interface, and `BcryptPasswordHasher implements PasswordHasher`. Task 5's `customerService` depends on the interface only.

- [ ] **Step 1: Add the dependency**

Add to `backend/package.json` `dependencies`: `"bcryptjs": "^2.4.3"`; to `devDependencies`: `"@types/bcryptjs": "^2.4.6"`. Run `npm install` from repo root.

- [ ] **Step 2: Write the failing test**

`backend/src/modules/customers/infrastructure/bcryptPasswordHasher.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { BcryptPasswordHasher } from './bcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('hashes a password and verifies it against the same plaintext', async () => {
    const hash = await hasher.hash('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    await expect(hasher.verify('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects the wrong plaintext', async () => {
    const hash = await hasher.hash('correct horse battery staple');
    await expect(hasher.verify('wrong password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (salted)', async () => {
    const hash1 = await hasher.hash('same password');
    const hash2 = await hasher.hash('same password');
    expect(hash1).not.toBe(hash2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test --workspace=backend -- bcryptPasswordHasher.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 4: Write the domain interface and infrastructure implementation**

`backend/src/modules/customers/domain/passwordHasher.ts`:
```typescript
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
```

`backend/src/modules/customers/infrastructure/bcryptPasswordHasher.ts`:
```typescript
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../domain/passwordHasher';

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend -- bcryptPasswordHasher.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/modules/customers/domain/passwordHasher.ts backend/src/modules/customers/infrastructure/bcryptPasswordHasher.ts backend/src/modules/customers/infrastructure/bcryptPasswordHasher.test.ts
git commit -m "feat: add PasswordHasher interface + bcryptjs implementation"
git push origin develop
```

---

## Task 4: JWT sign/verify utility

**Files:**
- Create: `backend/src/lib/jwt.ts`
- Create: `backend/src/lib/jwt.test.ts`
- Modify: `backend/package.json` (add `jsonwebtoken`, `@types/jsonwebtoken`)
- Modify: `backend/.env.example` (add `JWT_SECRET`)

**Interfaces:**
- Produces: `signCustomerToken(payload: { customerId: string; tenantId: string }): string` and `verifyCustomerToken(token: string): { customerId: string; tenantId: string } | null` (returns `null` instead of throwing on invalid/expired/tampered tokens — callers branch on this, don't need try/catch). Task 7's `customerAuth` middleware and Task 9's login route both use this.

- [ ] **Step 1: Add the dependency and env var**

Add to `backend/package.json` `dependencies`: `"jsonwebtoken": "^9.0.2"`; to `devDependencies`: `"@types/jsonwebtoken": "^9.0.7"`. Run `npm install` from repo root.

Add to `backend/.env.example` and your local `backend/.env`:
```
JWT_SECRET=dev-only-change-me
```

- [ ] **Step 2: Write the failing test**

`backend/src/lib/jwt.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('signCustomerToken / verifyCustomerToken', () => {
  it('round-trips a valid payload', async () => {
    const { signCustomerToken, verifyCustomerToken } = await import('./jwt');
    const token = signCustomerToken({ customerId: 'c1', tenantId: 't1' });
    const payload = verifyCustomerToken(token);
    expect(payload).toEqual({ customerId: 'c1', tenantId: 't1' });
  });

  it('returns null for a tampered token', async () => {
    const { signCustomerToken, verifyCustomerToken } = await import('./jwt');
    const token = signCustomerToken({ customerId: 'c1', tenantId: 't1' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(verifyCustomerToken(tampered)).toBeNull();
  });

  it('returns null for garbage input', async () => {
    const { verifyCustomerToken } = await import('./jwt');
    expect(verifyCustomerToken('not-a-jwt-at-all')).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test --workspace=backend -- jwt.test`
Expected: FAIL — `./jwt` doesn't exist yet

- [ ] **Step 4: Write minimal implementation**

`backend/src/lib/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';

export interface CustomerTokenPayload {
  customerId: string;
  tenantId: string;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function signCustomerToken(payload: CustomerTokenPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === 'string') return null;
    const { customerId, tenantId } = decoded as Record<string, unknown>;
    if (typeof customerId !== 'string' || typeof tenantId !== 'string') return null;
    return { customerId, tenantId };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend -- jwt.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/.env.example backend/src/lib
git commit -m "feat: add JWT sign/verify utility for customer sessions"
git push origin develop
```

---

## Task 5: `customers` module — domain layer (`customerService`)

**Files:**
- Create: `backend/src/modules/customers/domain/customer.ts`
- Create: `backend/src/modules/customers/domain/customerRecord.ts`
- Create: `backend/src/modules/customers/domain/customerRepository.ts`
- Create: `backend/src/modules/customers/domain/customerService.ts`
- Test: `backend/src/modules/customers/domain/customerService.test.ts`

**Interfaces:**
- Consumes: `PasswordHasher` (Task 3), `Customer` shared type (Task 1).
- Produces:
  - `CustomerRepository.findByTenantAndEmail(tenantId, email): Promise<CustomerRecord | null>`
  - `CustomerRepository.findById(tenantId, id): Promise<CustomerRecord | null>`
  - `CustomerRepository.create(tenantId, input: {name,surname,address,email,phone,passwordHash}): Promise<CustomerRecord>`
  - `CustomerService.register(tenantId, input: RegisterRequest): Promise<Customer>` — throws `DuplicateEmailError` if `(tenantId, email)` already exists
  - `CustomerService.authenticate(tenantId, email, password): Promise<Customer | null>` — `null` on any failure (unknown email or wrong password — deliberately not distinguished, to avoid leaking which one was wrong)

  Task 6's `PgCustomerRepository` implements `CustomerRepository` with matching signatures. Task 9's `customerController` calls `CustomerService.register`/`authenticate`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/customers/domain/customerService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { CustomerService, DuplicateEmailError } from './customerService';
import type { CustomerRepository } from './customerRepository';
import type { PasswordHasher } from './passwordHasher';
import type { CustomerRecord } from './customerRecord';

function fakeRepo(existing: CustomerRecord[] = []): CustomerRepository {
  return {
    findByTenantAndEmail: vi.fn(async (tenantId, email) =>
      existing.find((c) => c.tenantId === tenantId && c.email === email) ?? null
    ),
    findById: vi.fn(async (tenantId, id) => existing.find((c) => c.tenantId === tenantId && c.id === id) ?? null),
    create: vi.fn(async (tenantId, input) => ({
      id: 'new-id',
      tenantId,
      name: input.name,
      surname: input.surname,
      address: input.address,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      role: 'user',
      type: 'physical',
      createdAt: '2026-08-15T00:00:00.000Z',
    })),
  };
}

const fakeHasher: PasswordHasher = {
  hash: vi.fn(async (plain) => `hashed:${plain}`),
  verify: vi.fn(async (plain, hash) => hash === `hashed:${plain}`),
};

describe('CustomerService.register', () => {
  it('hashes the password and never stores it in plaintext', async () => {
    const repo = fakeRepo();
    const service = new CustomerService(repo, fakeHasher);
    await service.register('t1', { name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', password: 'plaintext-pw' });
    expect(repo.create).toHaveBeenCalledWith('t1', expect.objectContaining({ passwordHash: 'hashed:plaintext-pw' }));
    const createCall = (repo.create as any).mock.calls[0][1];
    expect(createCall.password).toBeUndefined();
  });

  it('returns a Customer with no passwordHash field on it', async () => {
    const repo = fakeRepo();
    const service = new CustomerService(repo, fakeHasher);
    const customer = await service.register('t1', { name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', password: 'plaintext-pw' });
    expect((customer as any).passwordHash).toBeUndefined();
    expect(customer.role).toBe('user');
    expect(customer.type).toBe('physical');
  });

  it('rejects a duplicate (tenantId, email) with DuplicateEmailError', async () => {
    const repo = fakeRepo([
      { id: 'existing', tenantId: 't1', name: 'X', surname: 'Y', address: 'Z', email: 'a@example.com', phone: null, passwordHash: 'h', role: 'user', type: 'physical', createdAt: '2026-08-15T00:00:00.000Z' },
    ]);
    const service = new CustomerService(repo, fakeHasher);
    await expect(
      service.register('t1', { name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', password: 'plaintext-pw' })
    ).rejects.toThrow(DuplicateEmailError);
  });

  it('allows the same email under a different tenant', async () => {
    const repo = fakeRepo([
      { id: 'existing', tenantId: 't2', name: 'X', surname: 'Y', address: 'Z', email: 'a@example.com', phone: null, passwordHash: 'h', role: 'user', type: 'physical', createdAt: '2026-08-15T00:00:00.000Z' },
    ]);
    const service = new CustomerService(repo, fakeHasher);
    await expect(
      service.register('t1', { name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', password: 'plaintext-pw' })
    ).resolves.toBeDefined();
  });
});

describe('CustomerService.authenticate', () => {
  it('returns the Customer on correct credentials', async () => {
    const repo = fakeRepo([
      { id: 'c1', tenantId: 't1', name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', phone: null, passwordHash: 'hashed:secret123', role: 'user', type: 'physical', createdAt: '2026-08-15T00:00:00.000Z' },
    ]);
    const service = new CustomerService(repo, fakeHasher);
    const customer = await service.authenticate('t1', 'a@example.com', 'secret123');
    expect(customer?.id).toBe('c1');
  });

  it('returns null for a wrong password', async () => {
    const repo = fakeRepo([
      { id: 'c1', tenantId: 't1', name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', phone: null, passwordHash: 'hashed:secret123', role: 'user', type: 'physical', createdAt: '2026-08-15T00:00:00.000Z' },
    ]);
    const service = new CustomerService(repo, fakeHasher);
    expect(await service.authenticate('t1', 'a@example.com', 'wrong')).toBeNull();
  });

  it('returns null for an unknown email (not a distinct error, to avoid leaking which)', async () => {
    const service = new CustomerService(fakeRepo(), fakeHasher);
    expect(await service.authenticate('t1', 'nobody@example.com', 'whatever')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- customerService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/customers/domain/customer.ts`:
```typescript
export type { Customer } from '@shop-platform/shared-types';
```

`backend/src/modules/customers/domain/customerRecord.ts`:
```typescript
import type { Customer } from './customer';

// Internal-only shape: includes passwordHash. NEVER return this from an API
// response or log it — customerService.toPublicCustomer() strips it.
export interface CustomerRecord extends Customer {
  passwordHash: string;
}
```

`backend/src/modules/customers/domain/customerRepository.ts`:
```typescript
import type { CustomerRecord } from './customerRecord';

export interface CustomerRepository {
  findByTenantAndEmail(tenantId: string, email: string): Promise<CustomerRecord | null>;
  findById(tenantId: string, id: string): Promise<CustomerRecord | null>;
  create(
    tenantId: string,
    input: { name: string; surname: string; address: string; email: string; phone: string | null; passwordHash: string }
  ): Promise<CustomerRecord>;
}
```

`backend/src/modules/customers/domain/customerService.ts`:
```typescript
import type { RegisterRequest } from '@shop-platform/shared-types';
import type { Customer } from './customer';
import type { CustomerRecord } from './customerRecord';
import type { CustomerRepository } from './customerRepository';
import type { PasswordHasher } from './passwordHasher';

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A customer with email ${email} already exists for this tenant`);
    this.name = 'DuplicateEmailError';
  }
}

function toPublicCustomer(record: CustomerRecord): Customer {
  const { passwordHash: _passwordHash, ...publicCustomer } = record;
  return publicCustomer;
}

export class CustomerService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async register(tenantId: string, input: RegisterRequest): Promise<Customer> {
    const existing = await this.repository.findByTenantAndEmail(tenantId, input.email);
    if (existing) throw new DuplicateEmailError(input.email);

    const passwordHash = await this.passwordHasher.hash(input.password);
    const record = await this.repository.create(tenantId, {
      name: input.name,
      surname: input.surname,
      address: input.address,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
    });
    return toPublicCustomer(record);
  }

  async authenticate(tenantId: string, email: string, password: string): Promise<Customer | null> {
    const record = await this.repository.findByTenantAndEmail(tenantId, email);
    if (!record) return null;

    const valid = await this.passwordHasher.verify(password, record.passwordHash);
    if (!valid) return null;

    return toPublicCustomer(record);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- customerService.test`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/customers/domain
git commit -m "feat: add customers module domain layer (CustomerService register/authenticate)"
git push origin develop
```

---

## Task 6: `customers` module — infrastructure layer (`PgCustomerRepository`)

**Files:**
- Create: `backend/src/modules/customers/infrastructure/pgCustomerRepository.ts`
- Test: `backend/src/modules/customers/infrastructure/pgCustomerRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant` (Foundation Task 4), `customers.customers` table (Task 2).
- Produces: `PgCustomerRepository implements CustomerRepository`. Task 9's routes wire this to `CustomerService`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/customers/infrastructure/pgCustomerRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgCustomerRepository } from './pgCustomerRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const customerRepo = new PgCustomerRepository(pool);

let tenantId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'customer-repo-test', name: 'Customer Repo Test Shop' });
  tenantId = tenant.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgCustomerRepository', () => {
  it('creates a customer and finds it by tenant+email', async () => {
    const created = await customerRepo.create(tenantId, {
      name: 'Aygün', surname: 'Məmmədova', address: 'Bakı', email: 'repo-test@example.com', phone: null, passwordHash: 'hash',
    });
    expect(created.email).toBe('repo-test@example.com');
    expect(created.role).toBe('user');
    expect(created.type).toBe('physical');

    const found = await customerRepo.findByTenantAndEmail(tenantId, 'repo-test@example.com');
    expect(found?.id).toBe(created.id);
  });

  it('finds a customer by id, scoped to the right tenant', async () => {
    const created = await customerRepo.create(tenantId, {
      name: 'A', surname: 'B', address: 'Bakı', email: 'by-id-test@example.com', phone: null, passwordHash: 'hash',
    });
    const found = await customerRepo.findById(tenantId, created.id);
    expect(found?.email).toBe('by-id-test@example.com');
  });

  it('returns null for an email that does not exist under this tenant', async () => {
    const found = await customerRepo.findByTenantAndEmail(tenantId, 'does-not-exist@example.com');
    expect(found).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgCustomerRepository.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/modules/customers/infrastructure/pgCustomerRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { CustomerRecord } from '../domain/customerRecord';
import type { CustomerRepository } from '../domain/customerRepository';
import { withTenant } from '../../../db/withTenant';

function toRecord(row: any): CustomerRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    surname: row.surname,
    address: row.address,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    type: row.type,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgCustomerRepository implements CustomerRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenantAndEmail(tenantId: string, email: string): Promise<CustomerRecord | null> {
    if (!tenantId) throw new Error('CustomerRepository.findByTenantAndEmail requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM customers.customers WHERE tenant_id = $1 AND email = $2', [tenantId, email]);
      return rows[0] ? toRecord(rows[0]) : null;
    });
  }

  async findById(tenantId: string, id: string): Promise<CustomerRecord | null> {
    if (!tenantId) throw new Error('CustomerRepository.findById requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM customers.customers WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
      return rows[0] ? toRecord(rows[0]) : null;
    });
  }

  async create(
    tenantId: string,
    input: { name: string; surname: string; address: string; email: string; phone: string | null; passwordHash: string }
  ): Promise<CustomerRecord> {
    if (!tenantId) throw new Error('CustomerRepository.create requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [tenantId, input.name, input.surname, input.address, input.email, input.phone, input.passwordHash]
      );
      return toRecord(rows[0]);
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgCustomerRepository.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/customers/infrastructure/pgCustomerRepository.ts backend/src/modules/customers/infrastructure/pgCustomerRepository.test.ts
git commit -m "feat: add PgCustomerRepository"
git push origin develop
```

---

## Task 7: `customerAuth` middleware

**Files:**
- Create: `backend/src/middleware/customerAuth.ts`
- Test: `backend/src/middleware/customerAuth.test.ts`
- Modify: `backend/package.json` (add `cookie-parser`, `@types/cookie-parser`)

**Interfaces:**
- Consumes: `verifyCustomerToken` (Task 4), `CustomerRepository` (Task 5).
- Produces: an Express middleware factory `customerAuth(customerRepository: CustomerRepository)` that reads the JWT from the `customerAuth` cookie or an `Authorization: Bearer` header (cookie checked first), verifies it, confirms the token's `tenantId` matches `req.tenant.id` (must run after `tenantResolve`), loads the full customer via the repository, and attaches `req.customer`. Responds 401 (not throwing to the generic error handler — this is a normal auth failure, not a programming error) if the token is missing, invalid, or belongs to a different tenant than the one resolved from the subdomain. Later plans (Cart/Checkout/Orders, Engagement) mount this in front of routes that require a logged-in customer.

- [ ] **Step 1: Add the dependency**

Add to `backend/package.json` `dependencies`: `"cookie-parser": "^1.4.7"`; to `devDependencies`: `"@types/cookie-parser": "^1.4.8"`. Run `npm install` from repo root.

- [ ] **Step 2: Write the failing test**

`backend/src/middleware/customerAuth.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { CustomerRepository } from '../modules/customers/domain/customerRepository';
import type { CustomerRecord } from '../modules/customers/domain/customerRecord';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

const CUSTOMER: CustomerRecord = {
  id: 'c1', tenantId: 't1', name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', phone: null,
  passwordHash: 'irrelevant-here', role: 'user', type: 'physical', createdAt: '2026-08-15T00:00:00.000Z',
};

async function buildApp() {
  const { customerAuth } = await import('./customerAuth');
  const { signCustomerToken } = await import('../lib/jwt');

  const customerRepository: CustomerRepository = {
    findByTenantAndEmail: vi.fn(),
    findById: vi.fn(async (tenantId, id) => (tenantId === 't1' && id === 'c1' ? CUSTOMER : null)),
    create: vi.fn(),
  };

  const app = express();
  app.use(cookieParser());
  // Fake tenantResolve stand-in: this middleware suite tests customerAuth in
  // isolation, so it sets req.tenant directly rather than pulling in the
  // real subdomain-lookup middleware.
  app.use((req, _res, next) => {
    (req as any).tenant = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };
    next();
  });
  app.use(customerAuth(customerRepository));
  app.get('/me', (req, res) => res.json({ customerId: (req as any).customer?.id }));

  return { app, signCustomerToken };
}

describe('customerAuth middleware', () => {
  it('attaches req.customer from a valid cookie token', async () => {
    const { app, signCustomerToken } = await buildApp();
    const token = signCustomerToken({ customerId: 'c1', tenantId: 't1' });

    const res = await request(app).get('/me').set('Cookie', `customerAuth=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.customerId).toBe('c1');
  });

  it('attaches req.customer from a valid Authorization: Bearer header', async () => {
    const { app, signCustomerToken } = await buildApp();
    const token = signCustomerToken({ customerId: 'c1', tenantId: 't1' });

    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.customerId).toBe('c1');
  });

  it('returns 401 with no token at all', async () => {
    const { app } = await buildApp();
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token issued for a different tenant than the resolved one', async () => {
    const { app, signCustomerToken } = await buildApp();
    const token = signCustomerToken({ customerId: 'c1', tenantId: 'some-other-tenant' });

    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage token', async () => {
    const { app } = await buildApp();
    const res = await request(app).get('/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test --workspace=backend -- customerAuth.test`
Expected: FAIL — `./customerAuth` doesn't exist yet

- [ ] **Step 4: Write the middleware**

`backend/src/middleware/customerAuth.ts`:
```typescript
import type { Request, Response, NextFunction } from 'express';
import type { Customer } from '../modules/customers/domain/customer';
import type { CustomerRepository } from '../modules/customers/domain/customerRepository';
import { verifyCustomerToken } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      customer?: Customer;
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = (req as any).cookies?.customerAuth;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);

  return null;
}

export function customerAuth(customerRepository: CustomerRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    const payload = verifyCustomerToken(token);
    if (!payload) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    if (!req.tenant || payload.tenantId !== req.tenant.id) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    const customer = await customerRepository.findById(payload.tenantId, payload.customerId);
    if (!customer) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    req.customer = customer;
    next();
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend -- customerAuth.test`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/middleware/customerAuth.ts backend/src/middleware/customerAuth.test.ts
git commit -m "feat: add customerAuth middleware (cookie or Bearer token, tenant-matched)"
git push origin develop
```

---

## Task 8: Register/Login/Me routes (presentation layer)

**Files:**
- Create: `backend/src/modules/customers/presentation/customerDto.ts`
- Create: `backend/src/modules/customers/presentation/customerController.ts`
- Create: `backend/src/modules/customers/presentation/customerRoutes.ts`
- Test: `backend/src/modules/customers/presentation/customerRoutes.test.ts`

**Interfaces:**
- Consumes: `CustomerService` (Task 5), `customerAuth` (Task 7), `signCustomerToken` (Task 4).
- Produces: `customerRoutes(customerService, customerRepository): Router` mounting `POST /customers/register`, `POST /customers/login`, `GET /customers/me`. Task 10 mounts this in `server.ts`.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/customers/presentation/customerRoutes.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { errorHandler } from '../../../middleware/errorHandler';
import { customerRoutes } from './customerRoutes';
import { CustomerService } from '../domain/customerService';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { CustomerRepository } from '../domain/customerRepository';
import type { PasswordHasher } from '../domain/passwordHasher';
import type { CustomerRecord } from '../domain/customerRecord';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };

function buildApp() {
  const store = new Map<string, CustomerRecord>(); // keyed by `${tenantId}:${email}`

  const tenantRepository: TenantRepository = {
    findBySubdomain: vi.fn(async (sub) => (sub === 'shop-a' ? TENANT : null)),
    findById: vi.fn(),
    create: vi.fn(),
  };

  const customerRepository: CustomerRepository = {
    findByTenantAndEmail: vi.fn(async (tenantId, email) => store.get(`${tenantId}:${email}`) ?? null),
    findById: vi.fn(async (tenantId, id) => [...store.values()].find((c) => c.tenantId === tenantId && c.id === id) ?? null),
    create: vi.fn(async (tenantId, input) => {
      const record: CustomerRecord = {
        id: `id-${store.size + 1}`, tenantId, name: input.name, surname: input.surname, address: input.address,
        email: input.email, phone: input.phone, passwordHash: input.passwordHash, role: 'user', type: 'physical',
        createdAt: '2026-08-15T00:00:00.000Z',
      };
      store.set(`${tenantId}:${input.email}`, record);
      return record;
    }),
  };

  const passwordHasher: PasswordHasher = {
    hash: vi.fn(async (plain) => `hashed:${plain}`),
    verify: vi.fn(async (plain, hash) => hash === `hashed:${plain}`),
  };

  const customerService = new CustomerService(customerRepository, passwordHasher);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantResolve(tenantRepository));
  app.use(customerRoutes(customerService, customerRepository));
  app.use(errorHandler);
  return app;
}

describe('POST /customers/register', () => {
  it('creates a customer and returns it without a passwordHash field', async () => {
    const app = buildApp();
    const res = await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send({
      name: 'Aygün', surname: 'Məmmədova', address: 'Bakı', email: 'aygun@example.com', password: 'correct horse battery',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('aygun@example.com');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects an invalid payload (e.g. short password) with 400', async () => {
    const app = buildApp();
    const res = await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send({
      name: 'A', surname: 'B', address: 'Bakı', email: 'short@example.com', password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email with 409', async () => {
    const app = buildApp();
    const payload = { name: 'A', surname: 'B', address: 'Bakı', email: 'dupe@example.com', password: 'correct horse battery' };
    await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send(payload);
    const res = await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send(payload);
    expect(res.status).toBe(409);
  });
});

describe('POST /customers/login then GET /customers/me', () => {
  it('logs in, sets an httpOnly cookie, and the returned token also works via Authorization header', async () => {
    const app = buildApp();
    await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send({
      name: 'Aygün', surname: 'Məmmədova', address: 'Bakı', email: 'login-test@example.com', password: 'correct horse battery',
    });

    const loginRes = await request(app).post('/customers/login').set('Host', 'shop-a.platform.test').send({
      email: 'login-test@example.com', password: 'correct horse battery',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    const setCookie = loginRes.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toMatch(/customerAuth=/);
    expect(setCookie).toMatch(/HttpOnly/i);

    // Prove the cookie works
    const meViaCookie = await request(app).get('/customers/me').set('Host', 'shop-a.platform.test').set('Cookie', setCookie);
    expect(meViaCookie.status).toBe(200);
    expect(meViaCookie.body.email).toBe('login-test@example.com');

    // Prove the same token also works via Authorization header (spec §3a: not locked to one mechanism)
    const meViaHeader = await request(app).get('/customers/me').set('Host', 'shop-a.platform.test').set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(meViaHeader.status).toBe(200);
    expect(meViaHeader.body.email).toBe('login-test@example.com');
  });

  it('rejects login with the wrong password with 401', async () => {
    const app = buildApp();
    await request(app).post('/customers/register').set('Host', 'shop-a.platform.test').send({
      name: 'A', surname: 'B', address: 'Bakı', email: 'wrongpw@example.com', password: 'correct horse battery',
    });
    const res = await request(app).post('/customers/login').set('Host', 'shop-a.platform.test').send({
      email: 'wrongpw@example.com', password: 'not the right password',
    });
    expect(res.status).toBe(401);
  });

  it('GET /customers/me with no session returns 401', async () => {
    const app = buildApp();
    const res = await request(app).get('/customers/me').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- customerRoutes.test`
Expected: FAIL — `./customerRoutes` doesn't exist yet

- [ ] **Step 3: Write the presentation layer**

`backend/src/modules/customers/presentation/customerDto.ts`:
```typescript
export { registerRequestSchema, loginRequestSchema } from '@shop-platform/shared-types';
```

`backend/src/modules/customers/presentation/customerController.ts`:
```typescript
import type { Request, Response } from 'express';
import { registerRequestSchema, loginRequestSchema } from './customerDto';
import { CustomerService, DuplicateEmailError } from '../domain/customerService';
import { signCustomerToken } from '../../../lib/jwt';
import { MissingTenantScopeError } from '../../../middleware/errors';

const COOKIE_NAME = 'customerAuth';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches the JWT's own expiresIn

export function customerController(customerService: CustomerService) {
  return {
    async register(req: Request, res: Response) {
      if (!req.tenant) throw new MissingTenantScopeError('customerController.register: req.tenant not set');

      const parsed = registerRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
        return;
      }

      try {
        const customer = await customerService.register(req.tenant.id, parsed.data);
        res.status(201).json(customer);
      } catch (err) {
        if (err instanceof DuplicateEmailError) {
          res.status(409).json({ error: 'email_already_registered' });
          return;
        }
        throw err;
      }
    },

    async login(req: Request, res: Response) {
      if (!req.tenant) throw new MissingTenantScopeError('customerController.login: req.tenant not set');

      const parsed = loginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
        return;
      }

      const customer = await customerService.authenticate(req.tenant.id, parsed.data.email, parsed.data.password);
      if (!customer) {
        res.status(401).json({ error: 'invalid_credentials' });
        return;
      }

      const token = signCustomerToken({ customerId: customer.id, tenantId: customer.tenantId });
      res.cookie(COOKIE_NAME, token, { httpOnly: true, maxAge: COOKIE_MAX_AGE_MS, sameSite: 'lax' });
      res.status(200).json({ ...customer, token });
    },

    async me(req: Request, res: Response) {
      // customerAuth middleware guarantees req.customer is set before this runs.
      res.status(200).json(req.customer);
    },
  };
}
```

`backend/src/modules/customers/presentation/customerRoutes.ts`:
```typescript
import { Router } from 'express';
import type { CustomerService } from '../domain/customerService';
import type { CustomerRepository } from '../domain/customerRepository';
import { customerController } from './customerController';
import { customerAuth } from '../../../middleware/customerAuth';

export function customerRoutes(customerService: CustomerService, customerRepository: CustomerRepository): Router {
  const router = Router();
  const controller = customerController(customerService);

  router.post('/customers/register', controller.register);
  router.post('/customers/login', controller.login);
  router.get('/customers/me', customerAuth(customerRepository), controller.me);

  return router;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- customerRoutes.test`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/customers/presentation
git commit -m "feat: add customer register/login/me routes"
git push origin develop
```

---

## Task 9: Wire into `server.ts` and manually verify live

**Files:**
- Modify: `backend/src/server.ts`

**Interfaces:**
- No new testable interface — this task wires Tasks 1-8 together into the running app and verifies it manually, the same way the Foundation plan's `GET /branches` was verified.

- [ ] **Step 1: Wire cookie-parser and the customers module into the app**

Modify `backend/src/server.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pool from './db/pool';
import { tenantResolve } from './middleware/tenantResolve';
import { errorHandler } from './middleware/errorHandler';
import { PgTenantRepository } from './modules/tenants/infrastructure/pgTenantRepository';
import { PgBranchRepository } from './modules/tenants/infrastructure/pgBranchRepository';
import { branchRoutes } from './modules/tenants/presentation/branchRoutes';
import { PgCustomerRepository } from './modules/customers/infrastructure/pgCustomerRepository';
import { BcryptPasswordHasher } from './modules/customers/infrastructure/bcryptPasswordHasher';
import { CustomerService } from './modules/customers/domain/customerService';
import { customerRoutes } from './modules/customers/presentation/customerRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const tenantRepository = new PgTenantRepository(pool);
const branchRepository = new PgBranchRepository(pool);
const customerRepository = new PgCustomerRepository(pool);
const customerService = new CustomerService(customerRepository, new BcryptPasswordHasher());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use(tenantResolve(tenantRepository)); // everything below this line is tenant-scoped

app.use(branchRoutes(branchRepository));
app.use(customerRoutes(customerService, customerRepository));
// more module routers get mounted here in later plans

app.use(errorHandler); // must be last

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server ${PORT} portunda aktivdir!`);
    });
}

export default app;
```

- [ ] **Step 2: Run the full backend test suite**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend`
Expected: all tests pass (Foundation's + this plan's)

- [ ] **Step 3: Manually verify live**

From repo root:
```bash
npm run dev &> /tmp/api.log &
for i in $(seq 1 30); do curl -sf http://localhost:8080/health > /dev/null && break; sleep 1; done

# Register
curl -s -c /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"name":"Test","surname":"User","address":"Bakı","email":"demo@example.com","password":"correct horse battery"}' \
  http://localhost:8080/customers/register
echo

# Login (saves the cookie to /tmp/cookies.txt)
curl -s -c /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"correct horse battery"}' \
  http://localhost:8080/customers/login
echo

# Me, using the saved cookie
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" http://localhost:8080/customers/me
echo

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```
Expected: register returns 201 with the new customer (no `passwordHash` field); login returns 200 with `token` and the customer; `me` returns the same customer, proving the cookie round-trips through a real browser-like flow.

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat: wire customers module into server.ts, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against `2026-08-15-shop-platform-phase1-design.md` §3a):
- Registration fields (name, surname, address, email, phone optional, password) + hashing: Tasks 1, 5, 6, 8 ✅
- Login (email+password → JWT): Tasks 4, 5, 8 ✅
- `role: 'user'`, `type: 'physical'` fixed for Phase 1: Task 2's CHECK constraints + Task 1's literal zod types ✅
- Tenant-scoped accounts, `(tenant_id, email)` unique: Task 2 ✅
- JWT delivery not locked to one mechanism (cookie + header): Task 7 (`extractToken` checks both), tested explicitly in Task 8 ✅
- §8 error handling: `MissingTenantScopeError` reused from Foundation (Task 8's controller); 401 (not throwing to the generic handler) for ordinary auth failures — a deliberate difference from `MissingTenantScopeError`, since a missing/bad token is a normal client error, not a programming error
- Order-placement phone requirement (spec §3a) is explicitly **not** implemented here — it belongs to the Cart/Checkout/Orders plan, which will read `req.customer` and `req.customer.phone` (or reject the order) once orders exist. Nothing in this plan blocks that.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `Customer` (public, no `passwordHash`) defined once in `packages/shared-types` (Task 1); `CustomerRecord` (internal, extends `Customer` with `passwordHash`) defined in Task 5's domain layer and used consistently by `CustomerRepository`/`PgCustomerRepository` (Tasks 5-6) and `customerAuth` (Task 7, receives the same repository interface). `CustomerService.register`/`authenticate` signatures declared in Task 5 are consumed unchanged by `customerController` in Task 8.
