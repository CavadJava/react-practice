# Bid.cars Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Telegram bot that polls bid.cars every 10 minutes for new car auction listings matching an owner-configurable filter, and posts each new match to a Telegram channel.

**Architecture:** Node.js/TypeScript project (`bid-cars-bot/`, new top-level folder in this repo). A `node-cron` job polls bid.cars' internal JSON search API through a persisted Playwright/Chromium browser context (required — Cloudflare blocks plain HTTP), diffs results against a Postgres `seen_lots` table, filters against a Postgres `filters` row managed live via grammY bot commands, and posts new matches to a Telegram channel. Deployed as a systemd service on `157.180.73.79`.

**Tech Stack:** TypeScript (NodeNext ESM), Playwright (chromium), grammY, `pg`, `node-cron`, `dotenv`, Vitest.

## Global Constraints

- Poll interval: every 10 minutes (`*/10 * * * *`).
- Filter fields: makes (list), year range, max price. Managed via Telegram commands (`/filter_add`, `/filter_remove`, `/filter_year`, `/filter_maxprice`, `/filter_show`, `/filter_clear`), restricted to one `ADMIN_USER_ID`.
- If the filter has zero criteria set, the bot posts nothing (never floods the channel with an unconfigured "match everything" default).
- After 3 consecutive scrape failures, DM `ADMIN_USER_ID` once, then reset the counter.
- Env vars: `BOT_TOKEN`, `CHANNEL_ID`, `ADMIN_USER_ID`, `DATABASE_URL`. Real values live only in `/opt/bid-cars-bot/.env` on the deploy server — never in git.
- Deploy target: `157.180.73.79`, systemd service `bid-cars-bot.service`, `Restart=always`.
- Messages to the channel and to the admin are in Azerbaijani, matching the format in the spec.

## Confirmed real facts (from a live technical spike, 2026-08-16 — do not re-guess these)

- **Search API:** `GET https://bid.cars/app/search/request?search-type=filters&status=All&type=Automobile&make=All&model=All&year-from={Y1}&year-to={Y2}&auction-type=All` returns JSON: `{ current_page, per_page: 50, next_page_url, data: [...] }`. Only page 1 (50 listings) is fetched per poll — see Task 6 for why this is an accepted scope decision, not a silent cap.
- **This call MUST be made via `page.evaluate(() => fetch(...))` inside a real, already-Cloudflare-cleared Playwright page.** A plain HTTP client — even Playwright's own `context.request` sharing the same cookies — gets a 403 challenge page. Only a request made through the live browser's own JS engine passes.
- **Cloudflare can re-challenge mid-session** if requests fire too rapidly (confirmed: 3rd request in a fast back-to-back sequence got challenged after the first 2 succeeded). At a 10-minute poll interval with one request per poll this is not expected to be an issue, but the code must detect a challenge response (HTML instead of JSON) and treat it as a recoverable failure, never a crash.
- **Per-listing JSON fields that matter:** `lot` (e.g. `"0-45830359"` — stable unique ID, use as the dedupe key), `tag` (URL slug, e.g. `"2017-Chrysler-Pacifica-2C4RC1DG7HR623225"`), `name_long` (full untruncated `"{year} {make} {model}, {trim}"` string — **`name` is truncated by the API itself with `"..."`, never use it**), `location`, `primary_damage`, `prebid_price` (string like `"$0"` or `"$1,250"` — `"$0"` means no bid yet), `final_bid_formatted` (populated once an auction ends), `estimated_min`/`estimated_max` (numeric, always present — the site's own valuation, used as the reliable price-filter signal since bid amounts are often null/zero pre-auction), `prebid_close_time_lang.en` (human auction-time string), `img.img_1` (thumbnail URL).
- **Individual listing URL:** `https://bid.cars/en/lot/{lot}/{tag}` (confirmed from real homepage nav links, e.g. `https://bid.cars/en/lot/1-65165126/1968-Ford-Mustang-8R01C108819`).
- Real sample records (used as test fixtures below) are copied verbatim from an actual `search-type=filters&status=All` response.

---

### Task 1: Project scaffolding + Postgres schema + DB pool

**Files:**
- Create: `bid-cars-bot/package.json`
- Create: `bid-cars-bot/tsconfig.json`
- Create: `bid-cars-bot/vitest.config.ts`
- Create: `bid-cars-bot/.env.example`
- Create: `bid-cars-bot/.gitignore`
- Create: `bid-cars-bot/src/db/pool.ts`
- Create: `bid-cars-bot/src/db/schema.sql`
- Create: `bid-cars-bot/src/db/migrate.ts`
- Test: `bid-cars-bot/test/db.test.ts`

**Interfaces:**
- Produces: `createPool(databaseUrl: string): Pool` (from `src/db/pool.ts`, re-exports `pg`'s `Pool` type) — every later DB task imports this.
- Produces: `migrate(pool: Pool): Promise<void>` (from `src/db/migrate.ts`) — runs `schema.sql` against a pool. Used by tests and by the deploy step.

- [ ] **Step 1: Create the project folder and `package.json`**

```bash
mkdir -p bid-cars-bot/src/db bid-cars-bot/test
cd bid-cars-bot
npm init -y
```

Edit `package.json` so `"scripts"` and `"type"` look like this (keep the auto-generated `name`/`version`):

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "migrate": "tsx src/db/migrate.ts"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install grammy playwright pg node-cron dotenv
npm install -D typescript tsx vitest @types/node @types/pg @types/node-cron
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
  },
});
```

- [ ] **Step 5: Create `.env.example` and `.gitignore`**

`.env.example`:
```
BOT_TOKEN=
CHANNEL_ID=
ADMIN_USER_ID=
DATABASE_URL=postgres://localhost:5432/bid_cars_bot
```

`.gitignore`:
```
node_modules/
dist/
.env
.playwright-user-data/
```

- [ ] **Step 6: Create the local test database**

```bash
createdb bid_cars_bot_test
```

- [ ] **Step 7: Write `src/db/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS filters (
  id smallint PRIMARY KEY DEFAULT 1,
  makes text[] NOT NULL DEFAULT '{}',
  year_min integer,
  year_max integer,
  max_price numeric,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO filters (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS seen_lots (
  lot_id text PRIMARY KEY,
  seen_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 8: Write `src/db/pool.ts`**

```ts
import { Pool } from 'pg';

export type { Pool } from 'pg';

export function createPool(databaseUrl: string): Pool {
  return new Pool({ connectionString: databaseUrl });
}
```

- [ ] **Step 9: Write `src/db/migrate.ts`**

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrate(pool: Pool): Promise<void> {
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { createPool } = await import('./pool.js');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set');
  const pool = createPool(databaseUrl);
  await migrate(pool);
  console.log('Migration complete');
  await pool.end();
}
```

- [ ] **Step 10: Write the failing test — `test/db.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://localhost:5432/bid_cars_bot_test';
const pool = createPool(TEST_DATABASE_URL);

beforeAll(async () => {
  await migrate(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('migrate', () => {
  it('creates the filters table with a default single row', async () => {
    const result = await pool.query('SELECT * FROM filters WHERE id = 1');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].makes).toEqual([]);
  });

  it('creates the seen_lots table', async () => {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'seen_lots'"
    );
    expect(result.rows).toHaveLength(1);
  });
});
```

- [ ] **Step 11: Run the test and verify it passes**

Run: `npx vitest run test/db.test.ts`
Expected: 2 passed (this is scaffolding, not TDD-from-red — the migration is straightforward enough to write directly, but the test must genuinely pass against the real local Postgres).

- [ ] **Step 12: Commit**

```bash
cd ..
git add bid-cars-bot
git commit -m "feat(bid-cars-bot): project scaffolding, Postgres schema and pool

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Filter store (CRUD)

**Files:**
- Create: `bid-cars-bot/src/db/filters.ts`
- Test: `bid-cars-bot/test/filters.test.ts`

**Interfaces:**
- Consumes: `createPool`, `migrate` from Task 1.
- Produces: `interface Filter { makes: string[]; yearMin: number | null; yearMax: number | null; maxPrice: number | null }` and `getFilter(pool)`, `addMake(pool, make)`, `removeMake(pool, make)`, `setYearRange(pool, yearMin, yearMax)`, `setMaxPrice(pool, maxPrice)`, `clearFilter(pool)` — all `(pool: Pool) => Promise<Filter>` (the mutators take extra args as shown). Tasks 4, 6, 9, 10 import `Filter` from here.

- [ ] **Step 1: Write the failing test — `test/filters.test.ts`**

```ts
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';
import * as filters from '../src/db/filters.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://localhost:5432/bid_cars_bot_test';
const pool = createPool(TEST_DATABASE_URL);

beforeAll(async () => {
  await migrate(pool);
});

beforeEach(async () => {
  await filters.clearFilter(pool);
});

afterAll(async () => {
  await pool.end();
});

describe('filters store', () => {
  it('starts empty', async () => {
    const f = await filters.getFilter(pool);
    expect(f).toEqual({ makes: [], yearMin: null, yearMax: null, maxPrice: null });
  });

  it('adds and removes makes without duplicates', async () => {
    await filters.addMake(pool, 'BMW');
    const afterFirstAdd = await filters.addMake(pool, 'bmw');
    expect(afterFirstAdd.makes).toEqual(['BMW']);

    const afterSecondMake = await filters.addMake(pool, 'Mercedes');
    expect(afterSecondMake.makes).toEqual(['BMW', 'Mercedes']);

    const afterRemove = await filters.removeMake(pool, 'bmw');
    expect(afterRemove.makes).toEqual(['Mercedes']);
  });

  it('sets a year range', async () => {
    const f = await filters.setYearRange(pool, 2015, 2023);
    expect(f.yearMin).toBe(2015);
    expect(f.yearMax).toBe(2023);
  });

  it('sets and clears a max price', async () => {
    const withPrice = await filters.setMaxPrice(pool, 15000);
    expect(withPrice.maxPrice).toBe(15000);

    const cleared = await filters.setMaxPrice(pool, null);
    expect(cleared.maxPrice).toBeNull();
  });

  it('clearFilter resets everything', async () => {
    await filters.addMake(pool, 'Toyota');
    await filters.setYearRange(pool, 2010, 2020);
    await filters.setMaxPrice(pool, 9000);

    const cleared = await filters.clearFilter(pool);
    expect(cleared).toEqual({ makes: [], yearMin: null, yearMax: null, maxPrice: null });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/filters.test.ts`
Expected: FAIL — `Cannot find module '../src/db/filters.js'`

- [ ] **Step 3: Write `src/db/filters.ts`**

```ts
import { Pool } from 'pg';

export interface Filter {
  makes: string[];
  yearMin: number | null;
  yearMax: number | null;
  maxPrice: number | null;
}

interface FilterRow {
  makes: string[];
  year_min: number | null;
  year_max: number | null;
  max_price: string | null;
}

function rowToFilter(row: FilterRow): Filter {
  return {
    makes: row.makes ?? [],
    yearMin: row.year_min,
    yearMax: row.year_max,
    maxPrice: row.max_price !== null ? Number(row.max_price) : null,
  };
}

export async function getFilter(pool: Pool): Promise<Filter> {
  const result = await pool.query<FilterRow>('SELECT * FROM filters WHERE id = 1');
  return rowToFilter(result.rows[0]);
}

export async function addMake(pool: Pool, make: string): Promise<Filter> {
  const current = await getFilter(pool);
  const normalized = make.trim();
  const alreadyPresent = current.makes.some(m => m.toLowerCase() === normalized.toLowerCase());
  const nextMakes = alreadyPresent ? current.makes : [...current.makes, normalized];
  const result = await pool.query<FilterRow>(
    'UPDATE filters SET makes = $1 WHERE id = 1 RETURNING *',
    [nextMakes]
  );
  return rowToFilter(result.rows[0]);
}

export async function removeMake(pool: Pool, make: string): Promise<Filter> {
  const current = await getFilter(pool);
  const nextMakes = current.makes.filter(m => m.toLowerCase() !== make.trim().toLowerCase());
  const result = await pool.query<FilterRow>(
    'UPDATE filters SET makes = $1 WHERE id = 1 RETURNING *',
    [nextMakes]
  );
  return rowToFilter(result.rows[0]);
}

export async function setYearRange(pool: Pool, yearMin: number, yearMax: number): Promise<Filter> {
  const result = await pool.query<FilterRow>(
    'UPDATE filters SET year_min = $1, year_max = $2 WHERE id = 1 RETURNING *',
    [yearMin, yearMax]
  );
  return rowToFilter(result.rows[0]);
}

export async function setMaxPrice(pool: Pool, maxPrice: number | null): Promise<Filter> {
  const result = await pool.query<FilterRow>(
    'UPDATE filters SET max_price = $1 WHERE id = 1 RETURNING *',
    [maxPrice]
  );
  return rowToFilter(result.rows[0]);
}

export async function clearFilter(pool: Pool): Promise<Filter> {
  const result = await pool.query<FilterRow>(
    "UPDATE filters SET makes = '{}', year_min = NULL, year_max = NULL, max_price = NULL WHERE id = 1 RETURNING *"
  );
  return rowToFilter(result.rows[0]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/filters.test.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/db/filters.ts bid-cars-bot/test/filters.test.ts
git commit -m "feat(bid-cars-bot): filter store CRUD

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Seen-lots dedup store

**Files:**
- Create: `bid-cars-bot/src/db/seenLots.ts`
- Test: `bid-cars-bot/test/seenLots.test.ts`

**Interfaces:**
- Consumes: `createPool`, `migrate` from Task 1.
- Produces: `getSeenIds(pool: Pool, lotIds: string[]): Promise<Set<string>>`, `markSeen(pool: Pool, lotId: string): Promise<void>` — Task 10's scheduler imports both.

- [ ] **Step 1: Write the failing test — `test/seenLots.test.ts`**

```ts
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createPool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';
import { getSeenIds, markSeen } from '../src/db/seenLots.js';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://localhost:5432/bid_cars_bot_test';
const pool = createPool(TEST_DATABASE_URL);

beforeAll(async () => {
  await migrate(pool);
});

beforeEach(async () => {
  await pool.query('DELETE FROM seen_lots');
});

afterAll(async () => {
  await pool.end();
});

describe('seen lots store', () => {
  it('returns an empty set when nothing has been seen', async () => {
    const seen = await getSeenIds(pool, ['0-1', '0-2']);
    expect(seen.size).toBe(0);
  });

  it('marks a lot as seen and reports it back', async () => {
    await markSeen(pool, '0-45830359');
    const seen = await getSeenIds(pool, ['0-45830359', '0-99999999']);
    expect(seen).toEqual(new Set(['0-45830359']));
  });

  it('markSeen is idempotent', async () => {
    await markSeen(pool, '0-1');
    await expect(markSeen(pool, '0-1')).resolves.not.toThrow();
  });

  it('returns an empty set for an empty id list without querying', async () => {
    const seen = await getSeenIds(pool, []);
    expect(seen.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/seenLots.test.ts`
Expected: FAIL — `Cannot find module '../src/db/seenLots.js'`

- [ ] **Step 3: Write `src/db/seenLots.ts`**

```ts
import { Pool } from 'pg';

export async function getSeenIds(pool: Pool, lotIds: string[]): Promise<Set<string>> {
  if (lotIds.length === 0) return new Set();
  const result = await pool.query<{ lot_id: string }>(
    'SELECT lot_id FROM seen_lots WHERE lot_id = ANY($1)',
    [lotIds]
  );
  return new Set(result.rows.map(r => r.lot_id));
}

export async function markSeen(pool: Pool, lotId: string): Promise<void> {
  await pool.query(
    'INSERT INTO seen_lots (lot_id) VALUES ($1) ON CONFLICT (lot_id) DO NOTHING',
    [lotId]
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/seenLots.test.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/db/seenLots.ts bid-cars-bot/test/seenLots.test.ts
git commit -m "feat(bid-cars-bot): seen-lots dedup store

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Lot type + pure filter-matching logic

**Files:**
- Create: `bid-cars-bot/src/lots/types.ts`
- Create: `bid-cars-bot/src/lots/matchesFilter.ts`
- Test: `bid-cars-bot/test/matchesFilter.test.ts`

**Interfaces:**
- Consumes: `Filter` type from Task 2 (`src/db/filters.ts`).
- Produces: `interface Lot { id, make, model, year, currentBid, estimatedMin, estimatedMax, damage, location, auctionDate, imageUrl, url }` (full shape in Step 1) — Tasks 5, 7, 8 build/consume this. Produces `isFilterConfigured(filter: Filter): boolean` and `matchesFilter(lot: Lot, filter: Filter): boolean` — Task 7 imports both.

- [ ] **Step 1: Write `src/lots/types.ts`**

```ts
export interface Lot {
  id: string;
  make: string;
  model: string;
  year: number;
  /** Formatted display string like "$1,250", or null if no bid has been placed yet. */
  currentBid: string | null;
  estimatedMin: number;
  estimatedMax: number;
  damage: string;
  location: string;
  auctionDate: string;
  imageUrl: string;
  url: string;
}
```

- [ ] **Step 2: Write the failing test — `test/matchesFilter.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { matchesFilter, isFilterConfigured } from '../src/lots/matchesFilter.js';
import { Lot } from '../src/lots/types.js';
import { Filter } from '../src/db/filters.js';

const emptyFilter: Filter = { makes: [], yearMin: null, yearMax: null, maxPrice: null };

function makeLot(overrides: Partial<Lot> = {}): Lot {
  return {
    id: '0-1',
    make: 'BMW',
    model: '3 Series',
    year: 2020,
    currentBid: '$12,300',
    estimatedMin: 10000,
    estimatedMax: 14000,
    damage: 'Front end',
    location: 'Houston (TX)',
    auctionDate: 'Mon 17 Aug, 15:30 GMT+2',
    imageUrl: 'https://images.bid.cars/x.jpg',
    url: 'https://bid.cars/en/lot/0-1/x',
    ...overrides,
  };
}

describe('isFilterConfigured', () => {
  it('is false when nothing is set', () => {
    expect(isFilterConfigured(emptyFilter)).toBe(false);
  });

  it('is true when at least one criterion is set', () => {
    expect(isFilterConfigured({ ...emptyFilter, makes: ['BMW'] })).toBe(true);
    expect(isFilterConfigured({ ...emptyFilter, yearMin: 2015 })).toBe(true);
    expect(isFilterConfigured({ ...emptyFilter, maxPrice: 10000 })).toBe(true);
  });
});

describe('matchesFilter', () => {
  it('matches on make case-insensitively', () => {
    const filter: Filter = { ...emptyFilter, makes: ['bmw'] };
    expect(matchesFilter(makeLot({ make: 'BMW' }), filter)).toBe(true);
    expect(matchesFilter(makeLot({ make: 'Audi' }), filter)).toBe(false);
  });

  it('rejects lots outside the year range', () => {
    const filter: Filter = { ...emptyFilter, yearMin: 2018, yearMax: 2022 };
    expect(matchesFilter(makeLot({ year: 2020 }), filter)).toBe(true);
    expect(matchesFilter(makeLot({ year: 2016 }), filter)).toBe(false);
    expect(matchesFilter(makeLot({ year: 2023 }), filter)).toBe(false);
  });

  it('rejects lots whose estimated max exceeds the price cap', () => {
    const filter: Filter = { ...emptyFilter, maxPrice: 12000 };
    expect(matchesFilter(makeLot({ estimatedMax: 11000 }), filter)).toBe(true);
    expect(matchesFilter(makeLot({ estimatedMax: 14000 }), filter)).toBe(false);
  });

  it('combines all set criteria with AND', () => {
    const filter: Filter = { makes: ['BMW'], yearMin: 2018, yearMax: 2022, maxPrice: 15000 };
    expect(matchesFilter(makeLot({ make: 'BMW', year: 2020, estimatedMax: 14000 }), filter)).toBe(true);
    expect(matchesFilter(makeLot({ make: 'BMW', year: 2016, estimatedMax: 14000 }), filter)).toBe(false);
  });

  it('matches everything when the filter is empty', () => {
    expect(matchesFilter(makeLot(), emptyFilter)).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run test/matchesFilter.test.ts`
Expected: FAIL — `Cannot find module '../src/lots/matchesFilter.js'`

- [ ] **Step 4: Write `src/lots/matchesFilter.ts`**

```ts
import { Filter } from '../db/filters.js';
import { Lot } from './types.js';

export function isFilterConfigured(filter: Filter): boolean {
  return filter.makes.length > 0 || filter.yearMin !== null || filter.yearMax !== null || filter.maxPrice !== null;
}

export function matchesFilter(lot: Lot, filter: Filter): boolean {
  if (filter.makes.length > 0 && !filter.makes.some(m => m.toLowerCase() === lot.make.toLowerCase())) {
    return false;
  }
  if (filter.yearMin !== null && lot.year < filter.yearMin) return false;
  if (filter.yearMax !== null && lot.year > filter.yearMax) return false;
  if (filter.maxPrice !== null && lot.estimatedMax > filter.maxPrice) return false;
  return true;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/matchesFilter.test.ts`
Expected: 8 passed

- [ ] **Step 6: Commit**

```bash
git add bid-cars-bot/src/lots/types.ts bid-cars-bot/src/lots/matchesFilter.ts bid-cars-bot/test/matchesFilter.test.ts
git commit -m "feat(bid-cars-bot): Lot type and pure filter-matching logic

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Parse bid.cars' search API response into Lot[]

**Files:**
- Create: `bid-cars-bot/src/lots/parseLots.ts`
- Create: `bid-cars-bot/test/fixtures/search-response-sample.json`
- Create: `bid-cars-bot/test/fixtures/challenge-response-sample.html`
- Test: `bid-cars-bot/test/parseLots.test.ts`

**Interfaces:**
- Consumes: `Lot` from Task 4.
- Produces: `parseSearchResponse(json: string): Lot[]`, `class ChallengeError extends Error`, `isChallengeResponse(text: string): boolean` — Task 6's `fetchNewListings` imports all three.

- [ ] **Step 1: Create the real-data fixture — `test/fixtures/search-response-sample.json`**

This is copied verbatim (trimmed to 2 of the 50 records) from a real `bid.cars` search API response captured during the design spike:

```json
{
  "current_page": 1,
  "per_page": 50,
  "data": [
    {
      "primary_damage": "Front end",
      "name": "2017 Chrysler Pacifica, Touring",
      "name_long": "2017 Chrysler Pacifica, Touring",
      "tag": "2017-Chrysler-Pacifica-2C4RC1DG7HR623225",
      "lot": "0-45830359",
      "location": "Concord (NC)",
      "prebid_close_time_lang": { "en": "Mon 17 Aug, 15:30 GMT+2" },
      "time_left_formatted": "1 d 5 h 9 min",
      "prebid_price": "$0",
      "final_bid": null,
      "final_bid_formatted": null,
      "estimated_min": 1700,
      "estimated_max": 3700,
      "img": {
        "img_1": "https://images.bid.cars/045830359_6a802d71093ce/2017-Chrysler-Pacifica-2C4RC1DG7HR623225-1.jpg"
      }
    },
    {
      "primary_damage": "Left side",
      "name": "2020 Jeep Grand Cherokee, Lim...",
      "name_long": "2020 Jeep Grand Cherokee, Limited 4X2",
      "tag": "2020-Jeep-Grand-Cherokee-1C4RJEBG7LC348022",
      "lot": "0-45886434",
      "location": "Avenel New... (NJ)",
      "prebid_close_time_lang": { "en": "Mon 17 Aug, 15:30 GMT+2" },
      "time_left_formatted": "1 d 5 h 9 min",
      "prebid_price": "$25",
      "final_bid": null,
      "final_bid_formatted": null,
      "estimated_min": 2800,
      "estimated_max": 5460,
      "img": {
        "img_1": "https://images.bid.cars/045886434_6a802d46b27aa/2020-Jeep-Grand-Cherokee-1C4RJEBG7LC348022-1.jpg"
      }
    }
  ]
}
```

- [ ] **Step 2: Create the challenge-page fixture — `test/fixtures/challenge-response-sample.html`**

This is the real beginning of Cloudflare's "managed challenge" HTML page, captured when the live site re-challenged a request during the spike:

```html
<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="robots" content="noindex,nofollow"></head><body><div class="main-wrapper" role="main"><div class="main-content"><noscript><div class="h2"><span id="challenge-error-text">Enable JavaScript and cookies to continue</span></div></noscript></div></div></body></html>
```

- [ ] **Step 3: Write the failing test — `test/parseLots.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseSearchResponse, isChallengeResponse, ChallengeError } from '../src/lots/parseLots.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

const sampleJson = readFileSync(path.join(fixturesDir, 'search-response-sample.json'), 'utf8');
const challengeHtml = readFileSync(path.join(fixturesDir, 'challenge-response-sample.html'), 'utf8');

describe('isChallengeResponse', () => {
  it('detects a Cloudflare challenge page', () => {
    expect(isChallengeResponse(challengeHtml)).toBe(true);
  });

  it('does not flag real JSON', () => {
    expect(isChallengeResponse(sampleJson)).toBe(false);
  });
});

describe('parseSearchResponse', () => {
  it('parses real listings into Lot objects', () => {
    const lots = parseSearchResponse(sampleJson);
    expect(lots).toHaveLength(2);

    const pacifica = lots[0];
    expect(pacifica.id).toBe('0-45830359');
    expect(pacifica.year).toBe(2017);
    expect(pacifica.make).toBe('Chrysler');
    expect(pacifica.model).toBe('Pacifica, Touring');
    expect(pacifica.currentBid).toBeNull(); // prebid_price was "$0"
    expect(pacifica.estimatedMin).toBe(1700);
    expect(pacifica.estimatedMax).toBe(3700);
    expect(pacifica.damage).toBe('Front end');
    expect(pacifica.location).toBe('Concord (NC)');
    expect(pacifica.url).toBe('https://bid.cars/en/lot/0-45830359/2017-Chrysler-Pacifica-2C4RC1DG7HR623225');
  });

  it('uses name_long, never the truncated name field', () => {
    const lots = parseSearchResponse(sampleJson);
    const jeep = lots[1];
    expect(jeep.model).toBe('Grand Cherokee, Limited 4X2');
  });

  it('reports a non-"$0" prebid_price as the current bid', () => {
    const lots = parseSearchResponse(sampleJson);
    expect(lots[1].currentBid).toBe('$25');
  });

  it('throws ChallengeError instead of a JSON parse error on a challenge page', () => {
    expect(() => parseSearchResponse(challengeHtml)).toThrow(ChallengeError);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run test/parseLots.test.ts`
Expected: FAIL — `Cannot find module '../src/lots/parseLots.js'`

- [ ] **Step 5: Write `src/lots/parseLots.ts`**

```ts
import { Lot } from './types.js';

interface RawListing {
  lot: string;
  tag: string;
  name_long: string;
  location: string;
  primary_damage: string;
  prebid_price: string;
  final_bid_formatted: string | null;
  estimated_min: number;
  estimated_max: number;
  prebid_close_time_lang?: { en?: string };
  time_left_formatted?: string;
  img?: { img_1?: string };
}

interface SearchResponse {
  data: RawListing[];
}

export class ChallengeError extends Error {
  constructor() {
    super('bid.cars returned a Cloudflare challenge page instead of JSON');
    this.name = 'ChallengeError';
  }
}

export function isChallengeResponse(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<!DOCTYPE') || trimmed.includes('Just a moment');
}

const NAME_PATTERN = /^(\d{4})\s+(\S+)\s+(.+)$/;

function toLot(raw: RawListing): Lot {
  const match = NAME_PATTERN.exec(raw.name_long);
  const year = match ? Number(match[1]) : 0;
  const make = match ? match[2] : 'Unknown';
  const model = match ? match[3] : raw.name_long;

  return {
    id: raw.lot,
    make,
    model,
    year,
    currentBid: raw.final_bid_formatted ?? (raw.prebid_price !== '$0' ? raw.prebid_price : null),
    estimatedMin: raw.estimated_min,
    estimatedMax: raw.estimated_max,
    damage: raw.primary_damage,
    location: raw.location,
    auctionDate: raw.prebid_close_time_lang?.en ?? raw.time_left_formatted ?? '',
    imageUrl: raw.img?.img_1 ?? '',
    url: `https://bid.cars/en/lot/${raw.lot}/${raw.tag}`,
  };
}

export function parseSearchResponse(text: string): Lot[] {
  if (isChallengeResponse(text)) throw new ChallengeError();
  const parsed: SearchResponse = JSON.parse(text);
  return parsed.data.map(toLot);
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run test/parseLots.test.ts`
Expected: 6 passed

- [ ] **Step 7: Commit**

```bash
git add bid-cars-bot/src/lots/parseLots.ts bid-cars-bot/test/parseLots.test.ts bid-cars-bot/test/fixtures
git commit -m "feat(bid-cars-bot): parse bid.cars search API responses into Lot[]

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Playwright browser context + live search fetcher

**Files:**
- Create: `bid-cars-bot/src/scraper/browser.ts`
- Create: `bid-cars-bot/src/scraper/search.ts`
- Test: `bid-cars-bot/test/search.test.ts`

**Interfaces:**
- Consumes: `Filter` from Task 2, `Lot`, `parseSearchResponse`, `ChallengeError` from Tasks 4–5.
- Produces: `getContext(): Promise<BrowserContext>`, `closeContext(): Promise<void>` (from `browser.ts`); `buildSearchUrl(filter: Filter): string` and `fetchNewListings(filter: Filter): Promise<Lot[]>` (from `search.ts`) — Task 10's scheduler imports `fetchNewListings`.

**Scope note (not a silent cap — call this out to the user in the PR/summary):** only page 1 (50 listings) of the search API is fetched per poll. If bid.cars adds more than 50 new matching lots inside one 10-minute window, the ones beyond page 1 are missed until they'd naturally reappear — acceptable for a filtered personal-use feed, but worth knowing.

- [ ] **Step 1: Write `src/scraper/browser.ts`**

```ts
import { chromium, BrowserContext } from 'playwright';
import path from 'node:path';

const USER_DATA_DIR = path.resolve(process.cwd(), '.playwright-user-data');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

let context: BrowserContext | null = null;

export async function getContext(): Promise<BrowserContext> {
  if (context) return context;
  context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
    userAgent: USER_AGENT,
    viewport: { width: 1366, height: 850 },
    locale: 'en-US',
  });
  return context;
}

export async function closeContext(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
}
```

- [ ] **Step 2: Write the failing test — `test/search.test.ts` (pure part only — `buildSearchUrl`)**

```ts
import { describe, it, expect } from 'vitest';
import { buildSearchUrl } from '../src/scraper/search.js';
import { Filter } from '../src/db/filters.js';

const emptyFilter: Filter = { makes: [], yearMin: null, yearMax: null, maxPrice: null };

describe('buildSearchUrl', () => {
  it('defaults to the full 1900-2027 year range when unset', () => {
    const url = buildSearchUrl(emptyFilter);
    expect(url).toContain('year-from=1900');
    expect(url).toContain('year-to=2027');
    expect(url).toContain('make=All');
    expect(url).toContain('status=All');
    expect(url).toContain('type=Automobile');
  });

  it('encodes a configured year range', () => {
    const url = buildSearchUrl({ ...emptyFilter, yearMin: 2018, yearMax: 2022 });
    expect(url).toContain('year-from=2018');
    expect(url).toContain('year-to=2022');
  });

  it('always requests make=All — make filtering happens client-side against matchesFilter', () => {
    const url = buildSearchUrl({ ...emptyFilter, makes: ['BMW', 'Mercedes'] });
    expect(url).toContain('make=All');
  });
});
```

(Note: `fetchNewListings` itself — the part that drives a real browser page — is deliberately not unit-tested here; it depends on live network/Cloudflare state. It's covered by manual end-to-end verification in Task 11.)

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run test/search.test.ts`
Expected: FAIL — `Cannot find module '../src/scraper/search.js'`

- [ ] **Step 4: Write `src/scraper/search.ts`**

```ts
import { getContext } from './browser.js';
import { Filter } from '../db/filters.js';
import { parseSearchResponse, ChallengeError } from '../lots/parseLots.js';
import { Lot } from '../lots/types.js';

export function buildSearchUrl(filter: Filter): string {
  const params = new URLSearchParams({
    'search-type': 'filters',
    status: 'All',
    type: 'Automobile',
    make: 'All',
    model: 'All',
    'year-from': String(filter.yearMin ?? 1900),
    'year-to': String(filter.yearMax ?? 2027),
    'auction-type': 'All',
  });
  return `https://bid.cars/app/search/request?${params.toString()}`;
}

export async function fetchNewListings(filter: Filter): Promise<Lot[]> {
  const context = await getContext();
  const page = context.pages()[0] ?? (await context.newPage());
  const url = buildSearchUrl(filter);

  async function attempt(): Promise<Lot[]> {
    if (page.url() === 'about:blank') {
      await page.goto('https://bid.cars/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
    const text: string = await page.evaluate(async (apiUrl) => {
      const res = await fetch(apiUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      return res.text();
    }, url);
    return parseSearchResponse(text);
  }

  try {
    return await attempt();
  } catch (err) {
    if (!(err instanceof ChallengeError)) throw err;
    // One retry: force a fresh homepage visit to pick up new Cloudflare clearance.
    await page.goto('https://bid.cars/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    return await attempt();
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/search.test.ts`
Expected: 3 passed

- [ ] **Step 6: Commit**

```bash
git add bid-cars-bot/src/scraper bid-cars-bot/test/search.test.ts
git commit -m "feat(bid-cars-bot): Playwright browser context and live search fetcher

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: New-and-matching selection logic

**Files:**
- Create: `bid-cars-bot/src/scheduler/selectNewMatches.ts`
- Test: `bid-cars-bot/test/selectNewMatches.test.ts`

**Interfaces:**
- Consumes: `Lot`, `matchesFilter`, `isFilterConfigured` from Task 4; `Filter` from Task 2.
- Produces: `selectNewMatches(lots: Lot[], filter: Filter, seenIds: Set<string>): Lot[]` — Task 10's scheduler imports this.

- [ ] **Step 1: Write the failing test — `test/selectNewMatches.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { selectNewMatches } from '../src/scheduler/selectNewMatches.js';
import { Lot } from '../src/lots/types.js';
import { Filter } from '../src/db/filters.js';

function makeLot(overrides: Partial<Lot> = {}): Lot {
  return {
    id: '0-1',
    make: 'BMW',
    model: '3 Series',
    year: 2020,
    currentBid: '$12,300',
    estimatedMin: 10000,
    estimatedMax: 14000,
    damage: 'Front end',
    location: 'Houston (TX)',
    auctionDate: 'Mon 17 Aug, 15:30 GMT+2',
    imageUrl: 'https://images.bid.cars/x.jpg',
    url: 'https://bid.cars/en/lot/0-1/x',
    ...overrides,
  };
}

const emptyFilter: Filter = { makes: [], yearMin: null, yearMax: null, maxPrice: null };

describe('selectNewMatches', () => {
  it('returns nothing when the filter is unconfigured, even for brand-new lots', () => {
    const lots = [makeLot({ id: '0-1' }), makeLot({ id: '0-2' })];
    expect(selectNewMatches(lots, emptyFilter, new Set())).toEqual([]);
  });

  it('excludes already-seen lots', () => {
    const filter: Filter = { ...emptyFilter, makes: ['BMW'] };
    const lots = [makeLot({ id: '0-1' }), makeLot({ id: '0-2' })];
    const result = selectNewMatches(lots, filter, new Set(['0-1']));
    expect(result.map(l => l.id)).toEqual(['0-2']);
  });

  it('excludes lots that do not match the filter', () => {
    const filter: Filter = { ...emptyFilter, makes: ['Audi'] };
    const lots = [makeLot({ id: '0-1', make: 'BMW' })];
    expect(selectNewMatches(lots, filter, new Set())).toEqual([]);
  });

  it('returns new, matching lots', () => {
    const filter: Filter = { ...emptyFilter, makes: ['BMW'] };
    const lots = [makeLot({ id: '0-1', make: 'BMW' })];
    const result = selectNewMatches(lots, filter, new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('0-1');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/selectNewMatches.test.ts`
Expected: FAIL — `Cannot find module '../src/scheduler/selectNewMatches.js'`

- [ ] **Step 3: Write `src/scheduler/selectNewMatches.ts`**

```ts
import { Lot } from '../lots/types.js';
import { Filter } from '../db/filters.js';
import { matchesFilter, isFilterConfigured } from '../lots/matchesFilter.js';

export function selectNewMatches(lots: Lot[], filter: Filter, seenIds: Set<string>): Lot[] {
  if (!isFilterConfigured(filter)) return [];
  return lots.filter(lot => !seenIds.has(lot.id) && matchesFilter(lot, filter));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/selectNewMatches.test.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/scheduler/selectNewMatches.ts bid-cars-bot/test/selectNewMatches.test.ts
git commit -m "feat(bid-cars-bot): new-and-matching lot selection logic

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Telegram message formatting + posting

**Files:**
- Create: `bid-cars-bot/src/bot/post.ts`
- Test: `bid-cars-bot/test/post.test.ts`

**Interfaces:**
- Consumes: `Lot` from Task 4.
- Produces: `formatLotMessage(lot: Lot): string`, `postLot(bot: Bot, channelId: string, lot: Lot): Promise<void>` — Task 10's scheduler imports `postLot`.

- [ ] **Step 1: Write the failing test — `test/post.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { formatLotMessage, postLot } from '../src/bot/post.js';
import { Lot } from '../src/lots/types.js';

const lot: Lot = {
  id: '0-1',
  make: 'BMW',
  model: '3 Series',
  year: 2020,
  currentBid: '$12,300',
  estimatedMin: 10000,
  estimatedMax: 14000,
  damage: 'Front end',
  location: 'Houston (TX)',
  auctionDate: 'Mon 17 Aug, 15:30 GMT+2',
  imageUrl: 'https://images.bid.cars/x.jpg',
  url: 'https://bid.cars/en/lot/0-1/x',
};

describe('formatLotMessage', () => {
  it('shows the current bid when one exists', () => {
    const msg = formatLotMessage(lot);
    expect(msg).toContain('🚗 2020 BMW 3 Series');
    expect(msg).toContain('💰 Hazırkı bid: $12,300');
    expect(msg).toContain('📍 Location: Houston (TX)');
    expect(msg).toContain('🔧 Zərər: Front end');
    expect(msg).toContain('📅 Hərrac: Mon 17 Aug, 15:30 GMT+2');
    expect(msg).toContain('[Elana bax](https://bid.cars/en/lot/0-1/x)');
  });

  it('falls back to the estimated range when there is no bid yet', () => {
    const msg = formatLotMessage({ ...lot, currentBid: null });
    expect(msg).toContain('💰 Təxmini qiymət: $10,000–$14,000');
  });
});

describe('postLot', () => {
  it('sends a photo with the formatted caption when an image is available', async () => {
    const bot = { api: { sendPhoto: vi.fn(), sendMessage: vi.fn() } } as any;
    await postLot(bot, '-100123', lot);
    expect(bot.api.sendPhoto).toHaveBeenCalledWith(
      '-100123',
      lot.imageUrl,
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
    expect(bot.api.sendMessage).not.toHaveBeenCalled();
  });

  it('falls back to a plain text message when there is no image', async () => {
    const bot = { api: { sendPhoto: vi.fn(), sendMessage: vi.fn() } } as any;
    await postLot(bot, '-100123', { ...lot, imageUrl: '' });
    expect(bot.api.sendMessage).toHaveBeenCalled();
    expect(bot.api.sendPhoto).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/post.test.ts`
Expected: FAIL — `Cannot find module '../src/bot/post.js'`

- [ ] **Step 3: Write `src/bot/post.ts`**

```ts
import { Bot } from 'grammy';
import { Lot } from '../lots/types.js';

function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function formatLotMessage(lot: Lot): string {
  const priceLine = lot.currentBid
    ? `💰 Hazırkı bid: ${lot.currentBid}`
    : `💰 Təxmini qiymət: ${formatMoney(lot.estimatedMin)}–${formatMoney(lot.estimatedMax)}`;

  return [
    `🚗 ${lot.year} ${lot.make} ${lot.model}`,
    priceLine,
    `📍 Location: ${lot.location}`,
    `🔧 Zərər: ${lot.damage}`,
    `📅 Hərrac: ${lot.auctionDate}`,
    `🔗 [Elana bax](${lot.url})`,
  ].join('\n');
}

export async function postLot(bot: Bot, channelId: string, lot: Lot): Promise<void> {
  const caption = formatLotMessage(lot);
  if (lot.imageUrl) {
    await bot.api.sendPhoto(channelId, lot.imageUrl, { caption, parse_mode: 'Markdown' });
  } else {
    await bot.api.sendMessage(channelId, caption, { parse_mode: 'Markdown' });
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/post.test.ts`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/bot/post.ts bid-cars-bot/test/post.test.ts
git commit -m "feat(bid-cars-bot): Telegram message formatting and posting

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Admin-gated filter commands

**Files:**
- Create: `bid-cars-bot/src/bot/commands.ts`
- Test: `bid-cars-bot/test/commands.test.ts`

**Interfaces:**
- Consumes: `Filter` and all functions from Task 2 (`src/db/filters.ts`).
- Produces: `isAdmin(ctx: { from?: { id: number } }, adminUserId: number): boolean`, `registerFilterCommands(bot: Bot, pool: Pool, adminUserId: number): void` — Task 10's `index.ts` imports `registerFilterCommands`.

- [ ] **Step 1: Write the failing test — `test/commands.test.ts` (covers the pure `isAdmin` guard; the full command handlers are covered by manual verification in Task 11, same as `fetchNewListings` in Task 6, since exercising grammY's dispatcher end-to-end needs a live bot connection)**

```ts
import { describe, it, expect } from 'vitest';
import { isAdmin } from '../src/bot/commands.js';

describe('isAdmin', () => {
  it('is true only for the configured admin user id', () => {
    expect(isAdmin({ from: { id: 12345 } }, 12345)).toBe(true);
    expect(isAdmin({ from: { id: 99999 } }, 12345)).toBe(false);
  });

  it('is false when there is no sender (e.g. a channel post)', () => {
    expect(isAdmin({}, 12345)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/commands.test.ts`
Expected: FAIL — `Cannot find module '../src/bot/commands.js'`

- [ ] **Step 3: Write `src/bot/commands.ts`**

```ts
import { Bot, Context } from 'grammy';
import { Pool } from 'pg';
import * as filters from '../db/filters.js';

export function isAdmin(ctx: { from?: { id: number } }, adminUserId: number): boolean {
  return ctx.from?.id === adminUserId;
}

export function registerFilterCommands(bot: Bot, pool: Pool, adminUserId: number): void {
  bot.command('filter_add', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    const make = ctx.match?.toString().trim();
    if (!make) {
      await ctx.reply('İstifadə: /filter_add <marka>');
      return;
    }
    const updated = await filters.addMake(pool, make);
    await ctx.reply(`Əlavə olundu. Marka siyahısı: ${updated.makes.join(', ') || '(boş)'}`);
  });

  bot.command('filter_remove', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    const make = ctx.match?.toString().trim();
    if (!make) {
      await ctx.reply('İstifadə: /filter_remove <marka>');
      return;
    }
    const updated = await filters.removeMake(pool, make);
    await ctx.reply(`Silindi. Marka siyahısı: ${updated.makes.join(', ') || '(boş)'}`);
  });

  bot.command('filter_year', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    const parts = ctx.match?.toString().trim().split(/\s+/) ?? [];
    const [min, max] = parts.map(Number);
    if (!min || !max || Number.isNaN(min) || Number.isNaN(max)) {
      await ctx.reply('İstifadə: /filter_year <min> <max>, məs: /filter_year 2015 2023');
      return;
    }
    const updated = await filters.setYearRange(pool, min, max);
    await ctx.reply(`İl aralığı: ${updated.yearMin}–${updated.yearMax}`);
  });

  bot.command('filter_maxprice', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    const arg = ctx.match?.toString().trim();
    if (arg === 'clear') {
      await filters.setMaxPrice(pool, null);
      await ctx.reply('Maksimum qiymət limiti silindi.');
      return;
    }
    const price = Number(arg);
    if (!arg || Number.isNaN(price) || price <= 0) {
      await ctx.reply('İstifadə: /filter_maxprice <məbləğ> və ya /filter_maxprice clear');
      return;
    }
    const updated = await filters.setMaxPrice(pool, price);
    await ctx.reply(`Maksimum qiymət: $${updated.maxPrice}`);
  });

  bot.command('filter_show', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    const f = await filters.getFilter(pool);
    await ctx.reply(
      `Markalar: ${f.makes.join(', ') || '(hamısı)'}\n` +
        `İl: ${f.yearMin ?? '—'}–${f.yearMax ?? '—'}\n` +
        `Maks qiymət: ${f.maxPrice ? '$' + f.maxPrice : '—'}`
    );
  });

  bot.command('filter_clear', async (ctx: Context) => {
    if (!isAdmin(ctx, adminUserId)) return;
    await filters.clearFilter(pool);
    await ctx.reply('Filtr sıfırlandı.');
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/commands.test.ts`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/bot/commands.ts bid-cars-bot/test/commands.test.ts
git commit -m "feat(bid-cars-bot): admin-gated filter commands

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Scheduler + app entrypoint (final wiring)

**Files:**
- Create: `bid-cars-bot/src/scheduler/scheduler.ts`
- Create: `bid-cars-bot/src/index.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–9 (`createPool`, `migrate`, `getFilter`, `getSeenIds`/`markSeen`, `fetchNewListings`, `ChallengeError`, `selectNewMatches`, `postLot`, `registerFilterCommands`).
- Produces: `startScheduler(bot: Bot, pool: Pool, channelId: string, adminUserId: number): void`. Nothing downstream consumes this — it's the wiring layer.

No automated test for this task: it's pure orchestration of already-tested pieces plus live `node-cron`/Telegram/browser state. It's verified by the manual end-to-end check in Task 11.

- [ ] **Step 1: Write `src/scheduler/scheduler.ts`**

```ts
import cron from 'node-cron';
import { Bot } from 'grammy';
import { Pool } from 'pg';
import { fetchNewListings } from '../scraper/search.js';
import { ChallengeError } from '../lots/parseLots.js';
import { selectNewMatches } from './selectNewMatches.js';
import * as filtersDb from '../db/filters.js';
import * as seenLotsDb from '../db/seenLots.js';
import { postLot } from '../bot/post.js';

const FAILURE_ALERT_THRESHOLD = 3;

export function startScheduler(bot: Bot, pool: Pool, channelId: string, adminUserId: number): void {
  let consecutiveFailures = 0;

  cron.schedule('*/10 * * * *', async () => {
    try {
      const filter = await filtersDb.getFilter(pool);
      const lots = await fetchNewListings(filter);
      const seenIds = await seenLotsDb.getSeenIds(pool, lots.map(l => l.id));
      const matches = selectNewMatches(lots, filter, seenIds);

      for (const lot of matches) {
        await postLot(bot, channelId, lot);
        await seenLotsDb.markSeen(pool, lot.id);
      }
      consecutiveFailures = 0;
    } catch (err) {
      consecutiveFailures += 1;
      const reason = err instanceof ChallengeError ? 'Cloudflare challenge blokladı' : (err as Error).message;
      console.error('[scheduler] poll failed:', reason);
      if (consecutiveFailures >= FAILURE_ALERT_THRESHOLD) {
        await bot.api.sendMessage(
          String(adminUserId),
          `⚠️ bid.cars scrape ${consecutiveFailures} dəfə ardıcıl uğursuz oldu. Son səbəb: ${reason}`
        );
        consecutiveFailures = 0;
      }
    }
  });
}
```

- [ ] **Step 2: Write `src/index.ts`**

```ts
import 'dotenv/config';
import { Bot } from 'grammy';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { registerFilterCommands } from './bot/commands.js';
import { startScheduler } from './scheduler/scheduler.js';

const { BOT_TOKEN, CHANNEL_ID, ADMIN_USER_ID, DATABASE_URL } = process.env;
if (!BOT_TOKEN || !CHANNEL_ID || !ADMIN_USER_ID || !DATABASE_URL) {
  throw new Error('Missing required env vars: BOT_TOKEN, CHANNEL_ID, ADMIN_USER_ID, DATABASE_URL');
}

const pool = createPool(DATABASE_URL);
await migrate(pool);

const bot = new Bot(BOT_TOKEN);
const adminUserId = Number(ADMIN_USER_ID);

registerFilterCommands(bot, pool, adminUserId);
startScheduler(bot, pool, CHANNEL_ID, adminUserId);

bot.start();
console.log('bid-cars-bot started');
```

- [ ] **Step 3: Run the full test suite to make sure nothing broke**

Run: `cd bid-cars-bot && npx vitest run`
Expected: all tests from Tasks 1–9 still pass (this task adds no new tests, only wiring).

- [ ] **Step 4: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add bid-cars-bot/src/scheduler/scheduler.ts bid-cars-bot/src/index.ts
git commit -m "feat(bid-cars-bot): wire scheduler and app entrypoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Deploy to 157.180.73.79 and verify end-to-end

**Files:** none new — server configuration only.

**Interfaces:** none — this is the deployment task, last in the plan.

- [ ] **Step 1: Install Postgres on the server**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "apt-get install -y postgresql"
```

- [ ] **Step 2: Create the database and role**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "sudo -u postgres psql -c \"CREATE USER bid_cars_bot WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';\" -c \"CREATE DATABASE bid_cars_bot OWNER bid_cars_bot;\""
```

Pick a real strong password when running this — do not use the literal placeholder.

- [ ] **Step 3: Clean up the spike directory, keep the reusable Chromium cache**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "rm -rf /opt/bid-cars-bot/spike"
```

(`/root/.cache/ms-playwright` — the actual downloaded Chromium binary — is left in place and will be reused by the real project's `npx playwright install chromium --with-deps`, which is a no-op if the version already matches.)

- [ ] **Step 4: Sync the project to the server**

From the local repo root:

```bash
rsync -av --exclude node_modules --exclude .git --exclude dist --exclude .env \
  -e "ssh -i ~/.ssh/youtube-remote-webrtc_ed25519" \
  bid-cars-bot/ root@157.180.73.79:/opt/bid-cars-bot/
```

This does not touch the `.env` already sitting on the server (with `BOT_TOKEN` in it from earlier), since the source tree has no `.env` file to sync.

- [ ] **Step 5: Complete the server's `.env`**

SSH in and append the remaining variables to `/opt/bid-cars-bot/.env` (it already has `BOT_TOKEN`):

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79
cat >> /opt/bid-cars-bot/.env <<'EOF'
CHANNEL_ID=<real channel id, e.g. -100xxxxxxxxxx>
ADMIN_USER_ID=<your numeric Telegram user id, from @userinfobot>
DATABASE_URL=postgres://bid_cars_bot:CHANGE_ME_STRONG_PASSWORD@localhost:5432/bid_cars_bot
EOF
chmod 600 /opt/bid-cars-bot/.env
```

You'll need to have already: created the Telegram channel, added `@teslahubsAuctionBot` as an admin of it, and messaged `@userinfobot` to get your own numeric user id.

- [ ] **Step 6: Install dependencies and build on the server**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "cd /opt/bid-cars-bot && npm install && npx playwright install chromium --with-deps && npm run build"
```

- [ ] **Step 7: Create the systemd unit**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "cat > /etc/systemd/system/bid-cars-bot.service" <<'EOF'
[Unit]
Description=bid-cars-bot Telegram bot
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/bid-cars-bot
EnvironmentFile=/opt/bid-cars-bot/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

- [ ] **Step 8: Enable and start the service**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "systemctl daemon-reload && systemctl enable --now bid-cars-bot"
```

- [ ] **Step 9: Verify it started cleanly**

```bash
ssh -i ~/.ssh/youtube-remote-webrtc_ed25519 root@157.180.73.79 "systemctl status bid-cars-bot --no-pager && journalctl -u bid-cars-bot -n 30 --no-pager"
```

Expected: `active (running)`, log line `bid-cars-bot started`, no crash loop.

- [ ] **Step 10: Manual end-to-end verification (this is the real test — Cloudflare bypass and live posting can't be automated)**

In Telegram, DM `@teslahubsAuctionBot`:
1. `/filter_show` → expect the empty-filter message (proves the bot responds and DB round-trips).
2. `/filter_add Toyota` → expect confirmation.
3. `/filter_year 2015 2023`
4. `/filter_maxprice 15000`
5. `/filter_show` → confirm all three took effect.
6. Wait up to 10 minutes for the next scheduled poll (or temporarily edit the cron expression to `*/1 * * * *`, restart the service, confirm a post, then change it back to `*/10 * * * *` and restart again).
7. Confirm a real Toyota listing (year 2015–2023, under $15,000 estimated) appears in the channel with photo, price, location, damage, auction time, and a working link.
8. Check `journalctl -u bid-cars-bot -f` during this to confirm no errors logged.

- [ ] **Step 11: Commit the deployment note**

```bash
git add docs/superpowers/plans/2026-08-16-bid-cars-telegram-bot.md
git commit -m "docs: mark bid-cars-bot deployed to 157.180.73.79

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" --allow-empty
```

(Use this final commit as the checkpoint to update this plan file's checkboxes once Step 10 is confirmed working live.)
