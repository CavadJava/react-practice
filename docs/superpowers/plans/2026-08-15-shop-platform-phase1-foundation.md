# Shop Platform — Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the mono-repo skeleton, the Postgres schema/migration/RLS mechanism, and the `tenants` (incl. `branches`) module end-to-end — a running backend that can resolve a tenant by subdomain, with the tenant-isolation safety pattern (repository layer + RLS) proven on a real table. This is the first of 5 plans implementing the [Phase 1 design spec](../specs/2026-08-15-shop-platform-phase1-design.md); later plans (Customer Auth, Catalog & Component System, Cart/Checkout/Orders, Engagement) build on what this one produces.

**Architecture:** npm-workspaces mono-repo (`projects/shop-platform/`) with a `backend` (Express + raw `pg`) workspace and a `packages/shared-types` workspace. Backend follows Clean Architecture per module (`domain/infrastructure/presentation`, dependencies point inward only). Tenant isolation is enforced twice: the repository layer never queries without a `tenant_id`, and Postgres Row-Level Security backs that up at the DB level via a `SET LOCAL app.tenant_id` session variable set inside every tenant-scoped transaction.

**Tech Stack:** TypeScript, Express 5, `pg` (node-postgres, no ORM), Postgres, Vitest + Supertest for testing, a hand-rolled SQL-file migration runner (no external migration library — matches the project's no-ORM, minimal-dependency philosophy).

## Global Constraints

- Every tenant-owned table has a `tenant_id` column; no query bypasses the repository layer (spec §3, rule 1-2).
- `domain/` files never import Express or `pg` — dependencies point inward only (spec §7).
- Single Express API, module-based internally — no microservices in Phase 1 (spec §6).
- Repository layer throws (never silently returns unscoped data) if called without a `tenant_id` (spec §8).
- Unknown/unresolvable subdomain → dedicated "shop not found" response, not a generic 404 (spec §8).
- Mono-repo via npm workspaces, not pnpm/Turborepo/Nx (spec §7).

---

## File Structure

```
projects/shop-platform/
├── package.json                          # workspaces root
├── packages/shared-types/
│   ├── package.json
│   └── src/
│       ├── tenant.ts                     # Tenant, Branch types + zod schemas
│       └── index.ts
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── .env.example
    └── src/
        ├── server.ts                     # Express app entrypoint
        ├── db/
        │   ├── pool.ts                   # pg Pool from env vars
        │   ├── withTenant.ts             # transaction helper: SET LOCAL app.tenant_id
        │   ├── migrate.ts                # migration runner script
        │   └── migrations/
        │       ├── 0001_extensions_and_migration_table.sql
        │       ├── 0002_tenants_schema.sql
        │       └── 0003_branches_table.sql
        ├── middleware/
        │   ├── tenantResolve.ts
        │   ├── errorHandler.ts
        │   └── errors.ts                 # TenantNotFoundError etc.
        └── modules/
            └── tenants/
                ├── domain/
                │   ├── tenant.ts
                │   ├── branch.ts
                │   ├── tenantRepository.ts
                │   └── branchRepository.ts
                ├── infrastructure/
                │   ├── pgTenantRepository.ts
                │   └── pgBranchRepository.ts
                └── presentation/
                    └── tenantRoutes.ts    # GET /internal/tenants/:subdomain (debug/health use)
```

`projects/bk_texnogallery.az/backend` is retired by this plan — its `server.ts`/`config/db.ts` pattern (Express + `pg` Pool from env vars, CORS for a Next.js frontend) is carried over as-is into `backend/src/server.ts` / `backend/src/db/pool.ts`, but its `controllers/customerController.ts` + `routes/customerRoutes.ts` are **not** carried over: they model a completely different, pre-existing "customers" shape (PIN/doc number/etc., no `tenant_id`) that predates and doesn't match this spec's `customers` module (built in the next plan). Task 1 explains exactly what moves and what's left behind.

---

## Task 1: Mono-repo scaffold

**Files:**
- Create: `projects/shop-platform/package.json`
- Create: `projects/shop-platform/.gitignore`
- Create: `projects/shop-platform/backend/package.json`
- Create: `projects/shop-platform/backend/tsconfig.json`
- Move: `projects/bk_texnogallery.az/backend/server.ts` → `projects/shop-platform/backend/src/server.ts` (adapted)
- Move: `projects/bk_texnogallery.az/backend/config/db.ts` → `projects/shop-platform/backend/src/db/pool.ts` (adapted)
- Test: `projects/shop-platform/backend/src/server.test.ts`

**Interfaces:**
- Produces: a root `npm install` at `projects/shop-platform/` installs the `backend` and (once created in a later task) `packages/shared-types` workspaces. `backend` exposes `npm run dev` and `npm test`.

- [ ] **Step 1: Create the workspace root**

`projects/shop-platform/package.json`:
```json
{
  "name": "shop-platform",
  "private": true,
  "workspaces": [
    "backend",
    "storefront",
    "admin",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=backend"
  }
}
```

`projects/shop-platform/.gitignore`:
```
node_modules/
dist/
.env
*.log
```

Note: `storefront` and `admin` are listed now (spec §7) even though those workspace folders don't exist yet — npm workspaces tolerates listed-but-missing folders; they're created in the Catalog/Component-System plan. `npm run dev` only runs `backend` for now; it grows to run all three once they exist (noted again in Task 9).

- [ ] **Step 2: Create the backend package**

`projects/shop-platform/backend/package.json`:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "tsx src/db/migrate.ts"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "pg": "^8.21.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/pg": "^8.20.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.22.4",
    "typescript": "^6.0.3",
    "vitest": "^3.0.0"
  }
}
```

`projects/shop-platform/backend/tsconfig.json` (carried over from `bk_texnogallery.az/backend/tsconfig.json` as-is):
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "types": ["node"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}
```

`projects/shop-platform/backend/.env.example`:
```
PORT=8080
DB_USER=postgres
DB_HOST=localhost
DB_NAME=shop_platform
DB_PASSWORD=postgres
DB_PORT=5432
```

- [ ] **Step 2b: Move and adapt the two carried-over files**

`projects/shop-platform/backend/src/db/pool.ts` (from `bk_texnogallery.az/backend/config/db.ts`, path/name only changed):
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

export default pool;
```

`projects/shop-platform/backend/src/server.ts` (from `bk_texnogallery.az/backend/server.ts`, `/backoffice` customer routes dropped — see File Structure note above — replaced with a bare healthcheck for now; real routes are added module-by-module in this and later plans):
```typescript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server ${PORT} portunda aktivdir!`);
    });
}

export default app;
```

(`export default app` + the `require.main === module` guard is what makes Step 4's test possible: the test imports `app` without starting a real listener.)

- [ ] **Step 3: Write the failing test**

`projects/shop-platform/backend/src/server.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

`projects/shop-platform/backend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Run test to verify it fails**

Run (from `projects/shop-platform/`): `npm install && npm test --workspace=backend`
Expected: FAIL — `server.ts` doesn't exist yet at that path (this step assumes Step 2b hasn't run; if you did Steps 2/2b together, skip to Step 5's PASS check and treat this as a sanity check that the test file itself is correct).

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=backend`
Expected: PASS

- [ ] **Step 6: Remove the retired source files and commit**

```bash
git rm -r projects/bk_texnogallery.az/backend/controllers projects/bk_texnogallery.az/backend/routes projects/bk_texnogallery.az/backend/server.ts projects/bk_texnogallery.az/backend/config
git add projects/shop-platform/
git commit -m "feat: scaffold shop-platform mono-repo, move backend skeleton from bk_texnogallery.az"
```

---

## Task 2: Shared Tenant/Branch types

**Files:**
- Create: `projects/shop-platform/packages/shared-types/package.json`
- Create: `projects/shop-platform/packages/shared-types/tsconfig.json`
- Create: `projects/shop-platform/packages/shared-types/src/tenant.ts`
- Create: `projects/shop-platform/packages/shared-types/src/index.ts`
- Test: `projects/shop-platform/packages/shared-types/src/tenant.test.ts`

**Interfaces:**
- Produces: `Tenant`, `Branch` TypeScript types and `tenantSchema`, `branchSchema` zod schemas, exported from `@shop-platform/shared-types`. Task 6/7's domain layer imports these rather than redefining them.

- [ ] **Step 1: Create the package**

`projects/shop-platform/packages/shared-types/package.json`:
```json
{
  "name": "@shop-platform/shared-types",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "vitest run"
  }
}
```

`projects/shop-platform/packages/shared-types/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 2: Write the failing test**

`projects/shop-platform/packages/shared-types/src/tenant.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { tenantSchema, branchSchema } from './tenant';

describe('tenantSchema', () => {
  it('accepts a valid tenant', () => {
    const result = tenantSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      subdomain: 'texnogallery',
      name: 'TexnoGallery',
      createdAt: '2026-08-15T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a subdomain with uppercase letters', () => {
    const result = tenantSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      subdomain: 'TexnoGallery',
      name: 'TexnoGallery',
      createdAt: '2026-08-15T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('branchSchema', () => {
  it('accepts a valid branch', () => {
    const result = branchSchema.safeParse({
      id: '22222222-2222-2222-2222-222222222222',
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: 'Mərkəzi filial',
      address: 'Bakı, Nizami küç. 1',
      phone: '+994501234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a branch with no name', () => {
    const result = branchSchema.safeParse({
      id: '22222222-2222-2222-2222-222222222222',
      tenantId: '11111111-1111-1111-1111-111111111111',
      name: '',
      address: 'Bakı, Nizami küç. 1',
      phone: null,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run (from `projects/shop-platform/`): `npm install && npm test --workspace=packages/shared-types`
Expected: FAIL with "Cannot find module './tenant'"

- [ ] **Step 4: Write minimal implementation**

`projects/shop-platform/packages/shared-types/src/tenant.ts`:
```typescript
import { z } from 'zod';

export const tenantSchema = z.object({
  id: z.string().uuid(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, hyphens only'),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type Tenant = z.infer<typeof tenantSchema>;

export const branchSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().nullable(),
});

export type Branch = z.infer<typeof branchSchema>;
```

`projects/shop-platform/packages/shared-types/src/index.ts`:
```typescript
export * from './tenant';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test --workspace=packages/shared-types`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add projects/shop-platform/packages
git commit -m "feat: add shared Tenant/Branch types and zod schemas"
```

---

## Task 3: Postgres connection wiring + migration runner

**Files:**
- Modify: `projects/shop-platform/backend/package.json` (add `db:migrate` deps if needed — already added in Task 1)
- Create: `projects/shop-platform/backend/src/db/migrate.ts`
- Create: `projects/shop-platform/backend/src/db/migrations/0001_extensions_and_migration_table.sql`
- Test: `projects/shop-platform/backend/src/db/migrate.test.ts`

**Interfaces:**
- Consumes: `pool` default export from `./pool` (Task 1).
- Produces: `runMigrations(pool): Promise<string[]>` (returns the list of migration filenames it applied, in order) — a `schema_migrations` table tracking what's been run. Later tasks add more `NNNN_*.sql` files to `src/db/migrations/`; nothing about the runner itself changes.

**Before Step 1:** this task needs a real local Postgres with a test database. Create it once:
```bash
createdb shop_platform_test
```
(Assumes a local Postgres server is already running — the project's local-dev-script task, later in this plan, formalizes starting it. For now, use whatever Postgres is already on the machine.)

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/db/migrate.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });

afterAll(async () => {
  await pool.end();
});

describe('runMigrations', () => {
  it('creates the schema_migrations table and applies pending migrations idempotently', async () => {
    const firstRun = await runMigrations(pool);
    expect(firstRun.length).toBeGreaterThan(0);

    const secondRun = await runMigrations(pool);
    expect(secondRun).toEqual([]); // nothing pending the second time

    const { rows } = await pool.query('SELECT to_regclass($1) AS reg', ['public.schema_migrations']);
    expect(rows[0].reg).toBe('schema_migrations');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrate.test`
Expected: FAIL with "Cannot find module './migrate'"

- [ ] **Step 3: Write the migrations directory and runner**

`projects/shop-platform/backend/src/db/migrations/0001_extensions_and_migration_table.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`projects/shop-platform/backend/src/db/migrate.ts`:
```typescript
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Pool } from 'pg';
import pool from './pool';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

export async function runMigrations(targetPool: Pool): Promise<string[]> {
  // Bootstrap: schema_migrations itself is created by 0001, so query defensively.
  await targetPool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const applied = new Set(
    (await targetPool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // numeric filename prefixes (0001_, 0002_, ...) sort in run order

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await targetPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      newlyApplied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }

  return newlyApplied;
}

if (require.main === module) {
  runMigrations(pool)
    .then((applied) => {
      console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'No pending migrations.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrate.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/shop-platform/backend/src/db
git commit -m "feat: add SQL-file migration runner with idempotent re-run"
```

---

## Task 4: `withTenant` transaction helper (the RLS mechanism)

This is the piece every tenant-scoped repository (this plan's `branches`, and every module in later plans) will use. Get it right once here.

**Files:**
- Create: `projects/shop-platform/backend/src/db/withTenant.ts`
- Test: `projects/shop-platform/backend/src/db/withTenant.test.ts`

**Interfaces:**
- Consumes: `Pool` from `pg`.
- Produces: `withTenant<T>(pool: Pool, tenantId: string, fn: (client: PoolClient) => Promise<T>): Promise<T>` — runs `fn` inside a transaction with `app.tenant_id` set via `SET LOCAL` (so it only applies for that transaction, never leaks to a pooled connection's next user). Task 6 (`pgBranchRepository.ts`) and every later module's `pg*Repository.ts` call this instead of `pool.query` directly for any tenant-scoped read/write.

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/db/withTenant.test.ts`:
```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });

afterAll(async () => {
  await pool.end();
});

describe('withTenant', () => {
  it('makes app.tenant_id readable inside the callback', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const seen = await withTenant(pool, tenantId, async (client) => {
      const { rows } = await client.query("SELECT current_setting('app.tenant_id', true) AS tid");
      return rows[0].tid;
    });
    expect(seen).toBe(tenantId);
  });

  it('does not leak app.tenant_id to a connection reused after the transaction ends', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    await withTenant(pool, tenantId, async () => {});

    const { rows } = await pool.query("SELECT current_setting('app.tenant_id', true) AS tid");
    expect(rows[0].tid).toBe(''); // SET LOCAL is scoped to the transaction that ended
  });

  it('rolls back on error and still releases the client', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    await expect(
      withTenant(pool, tenantId, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    // pool still usable afterwards proves the client was released, not leaked
    const { rows } = await pool.query('SELECT 1 AS ok');
    expect(rows[0].ok).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- withTenant.test`
Expected: FAIL with "Cannot find module './withTenant'"

- [ ] **Step 3: Write minimal implementation**

`projects/shop-platform/backend/src/db/withTenant.ts`:
```typescript
import type { Pool, PoolClient } from 'pg';

export async function withTenant<T>(
  pool: Pool,
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // set_config with is_local=true is the parameterized equivalent of SET LOCAL
    // (SET LOCAL itself doesn't accept query parameters).
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- withTenant.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/shop-platform/backend/src/db/withTenant.ts projects/shop-platform/backend/src/db/withTenant.test.ts
git commit -m "feat: add withTenant transaction helper backing Postgres RLS"
```

---

## Task 5: `tenants` schema + `tenants.tenants` table migration

**Files:**
- Create: `projects/shop-platform/backend/src/db/migrations/0002_tenants_schema.sql`
- Test: `projects/shop-platform/backend/src/db/migrations.tenants.test.ts`

**Interfaces:**
- Produces: `tenants.tenants` table (`id`, `subdomain` unique, `name`, `created_at`). Not tenant-scoped itself (it *is* the tenant list) — no RLS here; RLS starts at `tenants.branches` in Task 6.

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/db/migrations.tenants.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });

beforeAll(async () => {
  await runMigrations(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('tenants.tenants table', () => {
  it('exists with the expected columns and a unique subdomain', async () => {
    const insert = await pool.query(
      `INSERT INTO tenants.tenants (subdomain, name) VALUES ($1, $2) RETURNING id, subdomain, name, created_at`,
      ['texnogallery', 'TexnoGallery']
    );
    expect(insert.rows[0].subdomain).toBe('texnogallery');
    expect(insert.rows[0].created_at).toBeTruthy();

    await expect(
      pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ($1, $2)`, ['texnogallery', 'Duplicate'])
    ).rejects.toThrow();

    await pool.query('DELETE FROM tenants.tenants WHERE subdomain = $1', ['texnogallery']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.tenants.test`
Expected: FAIL — `relation "tenants.tenants" does not exist`

- [ ] **Step 3: Write the migration**

`projects/shop-platform/backend/src/db/migrations/0002_tenants_schema.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS tenants;

CREATE TABLE tenants.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain TEXT NOT NULL UNIQUE CHECK (subdomain ~ '^[a-z0-9-]+$'),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.tenants.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/shop-platform/backend/src/db/migrations/0002_tenants_schema.sql projects/shop-platform/backend/src/db/migrations.tenants.test.ts
git commit -m "feat: add tenants.tenants table migration"
```

---

## Task 6: `tenants.branches` table with RLS (the tenant-isolation template)

This is the highest-priority test in this plan (spec §10: "a query for tenant A must never return tenant B's rows").

**Files:**
- Create: `projects/shop-platform/backend/src/db/migrations/0003_branches_table.sql`
- Test: `projects/shop-platform/backend/src/db/migrations.branches.test.ts`

**Interfaces:**
- Consumes: `withTenant` (Task 4), `tenants.tenants` (Task 5).
- Produces: `tenants.branches` table (`id`, `tenant_id`, `name`, `address`, `phone` nullable) with RLS enforcing `tenant_id = current_setting('app.tenant_id')`.

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/db/migrations.branches.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });

let tenantAId: string;
let tenantBId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('tenants.branches RLS', () => {
  it('a tenant can only see its own branches, even via a direct SELECT with RLS active', async () => {
    await withTenant(pool, tenantAId, (client) =>
      client.query('INSERT INTO tenants.branches (tenant_id, name, address, phone) VALUES ($1, $2, $3, $4)', [
        tenantAId, 'A Mərkəzi', 'Bakı', null,
      ])
    );
    await withTenant(pool, tenantBId, (client) =>
      client.query('INSERT INTO tenants.branches (tenant_id, name, address, phone) VALUES ($1, $2, $3, $4)', [
        tenantBId, 'B Mərkəzi', 'Gəncə', null,
      ])
    );

    const asTenantA = await withTenant(pool, tenantAId, (client) => client.query('SELECT name FROM tenants.branches'));
    expect(asTenantA.rows.map((r) => r.name)).toEqual(['A Mərkəzi']);

    const asTenantB = await withTenant(pool, tenantBId, (client) => client.query('SELECT name FROM tenants.branches'));
    expect(asTenantB.rows.map((r) => r.name)).toEqual(['B Mərkəzi']);
  });

  it('a query with no app.tenant_id set sees no rows (fail closed, not fail open)', async () => {
    const { rows } = await pool.query('SELECT name FROM tenants.branches');
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.branches.test`
Expected: FAIL — `relation "tenants.branches" does not exist`

- [ ] **Step 3: Write the migration**

`projects/shop-platform/backend/src/db/migrations/0003_branches_table.sql`:
```sql
CREATE TABLE tenants.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_tenant_id ON tenants.branches (tenant_id);

ALTER TABLE tenants.branches ENABLE ROW LEVEL SECURITY;
-- No superuser/BYPASSRLS role is used by the app in any environment — enforce
-- this explicitly rather than relying on nobody-ever-uses-a-superuser-connection.
ALTER TABLE tenants.branches FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants.branches
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.branches.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/shop-platform/backend/src/db/migrations/0003_branches_table.sql projects/shop-platform/backend/src/db/migrations.branches.test.ts
git commit -m "feat: add tenants.branches table with RLS tenant-isolation policy"
```

---

## Task 7: `tenants` module — domain + infrastructure (Clean Architecture)

**Files:**
- Create: `projects/shop-platform/backend/src/modules/tenants/domain/tenant.ts`
- Create: `projects/shop-platform/backend/src/modules/tenants/domain/branch.ts`
- Create: `projects/shop-platform/backend/src/modules/tenants/domain/tenantRepository.ts`
- Create: `projects/shop-platform/backend/src/modules/tenants/domain/branchRepository.ts`
- Create: `projects/shop-platform/backend/src/modules/tenants/infrastructure/pgTenantRepository.ts`
- Create: `projects/shop-platform/backend/src/modules/tenants/infrastructure/pgBranchRepository.ts`
- Test: `projects/shop-platform/backend/src/modules/tenants/infrastructure/pgTenantRepository.test.ts`
- Test: `projects/shop-platform/backend/src/modules/tenants/infrastructure/pgBranchRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant` (Task 4), `Tenant`/`Branch` types (Task 2, re-exported from `@shop-platform/shared-types`).
- Produces:
  - `TenantRepository.findBySubdomain(subdomain: string): Promise<Tenant | null>`
  - `TenantRepository.findById(id: string): Promise<Tenant | null>`
  - `TenantRepository.create(input: { subdomain: string; name: string }): Promise<Tenant>`
  - `BranchRepository.findByTenant(tenantId: string): Promise<Branch[]>`
  - `BranchRepository.create(tenantId: string, input: { name: string; address: string; phone: string | null }): Promise<Branch>`

  Task 9 (middleware) consumes `TenantRepository.findBySubdomain`. Task 10 (seed script) consumes both `create` methods.

- [ ] **Step 1: Add the shared-types dependency to backend**

Add to `projects/shop-platform/backend/package.json` `dependencies`:
```json
"@shop-platform/shared-types": "*"
```
Run: `npm install` (from `projects/shop-platform/`) — npm workspaces links it locally, no publish needed.

- [ ] **Step 2: Write the failing tests**

`projects/shop-platform/backend/src/modules/tenants/infrastructure/pgTenantRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from './pgTenantRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });
const repo = new PgTenantRepository(pool);

beforeAll(async () => {
  await runMigrations(pool);
});

afterAll(async () => {
  await pool.query("DELETE FROM tenants.tenants WHERE subdomain = 'repo-test'");
  await pool.end();
});

describe('PgTenantRepository', () => {
  it('creates a tenant and finds it by subdomain', async () => {
    const created = await repo.create({ subdomain: 'repo-test', name: 'Repo Test Shop' });
    expect(created.subdomain).toBe('repo-test');

    const found = await repo.findBySubdomain('repo-test');
    expect(found?.id).toBe(created.id);
  });

  it('returns null for an unknown subdomain', async () => {
    const found = await repo.findBySubdomain('does-not-exist');
    expect(found).toBeNull();
  });
});
```

`projects/shop-platform/backend/src/modules/tenants/infrastructure/pgBranchRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { PgTenantRepository } from './pgTenantRepository';
import { PgBranchRepository } from './pgBranchRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const branchRepo = new PgBranchRepository(pool);

let tenantId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'branch-repo-test', name: 'Branch Repo Test Shop' });
  tenantId = tenant.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgBranchRepository', () => {
  it('creates a branch scoped to a tenant and finds it back by that tenant', async () => {
    const created = await branchRepo.create(tenantId, { name: 'Əsas filial', address: 'Bakı', phone: null });
    expect(created.tenantId).toBe(tenantId);

    const found = await branchRepo.findByTenant(tenantId);
    expect(found.map((b) => b.id)).toContain(created.id);
  });

  it('throws if asked to create a branch without a tenantId', async () => {
    // @ts-expect-error - intentionally omitting the required argument to prove the guard exists at runtime
    await expect(branchRepo.create(undefined, { name: 'X', address: 'Y', phone: null })).rejects.toThrow(/tenantId/);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/tenants`
Expected: FAIL — modules don't exist yet

- [ ] **Step 4: Write the domain layer**

`projects/shop-platform/backend/src/modules/tenants/domain/tenant.ts`:
```typescript
export type { Tenant } from '@shop-platform/shared-types';
```

`projects/shop-platform/backend/src/modules/tenants/domain/branch.ts`:
```typescript
export type { Branch } from '@shop-platform/shared-types';
```

`projects/shop-platform/backend/src/modules/tenants/domain/tenantRepository.ts`:
```typescript
import type { Tenant } from './tenant';

export interface TenantRepository {
  findBySubdomain(subdomain: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
  create(input: { subdomain: string; name: string }): Promise<Tenant>;
}
```

`projects/shop-platform/backend/src/modules/tenants/domain/branchRepository.ts`:
```typescript
import type { Branch } from './branch';

export interface BranchRepository {
  findByTenant(tenantId: string): Promise<Branch[]>;
  create(tenantId: string, input: { name: string; address: string; phone: string | null }): Promise<Branch>;
}
```

- [ ] **Step 5: Write the infrastructure layer**

`projects/shop-platform/backend/src/modules/tenants/infrastructure/pgTenantRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { Tenant } from '../domain/tenant';
import type { TenantRepository } from '../domain/tenantRepository';

function toTenant(row: any): Tenant {
  return {
    id: row.id,
    subdomain: row.subdomain,
    name: row.name,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgTenantRepository implements TenantRepository {
  constructor(private readonly pool: Pool) {}

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const { rows } = await this.pool.query('SELECT * FROM tenants.tenants WHERE subdomain = $1', [subdomain]);
    return rows[0] ? toTenant(rows[0]) : null;
  }

  async findById(id: string): Promise<Tenant | null> {
    const { rows } = await this.pool.query('SELECT * FROM tenants.tenants WHERE id = $1', [id]);
    return rows[0] ? toTenant(rows[0]) : null;
  }

  async create(input: { subdomain: string; name: string }): Promise<Tenant> {
    const { rows } = await this.pool.query(
      'INSERT INTO tenants.tenants (subdomain, name) VALUES ($1, $2) RETURNING *',
      [input.subdomain, input.name]
    );
    return toTenant(rows[0]);
  }
}
```

`projects/shop-platform/backend/src/modules/tenants/infrastructure/pgBranchRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { Branch } from '../domain/branch';
import type { BranchRepository } from '../domain/branchRepository';
import { withTenant } from '../../../db/withTenant';

function toBranch(row: any): Branch {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    address: row.address,
    phone: row.phone,
  };
}

export class PgBranchRepository implements BranchRepository {
  constructor(private readonly pool: Pool) {}

  async findByTenant(tenantId: string): Promise<Branch[]> {
    if (!tenantId) throw new Error('BranchRepository.findByTenant requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query('SELECT * FROM tenants.branches WHERE tenant_id = $1', [tenantId]);
      return rows.map(toBranch);
    });
  }

  async create(tenantId: string, input: { name: string; address: string; phone: string | null }): Promise<Branch> {
    if (!tenantId) throw new Error('BranchRepository.create requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        'INSERT INTO tenants.branches (tenant_id, name, address, phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [tenantId, input.name, input.address, input.phone]
      );
      return toBranch(rows[0]);
    });
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/tenants`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add projects/shop-platform/backend/src/modules/tenants projects/shop-platform/backend/package.json projects/shop-platform/package-lock.json
git commit -m "feat: add tenants module domain+infrastructure (PgTenantRepository, PgBranchRepository)"
```

---

## Task 8: `tenant-resolve` middleware ("shop not found" on unknown subdomain)

**Files:**
- Create: `projects/shop-platform/backend/src/middleware/errors.ts`
- Create: `projects/shop-platform/backend/src/middleware/errorHandler.ts`
- Create: `projects/shop-platform/backend/src/middleware/tenantResolve.ts`
- Modify: `projects/shop-platform/backend/src/server.ts`
- Test: `projects/shop-platform/backend/src/middleware/tenantResolve.test.ts`

**Interfaces:**
- Consumes: `TenantRepository` (Task 7).
- Produces: an Express middleware factory `tenantResolve(tenantRepository: TenantRepository)` that reads the subdomain from the `Host` header, attaches `req.tenant: Tenant` on success, and calls `next(new TenantNotFoundError(subdomain))` on failure. Every later module's routes are mounted behind this middleware and read `req.tenant`.

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/middleware/tenantResolve.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { tenantResolve } from './tenantResolve';
import { errorHandler } from './errorHandler';
import type { TenantRepository } from '../modules/tenants/domain/tenantRepository';

function buildApp(tenantRepository: TenantRepository) {
  const app = express();
  app.use(tenantResolve(tenantRepository));
  app.get('/whoami', (req, res) => res.json({ tenantId: req.tenant?.id }));
  app.use(errorHandler);
  return app;
}

describe('tenantResolve middleware', () => {
  it('attaches req.tenant when the subdomain resolves', async () => {
    const fakeRepo: TenantRepository = {
      findBySubdomain: vi.fn(async (sub) => (sub === 'texnogallery' ? { id: 't1', subdomain: 'texnogallery', name: 'TexnoGallery', createdAt: '2026-08-15T00:00:00.000Z' } : null)),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const app = buildApp(fakeRepo);

    const res = await request(app).get('/whoami').set('Host', 'texnogallery.platform.test');
    expect(res.status).toBe(200);
    expect(res.body.tenantId).toBe('t1');
  });

  it('responds with a dedicated shop-not-found body (not a generic 404) for an unknown subdomain', async () => {
    const fakeRepo: TenantRepository = {
      findBySubdomain: vi.fn(async () => null),
      findById: vi.fn(),
      create: vi.fn(),
    };
    const app = buildApp(fakeRepo);

    const res = await request(app).get('/whoami').set('Host', 'unknown-shop.platform.test');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'shop_not_found', subdomain: 'unknown-shop' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- tenantResolve.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the error types and handler**

`projects/shop-platform/backend/src/middleware/errors.ts`:
```typescript
export class TenantNotFoundError extends Error {
  constructor(public readonly subdomain: string) {
    super(`Tenant not found for subdomain: ${subdomain}`);
    this.name = 'TenantNotFoundError';
  }
}

export class MissingTenantScopeError extends Error {
  constructor(context: string) {
    super(`Missing tenant scope in ${context}`);
    this.name = 'MissingTenantScopeError';
  }
}
```

`projects/shop-platform/backend/src/middleware/errorHandler.ts`:
```typescript
import type { Request, Response, NextFunction } from 'express';
import { TenantNotFoundError, MissingTenantScopeError } from './errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof TenantNotFoundError) {
    res.status(404).json({ error: 'shop_not_found', subdomain: err.subdomain });
    return;
  }
  if (err instanceof MissingTenantScopeError) {
    // Fail loudly per spec §8 — this is a programming error, not a client error.
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
}
```

- [ ] **Step 4: Write the middleware**

`projects/shop-platform/backend/src/middleware/tenantResolve.ts`:
```typescript
import type { Request, Response, NextFunction } from 'express';
import type { Tenant } from '../modules/tenants/domain/tenant';
import type { TenantRepository } from '../modules/tenants/domain/tenantRepository';
import { TenantNotFoundError } from './errors';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

function extractSubdomain(host: string | undefined): string {
  if (!host) return '';
  // "texnogallery.platform.test:8080" -> "texnogallery"
  return host.split(':')[0]!.split('.')[0]!;
}

export function tenantResolve(tenantRepository: TenantRepository) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const subdomain = extractSubdomain(req.headers.host);
    const tenant = await tenantRepository.findBySubdomain(subdomain);
    if (!tenant) {
      next(new TenantNotFoundError(subdomain));
      return;
    }
    req.tenant = tenant;
    next();
  };
}
```

- [ ] **Step 5: Wire both into the app**

Modify `projects/shop-platform/backend/src/server.ts` — add after the `express.json()` line and before `/health` (health check stays tenant-independent):

```typescript
import pool from './db/pool';
import { tenantResolve } from './middleware/tenantResolve';
import { errorHandler } from './middleware/errorHandler';
import { PgTenantRepository } from './modules/tenants/infrastructure/pgTenantRepository';

// ... after app.use(express.json());

const tenantRepository = new PgTenantRepository(pool);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use(tenantResolve(tenantRepository)); // everything below this line is tenant-scoped

// module routers get mounted here in this and later plans

app.use(errorHandler); // must be last
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test --workspace=backend -- tenantResolve.test`
Expected: PASS

- [ ] **Step 7: Run the full backend test suite to check nothing broke**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend`
Expected: all PASS

- [ ] **Step 8: Commit**

```bash
git add projects/shop-platform/backend/src
git commit -m "feat: add tenant-resolve middleware and central error handler"
```

---

## Task 9: Seed script — provision `texnogallery` as the first tenant

**Files:**
- Create: `projects/shop-platform/backend/src/db/seed.ts`
- Test: `projects/shop-platform/backend/src/db/seed.test.ts`

**Interfaces:**
- Consumes: `PgTenantRepository`, `PgBranchRepository` (Task 7).
- Produces: `seedInitialTenant(pool): Promise<{ tenant: Tenant; branch: Branch }>`, idempotent (safe to run twice — the manual tenant-provisioning mechanism named in spec §2/§12).

- [ ] **Step 1: Write the failing test**

`projects/shop-platform/backend/src/db/seed.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { seedInitialTenant } from './seed';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop_platform_test' });

beforeAll(async () => {
  await runMigrations(pool);
});

afterAll(async () => {
  await pool.query("DELETE FROM tenants.tenants WHERE subdomain = 'texnogallery'");
  await pool.end();
});

describe('seedInitialTenant', () => {
  it('creates the texnogallery tenant with one branch', async () => {
    const { tenant, branch } = await seedInitialTenant(pool);
    expect(tenant.subdomain).toBe('texnogallery');
    expect(branch.tenantId).toBe(tenant.id);
  });

  it('is idempotent — running it again does not create a duplicate tenant', async () => {
    const first = await seedInitialTenant(pool);
    const second = await seedInitialTenant(pool);
    expect(second.tenant.id).toBe(first.tenant.id);

    const { rows } = await pool.query("SELECT count(*)::int AS n FROM tenants.tenants WHERE subdomain = 'texnogallery'");
    expect(rows[0].n).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- seed.test`
Expected: FAIL — `./seed` doesn't exist yet

- [ ] **Step 3: Write minimal implementation**

`projects/shop-platform/backend/src/db/seed.ts`:
```typescript
import type { Pool } from 'pg';
import pool from './pool';
import { PgTenantRepository } from '../modules/tenants/infrastructure/pgTenantRepository';
import { PgBranchRepository } from '../modules/tenants/infrastructure/pgBranchRepository';
import type { Tenant } from '../modules/tenants/domain/tenant';
import type { Branch } from '../modules/tenants/domain/branch';

export async function seedInitialTenant(targetPool: Pool): Promise<{ tenant: Tenant; branch: Branch }> {
  const tenantRepository = new PgTenantRepository(targetPool);
  const branchRepository = new PgBranchRepository(targetPool);

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

  return { tenant, branch };
}

if (require.main === module) {
  seedInitialTenant(pool)
    .then(({ tenant, branch }) => {
      console.log(`Seeded tenant ${tenant.subdomain} (${tenant.id}) with branch ${branch.name} (${branch.id})`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

Add to `projects/shop-platform/backend/package.json` `scripts`:
```json
"db:seed": "tsx src/db/seed.ts"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend -- seed.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add projects/shop-platform/backend/src/db/seed.ts projects/shop-platform/backend/src/db/seed.test.ts projects/shop-platform/backend/package.json
git commit -m "feat: add idempotent seed script provisioning texnogallery as first tenant"
```

---

## Task 10: Local development script

**Files:**
- Modify: `projects/shop-platform/package.json`
- Create: `projects/shop-platform/README.md`

**Interfaces:**
- Produces: `npm run dev` (from `projects/shop-platform/`) runs migrations, seeds the first tenant if needed, and starts the backend in watch mode. No new testable behavior (this is a scripts/docs task) — verified manually per Step 3.

- [ ] **Step 1: Add the composite dev script**

Modify `projects/shop-platform/package.json`:
```json
{
  "name": "shop-platform",
  "private": true,
  "workspaces": [
    "backend",
    "storefront",
    "admin",
    "packages/*"
  ],
  "scripts": {
    "setup": "npm install && npm run db:migrate --workspace=backend && npm run db:seed --workspace=backend",
    "dev": "npm run dev --workspace=backend"
  }
}
```

Note: `dev` only starts `backend` for now, matching what exists after this plan. The Catalog/Component-System plan (Plan 3) adds `storefront` and `admin` workspaces and updates this script to start all three together (e.g. via `concurrently`), per spec §6's "single command starts the full local stack" requirement — that requirement is only fully met once those two apps exist.

- [ ] **Step 2: Write the README**

`projects/shop-platform/README.md`:
```markdown
# Shop Platform

Multi-tenant e-commerce SaaS platform. See `docs/superpowers/specs/2026-08-15-shop-platform-phase1-design.md` in the repo root for the full design.

## Local setup

Prerequisites: Node.js, a local Postgres server running, a database created for this project:

    createdb shop_platform

Copy `backend/.env.example` to `backend/.env` and adjust if your local Postgres differs from the defaults.

Then, from this directory (`projects/shop-platform/`):

    npm run setup   # installs deps, runs migrations, seeds the first tenant (texnogallery)
    npm run dev     # starts the backend in watch mode

## Testing

    npm test --workspace=backend

Backend tests that touch the database expect `TEST_DATABASE_URL` (defaults to `postgres://postgres:postgres@localhost:5432/shop_platform_test` if unset):

    createdb shop_platform_test
    TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/shop_platform_test npm test --workspace=backend
```

- [ ] **Step 3: Manually verify the composite script**

Run (from `projects/shop-platform/`, against the real `shop_platform` DB, not the test one):
```bash
createdb shop_platform   # if not already created
cp backend/.env.example backend/.env
npm run setup
```
Expected: install succeeds, migration output lists the 3 applied files, seed output prints the `texnogallery` tenant/branch line.

Then: `npm run dev`
Expected: `🚀 Backend server 8080 portunda aktivdir!` printed; `curl http://localhost:8080/health` returns `{"status":"ok"}`; `curl -H "Host: texnogallery.localhost" http://localhost:8080/whoami` is not wired to a route yet (that was only a test fixture in Task 8) — skip; instead confirm tenant resolution end-to-end by temporarily hitting any tenant-scoped route added in a later plan.

- [ ] **Step 4: Commit**

```bash
git add projects/shop-platform/package.json projects/shop-platform/README.md
git commit -m "docs: add composite setup/dev scripts and README for local development"
```

---

## Self-Review Notes

**Spec coverage check** (against `2026-08-15-shop-platform-phase1-design.md`):
- §3 shared-DB tenancy, repository discipline, RLS: Tasks 4, 6, 7 ✅
- §3's 4 migration-path rules: rule 1 (no query bypasses repository) enforced by convention + tests in Task 7; rule 2 (`tenant_id` + no cross-tenant joins) enforced by Task 6's RLS; rule 3 (storage namespacing) — no file storage exists yet in this plan, deferred to whichever later plan adds `product_images`; rule 4 (replayable migrations) — Task 3's runner is idempotent per-file, satisfying this ✅
- §6 mono-repo, npm workspaces, single Express API, local dev script: Tasks 1, 2, 10 ✅
- §7 Clean Architecture layering, `tenants` module shape: Task 7 ✅
- §8 "shop not found" dedicated response: Task 8 ✅
- §2 manual tenant provisioning: Task 9 ✅
- Everything else in the spec (`customers`, `catalog`, `cart`, `orders`, `engagement`, page-builder, Layout Editor, storefront, admin) is explicitly out of scope for this plan — covered by the 4 plans that follow it.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands.

**Type consistency:** `Tenant`/`Branch` defined once in `packages/shared-types` (Task 2), re-exported (not redefined) by `domain/tenant.ts`/`domain/branch.ts` (Task 7), and used with identical shape in the middleware (Task 8) and seed script (Task 9). `TenantRepository`/`BranchRepository` method signatures declared in Task 7's domain files are implemented with matching signatures in the same task's infrastructure files and consumed unchanged in Tasks 8-9.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-15-shop-platform-phase1-foundation.md`.**
