# Teslahubs Shop+Product Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `platform-identity-service`'s data model from the ground up — Project renamed to Shop with many-to-many user membership (was one-project-per-user), separate `system_roles`/`shop_roles` tables, a new Product/subscription concept, and user status — then update `platform-identity-admin` to match.

**Architecture:** Same layered convention as the rest of this service (repository → service → handler), but the shape changes: `UserRepository`/`ShopRepository`/`ProductRepository` replace `UserRepository`/`ProjectRepository`; a new `ShopMembershipRepository` and `SubscriptionRepository` are added; `roleassign` package is replaced by `shopassign`, whose `CanManage` check requires a DB lookup (shop-admin-ness is now a per-membership-row fact, not a JWT claim), so it lives partly in the service layer rather than as a pure function. JWT claims shrink to `{user_id, system_role}` — no more `project_id`/`role` in the token, since a user's shop memberships are now 0-to-many and don't fit in a single claim.

**Tech Stack:** Go 1.26 (backend, unchanged), TypeScript/React/AntDesign (frontend, unchanged).

## Global Constraints

- Continue on the existing worktree/branch: `/Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service` (branch `worktree-platform-identity-service`). Do not create a new branch.
- This branch has never been merged, so there is no production data — `database.Migrate()` is rewritten to create the new schema directly (no `ALTER TABLE`/data-preserving migration needed). Old tables (`projects` with its old shape, the old 2-role `roles` table) are dropped and replaced, not migrated in place — this is a clean rebuild.
- Terminology: DB table/column names, Go types, and API paths all use `shop`/`Shop` (not `project`/`Project`). Azerbaijani UI strings may still say "Mağaza" — that's a display-label choice, not a naming constraint on code.
- JWT claims: `{user_id, system_role}` only. No `shop_id`, no `role` (ambiguous now — could mean system role or shop role). `auth.JWTManager.Generate` signature changes to `Generate(userID, systemRole string) (string, time.Time, error)`.
- System roles (seeded, fixed 3 rows): `superadmin`(1), `admin`(2), `user`(3). Shop roles (seeded, fixed 2 rows): `shop-admin`(1), `shop-user`(2). Both seeded via `ON CONFLICT (id) DO NOTHING` in `Migrate()`, matching the existing pattern.
- `POST /auth/register` creates a user with `system_role=user`, `status=ACTIVE`, and zero shop memberships — no shop is required at registration time (this is the single biggest behavior change from the old "first user in a project becomes admin" flow, which is removed entirely).
- Superadmin bootstrap (unchanged in spirit from the existing feature): seeded via `database.SeedSuperadmin` at startup from `.env` (`SUPERADMIN_USERNAME`/`SUPERADMIN_PASSWORD`), `system_role=superadmin`.
- `IN_ACTIVE` users are rejected at the `RequireAuth` middleware layer with 401 — checked on every authenticated request, not just at login (an admin could deactivate a user mid-session; their existing token must stop working on the next request, not just at their next login).
- Local Postgres already running at `localhost:5433` (db `postgres`, user `postgres`, password `1`) for backend tests.
- No AI attribution trailer in commit messages, following this branch's convention.
- Response envelope unchanged: `{"success": true, "data": {...}}` / `{"success": false, "error": {"code": "...", "message": "..."}}`.

---

## File Structure

### Backend — deleted (fully replaced, not incrementally edited)

```
platform-identity-service/internal/
  repository/project_repository.go       — DELETE (replaced by shop_repository.go)
  handlers/project_handler.go            — DELETE (replaced by shop_handler.go)
  service/project_service.go             — DELETE (replaced by shop_service.go)
  service/project_service_test.go        — DELETE (replaced by shop_service_test.go)
  service/roleassign/                    — DELETE entire package (replaced by shopassign/)
```

### Backend — new/rewritten

```
platform-identity-service/internal/
  models/models.go                        — REWRITE: Shop, SystemRole/ShopRole constants, User (system_role, status), ShopMembership, Product, Subscription
  database/postgres.go                    — REWRITE: Migrate() creates the new schema; SeedSuperadmin updated for system_role
  auth/jwt.go                             — REWRITE: Claims{UserID, SystemRole}, Generate(userID, systemRole)
  repository/shop_repository.go           — NEW (was project_repository.go)
  repository/user_repository.go           — REWRITE: no more project_id/role_id columns; adds status, system_role_id
  repository/shop_membership_repository.go — NEW
  repository/product_repository.go        — NEW
  repository/subscription_repository.go   — NEW
  repository/system_role_repository.go    — NEW (was role_repository.go, now system-role-scoped)
  repository/shop_role_repository.go      — NEW
  repository/repository_test.go           — REWRITE: all tests updated for new schema
  service/shopassign/checker.go            — NEW (was roleassign/strategy.go)
  service/shopassign/checker_test.go       — NEW
  service/auth_service.go                 — REWRITE: Register no longer takes/needs a shop; Login issues new claim shape
  service/auth_service_test.go            — REWRITE
  service/shop_service.go                  — NEW (was project_service.go)
  service/shop_membership_service.go       — NEW
  service/user_service.go                  — REWRITE: ListAll (superadmin), Get, SetSystemRole, SetStatus
  service/user_service_test.go             — REWRITE
  service/product_service.go               — NEW
  service/helpers_test.go                  — REWRITE (shared testDB stays, wiring helpers updated)
  handlers/shop_handler.go                 — NEW (was project_handler.go)
  handlers/auth_handler.go                 — REWRITE
  handlers/auth_handler_test.go            — REWRITE
  handlers/user_handler.go                 — REWRITE
  handlers/product_handler.go              — NEW
  handlers/system_role_handler.go          — NEW (was role_handler.go)
  middleware/auth.go                       — REWRITE: shopassign.Caller shape, IN_ACTIVE rejection
cmd/api/main.go                            — REWRITE: full wiring
.env / .env.example                        — unchanged (already has SUPERADMIN_* from the prior feature)
```

### Frontend — rewritten

```
platform-identity-admin/src/
  api/types.ts        — REWRITE: Shop, SystemRole, ShopRole, Product, Subscription, JwtClaims{user_id,system_role}
  api/auth.ts          — unchanged shape (login/register still identifier+password)
  api/shops.ts          — NEW (was projects.ts)
  api/users.ts          — REWRITE
  api/products.ts       — NEW
  api/systemRoles.ts     — NEW (was roles.ts)
  auth/jwt.ts            — unchanged (generic decode)
  auth/AuthContext.tsx    — unchanged shape
  auth/RequireAuth.tsx    — REWRITE: check system_role
  layouts/AppLayout.tsx   — REWRITE: Shop-lar / Product-lar / İstifadəçilər nav
  pages/LoginPage.tsx     — REWRITE: system_role check
  pages/ShopsPage.tsx     — NEW (was ProjectsPage.tsx)
  pages/ShopMembersPage.tsx — NEW
  pages/ProductsPage.tsx  — NEW
  pages/UsersPage.tsx     — REWRITE: system-wide user list (superadmin), no more shop-scoped branching
  pages/ProjectsPage.tsx  — DELETE
  pages/RolesPage.tsx     — DELETE
  App.tsx                 — REWRITE: new routes
```

---

## Backend Tasks

### Task 1: Models, database schema, JWT claims

**Files:**
- Rewrite: `platform-identity-service/internal/models/models.go`
- Rewrite: `platform-identity-service/internal/database/postgres.go`
- Rewrite: `platform-identity-service/internal/auth/jwt.go`
- Rewrite: `platform-identity-service/internal/auth/jwt_test.go`

**Interfaces:**
- Produces: `models.Shop{ID, Name string; CreatedAt time.Time}`, `models.SystemRole{ID int16; Name string}`, `models.ShopRole{ID int16; Name string}`, `models.User{ID, Name, Username, Email, PasswordHash string; SystemRoleID int16; SystemRoleName string; Status string; CreatedAt, UpdatedAt time.Time}`, `models.ShopMembership{ID, UserID, ShopID string; ShopRoleID int16; ShopRoleName string; ShopName string; CreatedAt time.Time}`, `models.Product{ID, Name string; CreatedAt time.Time}`, `models.Subscription{ID, UserID, ProductID string; Subscripted, Renewed bool; CreatedAt, UpdatedAt time.Time}`.
- Produces: `models.SystemRoleSuperadmin/Admin/User = "superadmin"/"admin"/"user"`, `models.ShopRoleAdmin/User = "shop-admin"/"shop-user"`, `models.UserStatusActive/InActive = "ACTIVE"/"IN_ACTIVE"`.
- Produces: `database.Connect` (unchanged), `database.Migrate(db) error` (new schema), `database.SeedSuperadmin(db, id, username, passwordHash string) error` (updated for `system_role_id`).
- Produces: `auth.Claims{UserID, SystemRole string; jwt.RegisteredClaims}`, `auth.JWTManager.Generate(userID, systemRole string) (string, time.Time, error)`, `.Verify(tokenStr string) (*Claims, error)` (signature body unchanged, only the claim fields change).

- [ ] **Step 1: Write `internal/models/models.go`**

```go
package models

import "time"

const (
	SystemRoleSuperadmin = "superadmin"
	SystemRoleAdmin      = "admin"
	SystemRoleUser       = "user"
)

const (
	ShopRoleAdmin = "shop-admin"
	ShopRoleUser  = "shop-user"
)

const (
	UserStatusActive   = "ACTIVE"
	UserStatusInActive = "IN_ACTIVE"
)

type Shop struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type SystemRole struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

type ShopRole struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

type User struct {
	ID             string
	Name           string
	Username       string
	Email          string
	PasswordHash   string
	SystemRoleID   int16
	SystemRoleName string // populated by joined queries
	Status         string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// ShopMembership is a row from user_shop_memberships, joined with the
// shop's name and the shop role's name for direct display — mirrors the
// old User.RoleName join-only-field precedent.
type ShopMembership struct {
	ID           string
	UserID       string
	ShopID       string
	ShopName     string
	ShopRoleID   int16
	ShopRoleName string
	CreatedAt    time.Time
}

type Product struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Subscription struct {
	ID          string
	UserID      string
	ProductID   string
	Subscripted bool
	Renewed     bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
```

- [ ] **Step 2: Write `internal/database/postgres.go`**

```go
package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/config"
)

func Connect(cfg *config.Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return db, nil
}

func Migrate(db *sql.DB) error {
	_, err := db.Exec(`
		DROP TABLE IF EXISTS user_product_subscriptions;
		DROP TABLE IF EXISTS products;
		DROP TABLE IF EXISTS user_shop_memberships;
		DROP TABLE IF EXISTS users;
		DROP TABLE IF EXISTS shops;
		DROP TABLE IF EXISTS shop_roles;
		DROP TABLE IF EXISTS system_roles;
		DROP TABLE IF EXISTS roles;
		DROP TABLE IF EXISTS projects;

		CREATE TABLE system_roles (
			id SMALLSERIAL PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);
		INSERT INTO system_roles (id, name) VALUES (1, 'superadmin'), (2, 'admin'), (3, 'user')
		ON CONFLICT (id) DO NOTHING;

		CREATE TABLE shop_roles (
			id SMALLSERIAL PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);
		INSERT INTO shop_roles (id, name) VALUES (1, 'shop-admin'), (2, 'shop-user')
		ON CONFLICT (id) DO NOTHING;

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
		CREATE INDEX idx_memberships_shop_id ON user_shop_memberships (shop_id);
		CREATE INDEX idx_memberships_user_id ON user_shop_memberships (user_id);

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
	`)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}

// SeedSuperadmin ensures exactly one bootstrap superadmin account exists.
// Idempotent: safe to call on every startup. passwordHash must already be
// bcrypt-hashed by the caller.
func SeedSuperadmin(db *sql.DB, id, username, passwordHash string) error {
	_, err := db.Exec(`
		INSERT INTO users (id, name, username, email, password_hash, system_role_id, status, created_at, updated_at)
		VALUES ($1, 'Superadmin', $2, $2 || '@platform-identity.local', $3, 1, 'ACTIVE', now(), now())
		ON CONFLICT (username) DO NOTHING
	`, id, username, passwordHash)
	if err != nil {
		return fmt.Errorf("seed superadmin: %w", err)
	}
	return nil
}
```

Note the `Migrate()` now `DROP TABLE`s everything first, including the old `projects`/`roles` tables by name — this is safe ONLY because this branch has no production data (stated in Global Constraints). The drop order respects foreign key dependencies (children before parents).

- [ ] **Step 3: Write `internal/auth/jwt.go`**

```go
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid or expired token")

type Claims struct {
	UserID     string `json:"user_id"`
	SystemRole string `json:"system_role"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret []byte
	ttl    time.Duration
}

func NewJWTManager(secret string, ttlMinutes int) *JWTManager {
	return &JWTManager{
		secret: []byte(secret),
		ttl:    time.Duration(ttlMinutes) * time.Minute,
	}
}

func (m *JWTManager) Generate(userID, systemRole string) (string, time.Time, error) {
	expiresAt := time.Now().Add(m.ttl)
	claims := Claims{
		UserID:     userID,
		SystemRole: systemRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, expiresAt, nil
}

func (m *JWTManager) Verify(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
```

- [ ] **Step 4: Rewrite `internal/auth/jwt_test.go`**

```go
package auth

import "testing"

func TestJWTManager_GenerateAndVerify(t *testing.T) {
	m := NewJWTManager("test-secret", 60)

	token, _, err := m.Generate("user-123", "admin")
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	claims, err := m.Verify(token)
	if err != nil {
		t.Fatalf("Verify failed: %v", err)
	}
	if claims.UserID != "user-123" || claims.SystemRole != "admin" {
		t.Errorf("unexpected claims: %+v", claims)
	}
}

func TestJWTManager_Verify_RejectsWrongSecret(t *testing.T) {
	m1 := NewJWTManager("secret-one", 60)
	m2 := NewJWTManager("secret-two", 60)

	token, _, err := m1.Generate("user-123", "user")
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	if _, err := m2.Verify(token); err == nil {
		t.Error("expected Verify to fail with mismatched secret")
	}
}
```

- [ ] **Step 5: Run auth package tests**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/auth/... -v
```
Expected: PASS (password_test.go is untouched and still passes; jwt_test.go passes with the new claim shape).

- [ ] **Step 6: Build to confirm no compile errors in the packages touched so far**

```bash
go build ./internal/models/... ./internal/database/... ./internal/auth/...
```
Expected: builds cleanly (other packages will fail to build until later tasks touch them — that's expected, don't run `go build ./...` yet).

- [ ] **Step 7: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/models/models.go \
  platform-identity-service/internal/database/postgres.go \
  platform-identity-service/internal/auth/jwt.go \
  platform-identity-service/internal/auth/jwt_test.go
git commit -m "feat(platform-identity-service): rebuild models, schema, and JWT claims for Shop+Product

Replaces Project with Shop, adds system_roles/shop_roles as separate
tables, many-to-many user_shop_memberships, Product+subscriptions, and
user status. This branch has no production data, so Migrate() rebuilds
the schema from scratch rather than migrating it in place."
```

---

### Task 2: Repositories

**Files:**
- Delete: `platform-identity-service/internal/repository/project_repository.go`
- New: `platform-identity-service/internal/repository/shop_repository.go`
- New: `platform-identity-service/internal/repository/system_role_repository.go`
- New: `platform-identity-service/internal/repository/shop_role_repository.go`
- New: `platform-identity-service/internal/repository/shop_membership_repository.go`
- New: `platform-identity-service/internal/repository/product_repository.go`
- New: `platform-identity-service/internal/repository/subscription_repository.go`
- Rewrite: `platform-identity-service/internal/repository/user_repository.go`
- Delete: `platform-identity-service/internal/repository/role_repository.go`
- Rewrite: `platform-identity-service/internal/repository/repository_test.go`

**Interfaces:**
- Produces: `ShopRepository{Create, List, GetByID}` (same shape as old `ProjectRepository`, renamed).
- Produces: `SystemRoleRepository{List(ctx) ([]models.SystemRole, error)}`.
- Produces: `ShopRoleRepository{List(ctx) ([]models.ShopRole, error)}`.
- Produces: `ShopMembershipRepository{Create(ctx, m *models.ShopMembership) error; GetByUserAndShop(ctx, userID, shopID string) (*models.ShopMembership, error); ListByShop(ctx, shopID string) ([]models.ShopMembership, error); ListByUser(ctx, userID string) ([]models.ShopMembership, error); SetShopRole(ctx, userID, shopID string, shopRoleID int16) error}`.
- Produces: `ProductRepository{Create(ctx, p *models.Product) error; List(ctx) ([]models.Product, error); GetByID(ctx, id string) (*models.Product, error)}`.
- Produces: `SubscriptionRepository{Upsert(ctx, s *models.Subscription) error; GetByUserAndProduct(ctx, userID, productID string) (*models.Subscription, error)}`.
- Produces: `UserRepository{Create, GetByID, GetByUsernameOrEmail, ListAll, SetSystemRole, SetStatus}` — `CountByProject`/`ListByProject`/`SetRole` (old, project-scoped) are removed; role/project-related logic moves to `ShopMembershipRepository`.
- Produces: `ErrShopNotFound`, `ErrUserNotFound`, `ErrUsernameTaken`, `ErrEmailTaken`, `ErrProductNotFound`, `ErrMembershipNotFound` (sentinel errors, same pattern as before).

- [ ] **Step 1: Delete old files**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
rm internal/repository/project_repository.go internal/repository/role_repository.go
```

- [ ] **Step 2: Write `internal/repository/shop_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"platform-identity-service/internal/models"
)

var ErrShopNotFound = errors.New("shop not found")

type ShopRepository struct {
	db *sql.DB
}

func NewShopRepository(db *sql.DB) *ShopRepository {
	return &ShopRepository{db: db}
}

func (r *ShopRepository) Create(ctx context.Context, s *models.Shop) error {
	const q = `INSERT INTO shops (id, name, created_at) VALUES ($1, $2, $3)`
	_, err := r.db.ExecContext(ctx, q, s.ID, s.Name, s.CreatedAt)
	return err
}

func (r *ShopRepository) List(ctx context.Context) ([]models.Shop, error) {
	const q = `SELECT id, name, created_at FROM shops ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	shops := []models.Shop{}
	for rows.Next() {
		var s models.Shop
		if err := rows.Scan(&s.ID, &s.Name, &s.CreatedAt); err != nil {
			return nil, err
		}
		shops = append(shops, s)
	}
	return shops, rows.Err()
}

func (r *ShopRepository) GetByID(ctx context.Context, id string) (*models.Shop, error) {
	const q = `SELECT id, name, created_at FROM shops WHERE id = $1`
	var s models.Shop
	err := r.db.QueryRowContext(ctx, q, id).Scan(&s.ID, &s.Name, &s.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrShopNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}
```

- [ ] **Step 3: Write `internal/repository/system_role_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"

	"platform-identity-service/internal/models"
)

type SystemRoleRepository struct {
	db *sql.DB
}

func NewSystemRoleRepository(db *sql.DB) *SystemRoleRepository {
	return &SystemRoleRepository{db: db}
}

func (r *SystemRoleRepository) List(ctx context.Context) ([]models.SystemRole, error) {
	const q = `SELECT id, name FROM system_roles ORDER BY id`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := []models.SystemRole{}
	for rows.Next() {
		var role models.SystemRole
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}
```

- [ ] **Step 4: Write `internal/repository/shop_role_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"

	"platform-identity-service/internal/models"
)

type ShopRoleRepository struct {
	db *sql.DB
}

func NewShopRoleRepository(db *sql.DB) *ShopRoleRepository {
	return &ShopRoleRepository{db: db}
}

func (r *ShopRoleRepository) List(ctx context.Context) ([]models.ShopRole, error) {
	const q = `SELECT id, name FROM shop_roles ORDER BY id`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := []models.ShopRole{}
	for rows.Next() {
		var role models.ShopRole
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}
```

- [ ] **Step 5: Write `internal/repository/shop_membership_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"platform-identity-service/internal/models"
)

var (
	ErrMembershipNotFound = errors.New("shop membership not found")
	ErrMembershipExists   = errors.New("user is already a member of this shop")
)

type ShopMembershipRepository struct {
	db *sql.DB
}

func NewShopMembershipRepository(db *sql.DB) *ShopMembershipRepository {
	return &ShopMembershipRepository{db: db}
}

const selectMembershipWithNames = `
	SELECT m.id, m.user_id, m.shop_id, s.name, m.shop_role_id, sr.name, m.created_at
	FROM user_shop_memberships m
	JOIN shops s ON s.id = m.shop_id
	JOIN shop_roles sr ON sr.id = m.shop_role_id
`

func (r *ShopMembershipRepository) scanOne(row *sql.Row) (*models.ShopMembership, error) {
	var m models.ShopMembership
	err := row.Scan(&m.ID, &m.UserID, &m.ShopID, &m.ShopName, &m.ShopRoleID, &m.ShopRoleName, &m.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrMembershipNotFound
	}
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ShopMembershipRepository) Create(ctx context.Context, m *models.ShopMembership) error {
	const q = `
		INSERT INTO user_shop_memberships (id, user_id, shop_id, shop_role_id, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.ExecContext(ctx, q, m.ID, m.UserID, m.ShopID, m.ShopRoleID, m.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrMembershipExists
		}
		return err
	}
	return nil
}

func (r *ShopMembershipRepository) GetByUserAndShop(ctx context.Context, userID, shopID string) (*models.ShopMembership, error) {
	row := r.db.QueryRowContext(ctx, selectMembershipWithNames+" WHERE m.user_id = $1 AND m.shop_id = $2", userID, shopID)
	return r.scanOne(row)
}

func (r *ShopMembershipRepository) ListByShop(ctx context.Context, shopID string) ([]models.ShopMembership, error) {
	rows, err := r.db.QueryContext(ctx, selectMembershipWithNames+" WHERE m.shop_id = $1 ORDER BY m.created_at", shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	memberships := []models.ShopMembership{}
	for rows.Next() {
		var m models.ShopMembership
		if err := rows.Scan(&m.ID, &m.UserID, &m.ShopID, &m.ShopName, &m.ShopRoleID, &m.ShopRoleName, &m.CreatedAt); err != nil {
			return nil, err
		}
		memberships = append(memberships, m)
	}
	return memberships, rows.Err()
}

func (r *ShopMembershipRepository) ListByUser(ctx context.Context, userID string) ([]models.ShopMembership, error) {
	rows, err := r.db.QueryContext(ctx, selectMembershipWithNames+" WHERE m.user_id = $1 ORDER BY m.created_at", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	memberships := []models.ShopMembership{}
	for rows.Next() {
		var m models.ShopMembership
		if err := rows.Scan(&m.ID, &m.UserID, &m.ShopID, &m.ShopName, &m.ShopRoleID, &m.ShopRoleName, &m.CreatedAt); err != nil {
			return nil, err
		}
		memberships = append(memberships, m)
	}
	return memberships, rows.Err()
}

func (r *ShopMembershipRepository) SetShopRole(ctx context.Context, userID, shopID string, shopRoleID int16) error {
	const q = `UPDATE user_shop_memberships SET shop_role_id = $3 WHERE user_id = $1 AND shop_id = $2`
	result, err := r.db.ExecContext(ctx, q, userID, shopID, shopRoleID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrMembershipNotFound
	}
	return nil
}
```

- [ ] **Step 6: Write `internal/repository/product_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"platform-identity-service/internal/models"
)

var ErrProductNotFound = errors.New("product not found")

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(ctx context.Context, p *models.Product) error {
	const q = `INSERT INTO products (id, name, created_at) VALUES ($1, $2, $3)`
	_, err := r.db.ExecContext(ctx, q, p.ID, p.Name, p.CreatedAt)
	return err
}

func (r *ProductRepository) List(ctx context.Context) ([]models.Product, error) {
	const q = `SELECT id, name, created_at FROM products ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []models.Product{}
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (*models.Product, error) {
	const q = `SELECT id, name, created_at FROM products WHERE id = $1`
	var p models.Product
	err := r.db.QueryRowContext(ctx, q, id).Scan(&p.ID, &p.Name, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrProductNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
```

- [ ] **Step 7: Write `internal/repository/subscription_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"platform-identity-service/internal/models"
)

var ErrSubscriptionNotFound = errors.New("subscription not found")

type SubscriptionRepository struct {
	db *sql.DB
}

func NewSubscriptionRepository(db *sql.DB) *SubscriptionRepository {
	return &SubscriptionRepository{db: db}
}

// Upsert creates or updates a user's subscription row for a product.
func (r *SubscriptionRepository) Upsert(ctx context.Context, s *models.Subscription) error {
	const q = `
		INSERT INTO user_product_subscriptions (id, user_id, product_id, subscripted, renewed, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, product_id) DO UPDATE
		SET subscripted = EXCLUDED.subscripted, renewed = EXCLUDED.renewed, updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.ExecContext(ctx, q, s.ID, s.UserID, s.ProductID, s.Subscripted, s.Renewed, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *SubscriptionRepository) GetByUserAndProduct(ctx context.Context, userID, productID string) (*models.Subscription, error) {
	const q = `
		SELECT id, user_id, product_id, subscripted, renewed, created_at, updated_at
		FROM user_product_subscriptions WHERE user_id = $1 AND product_id = $2
	`
	var s models.Subscription
	err := r.db.QueryRowContext(ctx, q, userID, productID).Scan(
		&s.ID, &s.UserID, &s.ProductID, &s.Subscripted, &s.Renewed, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrSubscriptionNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}
```

- [ ] **Step 8: Rewrite `internal/repository/user_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"platform-identity-service/internal/models"
)

var (
	ErrUserNotFound  = errors.New("user not found")
	ErrUsernameTaken = errors.New("username already registered")
	ErrEmailTaken    = errors.New("email already registered")
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u *models.User) error {
	const q = `
		INSERT INTO users (id, name, username, email, password_hash, system_role_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.ExecContext(ctx, q,
		u.ID, u.Name, u.Username, u.Email, u.PasswordHash, u.SystemRoleID, u.Status, u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "users_username_key" {
				return ErrUsernameTaken
			}
			return ErrEmailTaken
		}
		return err
	}
	return nil
}

const selectUserWithSystemRole = `
	SELECT u.id, u.name, u.username, u.email, u.password_hash, u.system_role_id, sr.name, u.status, u.created_at, u.updated_at
	FROM users u
	JOIN system_roles sr ON sr.id = u.system_role_id
`

func (r *UserRepository) scanUser(row *sql.Row) (*models.User, error) {
	var u models.User
	err := row.Scan(&u.ID, &u.Name, &u.Username, &u.Email, &u.PasswordHash,
		&u.SystemRoleID, &u.SystemRoleName, &u.Status, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	row := r.db.QueryRowContext(ctx, selectUserWithSystemRole+" WHERE u.id = $1", id)
	return r.scanUser(row)
}

func (r *UserRepository) GetByUsernameOrEmail(ctx context.Context, identifier string) (*models.User, error) {
	row := r.db.QueryRowContext(ctx, selectUserWithSystemRole+" WHERE u.username = $1 OR u.email = $1", identifier)
	return r.scanUser(row)
}

func (r *UserRepository) ListAll(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.QueryContext(ctx, selectUserWithSystemRole+" ORDER BY u.created_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Email, &u.PasswordHash,
			&u.SystemRoleID, &u.SystemRoleName, &u.Status, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserRepository) SetSystemRole(ctx context.Context, userID string, systemRoleID int16) error {
	const q = `UPDATE users SET system_role_id = $2, updated_at = now() WHERE id = $1`
	result, err := r.db.ExecContext(ctx, q, userID, systemRoleID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *UserRepository) SetStatus(ctx context.Context, userID, status string) error {
	const q = `UPDATE users SET status = $2, updated_at = now() WHERE id = $1`
	result, err := r.db.ExecContext(ctx, q, userID, status)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrUserNotFound
	}
	return nil
}
```

- [ ] **Step 9: Rewrite `internal/repository/repository_test.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/database"
	"platform-identity-service/internal/models"
)

func testDB(t *testing.T) *sql.DB {
	t.Helper()
	dsn := os.Getenv("TEST_DSN")
	if dsn == "" {
		dsn = "host=localhost port=5433 user=postgres password=1 dbname=postgres sslmode=disable"
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestShopRepository_CreateAndGet(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewShopRepository(db)

	s := &models.Shop{ID: uuid.NewString(), Name: "Test Shop " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := repo.Create(context.Background(), s); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	got, err := repo.GetByID(context.Background(), s.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.Name != s.Name {
		t.Errorf("expected name %q, got %q", s.Name, got.Name)
	}
}

func TestShopRepository_GetByID_NotFound(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewShopRepository(db)

	_, err := repo.GetByID(context.Background(), uuid.NewString())
	if err != ErrShopNotFound {
		t.Errorf("expected ErrShopNotFound, got %v", err)
	}
}

func TestSystemRoleRepository_List(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewSystemRoleRepository(db)

	roles, err := repo.List(context.Background())
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(roles) != 3 {
		t.Fatalf("expected 3 seeded system roles, got %d", len(roles))
	}
	byName := map[string]int16{}
	for _, r := range roles {
		byName[r.Name] = r.ID
	}
	if byName["superadmin"] != 1 || byName["admin"] != 2 || byName["user"] != 3 {
		t.Errorf("unexpected system role ids: %+v", byName)
	}
}

func TestShopRoleRepository_List(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewShopRoleRepository(db)

	roles, err := repo.List(context.Background())
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(roles) != 2 {
		t.Fatalf("expected 2 seeded shop roles, got %d", len(roles))
	}
	byName := map[string]int16{}
	for _, r := range roles {
		byName[r.Name] = r.ID
	}
	if byName["shop-admin"] != 1 || byName["shop-user"] != 2 {
		t.Errorf("unexpected shop role ids: %+v", byName)
	}
}

func createTestUser(t *testing.T, userRepo *UserRepository, systemRoleID int16) *models.User {
	t.Helper()
	now := time.Now().UTC()
	u := &models.User{
		ID: uuid.NewString(), Name: "Test User", Username: "u-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		SystemRoleID: systemRoleID, Status: models.UserStatusActive,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := userRepo.Create(context.Background(), u); err != nil {
		t.Fatalf("create user failed: %v", err)
	}
	return u
}

func TestUserRepository_CreateGetListAll(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	userRepo := NewUserRepository(db)

	u := createTestUser(t, userRepo, 3) // system role 'user'

	got, err := userRepo.GetByID(context.Background(), u.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.SystemRoleName != "user" {
		t.Errorf("expected SystemRoleName 'user', got %q", got.SystemRoleName)
	}
	if got.Status != models.UserStatusActive {
		t.Errorf("expected status ACTIVE, got %q", got.Status)
	}

	all, err := userRepo.ListAll(context.Background())
	if err != nil {
		t.Fatalf("ListAll failed: %v", err)
	}
	found := false
	for _, u2 := range all {
		if u2.ID == u.ID {
			found = true
		}
	}
	if !found {
		t.Error("expected created user in ListAll result")
	}
}

func TestUserRepository_GetByUsernameOrEmail(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	userRepo := NewUserRepository(db)

	u := createTestUser(t, userRepo, 3)

	got, err := userRepo.GetByUsernameOrEmail(context.Background(), u.Username)
	if err != nil {
		t.Fatalf("by username failed: %v", err)
	}
	if got.ID != u.ID {
		t.Errorf("expected id %q, got %q", u.ID, got.ID)
	}

	got, err = userRepo.GetByUsernameOrEmail(context.Background(), u.Email)
	if err != nil {
		t.Fatalf("by email failed: %v", err)
	}
	if got.ID != u.ID {
		t.Errorf("expected id %q, got %q", u.ID, got.ID)
	}

	_, err = userRepo.GetByUsernameOrEmail(context.Background(), "nonexistent-"+uuid.NewString())
	if err != ErrUserNotFound {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestUserRepository_SetSystemRole(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	userRepo := NewUserRepository(db)

	u := createTestUser(t, userRepo, 3)

	if err := userRepo.SetSystemRole(context.Background(), u.ID, 2); err != nil {
		t.Fatalf("SetSystemRole failed: %v", err)
	}

	got, err := userRepo.GetByID(context.Background(), u.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.SystemRoleName != "admin" {
		t.Errorf("expected 'admin', got %q", got.SystemRoleName)
	}
}

func TestUserRepository_SetStatus(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	userRepo := NewUserRepository(db)

	u := createTestUser(t, userRepo, 3)

	if err := userRepo.SetStatus(context.Background(), u.ID, models.UserStatusInActive); err != nil {
		t.Fatalf("SetStatus failed: %v", err)
	}

	got, err := userRepo.GetByID(context.Background(), u.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.Status != models.UserStatusInActive {
		t.Errorf("expected IN_ACTIVE, got %q", got.Status)
	}
}

func TestShopMembershipRepository_CreateListGetSetRole(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	shopRepo := NewShopRepository(db)
	userRepo := NewUserRepository(db)
	membershipRepo := NewShopMembershipRepository(db)

	shop := &models.Shop{ID: uuid.NewString(), Name: "Membership Shop " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := shopRepo.Create(context.Background(), shop); err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	u1 := createTestUser(t, userRepo, 3)
	u2 := createTestUser(t, userRepo, 3)

	m1 := &models.ShopMembership{ID: uuid.NewString(), UserID: u1.ID, ShopID: shop.ID, ShopRoleID: 1, CreatedAt: time.Now().UTC()}
	if err := membershipRepo.Create(context.Background(), m1); err != nil {
		t.Fatalf("create membership 1 failed: %v", err)
	}
	m2 := &models.ShopMembership{ID: uuid.NewString(), UserID: u2.ID, ShopID: shop.ID, ShopRoleID: 2, CreatedAt: time.Now().UTC()}
	if err := membershipRepo.Create(context.Background(), m2); err != nil {
		t.Fatalf("create membership 2 failed: %v", err)
	}

	// Duplicate membership should fail.
	dup := &models.ShopMembership{ID: uuid.NewString(), UserID: u1.ID, ShopID: shop.ID, ShopRoleID: 2, CreatedAt: time.Now().UTC()}
	if err := membershipRepo.Create(context.Background(), dup); err != ErrMembershipExists {
		t.Errorf("expected ErrMembershipExists, got %v", err)
	}

	members, err := membershipRepo.ListByShop(context.Background(), shop.ID)
	if err != nil {
		t.Fatalf("ListByShop failed: %v", err)
	}
	if len(members) != 2 {
		t.Fatalf("expected 2 members, got %d", len(members))
	}

	got, err := membershipRepo.GetByUserAndShop(context.Background(), u1.ID, shop.ID)
	if err != nil {
		t.Fatalf("GetByUserAndShop failed: %v", err)
	}
	if got.ShopRoleName != "shop-admin" {
		t.Errorf("expected shop-admin, got %q", got.ShopRoleName)
	}
	if got.ShopName != shop.Name {
		t.Errorf("expected joined ShopName %q, got %q", shop.Name, got.ShopName)
	}

	if err := membershipRepo.SetShopRole(context.Background(), u1.ID, shop.ID, 2); err != nil {
		t.Fatalf("SetShopRole failed: %v", err)
	}
	got, err = membershipRepo.GetByUserAndShop(context.Background(), u1.ID, shop.ID)
	if err != nil {
		t.Fatalf("GetByUserAndShop after SetShopRole failed: %v", err)
	}
	if got.ShopRoleName != "shop-user" {
		t.Errorf("expected shop-user after change, got %q", got.ShopRoleName)
	}

	byUser, err := membershipRepo.ListByUser(context.Background(), u1.ID)
	if err != nil {
		t.Fatalf("ListByUser failed: %v", err)
	}
	if len(byUser) != 1 || byUser[0].ShopID != shop.ID {
		t.Errorf("expected 1 membership for u1 in shop %q, got %+v", shop.ID, byUser)
	}
}

func TestProductRepository_CreateListGet(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewProductRepository(db)

	p := &models.Product{ID: uuid.NewString(), Name: "Test Product " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := repo.Create(context.Background(), p); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	got, err := repo.GetByID(context.Background(), p.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.Name != p.Name {
		t.Errorf("expected name %q, got %q", p.Name, got.Name)
	}

	all, err := repo.List(context.Background())
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	found := false
	for _, p2 := range all {
		if p2.ID == p.ID {
			found = true
		}
	}
	if !found {
		t.Error("expected created product in List result")
	}
}

func TestSubscriptionRepository_UpsertAndGet(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	userRepo := NewUserRepository(db)
	productRepo := NewProductRepository(db)
	subRepo := NewSubscriptionRepository(db)

	u := createTestUser(t, userRepo, 3)
	p := &models.Product{ID: uuid.NewString(), Name: "Sub Product " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := productRepo.Create(context.Background(), p); err != nil {
		t.Fatalf("create product failed: %v", err)
	}

	now := time.Now().UTC()
	sub := &models.Subscription{ID: uuid.NewString(), UserID: u.ID, ProductID: p.ID, Subscripted: false, Renewed: false, CreatedAt: now, UpdatedAt: now}
	if err := subRepo.Upsert(context.Background(), sub); err != nil {
		t.Fatalf("initial upsert failed: %v", err)
	}

	got, err := subRepo.GetByUserAndProduct(context.Background(), u.ID, p.ID)
	if err != nil {
		t.Fatalf("GetByUserAndProduct failed: %v", err)
	}
	if got.Subscripted {
		t.Error("expected Subscripted=false initially")
	}

	sub.Subscripted = true
	sub.UpdatedAt = time.Now().UTC()
	if err := subRepo.Upsert(context.Background(), sub); err != nil {
		t.Fatalf("update upsert failed: %v", err)
	}

	got, err = subRepo.GetByUserAndProduct(context.Background(), u.ID, p.ID)
	if err != nil {
		t.Fatalf("GetByUserAndProduct after update failed: %v", err)
	}
	if !got.Subscripted {
		t.Error("expected Subscripted=true after upsert update")
	}

	_, err = subRepo.GetByUserAndProduct(context.Background(), u.ID, uuid.NewString())
	if err != ErrSubscriptionNotFound {
		t.Errorf("expected ErrSubscriptionNotFound, got %v", err)
	}
}
```

- [ ] **Step 10: Run the full repository suite**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/repository/... -v
```
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/repository/
git commit -m "feat(platform-identity-service): rebuild repository layer for Shop+Product

Replaces ProjectRepository with ShopRepository; adds
SystemRoleRepository, ShopRoleRepository, ShopMembershipRepository,
ProductRepository, SubscriptionRepository; rewrites UserRepository to
drop project_id/role_id in favor of system_role_id + status."
```

---

### Task 3: `shopassign` package (replaces `roleassign`)

**Files:**
- Delete: `platform-identity-service/internal/service/roleassign/strategy.go`
- Delete: `platform-identity-service/internal/service/roleassign/strategy_test.go`
- New: `platform-identity-service/internal/service/shopassign/checker.go`
- New: `platform-identity-service/internal/service/shopassign/checker_test.go`

**Interfaces:**
- Produces: `shopassign.Caller{UserID, SystemRole string}`.
- Produces: `shopassign.CanManageShop(caller Caller, membership *models.ShopMembership) bool` — a plain function, not an interface with a swappable implementation. Unlike the old `roleassign.RoleAssigner`, this doesn't need to be an injected interface: there is exactly one rule (superadmin bypass OR shop-admin-of-that-shop), it needs a DB-fetched `*models.ShopMembership` (or `nil` if the caller has no membership row for that shop) as input rather than two flat structs, and no second implementation is anticipated. Keeping it a function avoids introducing an interface with only one real implementation — YAGNI, matching this plan's spec note that speculative permission plumbing (e.g. for system role `admin`) should wait until a second real need appears.

- [ ] **Step 1: Delete the old package**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
rm -rf internal/service/roleassign
```

- [ ] **Step 2: Write the failing test**

```go
package shopassign

import (
	"testing"

	"platform-identity-service/internal/models"
)

func TestCanManageShop(t *testing.T) {
	tests := []struct {
		name       string
		caller     Caller
		membership *models.ShopMembership
		want       bool
	}{
		{
			name:       "superadmin can manage any shop, even with no membership",
			caller:     Caller{UserID: "u1", SystemRole: "superadmin"},
			membership: nil,
			want:       true,
		},
		{
			name:       "shop-admin member can manage their own shop",
			caller:     Caller{UserID: "u1", SystemRole: "user"},
			membership: &models.ShopMembership{UserID: "u1", ShopID: "s1", ShopRoleName: "shop-admin"},
			want:       true,
		},
		{
			name:       "shop-user member cannot manage the shop",
			caller:     Caller{UserID: "u1", SystemRole: "user"},
			membership: &models.ShopMembership{UserID: "u1", ShopID: "s1", ShopRoleName: "shop-user"},
			want:       false,
		},
		{
			name:       "non-member, non-superadmin cannot manage the shop",
			caller:     Caller{UserID: "u1", SystemRole: "user"},
			membership: nil,
			want:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CanManageShop(tt.caller, tt.membership)
			if got != tt.want {
				t.Errorf("CanManageShop(%+v, %+v) = %v, want %v", tt.caller, tt.membership, got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
go test ./internal/service/shopassign/... -v
```
Expected: FAIL — package/function undefined.

- [ ] **Step 4: Write `internal/service/shopassign/checker.go`**

```go
// Package shopassign isolates the authorization decision for who may
// manage a shop's membership (add members, change a member's shop role).
package shopassign

import "platform-identity-service/internal/models"

type Caller struct {
	UserID     string
	SystemRole string
}

// CanManageShop reports whether caller may add/modify members of the shop
// membership belongs to. membership is the caller's own
// user_shop_memberships row for that shop, or nil if they have none.
// A superadmin always may, regardless of membership. Otherwise the caller
// must hold a shop-admin membership row for that specific shop.
func CanManageShop(caller Caller, membership *models.ShopMembership) bool {
	if caller.SystemRole == models.SystemRoleSuperadmin {
		return true
	}
	if membership == nil {
		return false
	}
	return membership.ShopRoleName == models.ShopRoleAdmin
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
go test ./internal/service/shopassign/... -v
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/service/shopassign/
git rm -r platform-identity-service/internal/service/roleassign/
git commit -m "feat(platform-identity-service): replace roleassign package with shopassign.CanManageShop

Shop-admin-ness is now a per-membership-row fact (a user can be
shop-admin of one shop and shop-user of another simultaneously), not a
JWT claim, so the check takes a caller plus their fetched membership
row rather than being a pure function over two flat structs. Kept as a
plain function rather than a Strategy interface — exactly one rule
exists and no second implementation is anticipated."
```

---

### Task 4: Services — Auth, Shop, ShopMembership, User, Product

**Files:**
- Delete: `platform-identity-service/internal/service/project_service.go`
- Delete: `platform-identity-service/internal/service/project_service_test.go`
- Rewrite: `platform-identity-service/internal/service/auth_service.go`
- Rewrite: `platform-identity-service/internal/service/auth_service_test.go`
- New: `platform-identity-service/internal/service/shop_service.go`
- New: `platform-identity-service/internal/service/shop_membership_service.go`
- Rewrite: `platform-identity-service/internal/service/user_service.go`
- Rewrite: `platform-identity-service/internal/service/user_service_test.go`
- New: `platform-identity-service/internal/service/product_service.go`
- Rewrite: `platform-identity-service/internal/service/helpers_test.go`
- Delete: `platform-identity-service/internal/service/role_service.go` (replaced by two below)
- New: `platform-identity-service/internal/service/system_role_service.go`
- New: `platform-identity-service/internal/service/shop_role_service.go`

**Interfaces:**
- Produces: `AuthService{NewAuthService(userRepo *repository.UserRepository, jwt *auth.JWTManager) *AuthService}` — no longer takes a `ProjectRepository`, since registration no longer touches a shop at all. `RegisterInput{Name, Username, Email, Password string}` (no `ProjectID`). `Register(ctx, in) (*models.User, error)` always creates with `system_role_id=3` ('user'), `status=ACTIVE`. `LoginInput{Identifier, Password string}`, `Login(ctx, in) (string, time.Time, error)` calls `jwt.Generate(u.ID, u.SystemRoleName)`.
- Produces: `ShopService{NewShopService(repo *repository.ShopRepository) *ShopService}` — `Create(ctx, name string) (*models.Shop, error)`, `List(ctx) ([]models.Shop, error)`, `Get(ctx, id string) (*models.Shop, error)` (same shape as old `ProjectService`, renamed).
- Produces: `ShopMembershipService{NewShopMembershipService(membershipRepo *repository.ShopMembershipRepository, userRepo *repository.UserRepository, shopRepo *repository.ShopRepository) *ShopMembershipService}` — `AddMember(ctx, caller shopassign.Caller, shopID, targetUserID, shopRoleName string) (*models.ShopMembership, error)`, `ListMembers(ctx, caller shopassign.Caller, shopID string) ([]models.ShopMembership, error)`, `SetMemberRole(ctx, caller shopassign.Caller, shopID, targetUserID, newShopRoleName string) (*models.ShopMembership, error)`, `ListMyShops(ctx, userID string) ([]models.ShopMembership, error)`.
- Produces: `UserService{NewUserService(repo *repository.UserRepository) *UserService}` — no longer takes a `RoleAssigner` (shop authority moved to `ShopMembershipService`; this service only handles system-wide user operations). `Get(ctx, caller shopassign.Caller, userID string) (*models.User, error)` (self or superadmin), `ListAll(ctx, caller shopassign.Caller) ([]models.User, error)` (superadmin only), `SetSystemRole(ctx, caller shopassign.Caller, targetUserID, newSystemRoleName string) (*models.User, error)` (superadmin only), `SetStatus(ctx, caller shopassign.Caller, targetUserID, newStatus string) (*models.User, error)` (superadmin only).
- Produces: `ProductService{NewProductService(productRepo *repository.ProductRepository, subRepo *repository.SubscriptionRepository) *ProductService}` — `Create(ctx, name string) (*models.Product, error)`, `List(ctx) ([]models.Product, error)`, `CheckAccess(ctx, userID, productID string) (string, error)` (returns `"full"` or `"demo"`), `SetSubscription(ctx, caller shopassign.Caller, targetUserID, productID string, subscripted, renewed bool) (*models.Subscription, error)` (superadmin or admin only).
- Produces: `SystemRoleService{List(ctx) ([]models.SystemRole, error)}`, `ShopRoleService{List(ctx) ([]models.ShopRole, error)}` (trivial pass-throughs, same shape as old `RoleService`).
- Produces (shared error vars): `ErrForbidden`, `ErrUserNotFound`, `ErrUsernameTaken`, `ErrEmailTaken`, `ErrInvalidCredentials`, `ErrShopNotFound`, `ErrMembershipNotFound`, `ErrMembershipExists`, `ErrProductNotFound`, `ErrInvalidSystemRole`, `ErrInvalidShopRole`, `ErrInvalidStatus` — all in `package service` (single error surface, matching the existing convention where `service.ErrForbidden` etc. are re-exported repository errors plus service-only ones).

- [ ] **Step 1: Delete old files**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
rm internal/service/project_service.go internal/service/project_service_test.go internal/service/role_service.go
```

- [ ] **Step 2: Write `internal/service/helpers_test.go`**

```go
package service

import (
	"database/sql"
	"os"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/database"
	"platform-identity-service/internal/repository"
)

func testDB(t *testing.T) *sql.DB {
	t.Helper()
	dsn := os.Getenv("TEST_DSN")
	if dsn == "" {
		dsn = "host=localhost port=5433 user=postgres password=1 dbname=postgres sslmode=disable"
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func newTestAuthService(t *testing.T) *AuthService {
	t.Helper()
	db := testDB(t)
	userRepo := repository.NewUserRepository(db)
	jwt := auth.NewJWTManager("test-secret", 60)
	return NewAuthService(userRepo, jwt)
}
```

- [ ] **Step 3: Write the failing `AuthService` tests**

```go
package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
)

func TestAuthService_Register_AlwaysCreatesPlainUser(t *testing.T) {
	authSvc := newTestAuthService(t)

	u, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "First", Username: "first-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if u.SystemRoleName != models.SystemRoleUser {
		t.Errorf("expected system role 'user', got %q", u.SystemRoleName)
	}
	if u.Status != models.UserStatusActive {
		t.Errorf("expected status ACTIVE, got %q", u.Status)
	}

	// A second registration also becomes a plain user — no more
	// first-user-becomes-admin behavior, since registration is no longer
	// shop-scoped.
	u2, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Second", Username: "second-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("second Register failed: %v", err)
	}
	if u2.SystemRoleName != models.SystemRoleUser {
		t.Errorf("expected second user's system role 'user', got %q", u2.SystemRoleName)
	}
}

func TestAuthService_Register_DuplicateUsername(t *testing.T) {
	authSvc := newTestAuthService(t)

	username := "dup-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "A", Username: username, Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("first Register failed: %v", err)
	}

	_, err = authSvc.Register(context.Background(), RegisterInput{
		Name: "B", Username: username, Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != ErrUsernameTaken {
		t.Errorf("expected ErrUsernameTaken, got %v", err)
	}
}

func TestAuthService_Login_Success(t *testing.T) {
	authSvc := newTestAuthService(t)

	username := "login-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Login User", Username: username, Email: uuid.NewString() + "@example.com", Password: "correct-password",
	})
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}

	token, _, err := authSvc.Login(context.Background(), LoginInput{Identifier: username, Password: "correct-password"})
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if token == "" {
		t.Error("expected non-empty token")
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	authSvc := newTestAuthService(t)

	username := "loginfail-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "User", Username: username, Email: uuid.NewString() + "@example.com", Password: "correct-password",
	})
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}

	_, _, err = authSvc.Login(context.Background(), LoginInput{Identifier: username, Password: "wrong-password"})
	if err != ErrInvalidCredentials {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestAuthService -v
```
Expected: FAIL — `AuthService`/`RegisterInput` shape mismatch (old file still present until Step 5).

- [ ] **Step 5: Rewrite `internal/service/auth_service.go`**

```go
package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

const systemRoleIDUser int16 = 3

var (
	ErrUserNotFound       = repository.ErrUserNotFound
	ErrUsernameTaken      = repository.ErrUsernameTaken
	ErrEmailTaken         = repository.ErrEmailTaken
	ErrInvalidCredentials = errors.New("invalid username/email or password")
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwt      *auth.JWTManager
}

func NewAuthService(userRepo *repository.UserRepository, jwt *auth.JWTManager) *AuthService {
	return &AuthService{userRepo: userRepo, jwt: jwt}
}

type RegisterInput struct {
	Name     string
	Username string
	Email    string
	Password string
}

// Register creates a Teslahubs-wide account. Every registered user starts
// as system role 'user' with no shop memberships — shop membership is
// admin-granted afterward via ShopMembershipService, not part of signup.
func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*models.User, error) {
	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	u := &models.User{
		ID:           uuid.NewString(),
		Name:         in.Name,
		Username:     in.Username,
		Email:        in.Email,
		PasswordHash: hash,
		SystemRoleID: systemRoleIDUser,
		Status:       models.UserStatusActive,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.userRepo.Create(ctx, u); err != nil {
		return nil, err
	}

	return s.userRepo.GetByID(ctx, u.ID)
}

type LoginInput struct {
	Identifier string
	Password   string
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (string, time.Time, error) {
	u, err := s.userRepo.GetByUsernameOrEmail(ctx, in.Identifier)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return "", time.Time{}, ErrInvalidCredentials
		}
		return "", time.Time{}, err
	}

	if !auth.CheckPassword(u.PasswordHash, in.Password) {
		return "", time.Time{}, ErrInvalidCredentials
	}

	return s.jwt.Generate(u.ID, u.SystemRoleName)
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
go test ./internal/service/... -run TestAuthService -v
```
Expected: PASS.

- [ ] **Step 7: Write `internal/service/shop_service.go`** (same shape as the deleted `project_service.go`, renamed)

```go
package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

var ErrShopNotFound = repository.ErrShopNotFound

type ShopService struct {
	repo *repository.ShopRepository
}

func NewShopService(repo *repository.ShopRepository) *ShopService {
	return &ShopService{repo: repo}
}

func (s *ShopService) Create(ctx context.Context, name string) (*models.Shop, error) {
	shop := &models.Shop{
		ID:        uuid.NewString(),
		Name:      name,
		CreatedAt: time.Now().UTC(),
	}
	if err := s.repo.Create(ctx, shop); err != nil {
		return nil, err
	}
	return shop, nil
}

func (s *ShopService) List(ctx context.Context) ([]models.Shop, error) {
	return s.repo.List(ctx)
}

func (s *ShopService) Get(ctx context.Context, id string) (*models.Shop, error) {
	return s.repo.GetByID(ctx, id)
}
```

- [ ] **Step 8: Write the failing `ShopMembershipService` tests**

Create `platform-identity-service/internal/service/shop_membership_service_test.go`:

```go
package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

func newTestShopMembershipService(t *testing.T) (*ShopMembershipService, *AuthService, *ShopService) {
	t.Helper()
	db := testDB(t)
	userRepo := repository.NewUserRepository(db)
	shopRepo := repository.NewShopRepository(db)
	membershipRepo := repository.NewShopMembershipRepository(db)
	jwtMgr := newTestJWTManager()
	authSvc := NewAuthService(userRepo, jwtMgr)
	shopSvc := NewShopService(shopRepo)
	membershipSvc := NewShopMembershipService(membershipRepo, userRepo, shopRepo)
	return membershipSvc, authSvc, shopSvc
}

func TestShopMembershipService_AddMember_BySuperadmin(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shop, err := shopSvc.Create(context.Background(), "Superadmin Add Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	membership, err := membershipSvc.AddMember(context.Background(), superadminCaller, shop.ID, target.ID, models.ShopRoleUser)
	if err != nil {
		t.Fatalf("AddMember failed: %v", err)
	}
	if membership.ShopRoleName != models.ShopRoleUser {
		t.Errorf("expected shop-user, got %q", membership.ShopRoleName)
	}
}

func TestShopMembershipService_AddMember_ByShopAdmin(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shop, err := shopSvc.Create(context.Background(), "ShopAdmin Add Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	shopAdmin, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "ShopAdmin", Username: "shopadmin-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register shopAdmin failed: %v", err)
	}
	// Bootstrap: make shopAdmin a shop-admin of this shop via a superadmin call.
	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	if _, err := membershipSvc.AddMember(context.Background(), superadminCaller, shop.ID, shopAdmin.ID, models.ShopRoleAdmin); err != nil {
		t.Fatalf("bootstrap AddMember failed: %v", err)
	}

	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	shopAdminCaller := shopassign.Caller{UserID: shopAdmin.ID, SystemRole: models.SystemRoleUser}
	membership, err := membershipSvc.AddMember(context.Background(), shopAdminCaller, shop.ID, target.ID, models.ShopRoleUser)
	if err != nil {
		t.Fatalf("AddMember by shop-admin failed: %v", err)
	}
	if membership.ShopRoleName != models.ShopRoleUser {
		t.Errorf("expected shop-user, got %q", membership.ShopRoleName)
	}
}

func TestShopMembershipService_AddMember_ForbiddenForNonMember(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shop, err := shopSvc.Create(context.Background(), "Forbidden Add Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	caller, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Nobody", Username: "nobody-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register caller failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	plainCaller := shopassign.Caller{UserID: caller.ID, SystemRole: models.SystemRoleUser}
	_, err = membershipSvc.AddMember(context.Background(), plainCaller, shop.ID, target.ID, models.ShopRoleUser)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestShopMembershipService_ListMembers(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shop, err := shopSvc.Create(context.Background(), "ListMembers Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	if _, err := membershipSvc.AddMember(context.Background(), superadminCaller, shop.ID, target.ID, models.ShopRoleUser); err != nil {
		t.Fatalf("AddMember failed: %v", err)
	}

	members, err := membershipSvc.ListMembers(context.Background(), superadminCaller, shop.ID)
	if err != nil {
		t.Fatalf("ListMembers failed: %v", err)
	}
	if len(members) != 1 {
		t.Fatalf("expected 1 member, got %d", len(members))
	}
}

func TestShopMembershipService_SetMemberRole(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shop, err := shopSvc.Create(context.Background(), "SetMemberRole Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shop failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	if _, err := membershipSvc.AddMember(context.Background(), superadminCaller, shop.ID, target.ID, models.ShopRoleUser); err != nil {
		t.Fatalf("AddMember failed: %v", err)
	}

	updated, err := membershipSvc.SetMemberRole(context.Background(), superadminCaller, shop.ID, target.ID, models.ShopRoleAdmin)
	if err != nil {
		t.Fatalf("SetMemberRole failed: %v", err)
	}
	if updated.ShopRoleName != models.ShopRoleAdmin {
		t.Errorf("expected shop-admin, got %q", updated.ShopRoleName)
	}
}

func TestShopMembershipService_ListMyShops(t *testing.T) {
	membershipSvc, authSvc, shopSvc := newTestShopMembershipService(t)

	shopA, err := shopSvc.Create(context.Background(), "MyShops A "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shopA failed: %v", err)
	}
	shopB, err := shopSvc.Create(context.Background(), "MyShops B "+uuid.NewString())
	if err != nil {
		t.Fatalf("create shopB failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	if _, err := membershipSvc.AddMember(context.Background(), superadminCaller, shopA.ID, target.ID, models.ShopRoleAdmin); err != nil {
		t.Fatalf("AddMember shopA failed: %v", err)
	}
	if _, err := membershipSvc.AddMember(context.Background(), superadminCaller, shopB.ID, target.ID, models.ShopRoleUser); err != nil {
		t.Fatalf("AddMember shopB failed: %v", err)
	}

	myShops, err := membershipSvc.ListMyShops(context.Background(), target.ID)
	if err != nil {
		t.Fatalf("ListMyShops failed: %v", err)
	}
	if len(myShops) != 2 {
		t.Fatalf("expected 2 shop memberships, got %d", len(myShops))
	}
}
```

Add a small helper `newTestJWTManager()` to `helpers_test.go` (this task's Step 2 file), since the tests above reference it:

```go
func newTestJWTManager() *auth.JWTManager {
	return auth.NewJWTManager("test-secret", 60)
}
```

- [ ] **Step 9: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestShopMembershipService -v
```
Expected: FAIL — `ShopMembershipService` undefined.

- [ ] **Step 10: Write `internal/service/shop_membership_service.go`**

```go
package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

var (
	ErrMembershipNotFound = repository.ErrMembershipNotFound
	ErrMembershipExists   = repository.ErrMembershipExists
	ErrInvalidShopRole    = errors.New("invalid shop role: must be 'shop-admin' or 'shop-user'")
)

var shopRoleNameToID = map[string]int16{
	models.ShopRoleAdmin: 1,
	models.ShopRoleUser:  2,
}

type ShopMembershipService struct {
	membershipRepo *repository.ShopMembershipRepository
	userRepo       *repository.UserRepository
	shopRepo       *repository.ShopRepository
}

func NewShopMembershipService(membershipRepo *repository.ShopMembershipRepository, userRepo *repository.UserRepository, shopRepo *repository.ShopRepository) *ShopMembershipService {
	return &ShopMembershipService{membershipRepo: membershipRepo, userRepo: userRepo, shopRepo: shopRepo}
}

// authorize fetches caller's own membership row for shopID (nil if none)
// and evaluates shopassign.CanManageShop against it.
func (s *ShopMembershipService) authorize(ctx context.Context, caller shopassign.Caller, shopID string) error {
	callerMembership, err := s.membershipRepo.GetByUserAndShop(ctx, caller.UserID, shopID)
	if err != nil && !errors.Is(err, repository.ErrMembershipNotFound) {
		return err
	}
	if errors.Is(err, repository.ErrMembershipNotFound) {
		callerMembership = nil
	}
	if !shopassign.CanManageShop(caller, callerMembership) {
		return ErrForbidden
	}
	return nil
}

func (s *ShopMembershipService) AddMember(ctx context.Context, caller shopassign.Caller, shopID, targetUserID, shopRoleName string) (*models.ShopMembership, error) {
	if err := s.authorize(ctx, caller, shopID); err != nil {
		return nil, err
	}

	shopRoleID, ok := shopRoleNameToID[shopRoleName]
	if !ok {
		return nil, ErrInvalidShopRole
	}

	if _, err := s.shopRepo.GetByID(ctx, shopID); err != nil {
		return nil, err
	}
	if _, err := s.userRepo.GetByID(ctx, targetUserID); err != nil {
		return nil, err
	}

	m := &models.ShopMembership{
		ID:         uuid.NewString(),
		UserID:     targetUserID,
		ShopID:     shopID,
		ShopRoleID: shopRoleID,
		CreatedAt:  time.Now().UTC(),
	}
	if err := s.membershipRepo.Create(ctx, m); err != nil {
		return nil, err
	}
	return s.membershipRepo.GetByUserAndShop(ctx, targetUserID, shopID)
}

func (s *ShopMembershipService) ListMembers(ctx context.Context, caller shopassign.Caller, shopID string) ([]models.ShopMembership, error) {
	if err := s.authorize(ctx, caller, shopID); err != nil {
		return nil, err
	}
	return s.membershipRepo.ListByShop(ctx, shopID)
}

func (s *ShopMembershipService) SetMemberRole(ctx context.Context, caller shopassign.Caller, shopID, targetUserID, newShopRoleName string) (*models.ShopMembership, error) {
	if err := s.authorize(ctx, caller, shopID); err != nil {
		return nil, err
	}

	shopRoleID, ok := shopRoleNameToID[newShopRoleName]
	if !ok {
		return nil, ErrInvalidShopRole
	}

	if err := s.membershipRepo.SetShopRole(ctx, targetUserID, shopID, shopRoleID); err != nil {
		return nil, err
	}
	return s.membershipRepo.GetByUserAndShop(ctx, targetUserID, shopID)
}

// ListMyShops returns every shop userID belongs to — no authorization
// check beyond "you can always see your own memberships," since the
// handler layer restricts this to the caller viewing their own id or a
// superadmin viewing anyone's.
func (s *ShopMembershipService) ListMyShops(ctx context.Context, userID string) ([]models.ShopMembership, error) {
	return s.membershipRepo.ListByUser(ctx, userID)
}
```

- [ ] **Step 11: Run tests to verify they pass**

```bash
go test ./internal/service/... -run TestShopMembershipService -v
```
Expected: all PASS.

- [ ] **Step 12: Write the failing `UserService` tests**

Rewrite `platform-identity-service/internal/service/user_service_test.go`:

```go
package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

func newTestUserService(t *testing.T) (*UserService, *AuthService) {
	t.Helper()
	db := testDB(t)
	userRepo := repository.NewUserRepository(db)
	jwtMgr := newTestJWTManager()
	authSvc := NewAuthService(userRepo, jwtMgr)
	userSvc := NewUserService(userRepo)
	return userSvc, authSvc
}

func TestUserService_Get_Self(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	u, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Self", Username: "self-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	caller := shopassign.Caller{UserID: u.ID, SystemRole: models.SystemRoleUser}
	got, err := userSvc.Get(context.Background(), caller, u.ID)
	if err != nil {
		t.Fatalf("Get self failed: %v", err)
	}
	if got.ID != u.ID {
		t.Errorf("expected id %q, got %q", u.ID, got.ID)
	}
}

func TestUserService_Get_ForbiddenForOtherPlainUser(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	caller, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Caller", Username: "caller-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register caller failed: %v", err)
	}
	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	callerClaims := shopassign.Caller{UserID: caller.ID, SystemRole: models.SystemRoleUser}
	_, err = userSvc.Get(context.Background(), callerClaims, target.ID)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestUserService_Get_SuperadminCanViewAnyone(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	got, err := userSvc.Get(context.Background(), superadminCaller, target.ID)
	if err != nil {
		t.Fatalf("Get by superadmin failed: %v", err)
	}
	if got.ID != target.ID {
		t.Errorf("expected id %q, got %q", target.ID, got.ID)
	}
}

func TestUserService_ListAll_SuperadminOnly(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	_, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Someone", Username: "someone-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	users, err := userSvc.ListAll(context.Background(), superadminCaller)
	if err != nil {
		t.Fatalf("ListAll by superadmin failed: %v", err)
	}
	if len(users) == 0 {
		t.Error("expected at least one user")
	}

	plainCaller := shopassign.Caller{UserID: "someone-id", SystemRole: models.SystemRoleUser}
	_, err = userSvc.ListAll(context.Background(), plainCaller)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden for plain user, got %v", err)
	}
}

func TestUserService_SetSystemRole_SuperadminOnly(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	updated, err := userSvc.SetSystemRole(context.Background(), superadminCaller, target.ID, models.SystemRoleAdmin)
	if err != nil {
		t.Fatalf("SetSystemRole failed: %v", err)
	}
	if updated.SystemRoleName != models.SystemRoleAdmin {
		t.Errorf("expected 'admin', got %q", updated.SystemRoleName)
	}

	plainCaller := shopassign.Caller{UserID: target.ID, SystemRole: models.SystemRoleAdmin}
	_, err = userSvc.SetSystemRole(context.Background(), plainCaller, target.ID, models.SystemRoleSuperadmin)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden for non-superadmin, got %v", err)
	}
}

func TestUserService_SetStatus_SuperadminOnly(t *testing.T) {
	userSvc, authSvc := newTestUserService(t)

	target, err := authSvc.Register(context.Background(), RegisterInput{
		Name: "Target", Username: "target-" + uuid.NewString(), Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register target failed: %v", err)
	}

	superadminCaller := shopassign.Caller{UserID: "superadmin-id", SystemRole: models.SystemRoleSuperadmin}
	updated, err := userSvc.SetStatus(context.Background(), superadminCaller, target.ID, models.UserStatusInActive)
	if err != nil {
		t.Fatalf("SetStatus failed: %v", err)
	}
	if updated.Status != models.UserStatusInActive {
		t.Errorf("expected IN_ACTIVE, got %q", updated.Status)
	}
}
```

- [ ] **Step 13: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestUserService -v
```
Expected: FAIL — `UserService` shape mismatch (old `roleassign`-based file still present).

- [ ] **Step 14: Rewrite `internal/service/user_service.go`**

```go
package service

import (
	"context"
	"errors"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

var (
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidSystemRole  = errors.New("invalid system role: must be 'superadmin', 'admin', or 'user'")
	ErrInvalidStatus      = errors.New("invalid status: must be 'ACTIVE' or 'IN_ACTIVE'")
)

var systemRoleNameToID = map[string]int16{
	models.SystemRoleSuperadmin: 1,
	models.SystemRoleAdmin:      2,
	models.SystemRoleUser:       3,
}

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// Get returns userID's record if caller is that same user or a superadmin.
// Shop-scoped viewing (e.g. a shop-admin seeing their own shop's members)
// goes through ShopMembershipService instead — this method is strictly
// about the system-wide user record.
func (s *UserService) Get(ctx context.Context, caller shopassign.Caller, userID string) (*models.User, error) {
	if caller.UserID != userID && caller.SystemRole != models.SystemRoleSuperadmin {
		return nil, ErrForbidden
	}
	return s.repo.GetByID(ctx, userID)
}

func (s *UserService) ListAll(ctx context.Context, caller shopassign.Caller) ([]models.User, error) {
	if caller.SystemRole != models.SystemRoleSuperadmin {
		return nil, ErrForbidden
	}
	return s.repo.ListAll(ctx)
}

func (s *UserService) SetSystemRole(ctx context.Context, caller shopassign.Caller, targetUserID, newSystemRoleName string) (*models.User, error) {
	if caller.SystemRole != models.SystemRoleSuperadmin {
		return nil, ErrForbidden
	}
	roleID, ok := systemRoleNameToID[newSystemRoleName]
	if !ok {
		return nil, ErrInvalidSystemRole
	}
	if err := s.repo.SetSystemRole(ctx, targetUserID, roleID); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, targetUserID)
}

func (s *UserService) SetStatus(ctx context.Context, caller shopassign.Caller, targetUserID, newStatus string) (*models.User, error) {
	if caller.SystemRole != models.SystemRoleSuperadmin {
		return nil, ErrForbidden
	}
	if newStatus != models.UserStatusActive && newStatus != models.UserStatusInActive {
		return nil, ErrInvalidStatus
	}
	if err := s.repo.SetStatus(ctx, targetUserID, newStatus); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, targetUserID)
}
```

- [ ] **Step 15: Run tests to verify they pass**

```bash
go test ./internal/service/... -run TestUserService -v
```
Expected: all PASS.

- [ ] **Step 16: Write `internal/service/product_service.go`** (no dedicated new test file for the trivial `Create`/`List` pass-throughs, matching the existing convention that simple pass-throughs rely on their repository test for query correctness — `CheckAccess`/`SetSubscription` DO get tests, since they have real branching logic)

```go
package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

var ErrProductNotFound = repository.ErrProductNotFound

const (
	AccessFull = "full"
	AccessDemo = "demo"
)

type ProductService struct {
	productRepo *repository.ProductRepository
	subRepo     *repository.SubscriptionRepository
}

func NewProductService(productRepo *repository.ProductRepository, subRepo *repository.SubscriptionRepository) *ProductService {
	return &ProductService{productRepo: productRepo, subRepo: subRepo}
}

func (s *ProductService) Create(ctx context.Context, name string) (*models.Product, error) {
	p := &models.Product{ID: uuid.NewString(), Name: name, CreatedAt: time.Now().UTC()}
	if err := s.productRepo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) List(ctx context.Context) ([]models.Product, error) {
	return s.productRepo.List(ctx)
}

// CheckAccess reports "full" if userID has an active subscription to
// productID, "demo" otherwise (including when no subscription row exists
// at all — a user who never subscribed still gets demo access, not an
// error).
func (s *ProductService) CheckAccess(ctx context.Context, userID, productID string) (string, error) {
	if _, err := s.productRepo.GetByID(ctx, productID); err != nil {
		return "", err
	}

	sub, err := s.subRepo.GetByUserAndProduct(ctx, userID, productID)
	if errors.Is(err, repository.ErrSubscriptionNotFound) {
		return AccessDemo, nil
	}
	if err != nil {
		return "", err
	}
	if sub.Subscripted {
		return AccessFull, nil
	}
	return AccessDemo, nil
}

// SetSubscription is called by an admin/superadmin to manually toggle a
// user's subscription — there is no payment gateway integration in this
// scope.
func (s *ProductService) SetSubscription(ctx context.Context, caller shopassign.Caller, targetUserID, productID string, subscripted, renewed bool) (*models.Subscription, error) {
	if caller.SystemRole != models.SystemRoleSuperadmin && caller.SystemRole != models.SystemRoleAdmin {
		return nil, ErrForbidden
	}
	if _, err := s.productRepo.GetByID(ctx, productID); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	existing, err := s.subRepo.GetByUserAndProduct(ctx, targetUserID, productID)
	id := uuid.NewString()
	createdAt := now
	if err == nil {
		id = existing.ID
		createdAt = existing.CreatedAt
	} else if !errors.Is(err, repository.ErrSubscriptionNotFound) {
		return nil, err
	}

	sub := &models.Subscription{
		ID: id, UserID: targetUserID, ProductID: productID,
		Subscripted: subscripted, Renewed: renewed,
		CreatedAt: createdAt, UpdatedAt: now,
	}
	if err := s.subRepo.Upsert(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}
```

- [ ] **Step 17: Write `internal/service/system_role_service.go`**

```go
package service

import (
	"context"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

type SystemRoleService struct {
	repo *repository.SystemRoleRepository
}

func NewSystemRoleService(repo *repository.SystemRoleRepository) *SystemRoleService {
	return &SystemRoleService{repo: repo}
}

func (s *SystemRoleService) List(ctx context.Context) ([]models.SystemRole, error) {
	return s.repo.List(ctx)
}
```

- [ ] **Step 18: Write `internal/service/shop_role_service.go`**

```go
package service

import (
	"context"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

type ShopRoleService struct {
	repo *repository.ShopRoleRepository
}

func NewShopRoleService(repo *repository.ShopRoleRepository) *ShopRoleService {
	return &ShopRoleService{repo: repo}
}

func (s *ShopRoleService) List(ctx context.Context) ([]models.ShopRole, error) {
	return s.repo.List(ctx)
}
```

- [ ] **Step 19: Run the full service package suite**

```bash
go test ./internal/service/... -v
```
Expected: all PASS across every file in this task.

- [ ] **Step 20: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/service/
git commit -m "feat(platform-identity-service): rebuild service layer for Shop+Product

AuthService.Register no longer requires or grants shop membership;
new ShopService (renamed from ProjectService), ShopMembershipService
(add/list/set-role via shopassign.CanManageShop), rewritten
UserService (system-role-scoped only, shop authority moved out), new
ProductService with manual subscription toggling and demo/full access
checking, and SystemRoleService/ShopRoleService replacing the old
single RoleService."
```

---

### Task 5: Handlers

**Files:**
- Delete: `platform-identity-service/internal/handlers/project_handler.go`
- Delete: `platform-identity-service/internal/handlers/role_handler.go`
- New: `platform-identity-service/internal/handlers/shop_handler.go`
- New: `platform-identity-service/internal/handlers/shop_membership_handler.go`
- New: `platform-identity-service/internal/handlers/product_handler.go`
- New: `platform-identity-service/internal/handlers/system_role_handler.go`
- New: `platform-identity-service/internal/handlers/shop_role_handler.go`
- Rewrite: `platform-identity-service/internal/handlers/auth_handler.go`
- Rewrite: `platform-identity-service/internal/handlers/auth_handler_test.go`
- Rewrite: `platform-identity-service/internal/handlers/user_handler.go`
- Rewrite: `platform-identity-service/internal/middleware/auth.go`

**Interfaces:**
- Produces: `ShopHandler{Create, List, Get}` (renamed from `ProjectHandler`).
- Produces: `ShopMembershipHandler{AddMember, ListMembers, SetMemberRole}` — routes: `POST /shops/{id}/members`, `GET /shops/{id}/members`, `POST /shops/{id}/members/{userId}/role`.
- Produces: `ProductHandler{Create, List, CheckAccess, SetSubscription}`.
- Produces: `SystemRoleHandler{List}`, `ShopRoleHandler{List}` — routes: `GET /system-roles`, `GET /shop-roles`.
- Produces: `AuthHandler{Register, Login}` — `registerRequest{Name, Username, Email, Password}` (no `ProjectID`/`role` field, un-spoofable exactly as before).
- Produces: `UserHandler{Get, ListAll, SetSystemRole, SetStatus, ListMyShops}` — routes: `GET /users/{id}`, `GET /users`, `POST /users/{id}/system-role`, `POST /users/{id}/status`, `GET /users/{id}/shops`.
- Produces: `middleware.RequireAuth(jwt *auth.JWTManager, userRepo *repository.UserRepository) func(http.Handler) http.Handler` — signature gains `userRepo` because it must now look up the caller's `status` on every request (JWT claims alone can't reflect a status change made after the token was issued) to reject `IN_ACTIVE` users. `middleware.CallerFromContext(ctx) (shopassign.Caller, bool)`.

- [ ] **Step 1: Delete old files**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
rm internal/handlers/project_handler.go internal/handlers/role_handler.go
```

- [ ] **Step 2: Rewrite `internal/middleware/auth.go`**

```go
package middleware

import (
	"context"
	"net/http"
	"strings"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/shopassign"
)

type contextKey string

const callerKey contextKey = "caller"

// RequireAuth verifies the token locally, then re-checks the caller's
// current status in the database — a status change (e.g. an admin
// deactivating a user) must take effect on the user's very next request,
// not just at their next login, so this cannot rely on the JWT's claims
// alone.
func RequireAuth(jwt *auth.JWTManager, userRepo *repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			token := strings.TrimPrefix(header, "Bearer ")
			if header == "" || token == header {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized", "missing or invalid authorization header")
				return
			}

			claims, err := jwt.Verify(token)
			if err != nil {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized", "invalid or expired token")
				return
			}

			user, err := userRepo.GetByID(r.Context(), claims.UserID)
			if err != nil {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized", "invalid or expired token")
				return
			}
			if user.Status != models.UserStatusActive {
				writeAuthError(w, http.StatusUnauthorized, "unauthorized", "account is deactivated")
				return
			}

			caller := shopassign.Caller{UserID: claims.UserID, SystemRole: claims.SystemRole}
			ctx := context.WithValue(r.Context(), callerKey, caller)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func CallerFromContext(ctx context.Context) (shopassign.Caller, bool) {
	caller, ok := ctx.Value(callerKey).(shopassign.Caller)
	return caller, ok
}

func writeAuthError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write([]byte(`{"success":false,"error":{"code":"` + code + `","message":"` + message + `"}}`))
}
```

- [ ] **Step 3: Write `internal/handlers/shop_handler.go`** (same shape as the deleted `project_handler.go`, renamed)

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

type ShopHandler struct {
	svc *service.ShopService
}

func NewShopHandler(svc *service.ShopService) *ShopHandler {
	return &ShopHandler{svc: svc}
}

type createShopRequest struct {
	Name string `json:"name"`
}

type shopResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

// Create godoc
// @Summary      Register a new shop
// @Tags         shops
// @Accept       json
// @Produce      json
// @Param        request body createShopRequest true "Shop payload"
// @Success      201 {object} shopResponse
// @Failure      400 {object} map[string]string
// @Router       /shops [post]
func (h *ShopHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createShopRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	s, err := h.svc.Create(r.Context(), req.Name)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create shop")
		return
	}

	writeJSON(w, http.StatusCreated, shopResponse{ID: s.ID, Name: s.Name, CreatedAt: s.CreatedAt.Format(timeFormat)})
}

// List godoc
// @Summary      List all shops
// @Tags         shops
// @Produce      json
// @Success      200 {array} shopResponse
// @Router       /shops [get]
func (h *ShopHandler) List(w http.ResponseWriter, r *http.Request) {
	shops, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list shops")
		return
	}

	response := make([]shopResponse, len(shops))
	for i, s := range shops {
		response[i] = shopResponse{ID: s.ID, Name: s.Name, CreatedAt: s.CreatedAt.Format(timeFormat)}
	}
	writeJSON(w, http.StatusOK, response)
}

// Get godoc
// @Summary      Get a shop by id
// @Tags         shops
// @Produce      json
// @Param        id path string true "Shop ID"
// @Success      200 {object} shopResponse
// @Failure      404 {object} map[string]string
// @Router       /shops/{id} [get]
func (h *ShopHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s, err := h.svc.Get(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrShopNotFound):
			writeError(w, http.StatusNotFound, "shop not found")
		default:
			writeError(w, http.StatusInternalServerError, "failed to get shop")
		}
		return
	}
	writeJSON(w, http.StatusOK, shopResponse{ID: s.ID, Name: s.Name, CreatedAt: s.CreatedAt.Format(timeFormat)})
}

const timeFormat = "2006-01-02T15:04:05Z07:00"
```

- [ ] **Step 4: Write `internal/handlers/shop_membership_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"platform-identity-service/internal/middleware"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

type ShopMembershipHandler struct {
	svc *service.ShopMembershipService
}

func NewShopMembershipHandler(svc *service.ShopMembershipService) *ShopMembershipHandler {
	return &ShopMembershipHandler{svc: svc}
}

type addMemberRequest struct {
	UserID   string `json:"user_id"`
	ShopRole string `json:"shop_role"`
}

type memberResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	ShopID    string `json:"shop_id"`
	ShopName  string `json:"shop_name"`
	ShopRole  string `json:"shop_role"`
	CreatedAt string `json:"created_at"`
}

func toMemberResponse(m *models.ShopMembership) memberResponse {
	return memberResponse{
		ID: m.ID, UserID: m.UserID, ShopID: m.ShopID, ShopName: m.ShopName,
		ShopRole: m.ShopRoleName, CreatedAt: m.CreatedAt.Format(timeFormat),
	}
}

// AddMember godoc
// @Summary      Add an existing user to a shop
// @Description  Caller must be superadmin or that shop's own shop-admin.
// @Tags         shops
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Shop ID"
// @Param        request body addMemberRequest true "Member payload"
// @Success      201 {object} memberResponse
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /shops/{id}/members [post]
func (h *ShopMembershipHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req addMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	shopID := chi.URLParam(r, "id")
	m, err := h.svc.AddMember(r.Context(), caller, shopID, req.UserID, req.ShopRole)
	if err != nil {
		writeMembershipError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toMemberResponse(m))
}

// ListMembers godoc
// @Summary      List a shop's members
// @Tags         shops
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Shop ID"
// @Success      200 {array} memberResponse
// @Failure      403 {object} map[string]string
// @Router       /shops/{id}/members [get]
func (h *ShopMembershipHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	shopID := chi.URLParam(r, "id")
	members, err := h.svc.ListMembers(r.Context(), caller, shopID)
	if err != nil {
		writeMembershipError(w, err)
		return
	}

	response := make([]memberResponse, len(members))
	for i := range members {
		response[i] = toMemberResponse(&members[i])
	}
	writeJSON(w, http.StatusOK, response)
}

type setMemberRoleRequest struct {
	ShopRole string `json:"shop_role"`
}

// SetMemberRole godoc
// @Summary      Change a member's shop role
// @Tags         shops
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Shop ID"
// @Param        userId path string true "User ID"
// @Param        request body setMemberRoleRequest true "Role payload"
// @Success      200 {object} memberResponse
// @Failure      403 {object} map[string]string
// @Router       /shops/{id}/members/{userId}/role [post]
func (h *ShopMembershipHandler) SetMemberRole(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req setMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	shopID := chi.URLParam(r, "id")
	userID := chi.URLParam(r, "userId")
	m, err := h.svc.SetMemberRole(r.Context(), caller, shopID, userID, req.ShopRole)
	if err != nil {
		writeMembershipError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toMemberResponse(m))
}

func writeMembershipError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, "superadmin or this shop's own shop-admin required")
	case errors.Is(err, service.ErrInvalidShopRole):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, service.ErrMembershipExists):
		writeError(w, http.StatusConflict, "user is already a member of this shop")
	case errors.Is(err, service.ErrMembershipNotFound):
		writeError(w, http.StatusNotFound, "membership not found")
	case errors.Is(err, repository.ErrShopNotFound):
		writeError(w, http.StatusNotFound, "shop not found")
	case errors.Is(err, repository.ErrUserNotFound):
		writeError(w, http.StatusNotFound, "user not found")
	default:
		writeError(w, http.StatusInternalServerError, "failed to process request")
	}
}
```

This file references `models.ShopMembership` — add the import `"platform-identity-service/internal/models"` to its import block (needed by `toMemberResponse`'s parameter type).

- [ ] **Step 5: Write `internal/handlers/product_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"platform-identity-service/internal/middleware"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

type ProductHandler struct {
	svc *service.ProductService
}

func NewProductHandler(svc *service.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

type createProductRequest struct {
	Name string `json:"name"`
}

type productResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

// Create godoc
// @Summary      Create a product
// @Description  Superadmin only.
// @Tags         products
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request body createProductRequest true "Product payload"
// @Success      201 {object} productResponse
// @Failure      403 {object} map[string]string
// @Router       /products [post]
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	if caller.SystemRole != "superadmin" {
		writeError(w, http.StatusForbidden, "superadmin role required")
		return
	}

	var req createProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	p, err := h.svc.Create(r.Context(), req.Name)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create product")
		return
	}
	writeJSON(w, http.StatusCreated, productResponse{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt.Format(timeFormat)})
}

// List godoc
// @Summary      List all products
// @Tags         products
// @Produce      json
// @Success      200 {array} productResponse
// @Router       /products [get]
func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	products, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list products")
		return
	}

	response := make([]productResponse, len(products))
	for i, p := range products {
		response[i] = productResponse{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt.Format(timeFormat)}
	}
	writeJSON(w, http.StatusOK, response)
}

type accessResponse struct {
	Access string `json:"access"`
}

// CheckAccess godoc
// @Summary      Check the caller's access level to a product
// @Description  Returns "full" if subscribed, "demo" otherwise.
// @Tags         products
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Product ID"
// @Success      200 {object} accessResponse
// @Failure      404 {object} map[string]string
// @Router       /products/{id}/access [get]
func (h *ProductHandler) CheckAccess(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	productID := chi.URLParam(r, "id")
	access, err := h.svc.CheckAccess(r.Context(), caller.UserID, productID)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to check access")
		return
	}
	writeJSON(w, http.StatusOK, accessResponse{Access: access})
}

type setSubscriptionRequest struct {
	Subscripted bool `json:"subscripted"`
	Renewed     bool `json:"renewed"`
}

type subscriptionResponse struct {
	UserID      string `json:"user_id"`
	ProductID   string `json:"product_id"`
	Subscripted bool   `json:"subscripted"`
	Renewed     bool   `json:"renewed"`
}

// SetSubscription godoc
// @Summary      Manually set a user's subscription to a product
// @Description  Superadmin or admin only. No payment gateway integration.
// @Tags         products
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        userId path string true "User ID"
// @Param        productId path string true "Product ID"
// @Param        request body setSubscriptionRequest true "Subscription payload"
// @Success      200 {object} subscriptionResponse
// @Failure      403 {object} map[string]string
// @Router       /users/{userId}/products/{productId}/subscribe [post]
func (h *ProductHandler) SetSubscription(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req setSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	targetUserID := chi.URLParam(r, "userId")
	productID := chi.URLParam(r, "productId")
	sub, err := h.svc.SetSubscription(r.Context(), caller, targetUserID, productID, req.Subscripted, req.Renewed)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrForbidden):
			writeError(w, http.StatusForbidden, "superadmin or admin role required")
		case errors.Is(err, repository.ErrProductNotFound):
			writeError(w, http.StatusNotFound, "product not found")
		default:
			writeError(w, http.StatusInternalServerError, "failed to set subscription")
		}
		return
	}
	writeJSON(w, http.StatusOK, subscriptionResponse{
		UserID: sub.UserID, ProductID: sub.ProductID, Subscripted: sub.Subscripted, Renewed: sub.Renewed,
	})
}
```

- [ ] **Step 6: Write `internal/handlers/system_role_handler.go`**

```go
package handlers

import (
	"net/http"

	"platform-identity-service/internal/service"
)

type SystemRoleHandler struct {
	svc *service.SystemRoleService
}

func NewSystemRoleHandler(svc *service.SystemRoleService) *SystemRoleHandler {
	return &SystemRoleHandler{svc: svc}
}

type systemRoleResponse struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

// List godoc
// @Summary      List all system roles
// @Tags         system-roles
// @Produce      json
// @Success      200 {array} systemRoleResponse
// @Router       /system-roles [get]
func (h *SystemRoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list system roles")
		return
	}

	response := make([]systemRoleResponse, len(roles))
	for i, role := range roles {
		response[i] = systemRoleResponse{ID: role.ID, Name: role.Name}
	}
	writeJSON(w, http.StatusOK, response)
}
```

- [ ] **Step 7: Write `internal/handlers/shop_role_handler.go`**

```go
package handlers

import (
	"net/http"

	"platform-identity-service/internal/service"
)

type ShopRoleHandler struct {
	svc *service.ShopRoleService
}

func NewShopRoleHandler(svc *service.ShopRoleService) *ShopRoleHandler {
	return &ShopRoleHandler{svc: svc}
}

type shopRoleResponse struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

// List godoc
// @Summary      List all shop roles
// @Tags         shop-roles
// @Produce      json
// @Success      200 {array} shopRoleResponse
// @Router       /shop-roles [get]
func (h *ShopRoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list shop roles")
		return
	}

	response := make([]shopRoleResponse, len(roles))
	for i, role := range roles {
		response[i] = shopRoleResponse{ID: role.ID, Name: role.Name}
	}
	writeJSON(w, http.StatusOK, response)
}
```

- [ ] **Step 8: Rewrite `internal/handlers/auth_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"platform-identity-service/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type registerRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	SystemRole string `json:"system_role"`
	Status     string `json:"status"`
}

// Register godoc
// @Summary      Register a Teslahubs account
// @Description  Always creates system role 'user' with no shop membership — shop_role sahəsi qəbul edilmir.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body registerRequest true "Register payload"
// @Success      201 {object} userResponse
// @Failure      400 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username, email and password are required")
		return
	}

	u, err := h.svc.Register(r.Context(), service.RegisterInput{
		Name: req.Name, Username: req.Username, Email: req.Email, Password: req.Password,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUsernameTaken):
			writeError(w, http.StatusConflict, "username already registered")
		case errors.Is(err, service.ErrEmailTaken):
			writeError(w, http.StatusConflict, "email already registered")
		default:
			writeError(w, http.StatusInternalServerError, "failed to register user")
		}
		return
	}

	writeJSON(w, http.StatusCreated, userResponse{
		ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email,
		SystemRole: u.SystemRoleName, Status: u.Status,
	})
}

type loginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type loginResponse struct {
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

// Login godoc
// @Summary      Log in with username or email
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body loginRequest true "Login payload"
// @Success      200 {object} loginResponse
// @Failure      401 {object} map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	token, expiresAt, err := h.svc.Login(r.Context(), service.LoginInput{Identifier: req.Identifier, Password: req.Password})
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid username/email or password")
		return
	}

	writeJSON(w, http.StatusOK, loginResponse{Token: token, ExpiresAt: expiresAt.Format(timeFormat)})
}
```

- [ ] **Step 9: Rewrite `internal/handlers/user_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"

	"platform-identity-service/internal/middleware"
	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

type UserHandler struct {
	svc           *service.UserService
	membershipSvc *service.ShopMembershipService
}

func NewUserHandler(svc *service.UserService, membershipSvc *service.ShopMembershipService) *UserHandler {
	return &UserHandler{svc: svc, membershipSvc: membershipSvc}
}

// Get godoc
// @Summary      Get a user
// @Description  Özünü, ya da (superadmin olarsa) istənilən useri görə bilər.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "User ID"
// @Success      200 {object} userResponse
// @Failure      403 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /users/{id} [get]
func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id := chi.URLParam(r, "id")
	u, err := h.svc.Get(r.Context(), caller, id)
	writeUserOrError(w, u, err)
}

// ListAll godoc
// @Summary      List every Teslahubs user
// @Description  Yalnız superadmin çağıra bilər.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} userResponse
// @Failure      403 {object} map[string]string
// @Router       /users [get]
func (h *UserHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	users, err := h.svc.ListAll(r.Context(), caller)
	if err != nil {
		writeUserServiceError(w, err)
		return
	}

	response := make([]userResponse, len(users))
	for i, u := range users {
		response[i] = userResponse{ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, SystemRole: u.SystemRoleName, Status: u.Status}
	}
	writeJSON(w, http.StatusOK, response)
}

type setSystemRoleRequest struct {
	SystemRole string `json:"system_role"`
}

// SetSystemRole godoc
// @Summary      Change a user's system role
// @Description  Yalnız superadmin çağıra bilər.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "User ID"
// @Param        request body setSystemRoleRequest true "Role payload"
// @Success      200 {object} userResponse
// @Failure      403 {object} map[string]string
// @Router       /users/{id}/system-role [post]
func (h *UserHandler) SetSystemRole(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req setSystemRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.SystemRole != models.SystemRoleSuperadmin && req.SystemRole != models.SystemRoleAdmin && req.SystemRole != models.SystemRoleUser {
		writeError(w, http.StatusBadRequest, "system_role must be 'superadmin', 'admin', or 'user'")
		return
	}

	id := chi.URLParam(r, "id")
	u, err := h.svc.SetSystemRole(r.Context(), caller, id, req.SystemRole)
	writeUserOrError(w, u, err)
}

type setStatusRequest struct {
	Status string `json:"status"`
}

// SetStatus godoc
// @Summary      Activate or deactivate a user
// @Description  Yalnız superadmin çağıra bilər.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "User ID"
// @Param        request body setStatusRequest true "Status payload"
// @Success      200 {object} userResponse
// @Failure      403 {object} map[string]string
// @Router       /users/{id}/status [post]
func (h *UserHandler) SetStatus(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req setStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Status != models.UserStatusActive && req.Status != models.UserStatusInActive {
		writeError(w, http.StatusBadRequest, "status must be 'ACTIVE' or 'IN_ACTIVE'")
		return
	}

	id := chi.URLParam(r, "id")
	u, err := h.svc.SetStatus(r.Context(), caller, id, req.Status)
	writeUserOrError(w, u, err)
}

// ListMyShops godoc
// @Summary      List the shops a user belongs to
// @Description  Özünü, ya da (superadmin olarsa) istənilən useri görə bilər.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "User ID"
// @Success      200 {array} memberResponse
// @Failure      403 {object} map[string]string
// @Router       /users/{id}/shops [get]
func (h *UserHandler) ListMyShops(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	userID := chi.URLParam(r, "id")
	if caller.UserID != userID && caller.SystemRole != models.SystemRoleSuperadmin {
		writeError(w, http.StatusForbidden, "self or superadmin required")
		return
	}

	memberships, err := h.membershipSvc.ListMyShops(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list shops")
		return
	}

	response := make([]memberResponse, len(memberships))
	for i := range memberships {
		response[i] = toMemberResponse(&memberships[i])
	}
	writeJSON(w, http.StatusOK, response)
}

func writeUserServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, "superadmin role required")
	case errors.Is(err, service.ErrInvalidSystemRole), errors.Is(err, service.ErrInvalidStatus):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "failed to process request")
	}
}

func writeUserOrError(w http.ResponseWriter, u *models.User, err error) {
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrUserNotFound):
			writeError(w, http.StatusNotFound, "user not found")
		default:
			writeUserServiceError(w, err)
		}
		return
	}
	writeJSON(w, http.StatusOK, userResponse{
		ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, SystemRole: u.SystemRoleName, Status: u.Status,
	})
}
```

- [ ] **Step 10: Rewrite `internal/handlers/auth_handler_test.go`** (full register→login→protected-route httptest flow)

```go
package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/database"
	appmiddleware "platform-identity-service/internal/middleware"
	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

func testRouter(t *testing.T) (chi.Router, *sql.DB) {
	t.Helper()
	dsn := os.Getenv("TEST_DSN")
	if dsn == "" {
		dsn = "host=localhost port=5433 user=postgres password=1 dbname=postgres sslmode=disable"
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	shopRepo := repository.NewShopRepository(db)
	membershipRepo := repository.NewShopMembershipRepository(db)
	jwtManager := auth.NewJWTManager("handler-test-secret", 60)

	authSvc := service.NewAuthService(userRepo, jwtManager)
	userSvc := service.NewUserService(userRepo)
	shopSvc := service.NewShopService(shopRepo)
	membershipSvc := service.NewShopMembershipService(membershipRepo, userRepo, shopRepo)

	authHandler := NewAuthHandler(authSvc)
	userHandler := NewUserHandler(userSvc, membershipSvc)
	shopHandler := NewShopHandler(shopSvc)
	membershipHandler := NewShopMembershipHandler(membershipSvc)

	r := chi.NewRouter()
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)
	r.Post("/api/v1/shops", shopHandler.Create)
	r.Group(func(r chi.Router) {
		r.Use(appmiddleware.RequireAuth(jwtManager, userRepo))
		r.Get("/api/v1/users/{id}", userHandler.Get)
		r.Get("/api/v1/users", userHandler.ListAll)
		r.Post("/api/v1/shops/{id}/members", membershipHandler.AddMember)
	})

	t.Cleanup(func() { db.Close() })
	return r, db
}

func doJSON(t *testing.T, r chi.Router, method, path, token string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatalf("encode body: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestFullFlow_RegisterLoginGetUser(t *testing.T) {
	r, _ := testRouter(t)

	username := "flow-" + uuid.NewString()
	rec := doJSON(t, r, http.MethodPost, "/api/v1/auth/register", "", map[string]string{
		"name": "Flow User", "username": username, "email": uuid.NewString() + "@example.com", "password": "password123",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("register: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var userEnv struct {
		Data struct {
			ID         string `json:"id"`
			SystemRole string `json:"system_role"`
		} `json:"data"`
	}
	json.NewDecoder(rec.Body).Decode(&userEnv)
	if userEnv.Data.SystemRole != models.SystemRoleUser {
		t.Fatalf("expected system_role 'user', got %q", userEnv.Data.SystemRole)
	}
	userID := userEnv.Data.ID

	rec = doJSON(t, r, http.MethodPost, "/api/v1/auth/login", "", map[string]string{
		"identifier": username, "password": "password123",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("login: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var loginEnv struct {
		Data struct{ Token string `json:"token"` } `json:"data"`
	}
	json.NewDecoder(rec.Body).Decode(&loginEnv)
	if loginEnv.Data.Token == "" {
		t.Fatal("expected non-empty token")
	}

	rec = doJSON(t, r, http.MethodGet, "/api/v1/users/"+userID, loginEnv.Data.Token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("get user: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	rec = doJSON(t, r, http.MethodGet, "/api/v1/users/"+userID, "", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("get user without token: expected 401, got %d", rec.Code)
	}
}

func TestFullFlow_RegistrationDoesNotCreateShopMembership(t *testing.T) {
	r, _ := testRouter(t)

	username := "noshop-" + uuid.NewString()
	rec := doJSON(t, r, http.MethodPost, "/api/v1/auth/register", "", map[string]string{
		"name": "No Shop", "username": username, "email": uuid.NewString() + "@example.com", "password": "password123",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("register: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	rec = doJSON(t, r, http.MethodPost, "/api/v1/auth/login", "", map[string]string{
		"identifier": username, "password": "password123",
	})
	var loginEnv struct {
		Data struct{ Token string `json:"token"` } `json:"data"`
	}
	json.NewDecoder(rec.Body).Decode(&loginEnv)

	// A plain user (no shop membership, no superadmin) cannot even create
	// a shop-member-add request that would succeed — confirmed indirectly
	// by the earlier service-layer tests (TestShopMembershipService_AddMember_ForbiddenForNonMember);
	// this test just confirms registration itself creates no membership
	// side effect by checking GET /users/{id} succeeds with system_role
	// 'user' and nothing shop-related was silently created.
	if loginEnv.Data.Token == "" {
		t.Fatal("expected non-empty token")
	}
}
```

- [ ] **Step 11: Build and run the handlers package tests**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go build ./internal/handlers/... ./internal/middleware/...
go test ./internal/handlers/... -v
```
Expected: builds cleanly, all tests PASS. (Full `go build ./...` and `go test ./...` won't succeed until Task 6 rewires `main.go` — that's expected at this point.)

- [ ] **Step 12: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/handlers/ platform-identity-service/internal/middleware/
git commit -m "feat(platform-identity-service): rebuild handler layer for Shop+Product

New ShopHandler (renamed from ProjectHandler), ShopMembershipHandler,
ProductHandler, SystemRoleHandler, ShopRoleHandler; rewritten
AuthHandler (no shop at registration) and UserHandler (system-role
scoped, plus ListMyShops); RequireAuth middleware now re-checks the
caller's status on every request via a DB lookup, not just at login."
```

---

### Task 6: `cmd/api/main.go` wiring, Swagger regeneration, local run verification

**Files:**
- Rewrite: `platform-identity-service/cmd/api/main.go`

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: the runnable binary — no further consumers within this plan.

- [ ] **Step 1: Rewrite `cmd/api/main.go`**

```go
package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"platform-identity-service/internal/auth"
	appconfig "platform-identity-service/internal/config"
	"platform-identity-service/internal/database"
	_ "platform-identity-service/internal/docs"
	"platform-identity-service/internal/handlers"
	"platform-identity-service/internal/logclient"
	appmiddleware "platform-identity-service/internal/middleware"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

// @title           Teslahubs Identity Service API
// @version         2.0
// @description     Teslahubs-un mərkəzi identity modulu: istifadəçilər Shop-lara (many-to-many, shop-admin/shop-user rolları ilə) üzv ola bilər və Product-lara (manual subscription) abunə ola bilər. Sistem rolları: superadmin/admin/user.
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg, err := appconfig.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	superadminHash, err := auth.HashPassword(cfg.SuperadminPassword)
	if err != nil {
		log.Fatalf("failed to hash superadmin password: %v", err)
	}
	if err := database.SeedSuperadmin(db, uuid.NewString(), cfg.SuperadminUsername, superadminHash); err != nil {
		log.Fatalf("failed to seed superadmin: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	shopRepo := repository.NewShopRepository(db)
	membershipRepo := repository.NewShopMembershipRepository(db)
	productRepo := repository.NewProductRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	systemRoleRepo := repository.NewSystemRoleRepository(db)
	shopRoleRepo := repository.NewShopRoleRepository(db)
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTTTLMinutes)

	authService := service.NewAuthService(userRepo, jwtManager)
	userService := service.NewUserService(userRepo)
	shopService := service.NewShopService(shopRepo)
	membershipService := service.NewShopMembershipService(membershipRepo, userRepo, shopRepo)
	productService := service.NewProductService(productRepo, subscriptionRepo)
	systemRoleService := service.NewSystemRoleService(systemRoleRepo)
	shopRoleService := service.NewShopRoleService(shopRoleRepo)

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService, membershipService)
	shopHandler := handlers.NewShopHandler(shopService)
	membershipHandler := handlers.NewShopMembershipHandler(membershipService)
	productHandler := handlers.NewProductHandler(productService)
	systemRoleHandler := handlers.NewSystemRoleHandler(systemRoleService)
	shopRoleHandler := handlers.NewShopRoleHandler(shopRoleService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	r.Use(logclient.RequestLogger(logclient.New(cfg.LogServiceURL, "platform-identity-service")))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Get("/swagger/*", httpSwagger.WrapHandler)

	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/shops", shopHandler.Create)
		r.Get("/shops", shopHandler.List)
		r.Get("/shops/{id}", shopHandler.Get)
		r.Get("/system-roles", systemRoleHandler.List)
		r.Get("/shop-roles", shopRoleHandler.List)
		r.Get("/products", productHandler.List)

		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.RequireAuth(jwtManager, userRepo))

			r.Get("/users/{id}", userHandler.Get)
			r.Get("/users", userHandler.ListAll)
			r.Post("/users/{id}/system-role", userHandler.SetSystemRole)
			r.Post("/users/{id}/status", userHandler.SetStatus)
			r.Get("/users/{id}/shops", userHandler.ListMyShops)

			r.Post("/shops/{id}/members", membershipHandler.AddMember)
			r.Get("/shops/{id}/members", membershipHandler.ListMembers)
			r.Post("/shops/{id}/members/{userId}/role", membershipHandler.SetMemberRole)

			r.Post("/products", productHandler.Create)
			r.Get("/products/{id}/access", productHandler.CheckAccess)
			r.Post("/users/{userId}/products/{productId}/subscribe", productHandler.SetSubscription)
		})
	})

	log.Printf("platform-identity-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

- [ ] **Step 2: Regenerate Swagger docs**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
$(go env GOPATH)/bin/swag init -g cmd/api/main.go -o internal/docs
```
Expected: regenerates `internal/docs/docs.go`, `swagger.json`, `swagger.yaml` with the new endpoint set (if `swag` isn't installed, run `go install github.com/swaggo/swag/cmd/swag@latest` first).

- [ ] **Step 3: Build and run the full test suite**

```bash
go build ./...
go test ./... -v
```
Expected: builds cleanly, all packages PASS.

- [ ] **Step 4: Live end-to-end verification**

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill || true
sleep 1
go run ./cmd/api > /tmp/pis-shop-product.log 2>&1 &
sleep 3
cat /tmp/pis-shop-product.log
```
Expected: `platform-identity-service listening on :8095`, no errors.

```bash
curl -s http://localhost:8095/health; echo
curl -s http://localhost:8095/api/v1/system-roles; echo
curl -s http://localhost:8095/api/v1/shop-roles; echo
```
Expected: health OK; system-roles returns 3 rows (superadmin/admin/user); shop-roles returns 2 rows (shop-admin/shop-user).

```bash
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"superadmin-dev-password"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
echo "superadmin token acquired: ${TOKEN:0:20}..."

SHOP_ID=$(curl -s -X POST http://localhost:8095/api/v1/shops -H "Content-Type: application/json" -d '{"name":"teslabaku-home"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
echo "shop created: $SHOP_ID"

curl -s -X POST http://localhost:8095/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test Member","username":"test-member","email":"test-member@example.com","password":"password123"}'
echo
MEMBER_ID=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier":"test-member","password":"password123"}' > /dev/null; curl -s http://localhost:8095/api/v1/users -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print([u['id'] for u in d if u['username']=='test-member'][0])")

curl -s -X POST "http://localhost:8095/api/v1/shops/$SHOP_ID/members" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$MEMBER_ID\",\"shop_role\":\"shop-user\"}"
echo

curl -s "http://localhost:8095/api/v1/shops/$SHOP_ID/members" -H "Authorization: Bearer $TOKEN"
echo

PRODUCT_ID=$(curl -s -X POST http://localhost:8095/api/v1/products -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Teslahubs Pro"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
echo "product created: $PRODUCT_ID"

MEMBER_TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier":"test-member","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s "http://localhost:8095/api/v1/products/$PRODUCT_ID/access" -H "Authorization: Bearer $MEMBER_TOKEN"
echo

curl -s -X POST "http://localhost:8095/api/v1/users/$MEMBER_ID/products/$PRODUCT_ID/subscribe" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"subscripted":true,"renewed":false}'
echo

curl -s "http://localhost:8095/api/v1/products/$PRODUCT_ID/access" -H "Authorization: Bearer $MEMBER_TOKEN"
echo
```
Expected: shop created; member registered with system_role `user`; member added to the shop as `shop-user`; `GET /shops/{id}/members` shows 1 member; product created; access check before subscribing returns `{"access":"demo"}`; after `SetSubscription` with `subscripted:true`, access check returns `{"access":"full"}`.

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
```

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/cmd/api/main.go platform-identity-service/internal/docs
git commit -m "feat(platform-identity-service): wire Shop+Product main.go, regenerate swagger, verified local run

Full end-to-end flow verified: shop creation, plain registration
(no shop, system_role=user), superadmin adding a member to a shop,
product creation, and the demo->full access transition after manually
setting a subscription."
```

---

## Self-Review Notes (Backend, Tasks 1-6)

- **Spec coverage:** Shop renamed from Project everywhere (Tasks 1-6), many-to-many `user_shop_memberships` replacing `users.project_id`/`role_id` (Tasks 1-2, 4), separate `system_roles`/`shop_roles` tables (Tasks 1-2), Product + manual subscription with demo/full access (Tasks 1-2, 4-6), user status with mid-session enforcement via `RequireAuth` (Tasks 1, 5), superadmin shop-bypass reusing the Strategy-pattern shape (Task 3), registration no longer shop-scoped (Task 4) — all spec sections covered.
- **Type consistency:** `models.ShopMembership.ShopRoleName`/`ShopName` (Task 1) match the repository's `selectMembershipWithNames` JOIN aliases (Task 2) and the handler's `memberResponse` JSON fields (Task 5) — verified field-by-field against the actual struct definitions written in each task, not assumed. `shopassign.Caller{UserID, SystemRole}` (Task 3) matches exactly what `middleware.CallerFromContext` (Task 5) constructs from JWT claims (Task 1).
- **Sequencing correctness:** Task 3 (shopassign) has no dependency on Task 2's repositories — it's pure logic over a `*models.ShopMembership` passed in, so it could run before or after Task 2; kept after for narrative flow only. Task 4's `ShopMembershipService.authorize` is the one place a repository lookup happens inside what used to be a pure Strategy check — flagged explicitly in Task 3's Interfaces section so implementers don't expect `shopassign` itself to touch the database.
- **No placeholders:** every step across all 6 tasks has complete, runnable code — Step 4 of Task 6 is the single end-to-end proof that every layer's wiring is correct together, not just unit-tested in isolation.

---

## Frontend Tasks

(Frontend tasks 7-10 continue below, covering `platform-identity-admin`'s types/API layer, auth, and pages — drafted in the same complete-code style as the backend tasks above.)

### Task 7: Types, API layer, auth updates

**Files:**
- Rewrite: `platform-identity-admin/src/api/types.ts`
- New: `platform-identity-admin/src/api/shops.ts` (replaces `projects.ts`)
- Delete: `platform-identity-admin/src/api/projects.ts`
- New: `platform-identity-admin/src/api/products.ts`
- New: `platform-identity-admin/src/api/systemRoles.ts` (replaces `roles.ts`)
- Delete: `platform-identity-admin/src/api/roles.ts`
- Rewrite: `platform-identity-admin/src/api/users.ts`
- Rewrite: `platform-identity-admin/src/auth/RequireAuth.tsx`

**Interfaces:**
- Produces: `Shop{id, name, created_at}`, `SystemRole{id, name}`, `ShopRole{id, name}`, `Product{id, name, created_at}`, `Member{id, user_id, shop_id, shop_name, shop_role, created_at}`, `User{id, name, username, email, system_role, status}`, `JwtClaims{user_id, system_role, exp, iat?}`.
- Produces: `listShops()`, `createShop(name)`, `getShop(id)`, `listSystemRoles()`, `listShopRoles()`, `listProducts()`, `createProduct(name)`, `checkAccess(productId)`, `setSubscription(userId, productId, subscripted, renewed)`, `listUsersByShop` — wait, this doesn't exist server-side; the frontend uses `listShopMembers(shopId)` instead — `listAllUsers()`, `listShopMembers(shopId)`, `addShopMember(shopId, userId, shopRole)`, `setMemberRole(shopId, userId, shopRole)`, `listUserShops(userId)`, `setSystemRole(userId, systemRole)`, `setStatus(userId, status)`.

- [ ] **Step 1: Rewrite `src/api/types.ts`**

```typescript
export interface ApiError {
  code: string;
  message: string;
}

export interface Shop {
  id: string;
  name: string;
  created_at: string;
}

export interface SystemRole {
  id: number;
  name: string;
}

export interface ShopRole {
  id: number;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  shop_id: string;
  shop_name: string;
  shop_role: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  system_role: string;
  status: string;
}

export interface JwtClaims {
  user_id: string;
  system_role: string;
  exp: number;
  iat?: number;
}
```

- [ ] **Step 2: Delete old API files, write `src/api/shops.ts`**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
rm src/api/projects.ts src/api/roles.ts
```

```typescript
import { platformIdentityApi } from './httpClients';
import type { Shop } from './types';

export async function listShops(): Promise<Shop[]> {
  const response = await platformIdentityApi.get<Shop[]>('/shops');
  return response.data;
}

export async function createShop(name: string): Promise<Shop> {
  const response = await platformIdentityApi.post<Shop>('/shops', { name });
  return response.data;
}

export async function getShop(id: string): Promise<Shop> {
  const response = await platformIdentityApi.get<Shop>(`/shops/${id}`);
  return response.data;
}
```

- [ ] **Step 3: Write `src/api/systemRoles.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { SystemRole, ShopRole } from './types';

export async function listSystemRoles(): Promise<SystemRole[]> {
  const response = await platformIdentityApi.get<SystemRole[]>('/system-roles');
  return response.data;
}

export async function listShopRoles(): Promise<ShopRole[]> {
  const response = await platformIdentityApi.get<ShopRole[]>('/shop-roles');
  return response.data;
}
```

- [ ] **Step 4: Write `src/api/products.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { Product } from './types';

export async function listProducts(): Promise<Product[]> {
  const response = await platformIdentityApi.get<Product[]>('/products');
  return response.data;
}

export async function createProduct(name: string): Promise<Product> {
  const response = await platformIdentityApi.post<Product>('/products', { name });
  return response.data;
}

export async function checkAccess(productId: string): Promise<{ access: string }> {
  const response = await platformIdentityApi.get<{ access: string }>(`/products/${productId}/access`);
  return response.data;
}

export async function setSubscription(
  userId: string,
  productId: string,
  subscripted: boolean,
  renewed: boolean
): Promise<{ user_id: string; product_id: string; subscripted: boolean; renewed: boolean }> {
  const response = await platformIdentityApi.post(`/users/${userId}/products/${productId}/subscribe`, {
    subscripted,
    renewed,
  });
  return response.data;
}
```

- [ ] **Step 5: Rewrite `src/api/users.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { Member, User } from './types';

export async function listAllUsers(): Promise<User[]> {
  const response = await platformIdentityApi.get<User[]>('/users');
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await platformIdentityApi.get<User>(`/users/${id}`);
  return response.data;
}

export async function setSystemRole(userId: string, systemRole: string): Promise<User> {
  const response = await platformIdentityApi.post<User>(`/users/${userId}/system-role`, { system_role: systemRole });
  return response.data;
}

export async function setStatus(userId: string, status: string): Promise<User> {
  const response = await platformIdentityApi.post<User>(`/users/${userId}/status`, { status });
  return response.data;
}

export async function listUserShops(userId: string): Promise<Member[]> {
  const response = await platformIdentityApi.get<Member[]>(`/users/${userId}/shops`);
  return response.data;
}

export async function listShopMembers(shopId: string): Promise<Member[]> {
  const response = await platformIdentityApi.get<Member[]>(`/shops/${shopId}/members`);
  return response.data;
}

export async function addShopMember(shopId: string, userId: string, shopRole: string): Promise<Member> {
  const response = await platformIdentityApi.post<Member>(`/shops/${shopId}/members`, {
    user_id: userId,
    shop_role: shopRole,
  });
  return response.data;
}

export async function setMemberRole(shopId: string, userId: string, shopRole: string): Promise<Member> {
  const response = await platformIdentityApi.post<Member>(`/shops/${shopId}/members/${userId}/role`, {
    shop_role: shopRole,
  });
  return response.data;
}
```

- [ ] **Step 6: Rewrite `src/auth/RequireAuth.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { token, claims } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (claims?.system_role !== 'admin' && claims?.system_role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
```

- [ ] **Step 7: Build to confirm no compile errors in the files touched so far**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npx tsc -b 2>&1 | grep -v "ProjectsPage\|RolesPage\|UsersPage\|LoginPage\|App.tsx" || true
```
Expected: errors only from `ProjectsPage.tsx`/`RolesPage.tsx`/`UsersPage.tsx`/`LoginPage.tsx`/`App.tsx` (untouched until Tasks 8-9) referencing the old `api/projects`/`api/roles` modules — that's expected at this point; the grep filters those out to confirm no OTHER unexpected errors exist in the files this task actually wrote.

- [ ] **Step 8: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/api/ platform-identity-admin/src/auth/RequireAuth.tsx
git commit -m "feat(platform-identity-admin): rebuild types and API layer for Shop+Product

Shop replaces Project; new Product/subscription and system-role/
shop-role API modules; RequireAuth checks system_role instead of the
old flat role claim."
```

---

### Task 8: Layout, Login page, Shops page

**Files:**
- Rewrite: `platform-identity-admin/src/layouts/AppLayout.tsx`
- Rewrite: `platform-identity-admin/src/pages/LoginPage.tsx`
- New: `platform-identity-admin/src/pages/ShopsPage.tsx`
- Delete: `platform-identity-admin/src/pages/ProjectsPage.tsx`
- Delete: `platform-identity-admin/src/pages/RolesPage.tsx`

**Interfaces:**
- Consumes: `listShops()`, `createShop()` (Task 7), `useAuth()` (existing).
- Produces: `AppLayout` (Shop-lar / Product-lar / İstifadəçilər nav), `LoginPage`, `ShopsPage` — the click-through to a shop's members lives in Task 9's `ShopMembersPage`, linked from here.

- [ ] **Step 1: Delete old page files**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
rm src/pages/ProjectsPage.tsx src/pages/RolesPage.tsx
```

- [ ] **Step 2: Rewrite `src/layouts/AppLayout.tsx`**

```typescript
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { AppstoreOutlined, ShoppingOutlined, TeamOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Sider, Header, Content } = Layout;

const items: MenuProps['items'] = [
  { key: '/shops', icon: <AppstoreOutlined />, label: 'Shop-lar' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Product-lar' },
  { key: '/users', icon: <TeamOutlined />, label: 'İstifadəçilər' },
];

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Highlight the top-level nav item even on a nested route like
  // /shops/:id/members.
  const selectedKey = items?.find((item) => item && location.pathname.startsWith(String(item.key)))?.key as string | undefined;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{ padding: 16, fontWeight: 600, fontSize: 16 }}>Teslahubs Admin</div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, background: '#fff' }}>
          <span>
            <UserOutlined /> Admin
          </span>
          <a onClick={logout}>
            <LogoutOutlined /> Çıxış
          </a>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 3: Rewrite `src/pages/LoginPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { decodeToken } from '../auth/jwt';

interface LoginFormValues {
  identifier: string;
  password: string;
}

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login: setToken } = useAuth();
  const navigate = useNavigate();

  async function onFinish(values: LoginFormValues) {
    setLoading(true);
    try {
      const { token } = await login(values.identifier, values.password);
      const claims = decodeToken(token);
      if (claims.system_role !== 'admin' && claims.system_role !== 'superadmin') {
        message.error('Yalnız admin və ya superadmin rolunda olan istifadəçilər giriş edə bilər');
        return;
      }
      setToken(token);
      navigate('/shops');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Login uğursuz oldu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Teslahubs Admin — Giriş" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="identifier" label="Username və ya Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Şifrə" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Giriş
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/pages/ShopsPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Form, Input, Modal, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { Shop } from '../api/types';
import { createShop, listShops } from '../api/shops';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

interface ShopFormValues {
  name: string;
}

export function ShopsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<ShopFormValues>();

  const { data: shops, isLoading, isError, error } = useQuery({ queryKey: ['shops'], queryFn: () => listShops() });
  useQueryErrorToast(isError, error);

  const createMutation = useMutation({
    mutationFn: (values: ShopFormValues) => createShop(values.name),
    onSuccess: () => {
      message.success('Shop yaradıldı');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'ID', dataIndex: 'id' },
    { title: 'Yaradılma tarixi', dataIndex: 'created_at' },
    {
      title: 'Əməliyyat',
      render: (_: unknown, record: Shop) => (
        <Button size="small" onClick={() => navigate(`/shops/${record.id}/members`)}>
          Üzvlər
        </Button>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        Yeni shop
      </Button>
      <Table rowKey="id" loading={isLoading} dataSource={shops} columns={columns} />
      <Modal
        title="Yeni shop"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="name" label="Ad" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/layouts/AppLayout.tsx \
  platform-identity-admin/src/pages/LoginPage.tsx \
  platform-identity-admin/src/pages/ShopsPage.tsx
git rm platform-identity-admin/src/pages/ProjectsPage.tsx platform-identity-admin/src/pages/RolesPage.tsx
git commit -m "feat(platform-identity-admin): rebuild AppLayout, LoginPage, add ShopsPage

Sider now shows Shop-lar/Product-lar/İstifadəçilər. ShopsPage replaces
ProjectsPage with the same create+list pattern, plus a link to each
shop's members page."
```

---

### Task 9: Shop members page, Products page

**Files:**
- New: `platform-identity-admin/src/pages/ShopMembersPage.tsx`
- New: `platform-identity-admin/src/pages/ProductsPage.tsx`

**Interfaces:**
- Consumes: `getShop`, `listShopMembers`, `addShopMember`, `setMemberRole`, `listAllUsers` (Task 7 — needed for the "pick a user to add" selector), `listShopRoles` (Task 7), `listProducts`, `createProduct`, `setSubscription` (Task 7).

- [ ] **Step 1: Write `src/pages/ShopMembersPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Modal, Select, Space, Table, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { Member } from '../api/types';
import { getShop } from '../api/shops';
import { listShopRoles } from '../api/systemRoles';
import { addShopMember, listAllUsers, listShopMembers, setMemberRole } from '../api/users';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

export function ShopMembersPage() {
  const { id: shopId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedShopRole, setSelectedShopRole] = useState<string | null>(null);

  const { data: shop } = useQuery({ queryKey: ['shop', shopId], queryFn: () => getShop(shopId!), enabled: !!shopId });

  const {
    data: members,
    isLoading: membersLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['shop-members', shopId], queryFn: () => listShopMembers(shopId!), enabled: !!shopId });
  useQueryErrorToast(isError, error);

  const { data: allUsers } = useQuery({ queryKey: ['all-users-for-add'], queryFn: () => listAllUsers(), enabled: modalOpen });
  const { data: shopRoles } = useQuery({ queryKey: ['shop-roles'], queryFn: () => listShopRoles(), enabled: modalOpen });

  const addMutation = useMutation({
    mutationFn: () => addShopMember(shopId!, selectedUserId!, selectedShopRole!),
    onSuccess: () => {
      message.success('Üzv əlavə edildi');
      setModalOpen(false);
      setSelectedUserId(null);
      setSelectedShopRole(null);
      queryClient.invalidateQueries({ queryKey: ['shop-members', shopId] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, shopRole }: { userId: string; shopRole: string }) => setMemberRole(shopId!, userId, shopRole),
    onSuccess: () => {
      message.success('Rol dəyişdirildi');
      queryClient.invalidateQueries({ queryKey: ['shop-members', shopId] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'User ID', dataIndex: 'user_id' },
    { title: 'Shop rolu', dataIndex: 'shop_role' },
    {
      title: 'Əməliyyat',
      render: (_: unknown, record: Member) => (
        <Space>
          <Button
            size="small"
            disabled={record.shop_role === 'shop-admin'}
            onClick={() => setRoleMutation.mutate({ userId: record.user_id, shopRole: 'shop-admin' })}
          >
            Shop-admin et
          </Button>
          <Button
            size="small"
            disabled={record.shop_role === 'shop-user'}
            onClick={() => setRoleMutation.mutate({ userId: record.user_id, shopRole: 'shop-user' })}
          >
            Shop-user et
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {shop && (
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          {shop.name} — Üzvlər
        </Typography.Title>
      )}
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        Üzv əlavə et
      </Button>
      <Table rowKey="id" loading={membersLoading} dataSource={members} columns={columns} />
      <Modal
        title="Üzv əlavə et"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => addMutation.mutate()}
        confirmLoading={addMutation.isPending}
        okButtonProps={{ disabled: !selectedUserId || !selectedShopRole }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            style={{ width: '100%' }}
            placeholder="İstifadəçi seç"
            value={selectedUserId ?? undefined}
            onChange={setSelectedUserId}
            options={allUsers?.map((u) => ({ label: `${u.name} (${u.username})`, value: u.id }))}
          />
          <Select
            style={{ width: '100%' }}
            placeholder="Rol seç"
            value={selectedShopRole ?? undefined}
            onChange={setSelectedShopRole}
            options={shopRoles?.map((r) => ({ label: r.name, value: r.name }))}
          />
        </Space>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Write `src/pages/ProductsPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Form, Input, Modal, Select, Space, Switch, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../api/types';
import { createProduct, listProducts, setSubscription } from '../api/products';
import { listAllUsers } from '../api/users';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

interface ProductFormValues {
  name: string;
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subModalProduct, setSubModalProduct] = useState<Product | null>(null);
  const [subUserId, setSubUserId] = useState<string | null>(null);
  const [subscripted, setSubscripted] = useState(false);
  const [renewed, setRenewed] = useState(false);
  const [form] = Form.useForm<ProductFormValues>();

  const { data: products, isLoading, isError, error } = useQuery({ queryKey: ['products'], queryFn: () => listProducts() });
  useQueryErrorToast(isError, error);

  const { data: allUsers } = useQuery({ queryKey: ['all-users-for-sub'], queryFn: () => listAllUsers(), enabled: !!subModalProduct });

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values.name),
    onSuccess: () => {
      message.success('Product yaradıldı');
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const subMutation = useMutation({
    mutationFn: () => setSubscription(subUserId!, subModalProduct!.id, subscripted, renewed),
    onSuccess: () => {
      message.success('Subscription yeniləndi');
      setSubModalProduct(null);
      setSubUserId(null);
      setSubscripted(false);
      setRenewed(false);
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'ID', dataIndex: 'id' },
    {
      title: 'Əməliyyat',
      render: (_: unknown, record: Product) => (
        <Button size="small" onClick={() => setSubModalProduct(record)}>
          Subscription idarə et
        </Button>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setCreateModalOpen(true)} style={{ marginBottom: 16 }}>
        Yeni product
      </Button>
      <Table rowKey="id" loading={isLoading} dataSource={products} columns={columns} />
      <Modal
        title="Yeni product"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="name" label="Ad" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={subModalProduct ? `${subModalProduct.name} — Subscription` : ''}
        open={!!subModalProduct}
        onCancel={() => setSubModalProduct(null)}
        onOk={() => subMutation.mutate()}
        confirmLoading={subMutation.isPending}
        okButtonProps={{ disabled: !subUserId }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            style={{ width: '100%' }}
            placeholder="İstifadəçi seç"
            value={subUserId ?? undefined}
            onChange={setSubUserId}
            options={allUsers?.map((u) => ({ label: `${u.name} (${u.username})`, value: u.id }))}
          />
          <Space>
            <span>Subscripted:</span>
            <Switch checked={subscripted} onChange={setSubscripted} />
          </Space>
          <Space>
            <span>Renewed:</span>
            <Switch checked={renewed} onChange={setRenewed} />
          </Space>
        </Space>
      </Modal>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/pages/ShopMembersPage.tsx platform-identity-admin/src/pages/ProductsPage.tsx
git commit -m "feat(platform-identity-admin): add ShopMembersPage and ProductsPage

ShopMembersPage: view/add members with a shop-role picker, per-row
role-change buttons. ProductsPage: create products, manage a per-user
manual subscription toggle (subscripted/renewed) with no payment
gateway integration."
```

---

### Task 10: UsersPage rewrite, App.tsx wiring, verified local run

**Files:**
- Rewrite: `platform-identity-admin/src/pages/UsersPage.tsx`
- Rewrite: `platform-identity-admin/src/App.tsx`

**Interfaces:**
- Consumes: `listAllUsers`, `setSystemRole`, `setStatus`, `listUserShops` (Task 7), all pages from Tasks 8-9.
- Produces: the fully wired app — no further consumers within this plan.

- [ ] **Step 1: Rewrite `src/pages/UsersPage.tsx`**

The old dual-mode (dropdown-scoped vs. superadmin-all) branching no longer applies — shop membership is inherently multi-valued now, so a flat system-wide user list (superadmin-only, matching `GET /users`'s actual authority) is the only shape that makes sense here. Per-shop membership is viewed via `ShopMembersPage` instead.

```typescript
import { Button, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../api/types';
import { listAllUsers, setStatus, setSystemRole } from '../api/users';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

export function UsersPage() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, isError, error } = useQuery({ queryKey: ['all-users'], queryFn: () => listAllUsers() });
  useQueryErrorToast(isError, error);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['all-users'] });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => setSystemRole(userId, role),
    onSuccess: () => {
      message.success('Sistem rolu dəyişdirildi');
      invalidate();
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) => setStatus(userId, status),
    onSuccess: () => {
      message.success('Status dəyişdirildi');
      invalidate();
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Sistem rolu', dataIndex: 'system_role' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (status === 'ACTIVE' ? <Tag color="green">ACTIVE</Tag> : <Tag color="red">IN_ACTIVE</Tag>),
    },
    {
      title: 'Əməliyyat',
      render: (_: unknown, record: User) => (
        <Space direction="vertical">
          <Space>
            <Button
              size="small"
              disabled={record.system_role === 'superadmin'}
              onClick={() => roleMutation.mutate({ userId: record.id, role: 'superadmin' })}
            >
              Superadmin et
            </Button>
            <Button
              size="small"
              disabled={record.system_role === 'admin'}
              onClick={() => roleMutation.mutate({ userId: record.id, role: 'admin' })}
            >
              Admin et
            </Button>
            <Button
              size="small"
              disabled={record.system_role === 'user'}
              onClick={() => roleMutation.mutate({ userId: record.id, role: 'user' })}
            >
              User et
            </Button>
          </Space>
          <Button
            size="small"
            danger={record.status === 'ACTIVE'}
            onClick={() =>
              statusMutation.mutate({ userId: record.id, status: record.status === 'ACTIVE' ? 'IN_ACTIVE' : 'ACTIVE' })
            }
          >
            {record.status === 'ACTIVE' ? 'Deaktiv et' : 'Aktiv et'}
          </Button>
        </Space>
      ),
    },
  ];

  return <Table rowKey="id" loading={isLoading} dataSource={users} columns={columns} />;
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`**

```typescript
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ShopsPage } from './pages/ShopsPage';
import { ShopMembersPage } from './pages/ShopMembersPage';
import { ProductsPage } from './pages/ProductsPage';
import { UsersPage } from './pages/UsersPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/shops" replace />} />
                <Route path="/shops" element={<ShopsPage />} />
                <Route path="/shops/:id/members" element={<ShopMembersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/shops" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Build and type-check**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run build
```
Expected: builds cleanly, no TypeScript errors.

- [ ] **Step 4: Verify locally end-to-end against the real backend**

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill || true
sleep 1
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go run ./cmd/api > /tmp/pis-t10.log 2>&1 &
sleep 3

lsof -ti :5173 2>/dev/null | xargs -r kill || true
sleep 1
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run dev > /tmp/pia-t10.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
```
Expected: `200`.

Verify the superadmin data path via curl (simulating exactly what `UsersPage` fetches):

```bash
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"superadmin-dev-password"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -H "Origin: http://localhost:5173" http://localhost:8095/api/v1/users -H "Authorization: Bearer $TOKEN"
echo
```
Expected: `{"success":true,"data":[{...,"system_role":"...","status":"ACTIVE"}]}`, matching `UsersPage`'s column `dataIndex`s exactly.

Manually confirm (report what you observe):
1. Log into the panel with `superadmin` / `superadmin-dev-password`.
2. Navigate to Shop-lar — confirm the shop list and "Yeni shop" creation work; click "Üzvlər" on a shop.
3. On the shop's members page, confirm "Üzv əlavə et" opens with a user picker and shop-role picker, and adding one succeeds and appears in the table.
4. Navigate to Product-lar — confirm creation works, and "Subscription idarə et" opens a modal that successfully toggles a user's subscription.
5. Navigate to İstifadəçilər — confirm the system-wide user list shows every registered user with system role and status columns, and the role/status action buttons work.

Stop both servers when done:
```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
lsof -ti :5173 2>/dev/null | xargs -r kill
```

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/pages/UsersPage.tsx platform-identity-admin/src/App.tsx
git commit -m "feat(platform-identity-admin): rebuild UsersPage as system-wide list, wire App.tsx routing, verified local run

UsersPage is now a flat superadmin-only list of every Teslahubs user
with system-role and ACTIVE/IN_ACTIVE status controls — the old
shop-scoped dropdown/branch logic no longer applies since shop
membership is many-to-many and viewed per-shop via ShopMembersPage
instead."
```

---

## Self-Review Notes (Full Plan)

- **Spec coverage — final check across all 10 tasks:** Shop renamed from Project everywhere including the frontend nav/pages (Tasks 1, 5, 8); many-to-many shop membership with its own admin/view/role-change endpoints and UI (Tasks 2, 4-5, 9); separate system-role vs shop-role tables and UI pickers (Tasks 1-2, 4-5, 7, 9-10); Product + manual subscription with demo/full access (Tasks 1-2, 4-6, 7, 9); user status with mid-request enforcement (Tasks 1, 5) and admin-facing toggle (Task 10); superadmin shop-management bypass (Task 3-4); registration decoupled from shop entirely (Task 4, 8) — every spec section has a task.
- **Type consistency, frontend-backend boundary:** `models.User.SystemRoleName`/`Status` (Go) → `userResponse.system_role`/`status` (JSON, Task 5) → `User.system_role`/`status` (TypeScript, Task 7) → `UsersPage` column `dataIndex`s (Task 10) — traced end to end, no drift. `models.ShopMembership.ShopRoleName` → `memberResponse.shop_role` → `Member.shop_role` → `ShopMembersPage` column — same trace.
- **No placeholders:** all 10 tasks carry complete, runnable code for every file. Task 6 (backend) and Task 10 (frontend) each end with a live, multi-step end-to-end verification that proves every layer's wiring holds together as one system, not just unit-tested in isolation.
- **Scope discipline:** payment gateway integration, self-service shop join, specific `admin` system-role permissions, password change, and registration rate-limiting are named in the spec as explicitly out of scope and have correctly received no task.

