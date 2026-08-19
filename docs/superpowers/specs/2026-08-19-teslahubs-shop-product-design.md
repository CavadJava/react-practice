# Teslahubs — Shop + Product Identity Redesign

**Date:** 2026-08-19
**Repo:** go-project-practices (platform-identity-service + platform-identity-admin)
**Status:** Approved for planning

## Purpose

A ground-up redesign of `platform-identity-service`'s data model, replacing
the single-project-per-user model with Teslahubs' real structure: a system
of independently-owned **Shops** a user can join zero-or-more of (each with
its own shop-level role), plus **Products** Teslahubs itself sells, which a
user subscribes to (paid = full access, unpaid = demo access) independent
of any shop membership.

This branch has not been merged to `master` yet, so there is no production
data to migrate — the schema is rebuilt cleanly rather than layered on top
of the old one.

## Scope decisions (from brainstorming)

- **Shop replaces the old "Project" concept 1:1** — the existing `projects`
  table becomes `shops` (renamed at the DB, model, repository, service,
  and handler level — no `Project` naming survives). A Shop is what used
  to be a Project: an independently registered tenant (e.g.
  `teslabaku-home`, `teslaland-home`).
- **A user can belong to multiple Shops simultaneously**, each with its own
  shop-level role — this is the core behavioral change from the old
  one-project-per-user model. Modeled as a many-to-many join table,
  `user_shop_memberships`, replacing the old `users.project_id`/`role_id`
  columns entirely (both are dropped).
- **System role and Shop role are two separate, independently-seeded role
  tables** — `system_roles` (superadmin/admin/user) and `shop_roles`
  (shop-admin/shop-user). A user's system role lives directly on `users`
  (one system role per user, unlike shop roles which are per-membership).
  Kept as separate tables rather than one table with a `kind` column,
  since every query already knows which kind it wants and a shared table
  would need that filter everywhere for no real benefit.
- **Product is an entirely new concept**, unrelated to Shop. Teslahubs
  sells access to its own Products; a user's relationship to a Product is
  subscription-based (`user_product_subscriptions`: `subscripted`,
  `renewed` booleans), not membership-based. No shop involvement.
- **Subscriptions are set manually by admin/superadmin for now** — no
  payment gateway integration. `subscripted=true` is toggled via an
  endpoint an admin calls; this is an explicit, scoped MVP decision, not
  an oversight (a future payment integration is a separate, unscoped
  project).
- **Shop membership is admin-granted, not self-service.** There is no
  "join this shop" flow for a plain user — a shop's own shop-admin, or a
  system superadmin, adds a user to a shop with a given shop role via
  `POST /shops/{id}/members`. General registration
  (`POST /auth/register`) only creates a Teslahubs-wide account with
  system role `user` and no shop membership at all — a user can be a
  Teslahubs member with zero shops.
- **Superadmin's shop authority**: a superadmin can add a member to *any*
  shop (bypassing the "must be that shop's own shop-admin" check) — this
  reuses the same Strategy-pattern shape the old `SuperadminOrSameProjectAdmin`
  used, renamed to fit the new domain (`ShopAdmin`/`SuperadminOrShopAdmin`
  in a new `shopassign` package, replacing `roleassign`).
- **System role `admin` has no defined permissions yet** — it exists as a
  seeded value (distinct from `user` and `superadmin`) because the user
  explicitly listed it as a real value, but no endpoint currently branches
  on it. This is deliberate: define the role now, wire specific
  authority to it later when a real need appears (YAGNI — inventing
  permissions for it now would be speculative).
- **User status** (`ACTIVE`/`IN_ACTIVE`) is a new column on `users`.
  `IN_ACTIVE` users are rejected at the `RequireAuth` middleware layer —
  they cannot authenticate at all, not merely restricted in scope. There
  is no endpoint to *set* status in this scope beyond a superadmin/admin
  toggle (mirrors the "manual, no self-service" pattern used for
  subscriptions).

## Data model

```sql
CREATE TABLE system_roles (
	id SMALLSERIAL PRIMARY KEY,
	name TEXT UNIQUE NOT NULL
);
-- seed: (1, 'superadmin'), (2, 'admin'), (3, 'user')

CREATE TABLE shop_roles (
	id SMALLSERIAL PRIMARY KEY,
	name TEXT UNIQUE NOT NULL
);
-- seed: (1, 'shop-admin'), (2, 'shop-user')

CREATE TABLE shops (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	username TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	system_role_id SMALLINT NOT NULL REFERENCES system_roles(id) DEFAULT 3,
	status TEXT NOT NULL DEFAULT 'ACTIVE',
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_shop_memberships (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id),
	shop_id UUID NOT NULL REFERENCES shops(id),
	shop_role_id SMALLINT NOT NULL REFERENCES shop_roles(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (user_id, shop_id)
);

CREATE TABLE products (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_product_subscriptions (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id),
	product_id UUID NOT NULL REFERENCES products(id),
	subscripted BOOLEAN NOT NULL DEFAULT false,
	renewed BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (user_id, product_id)
);
```

`status` uses a plain `TEXT` column with two valid values (`ACTIVE`,
`IN_ACTIVE`) validated in Go, not a DB enum/check constraint — matches
this codebase's existing convention of validating role-name-shaped
strings in the service layer rather than at the DB level.

## API

### Auth (rewritten)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | none | Create a Teslahubs account: system role `user`, `status=ACTIVE`, no shop membership |
| POST | `/auth/login` | none | JWT claims: `{user_id, system_role}` — no `shop_id`/`project_id`, since a user may belong to 0-N shops |

### Shops (renamed from Projects)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/shops` | none (unchanged from old `POST /projects`) | Register a new shop |
| GET | `/shops` | none | List all shops |
| GET | `/shops/{id}` | none | Get one shop |
| POST | `/shops/{id}/members` | Bearer JWT, caller must be superadmin or that shop's shop-admin | Add an existing user to the shop with a shop role |
| GET | `/shops/{id}/members` | Bearer JWT, caller must be superadmin or that shop's shop-admin | List the shop's members |
| POST | `/shops/{id}/members/{userId}/role` | Bearer JWT, same authority as above | Change a member's shop role |

### Users

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/users/{id}` | Bearer JWT, self or superadmin | Get a user (system role, status, no shop info inline — see `/users/{id}/shops`) |
| GET | `/users/{id}/shops` | Bearer JWT, self or superadmin | List the shops a user belongs to, with their role in each |
| GET | `/users` | Bearer JWT, superadmin only | List every Teslahubs user |
| POST | `/users/{id}/system-role` | Bearer JWT, superadmin only | Change a user's system role |
| POST | `/users/{id}/status` | Bearer JWT, superadmin only | Set `ACTIVE`/`IN_ACTIVE` |

### Products

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/products` | none | List all products |
| POST | `/products` | Bearer JWT, superadmin only | Create a product |
| GET | `/products/{id}/access` | Bearer JWT | `{"access":"full"}` if the caller's subscription is `subscripted=true`, else `{"access":"demo"}` |
| POST | `/users/{id}/products/{productId}/subscribe` | Bearer JWT, superadmin or admin | Set `subscripted=true` (and optionally `renewed`) for a user's product row, creating it if absent |

## Authorization

New `shopassign` package (replaces `roleassign`):

```go
type Caller struct {
	UserID     string
	SystemRole string
}

type ShopTarget struct {
	ShopID string
}

type ShopMembershipChecker interface {
	// CanManage reports whether caller may add/modify members of shopID.
	CanManage(caller Caller, callerShopMemberships []ShopMembership, target ShopTarget) bool
}
```

`SuperadminOrShopAdmin` is the concrete implementation: true if
`caller.SystemRole == "superadmin"`, or if the caller has a
`user_shop_memberships` row for `target.ShopID` with `shop_role ==
"shop-admin"`. Since shop-admin-ness is now a per-row fact (not a JWT
claim, because a user can be shop-admin of one shop and shop-user of
another simultaneously), this check requires a repository lookup inside
the service layer — it cannot be a pure function over `Caller`/`Target`
structs the way the old `roleassign.SameProjectAdmin` was. The service
method fetches the caller's membership row for the target shop first,
then evaluates the strategy.

## Frontend (`platform-identity-admin`)

- `AuthContext`/`RequireAuth`: JWT claims lose `project_id`, gain
  `system_role`. `RequireAuth` accepts `system_role in {admin, superadmin}`
  (a plain `user` cannot reach the admin panel at all, same gate as before,
  just renamed).
- Sider: **Shop-lar** (renamed from Layihələr), **Product-lar** (new),
  **İstifadəçilər** (system-wide user list, superadmin-only, replaces the
  old dual-mode UsersPage entirely since shop membership is no longer a
  single-value-per-user concept the old dropdown/branch logic depended on).
- New **ShopMembersPage**, reached from the Shop-lar list (click a shop →
  see its members, add a member, change a member's shop role) — this
  replaces the old single flat "Users" list's shop-scoping logic, since
  membership is now inherently shop-scoped data, not a property of the
  user record itself.
- **ProductsPage**: list + create (superadmin), each row links to a
  subscription-management view (list users subscribed to that product,
  toggle `subscripted`/`renewed`).

## Out of scope (explicitly deferred, not silently dropped)

- Payment gateway integration for subscriptions — manual toggle only.
- Self-service shop join requests (the old two-phase application flow
  mentioned in this monorepo's *other* service, `shop-role-service`, is a
  different system entirely and not reused here).
- Specific permissions for system role `admin` — seeded but inert.
- Any UI/endpoint to change a user's own password.
- Rate limiting or abuse protection on `POST /auth/register`.
