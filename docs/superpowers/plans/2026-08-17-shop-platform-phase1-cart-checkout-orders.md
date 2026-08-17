# Shop Platform — Phase 1 Cart, Checkout & Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-in customer add products to a cart, check out (creating a real order against a real branch, with a real delivery method), and see their own order history — the `cart` and `orders` modules spec §5 already designed the data model for, built end-to-end for the first time.

**Scope note:** Cart is **tied to a logged-in customer, no anonymous/guest cart** in Phase 1 — a deliberate simplification consistent with spec §3a's "no anonymous checkout" decision, extended one step earlier (to the cart itself) to avoid the real added complexity of anonymous-cart-then-merge-on-login logic, which nothing in the spec actually asks for. Order **status** exists as the full spec-defined lifecycle (`draft → in_progress → prepare → checking → approved → on_way → delivered`) but is only ever set to `draft` by checkout in Phase 1 — advancing it is Phase 3's Tenant Admin suite, exactly as the spec already says. **Payment** is cash-on-delivery/manual only (spec §2) — the `payments`/`payment_transactions` tables get a row, but no real gateway is called.

**Architecture:** Two new backend modules, same Clean Architecture shape as every prior one: `cart` (domain/infrastructure/presentation) and `orders` (domain/infrastructure/presentation). `cart`'s domain is the richest in the project so far (spec §7 named this in advance: "cart has the richest [service] because it does real calculation") — total calculation and a stock check on add-to-cart, both pure and DB-free. `orders`' checkout flow reads the cart, validates the customer has a phone on file (or one supplied at checkout — spec §3a), picks a delivery method, creates the order + order_items + a payment row, and clears the cart — all inside one transaction.

**Tech Stack:** No new dependencies — existing backend stack throughout. No storefront UI in this plan (matches the "prove the mechanism via the API first" pattern every backend-first plan in this project has used) — a cart/checkout storefront UI is natural follow-up work once this API exists, not bundled in here.

## Global Constraints

- Every tenant-owned table has `tenant_id`, RLS enforced (spec §3). This plan's migration adds tables to the already-`shop_platform_app`-owned... **no, it doesn't** — `cart`/`orders` are NEW schemas, so `shop_platform_app` will own them (it runs the `CREATE SCHEMA` itself), same as `customers`/`catalog` — **not** the `tenants`-schema CREATE-grant trap gotcha #12 documented. Still extend `setup-role.sql` with the new schemas' grant blocks for consistency/future migrations, and re-run it, but no special CREATE-on-existing-schema step should be needed this time.
- `domain/` files never import Express or `pg` directly (spec §7).
- No client-supplied `tenantId` or `customerId` is ever trusted — always `req.tenant.id` (from `tenantResolve`) and `req.customer.id` (from `customerAuth`).
- Checkout requires a logged-in customer (spec §3a) — every cart/order route in this plan is mounted behind `customerAuth`.
- A phone number is required to place an order, even though it's optional on the customer record (spec §3a) — enforced in `orderService`, not the DB column.
- Stock is decremented on order creation using the existing plain-quantity `product_stock` column (spec: "no reservation/locking in Phase 1") — a real race condition between two simultaneous checkouts of the last unit is a known, accepted Phase 1 limitation (matches spec's own explicit non-goal), not something this plan tries to solve.

---

## File Structure

```
packages/shared-types/src/
├── cart.ts                  # Cart/CartItem types
├── cart.test.ts
├── order.ts                 # Order/OrderItem/DeliveryMethod types + checkoutRequestSchema
└── order.test.ts

backend/src/
├── db/
│   ├── migrations/0007_cart_and_orders_tables.sql
│   └── setup-role.sql                          # extended: cart + orders schema grants
└── modules/
    ├── cart/
    │   ├── domain/
    │   │   ├── cart.ts
    │   │   ├── cartRepository.ts
    │   │   └── cartService.ts                   # total calc, stock check, add/remove/updateQty
    │   ├── infrastructure/
    │   │   ├── pgCartRepository.ts
    │   │   └── pgCartRepository.test.ts
    │   └── presentation/
    │       ├── cartRoutes.ts                     # GET /cart, POST /cart/items, PATCH/DELETE /cart/items/:id
    │       └── cartRoutes.test.ts
    └── orders/
        ├── domain/
        │   ├── order.ts
        │   ├── orderRepository.ts
        │   └── orderService.ts                   # checkout: phone check, stock decrement, order+payment creation
        ├── infrastructure/
        │   ├── pgOrderRepository.ts
        │   └── pgOrderRepository.test.ts
        └── presentation/
            ├── orderRoutes.ts                     # POST /orders (checkout), GET /orders, GET /orders/:id
            └── orderRoutes.test.ts
```

---

## Task 1: Shared Cart/Order types

**Files:**
- Create: `packages/shared-types/src/cart.ts`
- Create: `packages/shared-types/src/cart.test.ts`
- Create: `packages/shared-types/src/order.ts`
- Create: `packages/shared-types/src/order.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces: `Cart`/`CartItem` types; `Order`/`OrderItem`/`OrderStatus`/`DeliveryMethod` types + `checkoutRequestSchema` (zod). `OrderStatus` is the full 7-value union from spec §5 (`draft`/`in_progress`/`prepare`/`checking`/`approved`/`on_way`/`delivered`) even though Phase 1 only ever produces `draft`.

- [ ] **Step 1: Write the failing tests**

`packages/shared-types/src/cart.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { cartSchema } from './cart';

describe('cartSchema', () => {
  it('accepts a cart with items and a total', () => {
    const result = cartSchema.safeParse({
      id: 'c1', tenantId: 't1', customerId: 'cust1',
      items: [{ id: 'i1', productId: 'p1', productName: 'iPhone 15', priceCents: 250000, quantity: 2 }],
      totalCents: 500000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty cart', () => {
    const result = cartSchema.safeParse({ id: 'c1', tenantId: 't1', customerId: 'cust1', items: [], totalCents: 0 });
    expect(result.success).toBe(true);
  });
});
```

`packages/shared-types/src/order.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { orderSchema, checkoutRequestSchema, orderStatusSchema } from './order';

describe('orderStatusSchema', () => {
  it('accepts all 7 spec-defined statuses', () => {
    for (const status of ['draft', 'in_progress', 'prepare', 'checking', 'approved', 'on_way', 'delivered']) {
      expect(orderStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it('rejects an unknown status', () => {
    expect(orderStatusSchema.safeParse('shipped').success).toBe(false);
  });
});

describe('checkoutRequestSchema', () => {
  it('accepts self_pickup with a branchId', () => {
    const result = checkoutRequestSchema.safeParse({ deliveryMethod: 'self_pickup', branchId: 'b1', phone: '+994501234567' });
    expect(result.success).toBe(true);
  });

  it('accepts courier with no branchId', () => {
    const result = checkoutRequestSchema.safeParse({ deliveryMethod: 'courier', phone: '+994501234567' });
    expect(result.success).toBe(true);
  });

  it('rejects self_pickup with no branchId', () => {
    const result = checkoutRequestSchema.safeParse({ deliveryMethod: 'self_pickup', phone: '+994501234567' });
    expect(result.success).toBe(false);
  });
});

describe('orderSchema', () => {
  it('accepts a full order with items and payment', () => {
    const result = orderSchema.safeParse({
      id: 'o1', tenantId: 't1', customerId: 'cust1', status: 'draft', phone: '+994501234567',
      deliveryMethod: 'self_pickup', branchId: 'b1',
      items: [{ productId: 'p1', productName: 'iPhone 15', priceCents: 250000, quantity: 1 }],
      totalCents: 250000, createdAt: '2026-08-17T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from repo root): `npm test --workspace=packages/shared-types -- cart.test order.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write minimal implementation**

`packages/shared-types/src/cart.ts`:
```typescript
import { z } from 'zod';

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  priceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  customerId: z.string(),
  items: z.array(cartItemSchema),
  totalCents: z.number().int().nonnegative(),
});
export type Cart = z.infer<typeof cartSchema>;
```

`packages/shared-types/src/order.ts`:
```typescript
import { z } from 'zod';

export const orderStatusSchema = z.enum(['draft', 'in_progress', 'prepare', 'checking', 'approved', 'on_way', 'delivered']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const deliveryMethodSchema = z.enum(['self_pickup', 'courier']);
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

export const checkoutRequestSchema = z
  .object({
    deliveryMethod: deliveryMethodSchema,
    branchId: z.string().optional(),
    phone: z.string().min(1),
  })
  .refine((data) => data.deliveryMethod !== 'self_pickup' || !!data.branchId, {
    message: 'branchId is required when deliveryMethod is self_pickup',
    path: ['branchId'],
  });
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  priceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  customerId: z.string(),
  status: orderStatusSchema,
  phone: z.string(),
  deliveryMethod: deliveryMethodSchema,
  branchId: z.string().nullable(),
  items: z.array(orderItemSchema),
  totalCents: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type Order = z.infer<typeof orderSchema>;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=packages/shared-types -- cart.test order.test`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types
git commit -m "feat: add shared Cart and Order types"
git push origin develop
```

---

## Task 2: Cart + Orders schema migration + role grants

**Files:**
- Create: `backend/src/db/migrations/0007_cart_and_orders_tables.sql`
- Modify: `backend/src/db/setup-role.sql`
- Test: `backend/src/db/migrations.cartOrders.test.ts`

**Interfaces:**
- Produces: `cart.carts`, `cart.cart_items`; `orders.orders` (incl. `status`, `delivery_method`, `branch_id`, `phone`), `orders.order_items`, `orders.payments`, `orders.payment_transactions`. All RLS-enforced.

- [ ] **Step 1: Write the failing test**

`backend/src/db/migrations.cartOrders.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migrate';
import { withTenant } from './withTenant';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });

let tenantAId: string;
let tenantBId: string;
let customerId: string;
let branchId: string;
let productId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const a = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('cart-tenant-a', 'A') RETURNING id`);
  const b = await pool.query(`INSERT INTO tenants.tenants (subdomain, name) VALUES ('cart-tenant-b', 'B') RETURNING id`);
  tenantAId = a.rows[0].id;
  tenantBId = b.rows[0].id;

  await withTenant(pool, tenantAId, async (client) => {
    const cust = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'A','B','Bakı','cart-test@example.com',NULL,'hash') RETURNING id`,
      [tenantAId]
    );
    customerId = cust.rows[0].id;
    const branch = await client.query(`INSERT INTO tenants.branches (tenant_id, name, address) VALUES ($1, 'Main', 'Bakı') RETURNING id`, [tenantAId]);
    branchId = branch.rows[0].id;
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantAId]);
    const product = await client.query(
      `INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'Product A', NULL, 1000) RETURNING id`,
      [tenantAId, cat.rows[0].id]
    );
    productId = product.rows[0].id;
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id IN ($1, $2)', [tenantAId, tenantBId]);
  await pool.end();
});

describe('cart and orders schema', () => {
  it('stores a cart with items, RLS-isolated per tenant', async () => {
    const cart = await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO cart.carts (tenant_id, customer_id) VALUES ($1, $2) RETURNING id`, [tenantAId, customerId])
    );
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO cart.cart_items (tenant_id, cart_id, product_id, quantity) VALUES ($1, $2, $3, 2)`, [tenantAId, cart.rows[0].id, productId])
    );

    const asTenantB = await withTenant(pool, tenantBId, (client) => client.query('SELECT * FROM cart.carts'));
    expect(asTenantB.rows).toEqual([]);
  });

  it('stores an order with items, a payment row, and a valid status default', async () => {
    const order = await withTenant(pool, tenantAId, (client) =>
      client.query(
        `INSERT INTO orders.orders (tenant_id, customer_id, phone, delivery_method, branch_id) VALUES ($1, $2, '+994501234567', 'self_pickup', $3) RETURNING id, status`,
        [tenantAId, customerId, branchId]
      )
    );
    expect(order.rows[0].status).toBe('draft');

    await withTenant(pool, tenantAId, (client) =>
      client.query(
        `INSERT INTO orders.order_items (tenant_id, order_id, product_id, product_name, price_cents, quantity) VALUES ($1, $2, $3, 'Product A', 1000, 2)`,
        [tenantAId, order.rows[0].id, productId]
      )
    );
    await withTenant(pool, tenantAId, (client) =>
      client.query(`INSERT INTO orders.payments (tenant_id, order_id, method, amount_cents, status) VALUES ($1, $2, 'cash_on_delivery', 2000, 'pending')`, [tenantAId, order.rows[0].id])
    );

    const items = await withTenant(pool, tenantAId, (client) => client.query('SELECT * FROM orders.order_items WHERE order_id = $1', [order.rows[0].id]));
    expect(items.rows).toHaveLength(1);
  });

  it('rejects an order status outside the 7 spec-defined values', async () => {
    await expect(
      withTenant(pool, tenantAId, (client) =>
        client.query(
          `INSERT INTO orders.orders (tenant_id, customer_id, phone, delivery_method, status) VALUES ($1, $2, '+994501234567', 'courier', 'shipped')`,
          [tenantAId, customerId]
        )
      )
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.cartOrders.test`
Expected: FAIL — relations don't exist

- [ ] **Step 3: Write the migration**

`backend/src/db/migrations/0007_cart_and_orders_tables.sql`:
```sql
CREATE SCHEMA IF NOT EXISTS cart;

CREATE TABLE cart.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers.customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, customer_id)
);
CREATE INDEX idx_carts_tenant_id ON cart.carts (tenant_id);
ALTER TABLE cart.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart.carts FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cart.carts
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE cart.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    cart_id UUID NOT NULL REFERENCES cart.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, product_id)
);
CREATE INDEX idx_cart_items_tenant_id ON cart.cart_items (tenant_id);
CREATE INDEX idx_cart_items_cart_id ON cart.cart_items (cart_id);
ALTER TABLE cart.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart.cart_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cart.cart_items
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE SCHEMA IF NOT EXISTS orders;

CREATE TABLE orders.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers.customers(id),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'prepare', 'checking', 'approved', 'on_way', 'delivered')),
    phone TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('self_pickup', 'courier')),
    branch_id UUID REFERENCES tenants.branches(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_tenant_id ON orders.orders (tenant_id);
CREATE INDEX idx_orders_customer_id ON orders.orders (customer_id);
ALTER TABLE orders.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders.orders FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders.orders
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
-- customer_id and product_id below deliberately have NO ON DELETE CASCADE
-- (unlike cart_items, where losing a deleted product from someone's
-- in-progress cart is fine): an order is a historical record. Nothing in
-- Phase 1 deletes a customer or product, so this is a safety net, not a
-- currently-exercised path — it just ensures a future delete feature can't
-- silently destroy order history by default.

CREATE TABLE orders.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    product_name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_tenant_id ON orders.order_items (tenant_id);
CREATE INDEX idx_order_items_order_id ON orders.order_items (order_id);
ALTER TABLE orders.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders.order_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders.order_items
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE orders.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (method = 'cash_on_delivery'),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_tenant_id ON orders.payments (tenant_id);
CREATE INDEX idx_payments_order_id ON orders.payments (order_id);
ALTER TABLE orders.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders.payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders.payments
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE orders.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants.tenants(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES orders.payments(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_transactions_tenant_id ON orders.payment_transactions (tenant_id);
ALTER TABLE orders.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders.payment_transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders.payment_transactions
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

- [ ] **Step 4: Extend the role-grants script**

Modify `backend/src/db/setup-role.sql` — add after the `catalog` schema grants block:
```sql
-- cart schema (added by the Cart/Checkout/Orders plan)
GRANT USAGE ON SCHEMA cart TO shop_platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cart TO shop_platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA cart GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_platform_app;

-- orders schema (added by the Cart/Checkout/Orders plan)
GRANT USAGE ON SCHEMA orders TO shop_platform_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA orders TO shop_platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA orders GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_platform_app;
```
`cart`/`orders` are NEW schemas this migration creates — `shop_platform_app` runs the migration and thus owns them (same as `customers`/`catalog`), so **no extra CREATE grant is needed here** (unlike gotcha #12's `tenants`-schema situation). Apply anyway for the standard USAGE/DML/default-privileges coverage:
```bash
psql -d shop_platform -f backend/src/db/setup-role.sql
psql -d shop_platform_test -f backend/src/db/setup-role.sql
```

- [ ] **Step 5: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- migrations.cartOrders.test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/migrations/0007_cart_and_orders_tables.sql backend/src/db/setup-role.sql backend/src/db/migrations.cartOrders.test.ts
git commit -m "feat: add cart and orders schema migration with RLS"
git push origin develop
```

---

## Task 3: `cart` module — domain layer (`cartService`)

**Files:**
- Create: `backend/src/modules/cart/domain/cart.ts`
- Create: `backend/src/modules/cart/domain/cartRepository.ts`
- Create: `backend/src/modules/cart/domain/cartService.ts`
- Test: `backend/src/modules/cart/domain/cartService.test.ts`

**Interfaces:**
- Produces:
  - `CartRepository.findOrCreateByCustomer(tenantId, customerId): Promise<CartRow>`
  - `CartRepository.addItem(tenantId, cartId, productId, quantity): Promise<CartRow>` (upserts — adding an already-present product increases its quantity)
  - `CartRepository.updateItemQuantity(tenantId, cartId, itemId, quantity): Promise<CartRow>`
  - `CartRepository.removeItem(tenantId, cartId, itemId): Promise<CartRow>`
  - `CartService.getCart(tenantId, customerId): Promise<Cart>` — joins in live product name/price so a changed price shows up immediately, not a stale snapshot (that snapshot only happens at checkout, into `order_items`)
  - `CartService.addItem(tenantId, customerId, productId, quantity): Promise<Cart>` — throws `OutOfStockError` if requested quantity exceeds total stock
  - `CartService.updateItemQuantity`/`removeItem` — same shape

- [ ] **Step 1: Write the failing test**

`backend/src/modules/cart/domain/cartService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { CartService, OutOfStockError } from './cartService';
import type { CartRepository, CartRow } from './cartRepository';
import type { ProductLookup } from './cartService';

function row(overrides: Partial<CartRow> = {}): CartRow {
  return { id: 'cart1', tenantId: 't1', customerId: 'cust1', items: [], ...overrides };
}

function fakeProductLookup(stockById: Record<string, { name: string; priceCents: number; totalStock: number }>): ProductLookup {
  return { get: vi.fn(async (productId: string) => stockById[productId] ?? null) };
}

describe('CartService.addItem', () => {
  it('adds a new item and returns the cart with live product name/price joined in', async () => {
    const repo: CartRepository = {
      findOrCreateByCustomer: vi.fn(async () => row()),
      addItem: vi.fn(async () => row({ items: [{ id: 'i1', productId: 'p1', quantity: 2 }] })),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
    };
    const products = fakeProductLookup({ p1: { name: 'iPhone 15', priceCents: 250000, totalStock: 5 } });
    const service = new CartService(repo, products);

    const cart = await service.addItem('t1', 'cust1', 'p1', 2);
    expect(cart.items).toEqual([{ id: 'i1', productId: 'p1', productName: 'iPhone 15', priceCents: 250000, quantity: 2 }]);
    expect(cart.totalCents).toBe(500000);
  });

  it('rejects adding more than the available stock', async () => {
    const repo: CartRepository = { findOrCreateByCustomer: vi.fn(async () => row()), addItem: vi.fn(), updateItemQuantity: vi.fn(), removeItem: vi.fn() };
    const products = fakeProductLookup({ p1: { name: 'iPhone 15', priceCents: 250000, totalStock: 1 } });
    const service = new CartService(repo, products);

    await expect(service.addItem('t1', 'cust1', 'p1', 2)).rejects.toThrow(OutOfStockError);
    expect(repo.addItem).not.toHaveBeenCalled();
  });
});

describe('CartService.getCart', () => {
  it('sums totalCents across all items using live prices', async () => {
    const repo: CartRepository = {
      findOrCreateByCustomer: vi.fn(async () =>
        row({ items: [{ id: 'i1', productId: 'p1', quantity: 2 }, { id: 'i2', productId: 'p2', quantity: 1 }] })
      ),
      addItem: vi.fn(), updateItemQuantity: vi.fn(), removeItem: vi.fn(),
    };
    const products = fakeProductLookup({
      p1: { name: 'A', priceCents: 1000, totalStock: 10 },
      p2: { name: 'B', priceCents: 500, totalStock: 10 },
    });
    const service = new CartService(repo, products);

    const cart = await service.getCart('t1', 'cust1');
    expect(cart.totalCents).toBe(2500); // 2*1000 + 1*500
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- cartService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/cart/domain/cart.ts`:
```typescript
export type { Cart, CartItem } from '@shop-platform/shared-types';
```

`backend/src/modules/cart/domain/cartRepository.ts`:
```typescript
export interface CartItemRow {
  id: string;
  productId: string;
  quantity: number;
}

export interface CartRow {
  id: string;
  tenantId: string;
  customerId: string;
  items: CartItemRow[];
}

export interface CartRepository {
  findOrCreateByCustomer(tenantId: string, customerId: string): Promise<CartRow>;
  addItem(tenantId: string, cartId: string, productId: string, quantity: number): Promise<CartRow>;
  updateItemQuantity(tenantId: string, cartId: string, itemId: string, quantity: number): Promise<CartRow>;
  removeItem(tenantId: string, cartId: string, itemId: string): Promise<CartRow>;
}
```

`backend/src/modules/cart/domain/cartService.ts`:
```typescript
import type { Cart } from './cart';
import type { CartRepository, CartRow } from './cartRepository';

export class OutOfStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(`Requested ${requested} of product ${productId}, only ${available} in stock`);
    this.name = 'OutOfStockError';
  }
}

export interface ProductLookup {
  get(productId: string): Promise<{ name: string; priceCents: number; totalStock: number } | null>;
}

export class CartService {
  constructor(
    private readonly repository: CartRepository,
    private readonly products: ProductLookup
  ) {}

  private async toCart(row: CartRow): Promise<Cart> {
    const items = await Promise.all(
      row.items.map(async (item) => {
        const product = await this.products.get(item.productId);
        return {
          id: item.id,
          productId: item.productId,
          productName: product?.name ?? '(unknown product)',
          priceCents: product?.priceCents ?? 0,
          quantity: item.quantity,
        };
      })
    );
    const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    return { id: row.id, tenantId: row.tenantId, customerId: row.customerId, items, totalCents };
  }

  async getCart(tenantId: string, customerId: string): Promise<Cart> {
    const row = await this.repository.findOrCreateByCustomer(tenantId, customerId);
    return this.toCart(row);
  }

  async addItem(tenantId: string, customerId: string, productId: string, quantity: number): Promise<Cart> {
    const product = await this.products.get(productId);
    if (!product || product.totalStock < quantity) {
      throw new OutOfStockError(productId, quantity, product?.totalStock ?? 0);
    }
    const cartRow = await this.repository.findOrCreateByCustomer(tenantId, customerId);
    const updated = await this.repository.addItem(tenantId, cartRow.id, productId, quantity);
    return this.toCart(updated);
  }

  async updateItemQuantity(tenantId: string, customerId: string, itemId: string, quantity: number): Promise<Cart> {
    const cartRow = await this.repository.findOrCreateByCustomer(tenantId, customerId);
    const updated = await this.repository.updateItemQuantity(tenantId, cartRow.id, itemId, quantity);
    return this.toCart(updated);
  }

  async removeItem(tenantId: string, customerId: string, itemId: string): Promise<Cart> {
    const cartRow = await this.repository.findOrCreateByCustomer(tenantId, customerId);
    const updated = await this.repository.removeItem(tenantId, cartRow.id, itemId);
    return this.toCart(updated);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- cartService.test`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/cart/domain
git commit -m "feat: add cart module domain layer (CartService with stock check + live pricing)"
git push origin develop
```

---

## Task 4: `cart` module — infrastructure layer

**Files:**
- Create: `backend/src/modules/cart/infrastructure/pgCartRepository.ts`
- Create: `backend/src/modules/cart/infrastructure/pgCartRepository.test.ts`
- Create: `backend/src/modules/cart/infrastructure/pgProductLookup.ts` (implements `ProductLookup` against `catalog.products`/`catalog.product_stock`)
- Create: `backend/src/modules/cart/infrastructure/pgProductLookup.test.ts`

**Interfaces:**
- Consumes: `withTenant`, `cart.*` tables (Task 2), `catalog.products`/`catalog.product_stock` (Catalog Backend plan).
- Produces: `PgCartRepository implements CartRepository`, `PgProductLookup implements ProductLookup`.

- [ ] **Step 1: Write the failing tests**

`backend/src/modules/cart/infrastructure/pgProductLookup.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { withTenant } from '../../../db/withTenant';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgProductLookup } from './pgProductLookup';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const lookup = new PgProductLookup(pool);

let tenantId: string;
let productId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'product-lookup-test', name: 'Product Lookup Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, async (client) => {
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantId]);
    const branch = await client.query(`INSERT INTO tenants.branches (tenant_id, name, address) VALUES ($1, 'Main', 'Bakı') RETURNING id`, [tenantId]);
    const product = await client.query(
      `INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'iPhone 15', NULL, 250000) RETURNING id`,
      [tenantId, cat.rows[0].id]
    );
    productId = product.rows[0].id;
    await client.query(`INSERT INTO catalog.product_stock (tenant_id, product_id, branch_id, quantity) VALUES ($1, $2, $3, 5)`, [tenantId, productId, branch.rows[0].id]);
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgProductLookup', () => {
  it('returns name, price, and total stock for a real product, scoped by tenant', async () => {
    const result = await lookup.get(productId, tenantId);
    expect(result).toEqual({ name: 'iPhone 15', priceCents: 250000, totalStock: 5 });
  });

  it('returns null for an unknown product', async () => {
    expect(await lookup.get('00000000-0000-0000-0000-000000000000', tenantId)).toBeNull();
  });
});
```

`backend/src/modules/cart/infrastructure/pgCartRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { withTenant } from '../../../db/withTenant';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgCartRepository } from './pgCartRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const cartRepo = new PgCartRepository(pool);

let tenantId: string;
let productId: string;
let customerId: string;
let secondCustomerId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'cart-repo-test', name: 'Cart Repo Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, async (client) => {
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantId]);
    const product = await client.query(
      `INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'Product A', NULL, 1000) RETURNING id`,
      [tenantId, cat.rows[0].id]
    );
    productId = product.rows[0].id;
    // customer_id has a real FK to customers.customers now — create two real
    // rows rather than fabricating UUIDs, matching every other repo test's
    // pattern in this project (see e.g. migrations.cartOrders.test.ts).
    const cust1 = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'A','B','Bakı','cart-repo-1@example.com',NULL,'hash') RETURNING id`,
      [tenantId]
    );
    customerId = cust1.rows[0].id;
    const cust2 = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'C','D','Bakı','cart-repo-2@example.com',NULL,'hash') RETURNING id`,
      [tenantId]
    );
    secondCustomerId = cust2.rows[0].id;
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgCartRepository', () => {
  it('findOrCreateByCustomer creates a cart on first call, returns the same one on the second', async () => {
    const first = await cartRepo.findOrCreateByCustomer(tenantId, customerId);
    const second = await cartRepo.findOrCreateByCustomer(tenantId, customerId);
    expect(second.id).toBe(first.id);
  });

  it('addItem adds a new line; adding the same product again increases quantity instead of duplicating', async () => {
    const cart = await cartRepo.findOrCreateByCustomer(tenantId, customerId);
    await cartRepo.addItem(tenantId, cart.id, productId, 2);
    const afterSecondAdd = await cartRepo.addItem(tenantId, cart.id, productId, 3);
    expect(afterSecondAdd.items).toHaveLength(1);
    expect(afterSecondAdd.items[0]?.quantity).toBe(5);
  });

  it('updateItemQuantity and removeItem work', async () => {
    const cart = await cartRepo.findOrCreateByCustomer(tenantId, secondCustomerId);
    const withItem = await cartRepo.addItem(tenantId, cart.id, productId, 1);
    const itemId = withItem.items[0]!.id;

    const updated = await cartRepo.updateItemQuantity(tenantId, cart.id, itemId, 9);
    expect(updated.items[0]?.quantity).toBe(9);

    const removed = await cartRepo.removeItem(tenantId, cart.id, itemId);
    expect(removed.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/cart/infrastructure`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the implementations**

`backend/src/modules/cart/infrastructure/pgProductLookup.ts`:
```typescript
import type { Pool } from 'pg';
import { withTenant } from '../../../db/withTenant';
import type { ProductLookup } from '../domain/cartService';

export class PgProductLookup implements ProductLookup {
  constructor(private readonly pool: Pool) {}

  // Note the extra tenantId param (beyond the ProductLookup interface's single
  // productId) — cartService always has a tenantId in scope when it calls
  // this, so the interface itself takes only productId for domain-layer
  // simplicity, and this infrastructure adapter is constructed per-request
  // with tenantId already known where wired (see cartRoutes.ts, Task 5).
  async get(productId: string, tenantId: string): Promise<{ name: string; priceCents: number; totalStock: number } | null> {
    if (!tenantId) throw new Error('PgProductLookup.get requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const productRes = await client.query('SELECT name, price_cents FROM catalog.products WHERE tenant_id = $1 AND id = $2', [tenantId, productId]);
      if (!productRes.rows[0]) return null;
      const stockRes = await client.query('SELECT COALESCE(SUM(quantity), 0)::int AS total FROM catalog.product_stock WHERE tenant_id = $1 AND product_id = $2', [tenantId, productId]);
      return {
        name: productRes.rows[0].name,
        priceCents: productRes.rows[0].price_cents,
        totalStock: stockRes.rows[0].total,
      };
    });
  }
}
```

**Note:** this makes `ProductLookup.get`'s real signature `(productId: string, tenantId: string)`, one more argument than Task 3's interface declared. Update `backend/src/modules/cart/domain/cartService.ts`'s `ProductLookup` interface to `get(productId: string, tenantId: string): Promise<...>` and its 3 call sites (`toCart`, `addItem`) to pass `tenantId` through — a small necessary correction to Task 3's interface, caught here because the infrastructure layer is where the real constraint (repository calls need a tenantId) becomes concrete. Re-run Task 3's tests after this change (update its 2 fake `ProductLookup.get` mocks to accept the extra unused param) to confirm they still pass.

`backend/src/modules/cart/infrastructure/pgCartRepository.ts`:
```typescript
import type { Pool } from 'pg';
import type { CartRepository, CartRow } from '../domain/cartRepository';
import { withTenant } from '../../../db/withTenant';

async function loadCartRow(client: any, tenantId: string, cartId: string): Promise<CartRow> {
  const items = await client.query('SELECT id, product_id, quantity FROM cart.cart_items WHERE tenant_id = $1 AND cart_id = $2', [tenantId, cartId]);
  return {
    id: cartId,
    tenantId,
    customerId: '', // filled in by callers that already know it; findOrCreateByCustomer sets it directly
    items: items.rows.map((r: any) => ({ id: r.id, productId: r.product_id, quantity: r.quantity })),
  };
}

export class PgCartRepository implements CartRepository {
  constructor(private readonly pool: Pool) {}

  async findOrCreateByCustomer(tenantId: string, customerId: string): Promise<CartRow> {
    if (!tenantId) throw new Error('CartRepository.findOrCreateByCustomer requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO cart.carts (tenant_id, customer_id) VALUES ($1, $2)
         ON CONFLICT (tenant_id, customer_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id
         RETURNING id`,
        [tenantId, customerId]
      );
      const cart = await loadCartRow(client, tenantId, rows[0].id);
      return { ...cart, customerId };
    });
  }

  async addItem(tenantId: string, cartId: string, productId: string, quantity: number): Promise<CartRow> {
    if (!tenantId) throw new Error('CartRepository.addItem requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      await client.query(
        `INSERT INTO cart.cart_items (tenant_id, cart_id, product_id, quantity) VALUES ($1, $2, $3, $4)
         ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart.cart_items.quantity + EXCLUDED.quantity`,
        [tenantId, cartId, productId, quantity]
      );
      return loadCartRow(client, tenantId, cartId);
    });
  }

  async updateItemQuantity(tenantId: string, cartId: string, itemId: string, quantity: number): Promise<CartRow> {
    if (!tenantId) throw new Error('CartRepository.updateItemQuantity requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      await client.query('UPDATE cart.cart_items SET quantity = $1 WHERE tenant_id = $2 AND id = $3', [quantity, tenantId, itemId]);
      return loadCartRow(client, tenantId, cartId);
    });
  }

  async removeItem(tenantId: string, cartId: string, itemId: string): Promise<CartRow> {
    if (!tenantId) throw new Error('CartRepository.removeItem requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      await client.query('DELETE FROM cart.cart_items WHERE tenant_id = $1 AND id = $2', [tenantId, itemId]);
      return loadCartRow(client, tenantId, cartId);
    });
  }
}
```

- [ ] **Step 4: Update Task 3's `ProductLookup` interface and its tests per the note above, then run everything**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- modules/cart`
Expected: PASS (cartService.test.ts's 4 tests still pass with the updated mocks + the 5 new infrastructure tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/cart/infrastructure backend/src/modules/cart/domain/cartService.ts backend/src/modules/cart/domain/cartService.test.ts
git commit -m "feat: add PgCartRepository and PgProductLookup"
git push origin develop
```

---

## Task 5: Cart routes, wire into `server.ts`

**Files:**
- Create: `backend/src/modules/cart/presentation/cartRoutes.ts`
- Create: `backend/src/modules/cart/presentation/cartRoutes.test.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `CartService` (Task 3), `customerAuth` (Customer Auth plan).
- Produces: `cartRoutes(cartServiceFactory): Router` mounting `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` — all behind `customerAuth`, scoped by `req.customer.id`/`req.tenant.id`, never a client-supplied id.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/cart/presentation/cartRoutes.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { customerAuth } from '../../../middleware/customerAuth';
import { errorHandler } from '../../../middleware/errorHandler';
import { cartRoutes } from './cartRoutes';
import { CartService } from '../domain/cartService';
import { signCustomerToken } from '../../../lib/jwt';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { CustomerRepository } from '../../customers/domain/customerRepository';
import type { CartRepository, CartRow } from '../domain/cartRepository';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };
const CUSTOMER = { id: 'cust1', tenantId: 't1', name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', phone: null, passwordHash: 'h', role: 'user' as const, type: 'physical' as const, createdAt: '2026-08-15T00:00:00.000Z' };

function buildApp() {
  const carts = new Map<string, CartRow>();
  const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
  const customerRepository: CustomerRepository = { findByTenantAndEmail: vi.fn(), findById: vi.fn(async () => CUSTOMER), create: vi.fn() };
  const cartRepository: CartRepository = {
    findOrCreateByCustomer: vi.fn(async (tenantId, customerId) => {
      const key = `${tenantId}:${customerId}`;
      if (!carts.has(key)) carts.set(key, { id: key, tenantId, customerId, items: [] });
      return carts.get(key)!;
    }),
    addItem: vi.fn(async (tenantId, cartId, productId, quantity) => {
      const cart = [...carts.values()].find((c) => c.id === cartId)!;
      cart.items.push({ id: `item-${cart.items.length + 1}`, productId, quantity });
      return cart;
    }),
    updateItemQuantity: vi.fn(async (tenantId, cartId, itemId, quantity) => {
      const cart = [...carts.values()].find((c) => c.id === cartId)!;
      const item = cart.items.find((i) => i.id === itemId)!;
      item.quantity = quantity;
      return cart;
    }),
    removeItem: vi.fn(async (tenantId, cartId, itemId) => {
      const cart = [...carts.values()].find((c) => c.id === cartId)!;
      cart.items = cart.items.filter((i) => i.id !== itemId);
      return cart;
    }),
  };
  const cartService = new CartService(cartRepository, { get: vi.fn(async (productId) => ({ name: 'Product', priceCents: 1000, totalStock: 99 })) });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantResolve(tenantRepository));
  app.use(cartRoutes(cartService));
  app.use(errorHandler);
  return { app, customerRepository };
}

function authHeader() {
  const token = signCustomerToken({ customerId: 'cust1', tenantId: 't1' });
  return { Authorization: `Bearer ${token}` };
}

describe('cart routes', () => {
  it('GET /cart requires login (401 with no token)', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/cart').set('Host', 'shop-a.platform.test');
    expect(res.status).toBe(401);
  });

  it('POST /cart/items adds an item, then GET /cart reflects it', async () => {
    const { app } = buildApp();
    const postRes = await request(app).post('/cart/items').set('Host', 'shop-a.platform.test').set(authHeader()).send({ productId: 'p1', quantity: 2 });
    expect(postRes.status).toBe(200);
    expect(postRes.body.items).toHaveLength(1);

    const getRes = await request(app).get('/cart').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(getRes.body.items[0].quantity).toBe(2);
  });

  it('never trusts a client-supplied customerId — always uses req.customer.id from the auth token', async () => {
    const { app, customerRepository } = buildApp();
    await request(app)
      .post('/cart/items')
      .set('Host', 'shop-a.platform.test')
      .set(authHeader())
      .send({ productId: 'p1', quantity: 1, customerId: 'attacker-supplied' });

    expect(customerRepository.findById).toHaveBeenCalledWith('t1', 'cust1'); // from the token, not the body
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- cartRoutes.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the routes**

`backend/src/modules/cart/presentation/cartRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { CartService } from '../domain/cartService';
import { OutOfStockError } from '../domain/cartService';
import { MissingTenantScopeError } from '../../../middleware/errors';

const addItemSchema = z.object({ productId: z.string(), quantity: z.number().int().positive() });
const updateQuantitySchema = z.object({ quantity: z.number().int().positive() });

export function cartRoutes(cartService: CartService): Router {
  const router = Router();

  function requireScope(req: Request): { tenantId: string; customerId: string } {
    if (!req.tenant) throw new MissingTenantScopeError('cartRoutes: req.tenant not set');
    if (!req.customer) throw new Error('cartRoutes: req.customer not set — is customerAuth mounted?');
    return { tenantId: req.tenant.id, customerId: req.customer.id };
  }

  router.get('/cart', async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const cart = await cartService.getCart(tenantId, customerId);
    res.status(200).json(cart);
  });

  router.post('/cart/items', async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }
    try {
      const cart = await cartService.addItem(tenantId, customerId, parsed.data.productId, parsed.data.quantity);
      res.status(200).json(cart);
    } catch (err) {
      if (err instanceof OutOfStockError) {
        res.status(409).json({ error: 'out_of_stock', message: err.message });
        return;
      }
      throw err;
    }
  });

  router.patch('/cart/items/:id', async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const parsed = updateQuantitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }
    const cart = await cartService.updateItemQuantity(tenantId, customerId, req.params.id, parsed.data.quantity);
    res.status(200).json(cart);
  });

  router.delete('/cart/items/:id', async (req: Request, res: Response) => {
    const { tenantId, customerId } = requireScope(req);
    const cart = await cartService.removeItem(tenantId, customerId, req.params.id);
    res.status(200).json(cart);
  });

  return router;
}
```

This route module needs `customerAuth` mounted **before** it in `server.ts` (like `GET /customers/me` already is), not inside the module itself — Step 4 below wires that at the app level so it applies to all 4 routes at once, since (unlike `customerRoutes.ts`, which mixes public `register`/`login` with the protected `me`) every route in `cartRoutes` requires login.

- [ ] **Step 4: Run test to verify it passes, then wire into `server.ts`**

Run: `npm test --workspace=backend -- cartRoutes.test`
Expected: PASS (3 tests)

Modify `backend/src/server.ts` — add imports:
```typescript
import { customerAuth } from './middleware/customerAuth';
import { PgCartRepository } from './modules/cart/infrastructure/pgCartRepository';
import { PgProductLookup } from './modules/cart/infrastructure/pgProductLookup';
import { CartService } from './modules/cart/domain/cartService';
import { cartRoutes } from './modules/cart/presentation/cartRoutes';
```

Add after the existing repository/service instantiations:
```typescript
const cartRepository = new PgCartRepository(pool);
const productLookup = new PgProductLookup(pool);
const cartService = new CartService(cartRepository, { get: (productId, tenantId) => productLookup.get(productId, tenantId) });
```

Add after the existing `app.use(layoutConfigRoutes(...))` line:
```typescript
app.use(customerAuth(customerRepository), cartRoutes(cartService));
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/cart/presentation backend/src/server.ts
git commit -m "feat: add cart routes (behind customerAuth), wire into server.ts"
git push origin develop
```

---

## Task 6: `orders` module — domain layer (`orderService`)

**Files:**
- Create: `backend/src/modules/orders/domain/order.ts`
- Create: `backend/src/modules/orders/domain/orderRepository.ts`
- Create: `backend/src/modules/orders/domain/orderService.ts`
- Test: `backend/src/modules/orders/domain/orderService.test.ts`

**Interfaces:**
- Produces:
  - `OrderRepository.create(tenantId, input): Promise<Order>` — input includes `customerId`, `phone`, `deliveryMethod`, `branchId`, and the cart's items (already priced) — creates the order + order_items + a `pending` `cash_on_delivery` payment row, and clears the cart, all as one repository-level operation (the plan's Task 7 makes this a real DB transaction)
  - `OrderRepository.findByTenantAndCustomer(tenantId, customerId): Promise<Order[]>`
  - `OrderRepository.findById(tenantId, id): Promise<Order | null>`
  - `OrderService.checkout(tenantId, customerId, customerPhoneOnFile, request: CheckoutRequest): Promise<Order>` — throws `PhoneRequiredError` if neither the customer's own record nor the checkout request supplies a phone; throws `EmptyCartError` if the cart has no items

- [ ] **Step 1: Write the failing test**

`backend/src/modules/orders/domain/orderService.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { OrderService, PhoneRequiredError, EmptyCartError } from './orderService';
import type { OrderRepository } from './orderRepository';
import type { Cart } from '@shop-platform/shared-types';

function fakeRepo(): OrderRepository {
  return {
    create: vi.fn(async (tenantId, input) => ({
      id: 'o1', tenantId, customerId: input.customerId, status: 'draft', phone: input.phone,
      deliveryMethod: input.deliveryMethod, branchId: input.branchId ?? null,
      items: input.items, totalCents: input.items.reduce((sum: number, i: any) => sum + i.priceCents * i.quantity, 0),
      createdAt: '2026-08-17T00:00:00.000Z',
    })),
    findByTenantAndCustomer: vi.fn(),
    findById: vi.fn(),
  };
}

const CART_WITH_ITEMS: Cart = {
  id: 'cart1', tenantId: 't1', customerId: 'cust1',
  items: [{ id: 'i1', productId: 'p1', productName: 'iPhone 15', priceCents: 250000, quantity: 1 }],
  totalCents: 250000,
};
const EMPTY_CART: Cart = { id: 'cart1', tenantId: 't1', customerId: 'cust1', items: [], totalCents: 0 };

describe('OrderService.checkout', () => {
  it('creates an order using the phone from the checkout request when the customer has none on file', async () => {
    const repo = fakeRepo();
    const service = new OrderService(repo);
    const order = await service.checkout('t1', 'cust1', null, CART_WITH_ITEMS, { deliveryMethod: 'courier', phone: '+994501234567' });
    expect(order.phone).toBe('+994501234567');
    expect(order.status).toBe('draft');
  });

  it('uses the customer\'s phone on file if the checkout request omits one — but the request always supplies one per its own schema, so this really just proves either source works', async () => {
    const repo = fakeRepo();
    const service = new OrderService(repo);
    const order = await service.checkout('t1', 'cust1', '+994559876543', CART_WITH_ITEMS, { deliveryMethod: 'courier', phone: '+994559876543' });
    expect(order.phone).toBe('+994559876543');
  });

  it('throws PhoneRequiredError if somehow neither is present (defensive — the schema normally prevents this)', async () => {
    const repo = fakeRepo();
    const service = new OrderService(repo);
    await expect(service.checkout('t1', 'cust1', null, CART_WITH_ITEMS, { deliveryMethod: 'courier', phone: '' })).rejects.toThrow(PhoneRequiredError);
  });

  it('throws EmptyCartError for an empty cart', async () => {
    const repo = fakeRepo();
    const service = new OrderService(repo);
    await expect(service.checkout('t1', 'cust1', '+994501234567', EMPTY_CART, { deliveryMethod: 'courier', phone: '+994501234567' })).rejects.toThrow(EmptyCartError);
  });

  it('passes self_pickup + branchId through to the repository', async () => {
    const repo = fakeRepo();
    const service = new OrderService(repo);
    await service.checkout('t1', 'cust1', null, CART_WITH_ITEMS, { deliveryMethod: 'self_pickup', branchId: 'b1', phone: '+994501234567' });
    expect(repo.create).toHaveBeenCalledWith('t1', expect.objectContaining({ deliveryMethod: 'self_pickup', branchId: 'b1' }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- orderService.test`
Expected: FAIL — modules don't exist yet

- [ ] **Step 3: Write the domain files**

`backend/src/modules/orders/domain/order.ts`:
```typescript
export type { Order, OrderItem, OrderStatus, DeliveryMethod, CheckoutRequest } from '@shop-platform/shared-types';
```

`backend/src/modules/orders/domain/orderRepository.ts`:
```typescript
import type { Order, OrderItem, DeliveryMethod } from './order';

export interface CreateOrderInput {
  customerId: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  branchId?: string;
  items: OrderItem[];
  cartId: string; // cleared as part of the same operation
}

export interface OrderRepository {
  create(tenantId: string, input: CreateOrderInput): Promise<Order>;
  findByTenantAndCustomer(tenantId: string, customerId: string): Promise<Order[]>;
  findById(tenantId: string, id: string): Promise<Order | null>;
}
```

`backend/src/modules/orders/domain/orderService.ts`:
```typescript
import type { Cart, CheckoutRequest } from '@shop-platform/shared-types';
import type { Order } from './order';
import type { OrderRepository } from './orderRepository';

export class PhoneRequiredError extends Error {
  constructor() {
    super('A phone number is required to place an order');
    this.name = 'PhoneRequiredError';
  }
}

export class EmptyCartError extends Error {
  constructor() {
    super('Cannot check out an empty cart');
    this.name = 'EmptyCartError';
  }
}

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  async checkout(
    tenantId: string,
    customerId: string,
    customerPhoneOnFile: string | null,
    cart: Cart,
    request: CheckoutRequest
  ): Promise<Order> {
    if (cart.items.length === 0) throw new EmptyCartError();

    const phone = request.phone || customerPhoneOnFile;
    if (!phone) throw new PhoneRequiredError();

    return this.repository.create(tenantId, {
      customerId,
      phone,
      deliveryMethod: request.deliveryMethod,
      branchId: request.branchId,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        priceCents: item.priceCents,
        quantity: item.quantity,
      })),
      cartId: cart.id,
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=backend -- orderService.test`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/orders/domain
git commit -m "feat: add orders module domain layer (OrderService checkout logic)"
git push origin develop
```

---

## Task 7: `orders` module — infrastructure layer (transactional checkout + stock decrement)

**Files:**
- Create: `backend/src/modules/orders/infrastructure/pgOrderRepository.ts`
- Create: `backend/src/modules/orders/infrastructure/pgOrderRepository.test.ts`

**Interfaces:**
- Consumes: `withTenant`, `orders.*`/`cart.*`/`catalog.product_stock` tables.
- Produces: `PgOrderRepository implements OrderRepository`. `create()` runs entirely inside `withTenant`'s single transaction: inserts the order, inserts each order_item, decrements `product_stock` per item (across whichever branch rows have stock, oldest/first found — simple Phase 1 allocation, no cross-branch optimization), inserts a `pending` payment row, and deletes the cart's items — all committed together or none of it is.

- [ ] **Step 1: Write the failing test**

`backend/src/modules/orders/infrastructure/pgOrderRepository.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from '../../../db/migrate';
import { withTenant } from '../../../db/withTenant';
import { PgTenantRepository } from '../../tenants/infrastructure/pgTenantRepository';
import { PgOrderRepository } from './pgOrderRepository';

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test' });
const tenantRepo = new PgTenantRepository(pool);
const orderRepo = new PgOrderRepository(pool);

let tenantId: string;
let branchId: string;
let productId: string;
let cartId: string;
let customerId: string;

beforeAll(async () => {
  await runMigrations(pool);
  const tenant = await tenantRepo.create({ subdomain: 'order-repo-test', name: 'Order Repo Test' });
  tenantId = tenant.id;
  await withTenant(pool, tenantId, async (client) => {
    const branch = await client.query(`INSERT INTO tenants.branches (tenant_id, name, address) VALUES ($1, 'Main', 'Bakı') RETURNING id`, [tenantId]);
    branchId = branch.rows[0].id;
    const cat = await client.query(`INSERT INTO catalog.categories (tenant_id, parent_id, name) VALUES ($1, NULL, 'Cat') RETURNING id`, [tenantId]);
    const product = await client.query(`INSERT INTO catalog.products (tenant_id, category_id, name, description, price_cents) VALUES ($1, $2, 'iPhone 15', NULL, 250000) RETURNING id`, [tenantId, cat.rows[0].id]);
    productId = product.rows[0].id;
    await client.query(`INSERT INTO catalog.product_stock (tenant_id, product_id, branch_id, quantity) VALUES ($1, $2, $3, 10)`, [tenantId, productId, branchId]);
    const customer = await client.query(
      `INSERT INTO customers.customers (tenant_id, name, surname, address, email, phone, password_hash) VALUES ($1,'A','B','Bakı','order-repo-test@example.com',NULL,'hash') RETURNING id`,
      [tenantId]
    );
    customerId = customer.rows[0].id;
    const cart = await client.query(`INSERT INTO cart.carts (tenant_id, customer_id) VALUES ($1, $2) RETURNING id`, [tenantId, customerId]);
    cartId = cart.rows[0].id;
    await client.query(`INSERT INTO cart.cart_items (tenant_id, cart_id, product_id, quantity) VALUES ($1, $2, $3, 3)`, [tenantId, cartId, productId]);
  });
});

afterAll(async () => {
  await pool.query('DELETE FROM tenants.tenants WHERE id = $1', [tenantId]);
  await pool.end();
});

describe('PgOrderRepository.create', () => {
  it('creates the order + items + a pending payment, decrements stock, and clears the cart — all transactionally', async () => {
    const order = await orderRepo.create(tenantId, {
      customerId, phone: '+994501234567', deliveryMethod: 'self_pickup', branchId,
      items: [{ productId, productName: 'iPhone 15', priceCents: 250000, quantity: 3 }],
      cartId,
    });

    expect(order.status).toBe('draft');
    expect(order.totalCents).toBe(750000);

    const stock = await withTenant(pool, tenantId, (client) => client.query('SELECT quantity FROM catalog.product_stock WHERE tenant_id = $1 AND product_id = $2', [tenantId, productId]));
    expect(stock.rows[0].quantity).toBe(7); // 10 - 3

    const remainingCartItems = await withTenant(pool, tenantId, (client) => client.query('SELECT * FROM cart.cart_items WHERE tenant_id = $1 AND cart_id = $2', [tenantId, cartId]));
    expect(remainingCartItems.rows).toEqual([]);

    const payment = await withTenant(pool, tenantId, (client) => client.query('SELECT method, status, amount_cents FROM orders.payments WHERE tenant_id = $1 AND order_id = $2', [tenantId, order.id]));
    expect(payment.rows[0]).toEqual({ method: 'cash_on_delivery', status: 'pending', amount_cents: 750000 });
  });

  it('findByTenantAndCustomer returns the customer\'s own orders only', async () => {
    const orders = await orderRepo.findByTenantAndCustomer(tenantId, customerId);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.customerId === customerId)).toBe(true);
  });

  it('findById returns null for an unknown order', async () => {
    expect(await orderRepo.findById(tenantId, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgOrderRepository.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the implementation**

`backend/src/modules/orders/infrastructure/pgOrderRepository.ts`:
```typescript
import type { Pool, PoolClient } from 'pg';
import type { Order, OrderItem } from '../domain/order';
import type { OrderRepository, CreateOrderInput } from '../domain/orderRepository';
import { withTenant } from '../../../db/withTenant';

async function decrementStock(client: PoolClient, tenantId: string, productId: string, quantity: number): Promise<void> {
  // Simple Phase 1 allocation: decrement from whichever branch rows have
  // stock, in id order, until `quantity` is covered. No cross-branch
  // optimization, no locking beyond the transaction itself — matches
  // spec's explicit "no reservation/locking in Phase 1" non-goal.
  let remaining = quantity;
  const stockRows = await client.query(
    'SELECT id, quantity FROM catalog.product_stock WHERE tenant_id = $1 AND product_id = $2 AND quantity > 0 ORDER BY id FOR UPDATE',
    [tenantId, productId]
  );
  for (const row of stockRows.rows) {
    if (remaining <= 0) break;
    const take = Math.min(row.quantity, remaining);
    await client.query('UPDATE catalog.product_stock SET quantity = quantity - $1 WHERE id = $2', [take, row.id]);
    remaining -= take;
  }
}

function toOrder(row: any, items: OrderItem[]): Order {
  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    status: row.status,
    phone: row.phone,
    deliveryMethod: row.delivery_method,
    branchId: row.branch_id,
    items,
    totalCents,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async create(tenantId: string, input: CreateOrderInput): Promise<Order> {
    if (!tenantId) throw new Error('OrderRepository.create requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const orderRes = await client.query(
        `INSERT INTO orders.orders (tenant_id, customer_id, phone, delivery_method, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, input.customerId, input.phone, input.deliveryMethod, input.branchId ?? null]
      );
      const orderRow = orderRes.rows[0];

      for (const item of input.items) {
        await client.query(
          `INSERT INTO orders.order_items (tenant_id, order_id, product_id, product_name, price_cents, quantity) VALUES ($1, $2, $3, $4, $5, $6)`,
          [tenantId, orderRow.id, item.productId, item.productName, item.priceCents, item.quantity]
        );
        await decrementStock(client, tenantId, item.productId, item.quantity);
      }

      const totalCents = input.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
      await client.query(
        `INSERT INTO orders.payments (tenant_id, order_id, method, amount_cents, status) VALUES ($1, $2, 'cash_on_delivery', $3, 'pending')`,
        [tenantId, orderRow.id, totalCents]
      );

      await client.query('DELETE FROM cart.cart_items WHERE tenant_id = $1 AND cart_id = $2', [tenantId, input.cartId]);

      return toOrder(orderRow, input.items);
    });
  }

  async findByTenantAndCustomer(tenantId: string, customerId: string): Promise<Order[]> {
    if (!tenantId) throw new Error('OrderRepository.findByTenantAndCustomer requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const orders = await client.query('SELECT * FROM orders.orders WHERE tenant_id = $1 AND customer_id = $2 ORDER BY created_at DESC', [tenantId, customerId]);
      return Promise.all(orders.rows.map(async (row: any) => {
        const items = await client.query('SELECT product_id, product_name, price_cents, quantity FROM orders.order_items WHERE tenant_id = $1 AND order_id = $2', [tenantId, row.id]);
        return toOrder(row, items.rows.map((r: any) => ({ productId: r.product_id, productName: r.product_name, priceCents: r.price_cents, quantity: r.quantity })));
      }));
    });
  }

  async findById(tenantId: string, id: string): Promise<Order | null> {
    if (!tenantId) throw new Error('OrderRepository.findById requires a tenantId');
    return withTenant(this.pool, tenantId, async (client) => {
      const orderRes = await client.query('SELECT * FROM orders.orders WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
      if (!orderRes.rows[0]) return null;
      const items = await client.query('SELECT product_id, product_name, price_cents, quantity FROM orders.order_items WHERE tenant_id = $1 AND order_id = $2', [tenantId, id]);
      return toOrder(orderRes.rows[0], items.rows.map((r: any) => ({ productId: r.product_id, productName: r.product_name, priceCents: r.price_cents, quantity: r.quantity })));
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend -- pgOrderRepository.test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/orders/infrastructure
git commit -m "feat: add PgOrderRepository (transactional checkout: order+items+payment+stock+cart-clear)"
git push origin develop
```

---

## Task 8: Order routes, wire into `server.ts`, verify live end-to-end

**Files:**
- Create: `backend/src/modules/orders/presentation/orderRoutes.ts`
- Create: `backend/src/modules/orders/presentation/orderRoutes.test.ts`
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: `OrderService` (Task 6), `CartService` (Task 3), `customerAuth`.
- Produces: `orderRoutes(orderService, cartService): Router` mounting `POST /orders` (checkout — reads the customer's own cart server-side, not a client-supplied item list), `GET /orders` (the logged-in customer's own order history), `GET /orders/:id` (a single one of their own orders, 404 if it belongs to someone else or doesn't exist).

- [ ] **Step 1: Write the failing test**

`backend/src/modules/orders/presentation/orderRoutes.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { tenantResolve } from '../../../middleware/tenantResolve';
import { customerAuth } from '../../../middleware/customerAuth';
import { errorHandler } from '../../../middleware/errorHandler';
import { orderRoutes } from './orderRoutes';
import { OrderService } from '../domain/orderService';
import { CartService } from '../../cart/domain/cartService';
import { signCustomerToken } from '../../../lib/jwt';
import type { TenantRepository } from '../../tenants/domain/tenantRepository';
import type { CustomerRepository } from '../../customers/domain/customerRepository';
import type { CartRepository } from '../../cart/domain/cartRepository';
import type { OrderRepository } from '../domain/orderRepository';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

const TENANT = { id: 't1', subdomain: 'shop-a', name: 'Shop A', createdAt: '2026-08-15T00:00:00.000Z' };
const CUSTOMER = { id: 'cust1', tenantId: 't1', name: 'A', surname: 'B', address: 'Bakı', email: 'a@example.com', phone: null, passwordHash: 'h', role: 'user' as const, type: 'physical' as const, createdAt: '2026-08-15T00:00:00.000Z' };

function authHeader() {
  return { Authorization: `Bearer ${signCustomerToken({ customerId: 'cust1', tenantId: 't1' })}` };
}

function buildApp(cartHasItems: boolean) {
  const tenantRepository: TenantRepository = { findBySubdomain: vi.fn(async () => TENANT), findById: vi.fn(), create: vi.fn() };
  const customerRepository: CustomerRepository = { findByTenantAndEmail: vi.fn(), findById: vi.fn(async () => CUSTOMER), create: vi.fn() };
  const cartRepository: CartRepository = {
    findOrCreateByCustomer: vi.fn(async (tenantId, customerId) => ({
      id: 'cart1', tenantId, customerId,
      items: cartHasItems ? [{ id: 'i1', productId: 'p1', quantity: 1 }] : [],
    })),
    addItem: vi.fn(), updateItemQuantity: vi.fn(), removeItem: vi.fn(),
  };
  const cartService = new CartService(cartRepository, { get: vi.fn(async () => ({ name: 'iPhone 15', priceCents: 250000, totalStock: 5 })) });

  const orders: any[] = [];
  const orderRepository: OrderRepository = {
    create: vi.fn(async (tenantId, input) => {
      const order = { id: `o${orders.length + 1}`, tenantId, customerId: input.customerId, status: 'draft', phone: input.phone, deliveryMethod: input.deliveryMethod, branchId: input.branchId ?? null, items: input.items, totalCents: input.items.reduce((s: number, i: any) => s + i.priceCents * i.quantity, 0), createdAt: '2026-08-17T00:00:00.000Z' };
      orders.push(order);
      return order;
    }),
    findByTenantAndCustomer: vi.fn(async (tenantId, customerId) => orders.filter((o) => o.tenantId === tenantId && o.customerId === customerId)),
    findById: vi.fn(async (tenantId, id) => orders.find((o) => o.tenantId === tenantId && o.id === id) ?? null),
  };
  const orderService = new OrderService(orderRepository);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantResolve(tenantRepository));
  app.use(customerAuth(customerRepository), orderRoutes(orderService, cartService));
  app.use(errorHandler);
  return app;
}

describe('POST /orders (checkout)', () => {
  it('creates an order from the logged-in customer\'s own cart, ignoring any client-supplied item list', async () => {
    const app = buildApp(true);
    const res = await request(app)
      .post('/orders')
      .set('Host', 'shop-a.platform.test')
      .set(authHeader())
      .send({ deliveryMethod: 'courier', phone: '+994501234567', items: [{ productId: 'attacker-supplied', quantity: 999 }] });

    expect(res.status).toBe(201);
    expect(res.body.items).toEqual([{ productId: 'p1', productName: 'iPhone 15', priceCents: 250000, quantity: 1 }]);
  });

  it('rejects checkout with an empty cart', async () => {
    const app = buildApp(false);
    const res = await request(app).post('/orders').set('Host', 'shop-a.platform.test').set(authHeader()).send({ deliveryMethod: 'courier', phone: '+994501234567' });
    expect(res.status).toBe(400);
  });

  it('requires login (401 with no token)', async () => {
    const app = buildApp(true);
    const res = await request(app).post('/orders').set('Host', 'shop-a.platform.test').send({ deliveryMethod: 'courier', phone: '+994501234567' });
    expect(res.status).toBe(401);
  });
});

describe('GET /orders and /orders/:id', () => {
  it('lists only the logged-in customer\'s own orders, and can fetch one by id', async () => {
    const app = buildApp(true);
    const checkoutRes = await request(app).post('/orders').set('Host', 'shop-a.platform.test').set(authHeader()).send({ deliveryMethod: 'courier', phone: '+994501234567' });

    const listRes = await request(app).get('/orders').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(listRes.body.orders).toHaveLength(1);

    const detailRes = await request(app).get(`/orders/${checkoutRes.body.id}`).set('Host', 'shop-a.platform.test').set(authHeader());
    expect(detailRes.status).toBe(200);
  });

  it('returns 404 for an unknown order id', async () => {
    const app = buildApp(true);
    const res = await request(app).get('/orders/does-not-exist').set('Host', 'shop-a.platform.test').set(authHeader());
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=backend -- orderRoutes.test`
Expected: FAIL — module doesn't exist yet

- [ ] **Step 3: Write the routes**

`backend/src/modules/orders/presentation/orderRoutes.ts`:
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { checkoutRequestSchema } from '@shop-platform/shared-types';
import type { OrderService } from '../domain/orderService';
import { PhoneRequiredError, EmptyCartError } from '../domain/orderService';
import type { CartService } from '../../cart/domain/cartService';
import { MissingTenantScopeError } from '../../../middleware/errors';

export function orderRoutes(orderService: OrderService, cartService: CartService): Router {
  const router = Router();

  router.post('/orders', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('orderRoutes: req.tenant not set');
    if (!req.customer) throw new Error('orderRoutes: req.customer not set — is customerAuth mounted?');

    const parsed = checkoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
      return;
    }

    // Cart is read server-side from the logged-in customer's own cart —
    // the request body's own item list (if any were sent) is never used.
    const cart = await cartService.getCart(req.tenant.id, req.customer.id);

    try {
      const order = await orderService.checkout(req.tenant.id, req.customer.id, req.customer.phone, cart, parsed.data);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof EmptyCartError || err instanceof PhoneRequiredError) {
        res.status(400).json({ error: 'checkout_failed', message: err.message });
        return;
      }
      throw err;
    }
  });

  router.get('/orders', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('orderRoutes: req.tenant not set');
    if (!req.customer) throw new Error('orderRoutes: req.customer not set');
    // orderService has no direct "list" method (that's a plain read, not a
    // business rule) — the repository is reached via a small accessor the
    // service doesn't need; simplest is exposing it through orderService
    // itself. See Step 3b below for the one-line addition this implies.
    const orders = await orderService.listForCustomer(req.tenant.id, req.customer.id);
    res.status(200).json({ orders });
  });

  router.get('/orders/:id', async (req: Request, res: Response) => {
    if (!req.tenant) throw new MissingTenantScopeError('orderRoutes: req.tenant not set');
    if (!req.customer) throw new Error('orderRoutes: req.customer not set');
    const order = await orderService.getOwnOrder(req.tenant.id, req.customer.id, req.params.id);
    if (!order) {
      res.status(404).json({ error: 'order_not_found' });
      return;
    }
    res.status(200).json(order);
  });

  return router;
}
```

- [ ] **Step 3b: Add the two small read methods `orderRoutes.ts` needs to `OrderService` (Task 6's file — a small, backward-compatible addition, not a redesign)**

Modify `backend/src/modules/orders/domain/orderService.ts` — add inside the `OrderService` class, after `checkout`:
```typescript
  async listForCustomer(tenantId: string, customerId: string): Promise<Order[]> {
    return this.repository.findByTenantAndCustomer(tenantId, customerId);
  }

  async getOwnOrder(tenantId: string, customerId: string, orderId: string): Promise<Order | null> {
    const order = await this.repository.findById(tenantId, orderId);
    // Belongs-to-someone-else looks identical to not-found from the
    // outside — never leak "it exists but isn't yours" to the caller.
    if (!order || order.customerId !== customerId) return null;
    return order;
  }
```

Add two corresponding tests to `backend/src/modules/orders/domain/orderService.test.ts`:
```typescript
describe('OrderService.getOwnOrder', () => {
  it('returns null (not the order) when the order belongs to a different customer', async () => {
    const repo = fakeRepo();
    repo.findById = vi.fn(async () => ({ id: 'o1', tenantId: 't1', customerId: 'someone-else', status: 'draft', phone: 'x', deliveryMethod: 'courier', branchId: null, items: [], totalCents: 0, createdAt: '2026-08-17T00:00:00.000Z' }));
    const service = new OrderService(repo);
    expect(await service.getOwnOrder('t1', 'cust1', 'o1')).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests to verify they pass, then wire into `server.ts`**

Run: `npm test --workspace=backend -- orderRoutes.test orderService.test`
Expected: PASS (orderRoutes: 5 tests; orderService: 6 tests, the 5 from Task 6 plus this task's addition)

Modify `backend/src/server.ts` — add imports:
```typescript
import { PgOrderRepository } from './modules/orders/infrastructure/pgOrderRepository';
import { OrderService } from './modules/orders/domain/orderService';
import { orderRoutes } from './modules/orders/presentation/orderRoutes';
```

Add after the existing repository/service instantiations:
```typescript
const orderRepository = new PgOrderRepository(pool);
const orderService = new OrderService(orderRepository);
```

Add after the existing `app.use(customerAuth(customerRepository), cartRoutes(cartService));` line:
```typescript
app.use(customerAuth(customerRepository), orderRoutes(orderService, cartService));
```

- [ ] **Step 5: Run the full test suite, then manually verify live**

```bash
TEST_DATABASE_URL=postgres://shop_platform_app:shop_platform_app@localhost:5432/shop_platform_test npm test --workspace=backend
```
Expected: all green, no regressions across all eight epics so far.

```bash
cd /Users/frontend/workspace/me-github/multinant-teslahubs
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill 2>/dev/null
npm run dev --workspace=backend &> /tmp/api.log &
for i in $(seq 1 30); do curl -sf http://localhost:8080/health > /dev/null && break; sleep 1; done

# log in as the existing demo customer (seeded during Customer Auth's live check)
curl -s -c /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"correct horse battery"}' \
  http://localhost:8080/customers/login > /dev/null

# find a real product id
PRODUCT_ID=$(curl -s -H "Host: texnogallery.localhost" http://localhost:8080/products | python3 -c 'import sys,json; print(json.load(sys.stdin)["products"][0]["id"])')

echo "--- add to cart ---"
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}" \
  http://localhost:8080/cart/items
echo

echo "--- checkout (self-pickup, needs a real branch id) ---"
BRANCH_ID=$(curl -s -H "Host: texnogallery.localhost" http://localhost:8080/branches | python3 -c 'import sys,json; print(json.load(sys.stdin)["branches"][0]["id"])')
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" -H "Content-Type: application/json" \
  -d "{\"deliveryMethod\":\"self_pickup\",\"branchId\":\"$BRANCH_ID\",\"phone\":\"+994501234567\"}" \
  http://localhost:8080/orders
echo

echo "--- cart is now empty ---"
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" http://localhost:8080/cart
echo

echo "--- my orders shows it ---"
curl -s -b /tmp/cookies.txt -H "Host: texnogallery.localhost" http://localhost:8080/orders

lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```
Expected: cart shows the item added; checkout returns 201 with a real order (`status: "draft"`); cart is empty afterward; `/orders` lists the new order.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/orders/presentation backend/src/modules/orders/domain/orderService.ts backend/src/modules/orders/domain/orderService.test.ts backend/src/server.ts
git commit -m "feat: add order routes (checkout/list/detail), wire into server.ts, verified live end-to-end"
git push origin develop
```

---

## Self-Review Notes

**Spec coverage check** (against spec §2/§3a/§5):
- Cart, add/remove/update items: Tasks 3-5 ✅
- Checkout requires login: every route in Tasks 5+8 mounted behind `customerAuth` ✅
- Order placement requires a phone even though optional on the customer record: Task 6's `PhoneRequiredError` (checkout request's own schema already requires `phone`, so this is defense-in-depth, not the only guard) ✅
- Delivery method: self_pickup (+ branchId) or courier: Task 2's schema CHECK + Task 1's `checkoutRequestSchema` refinement ✅
- Order status full 7-value lifecycle, Phase 1 only ever produces `draft`: Task 1/2 ✅ (advancing status is explicitly Phase 3, not attempted here)
- Payment: cash-on-delivery/manual only, `payments`/`payment_transactions` tables shaped for a future real gateway: Task 2 (though `payment_transactions` itself isn't written to by any task here — no event has happened yet to log in Phase 1's cash-only flow; the table exists per spec's shape requirement, first real write happens with Phase 2's gateway)
- "Never trust a client-supplied tenantId/customerId": every route uses `req.tenant.id`/`req.customer.id` only — the checkout route explicitly tested to prove a client-supplied item list is ignored in favor of the server-side cart.
- "No reservation/locking in Phase 1" (spec's own explicit non-goal): Task 7's stock decrement uses `FOR UPDATE` only to make the decrement itself atomic within one checkout's transaction (prevents two order_items in the SAME order double-spending the same stock row) — this is not cross-checkout reservation/holding, which the spec explicitly doesn't ask for.

**Placeholder scan:** no TBD/TODO; every step has runnable code and exact commands. Two small mid-plan corrections (Task 4's `ProductLookup` signature fix, Task 8's `OrderService` read-method addition) are both fully specified with real code, not deferred.

**Type consistency:** `Cart`/`CartItem`/`Order`/`OrderItem`/`OrderStatus`/`DeliveryMethod`/`CheckoutRequest` defined once in `packages/shared-types` (Task 1), used unchanged through domain (Tasks 3, 6) → infrastructure (Tasks 4, 7) → presentation (Tasks 5, 8). `ProductLookup`'s signature correction in Task 4 is applied consistently to both its Task 3 definition and Task 3's own tests, not left mismatched.
