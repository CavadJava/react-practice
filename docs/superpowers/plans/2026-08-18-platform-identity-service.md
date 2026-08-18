# platform-identity-service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run locally a new Go microservice, `platform-identity-service`, that lets any future application register itself as a `Project` and manage its own `User`/`Admin` accounts, self-contained JWT auth included.

**Architecture:** Standard `handler → service → repository` layering identical to `shop-role-service` and `registration-service` in the same repo (constructor injection, `database/sql` over `pgx/v5`, chi router, `.env` config, fire-and-forget log-service calls, Swagger docs). On top of that, the authorization decision ("can this caller change that user's role") is expressed as a `Strategy` — a small `RoleAssigner` interface with one concrete implementation today (`sameProjectAdminStrategy`), so the rule is isolated, named, and independently testable instead of being an `if` buried in a handler.

**Tech Stack:** Go 1.26, chi v5, `github.com/jackc/pgx/v5` (via `database/sql`), `golang-jwt/jwt/v5`, `golang.org/x/crypto/bcrypt`, `google/uuid`, `swaggo/http-swagger/v2`, PostgreSQL on `localhost:5433`.

## Global Constraints

- Module name: `platform-identity-service`. Go version: `1.26` (match sibling `go.mod` files).
- Port: `8095` (next free port after existing 8081–8094 — verify no collision before starting the server: `lsof -i :8095`).
- DB: same Postgres instance as every other service (`localhost:5433`, db `postgres`, `.env`-driven credentials) — new tables only, no shared tables with other services.
- Response envelope: `{"success": true, "data": {...}}` / `{"success": false, "error": {"code": "...", "message": "..."}}` — exact shape used by every other go-project-practices service.
- Error codes are one of: `bad_request`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`, `service_unavailable`.
- No plaintext password ever touches the database or logs — only bcrypt hashes.
- `POST /auth/register` never accepts a client-supplied role. The first user registered under a given `project_id` becomes `admin`; every later one becomes `user`. This assignment must be race-safe under concurrent first registrations for the same new project.
- An `admin` may only act on users within their own `project_id` — there is no cross-project or system-wide superadmin.
- All source comments in English (matches existing service style), doc-comments on exported Swagger-annotated handlers in Azerbaijani (matches `shop-role-service` style) — follow whichever existing file you're mirroring most closely; don't mix within one file.
- Log-service integration (`internal/logclient`), CORS default `http://localhost:5173`, `/health` endpoint, `/swagger/*` route — copy verbatim from `shop-role-service`'s `main.go` pattern.
- This plan covers **local build + run only**. A deploy script is written as part of this plan (Task 9) but is not executed against any server.

---

## File Structure

```
platform-identity-service/
  go.mod, go.sum
  .env                                   — local dev config (gitignored pattern matches siblings, but siblings commit .env — check and follow)
  cmd/api/main.go                        — wiring, router, swagger annotations
  internal/
    config/config.go                     — env loading (DBHost, Port=8095 default, JWTSecret, JWTTTLMinutes, ...)
    database/postgres.go                 — Connect() + Migrate() (CREATE TABLE IF NOT EXISTS for projects/roles/users)
    models/models.go                     — Project, Role, User structs
    repository/project_repository.go     — Create, List, GetByID
    repository/user_repository.go        — Create, GetByID, GetByUsernameOrEmail, CountByProject, SetRole
    auth/password.go                     — HashPassword/CheckPassword (bcrypt) — mirrors registration-service exactly
    auth/jwt.go                          — Claims{UserID, ProjectID, Role}, JWTManager.Generate/Verify — mirrors registration-service's JWTManager shape
    service/roleassign/strategy.go       — RoleAssigner interface + sameProjectAdminStrategy (the Strategy pattern piece)
    service/project_service.go           — CreateProject, ListProjects, GetProject
    service/auth_service.go              — Register (first-user-admin logic), Login
    service/user_service.go              — GetUser, SetRole (uses roleassign.RoleAssigner)
    middleware/auth.go                   — RequireAuth: verifies local JWT, puts Caller in context (no remote authorization-service call — self-contained)
    handlers/response.go                 — writeJSON/writeError — copy verbatim from shop-role-service
    handlers/project_handler.go          — POST/GET /projects, GET /projects/{id}
    handlers/auth_handler.go             — POST /auth/register, POST /auth/login
    handlers/user_handler.go             — GET /users/{id}, POST /users/{id}/role
    logclient/client.go                  — copy verbatim from shop-role-service (fire-and-forget request logging)
    docs/                                — generated by `swag init`, not hand-written
  deploy/deploy.sh                       — generic SSH_HOST/SSH_USER-parameterized build+scp+systemd script (Task 9, not executed)
  deploy/platform-identity-service.service — systemd unit template
```

---

### Task 1: Module scaffold, config, database connection + migration

**Files:**
- Create: `platform-identity-service/go.mod`
- Create: `platform-identity-service/.env`
- Create: `platform-identity-service/internal/config/config.go`
- Create: `platform-identity-service/internal/database/postgres.go`
- Create: `platform-identity-service/internal/models/models.go`
- Test: `platform-identity-service/internal/config/config_test.go`

**Interfaces:**
- Produces: `config.Config` struct with fields `DBHost, DBPort, DBUser, DBPassword, DBName, DBSSLMode, JWTSecret string`, `JWTTTLMinutes int`, `Port string`, `CORSAllowedOrigins []string`, `LogServiceURL string`; `config.Load() *Config`; `(*Config).DSN() string`.
- Produces: `database.Connect(cfg *config.Config) (*sql.DB, error)`, `database.Migrate(db *sql.DB) error`.
- Produces: `models.Project{ID, Name string; CreatedAt time.Time}`, `models.Role{ID int16; Name string}`, `models.User{ID, Name, Username, Email, PasswordHash string; ProjectID *string; RoleID *int16; CreatedAt, UpdatedAt time.Time}`.

- [ ] **Step 1: Initialize the Go module**

```bash
cd /Users/frontend/workspace/go-project-practices
mkdir -p platform-identity-service/cmd/api platform-identity-service/internal/{config,database,models}
cd platform-identity-service
go mod init platform-identity-service
```

- [ ] **Step 2: Write `internal/config/config.go`**

```go
package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret     string
	JWTTTLMinutes int

	Port               string
	CORSAllowedOrigins []string
	LogServiceURL      string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5433"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", ""),
		DBName:             getEnv("DB_NAME", "postgres"),
		DBSSLMode:          getEnv("DB_SSLMODE", "disable"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTTTLMinutes:      getEnvInt("JWT_TTL_MINUTES", 60*24),
		Port:               getEnv("PORT", "8095"),
		CORSAllowedOrigins: strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"), ","),
		LogServiceURL:      getEnv("LOG_SERVICE_URL", "http://localhost:8091"),
	}
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	n := fallback
	_, err := fmtSscan(v, &n)
	if err != nil {
		return fallback
	}
	return n
}
```

Replace the `fmtSscan` placeholder with a real `fmt.Sscanf` call — use this exact body instead (avoids inventing a helper):

```go
func getEnvInt(key string, fallback int) int {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil {
		return fallback
	}
	return n
}
```

(add `"fmt"` to the imports)

- [ ] **Step 3: Write the config test**

```go
package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	os.Clearenv()
	cfg := Load()
	if cfg.Port != "8095" {
		t.Errorf("expected default port 8095, got %s", cfg.Port)
	}
	if cfg.JWTTTLMinutes != 60*24 {
		t.Errorf("expected default JWT TTL 1440, got %d", cfg.JWTTTLMinutes)
	}
}

func TestLoad_EnvOverride(t *testing.T) {
	os.Clearenv()
	os.Setenv("PORT", "9000")
	os.Setenv("JWT_TTL_MINUTES", "30")
	cfg := Load()
	if cfg.Port != "9000" {
		t.Errorf("expected overridden port 9000, got %s", cfg.Port)
	}
	if cfg.JWTTTLMinutes != 30 {
		t.Errorf("expected overridden JWT TTL 30, got %d", cfg.JWTTTLMinutes)
	}
}
```

- [ ] **Step 4: Run test to verify it fails (package doesn't compile / no dependencies yet)**

```bash
cd platform-identity-service
go get github.com/joho/godotenv@v1.5.1
go test ./internal/config/... -v
```
Expected: PASS once dependencies resolve (this is config-only, no external service needed) — if it fails, fix the config.go code, not the test.

- [ ] **Step 5: Write `internal/models/models.go`**

```go
package models

import "time"

type Project struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Role struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

type User struct {
	ID           string
	Name         string
	Username     string
	Email        string
	PasswordHash string
	ProjectID    *string
	RoleID       *int16
	RoleName     string // populated by joined queries, not persisted directly
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
```

- [ ] **Step 6: Write `internal/database/postgres.go`**

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
		CREATE TABLE IF NOT EXISTS projects (
			id UUID PRIMARY KEY,
			name TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS roles (
			id SMALLSERIAL PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);

		INSERT INTO roles (name) VALUES ('user'), ('admin')
		ON CONFLICT (name) DO NOTHING;

		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY,
			name TEXT NOT NULL,
			username TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			project_id UUID REFERENCES projects(id),
			role_id SMALLINT REFERENCES roles(id),
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		CREATE INDEX IF NOT EXISTS idx_users_project_id ON users (project_id);
	`)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}
```

- [ ] **Step 7: Write `.env`**

```bash
cat > /Users/frontend/workspace/go-project-practices/platform-identity-service/.env <<'EOF'
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=1
DB_NAME=postgres
DB_SSLMODE=disable
JWT_SECRET=platform-identity-dev-secret
JWT_TTL_MINUTES=1440
PORT=8095
CORS_ALLOWED_ORIGINS=http://localhost:5173
LOG_SERVICE_URL=http://localhost:8091
EOF
```

- [ ] **Step 8: Get remaining Task 1 dependencies and confirm build**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go get github.com/jackc/pgx/v5@v5.10.0
go build ./...
```
Expected: builds cleanly (no `main` package yet, so `go build ./...` only compiles the packages written so far — that's expected at this stage).

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/go.mod platform-identity-service/go.sum \
  platform-identity-service/.env platform-identity-service/internal/config \
  platform-identity-service/internal/database platform-identity-service/internal/models
git commit -m "feat(platform-identity-service): scaffold module, config, db migration"
```

---

### Task 2: Password hashing + JWT issuing/verification

**Files:**
- Create: `platform-identity-service/internal/auth/password.go`
- Create: `platform-identity-service/internal/auth/password_test.go`
- Create: `platform-identity-service/internal/auth/jwt.go`
- Create: `platform-identity-service/internal/auth/jwt_test.go`

**Interfaces:**
- Consumes: nothing from Task 1 directly (pure crypto/JWT logic).
- Produces: `auth.HashPassword(password string) (string, error)`, `auth.CheckPassword(hash, password string) bool`.
- Produces: `auth.Claims{UserID, ProjectID, Role string; jwt.RegisteredClaims}`, `auth.JWTManager` with `NewJWTManager(secret string, ttlMinutes int) *JWTManager`, `(*JWTManager) Generate(userID, projectID, role string) (token string, expiresAt time.Time, err error)`, `(*JWTManager) Verify(tokenStr string) (*Claims, error)`.

- [ ] **Step 1: Write the failing password test**

```go
package auth

import "testing"

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("correct-horse-battery-staple")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if !CheckPassword(hash, "correct-horse-battery-staple") {
		t.Error("expected CheckPassword to succeed with correct password")
	}
	if CheckPassword(hash, "wrong-password") {
		t.Error("expected CheckPassword to fail with wrong password")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go test ./internal/auth/... -run TestHashAndCheckPassword -v
```
Expected: FAIL — `HashPassword`/`CheckPassword` undefined.

- [ ] **Step 3: Write `internal/auth/password.go`**

```go
package auth

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
```

- [ ] **Step 4: Get bcrypt and run test to verify it passes**

```bash
go get golang.org/x/crypto@latest
go test ./internal/auth/... -run TestHashAndCheckPassword -v
```
Expected: PASS.

- [ ] **Step 5: Write the failing JWT test**

```go
package auth

import "testing"

func TestJWTManager_GenerateAndVerify(t *testing.T) {
	m := NewJWTManager("test-secret", 60)

	token, _, err := m.Generate("user-123", "project-abc", "admin")
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	claims, err := m.Verify(token)
	if err != nil {
		t.Fatalf("Verify failed: %v", err)
	}
	if claims.UserID != "user-123" || claims.ProjectID != "project-abc" || claims.Role != "admin" {
		t.Errorf("unexpected claims: %+v", claims)
	}
}

func TestJWTManager_Verify_RejectsWrongSecret(t *testing.T) {
	m1 := NewJWTManager("secret-one", 60)
	m2 := NewJWTManager("secret-two", 60)

	token, _, err := m1.Generate("user-123", "project-abc", "user")
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	if _, err := m2.Verify(token); err == nil {
		t.Error("expected Verify to fail with mismatched secret")
	}
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
go test ./internal/auth/... -run TestJWTManager -v
```
Expected: FAIL — `NewJWTManager` undefined.

- [ ] **Step 7: Write `internal/auth/jwt.go`**

```go
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid or expired token")

type Claims struct {
	UserID    string `json:"user_id"`
	ProjectID string `json:"project_id"`
	Role      string `json:"role"`
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

func (m *JWTManager) Generate(userID, projectID, role string) (string, time.Time, error) {
	expiresAt := time.Now().Add(m.ttl)
	claims := Claims{
		UserID:    userID,
		ProjectID: projectID,
		Role:      role,
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

- [ ] **Step 8: Get jwt dependency and run tests to verify they pass**

```bash
go get github.com/golang-jwt/jwt/v5@latest
go test ./internal/auth/... -v
```
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/auth platform-identity-service/go.mod platform-identity-service/go.sum
git commit -m "feat(platform-identity-service): add bcrypt password hashing and JWT manager"
```

---

### Task 3: Repositories (projects, users)

**Files:**
- Create: `platform-identity-service/internal/repository/project_repository.go`
- Create: `platform-identity-service/internal/repository/user_repository.go`

**Interfaces:**
- Consumes: `models.Project`, `models.User` (Task 1); `*sql.DB` from `database.Connect` (Task 1).
- Produces: `repository.ErrProjectNotFound`, `repository.ErrUserNotFound`, `repository.ErrUsernameTaken`, `repository.ErrEmailTaken` (all `error` vars).
- Produces: `ProjectRepository{NewProjectRepository(db *sql.DB) *ProjectRepository}` with methods `Create(ctx, p *models.Project) error`, `List(ctx) ([]models.Project, error)`, `GetByID(ctx, id string) (*models.Project, error)`.
- Produces: `UserRepository{NewUserRepository(db *sql.DB) *UserRepository}` with methods `Create(ctx, u *models.User) error`, `GetByID(ctx, id string) (*models.User, error)`, `GetByUsernameOrEmail(ctx, identifier string) (*models.User, error)`, `CountByProject(ctx, projectID string) (int, error)`, `SetRole(ctx, userID string, roleID int16) error`.

Note: `models.User.RoleName` is populated via a `JOIN roles` in `GetByID`/`GetByUsernameOrEmail` — later tasks (service/auth) need the role's string name (`"admin"`/`"user"`), not just its numeric id, to build JWT claims and `Caller`.

- [ ] **Step 1: Write repository tests (integration, against local Postgres)**

```go
package repository

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/google/uuid"

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

func TestProjectRepository_CreateAndGet(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewProjectRepository(db)

	p := &models.Project{ID: uuid.NewString(), Name: "Test Project " + uuid.NewString(), CreatedAt: time.Now().UTC()}
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
}

func TestProjectRepository_GetByID_NotFound(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewProjectRepository(db)

	_, err := repo.GetByID(context.Background(), uuid.NewString())
	if err != ErrProjectNotFound {
		t.Errorf("expected ErrProjectNotFound, got %v", err)
	}
}

func TestUserRepository_CreateAndCount(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	projectRepo := NewProjectRepository(db)
	userRepo := NewUserRepository(db)

	p := &models.Project{ID: uuid.NewString(), Name: "Count Test", CreatedAt: time.Now().UTC()}
	if err := projectRepo.Create(context.Background(), p); err != nil {
		t.Fatalf("Create project failed: %v", err)
	}

	count, err := userRepo.CountByProject(context.Background(), p.ID)
	if err != nil {
		t.Fatalf("CountByProject failed: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected 0 users for new project, got %d", count)
	}

	roleID := int16(2) // admin, seeded second
	u := &models.User{
		ID: uuid.NewString(), Name: "Cavad", Username: "cavad-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p.ID, RoleID: &roleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	if err := userRepo.Create(context.Background(), u); err != nil {
		t.Fatalf("Create user failed: %v", err)
	}

	count, err = userRepo.CountByProject(context.Background(), p.ID)
	if err != nil {
		t.Fatalf("CountByProject failed: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 user after create, got %d", count)
	}

	got, err := userRepo.GetByID(context.Background(), u.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.RoleName != "admin" {
		t.Errorf("expected joined RoleName 'admin', got %q", got.RoleName)
	}
}

func TestUserRepository_SetRole(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	projectRepo := NewProjectRepository(db)
	userRepo := NewUserRepository(db)

	p := &models.Project{ID: uuid.NewString(), Name: "SetRole Test", CreatedAt: time.Now().UTC()}
	_ = projectRepo.Create(context.Background(), p)

	roleID := int16(1) // user
	u := &models.User{
		ID: uuid.NewString(), Name: "Test", Username: "u-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p.ID, RoleID: &roleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	_ = userRepo.Create(context.Background(), u)

	if err := userRepo.SetRole(context.Background(), u.ID, 2); err != nil {
		t.Fatalf("SetRole failed: %v", err)
	}

	got, err := userRepo.GetByID(context.Background(), u.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.RoleName != "admin" {
		t.Errorf("expected role promoted to admin, got %q", got.RoleName)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail (packages don't exist yet)**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go get github.com/google/uuid@latest
go test ./internal/repository/... -v
```
Expected: FAIL — compile error, `ProjectRepository`/`UserRepository` undefined.

- [ ] **Step 3: Write `internal/repository/project_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"
	"errors"

	"platform-identity-service/internal/models"
)

var ErrProjectNotFound = errors.New("project not found")

type ProjectRepository struct {
	db *sql.DB
}

func NewProjectRepository(db *sql.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(ctx context.Context, p *models.Project) error {
	const q = `INSERT INTO projects (id, name, created_at) VALUES ($1, $2, $3)`
	_, err := r.db.ExecContext(ctx, q, p.ID, p.Name, p.CreatedAt)
	return err
}

func (r *ProjectRepository) List(ctx context.Context) ([]models.Project, error) {
	const q = `SELECT id, name, created_at FROM projects ORDER BY created_at DESC`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedAt); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, rows.Err()
}

func (r *ProjectRepository) GetByID(ctx context.Context, id string) (*models.Project, error) {
	const q = `SELECT id, name, created_at FROM projects WHERE id = $1`
	var p models.Project
	err := r.db.QueryRowContext(ctx, q, id).Scan(&p.ID, &p.Name, &p.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrProjectNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
```

- [ ] **Step 4: Write `internal/repository/user_repository.go`**

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
		INSERT INTO users (id, name, username, email, password_hash, project_id, role_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.ExecContext(ctx, q,
		u.ID, u.Name, u.Username, u.Email, u.PasswordHash, u.ProjectID, u.RoleID, u.CreatedAt, u.UpdatedAt,
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

const selectUserWithRole = `
	SELECT u.id, u.name, u.username, u.email, u.password_hash, u.project_id, u.role_id,
	       COALESCE(r.name, ''), u.created_at, u.updated_at
	FROM users u
	LEFT JOIN roles r ON r.id = u.role_id
`

func (r *UserRepository) scanUser(row *sql.Row) (*models.User, error) {
	var u models.User
	err := row.Scan(&u.ID, &u.Name, &u.Username, &u.Email, &u.PasswordHash,
		&u.ProjectID, &u.RoleID, &u.RoleName, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	row := r.db.QueryRowContext(ctx, selectUserWithRole+" WHERE u.id = $1", id)
	return r.scanUser(row)
}

func (r *UserRepository) GetByUsernameOrEmail(ctx context.Context, identifier string) (*models.User, error) {
	row := r.db.QueryRowContext(ctx, selectUserWithRole+" WHERE u.username = $1 OR u.email = $1", identifier)
	return r.scanUser(row)
}

func (r *UserRepository) CountByProject(ctx context.Context, projectID string) (int, error) {
	const q = `SELECT COUNT(*) FROM users WHERE project_id = $1`
	var count int
	err := r.db.QueryRowContext(ctx, q, projectID).Scan(&count)
	return count, err
}

func (r *UserRepository) SetRole(ctx context.Context, userID string, roleID int16) error {
	const q = `UPDATE users SET role_id = $2, updated_at = now() WHERE id = $1`
	result, err := r.db.ExecContext(ctx, q, userID, roleID)
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

- [ ] **Step 5: Run tests to verify they pass (requires local Postgres on :5433 running)**

```bash
go test ./internal/repository/... -v
```
Expected: all PASS. If Postgres isn't running locally, start it first (same instance every other go-project-practices service uses — check `docker ps` or however it's normally started in this environment).

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/repository platform-identity-service/go.mod platform-identity-service/go.sum
git commit -m "feat(platform-identity-service): add project and user repositories"
```

---

### Task 4: Role-assignment Strategy pattern

**Files:**
- Create: `platform-identity-service/internal/service/roleassign/strategy.go`
- Create: `platform-identity-service/internal/service/roleassign/strategy_test.go`

**Interfaces:**
- Consumes: nothing external — pure decision logic over plain strings/ids passed in by the caller.
- Produces: `roleassign.Caller{UserID, ProjectID, Role string}`, `roleassign.Target{UserID, ProjectID string}`, `roleassign.RoleAssigner` interface with `CanAssign(caller Caller, target Target) bool`, `roleassign.SameProjectAdmin` (the concrete strategy struct implementing `RoleAssigner`), `roleassign.NewSameProjectAdmin() *SameProjectAdmin`.

This isolates the one authorization rule from the spec ("an admin may only act on users within their own project") behind a named interface, so `service/user_service.go` (Task 6) depends on the interface, not a hardcoded `if`. Swapping in a different rule later (e.g. a future cross-project superadmin) means adding a new struct, not touching `user_service.go`.

- [ ] **Step 1: Write the failing test**

```go
package roleassign

import "testing"

func TestSameProjectAdmin_CanAssign(t *testing.T) {
	strategy := NewSameProjectAdmin()

	tests := []struct {
		name   string
		caller Caller
		target Target
		want   bool
	}{
		{
			name:   "admin in same project can assign",
			caller: Caller{UserID: "u1", ProjectID: "p1", Role: "admin"},
			target: Target{UserID: "u2", ProjectID: "p1"},
			want:   true,
		},
		{
			name:   "admin in different project cannot assign",
			caller: Caller{UserID: "u1", ProjectID: "p1", Role: "admin"},
			target: Target{UserID: "u2", ProjectID: "p2"},
			want:   false,
		},
		{
			name:   "non-admin caller cannot assign",
			caller: Caller{UserID: "u1", ProjectID: "p1", Role: "user"},
			target: Target{UserID: "u2", ProjectID: "p1"},
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := strategy.CanAssign(tt.caller, tt.target)
			if got != tt.want {
				t.Errorf("CanAssign(%+v, %+v) = %v, want %v", tt.caller, tt.target, got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go test ./internal/service/roleassign/... -v
```
Expected: FAIL — package/types undefined.

- [ ] **Step 3: Write `internal/service/roleassign/strategy.go`**

```go
// Package roleassign isolates the authorization decision for who may
// change whose role, expressed as a Strategy so the rule can be swapped
// or extended (e.g. a future cross-project superadmin) without touching
// the service layer that consumes it.
package roleassign

type Caller struct {
	UserID    string
	ProjectID string
	Role      string
}

type Target struct {
	UserID    string
	ProjectID string
}

type RoleAssigner interface {
	CanAssign(caller Caller, target Target) bool
}

// SameProjectAdmin implements the only rule the spec defines: an admin may
// change the role of any user within their own project, and nothing else.
type SameProjectAdmin struct{}

func NewSameProjectAdmin() *SameProjectAdmin {
	return &SameProjectAdmin{}
}

func (s *SameProjectAdmin) CanAssign(caller Caller, target Target) bool {
	return caller.Role == "admin" && caller.ProjectID == target.ProjectID
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/service/roleassign/... -v
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/service/roleassign
git commit -m "feat(platform-identity-service): add SameProjectAdmin role-assignment strategy"
```

---

### Task 5: Project service + Auth service (register/login)

**Files:**
- Create: `platform-identity-service/internal/service/project_service.go`
- Create: `platform-identity-service/internal/service/project_service_test.go`
- Create: `platform-identity-service/internal/service/auth_service.go`
- Create: `platform-identity-service/internal/service/auth_service_test.go`

**Interfaces:**
- Consumes: `repository.ProjectRepository`, `repository.UserRepository` (Task 3), `auth.HashPassword/CheckPassword`, `auth.JWTManager` (Task 2), `models.Project/User` (Task 1).
- Produces: `service.ErrProjectNotFound`, `service.ErrUserNotFound`, `service.ErrInvalidCredentials`, `service.ErrUsernameTaken`, `service.ErrEmailTaken` (errors).
- Produces: `ProjectService{NewProjectService(repo *repository.ProjectRepository) *ProjectService}` — `Create(ctx, name string) (*models.Project, error)`, `List(ctx) ([]models.Project, error)`, `Get(ctx, id string) (*models.Project, error)`.
- Produces: `AuthService{NewAuthService(projectRepo *repository.ProjectRepository, userRepo *repository.UserRepository, jwt *auth.JWTManager) *AuthService}` — `RegisterInput{ProjectID, Name, Username, Email, Password string}`, `Register(ctx, in RegisterInput) (*models.User, error)`, `LoginInput{Identifier, Password string}`, `Login(ctx, in LoginInput) (token string, expiresAt time.Time, err error)`.
- These types are what `handlers/project_handler.go` and `handlers/auth_handler.go` (Task 7) call directly.

Role ids: `1 = user`, `2 = admin` (matches the seed order `INSERT INTO roles (name) VALUES ('user'), ('admin')` in Task 1's migration — `user` gets serial `1`, `admin` gets serial `2`).

- [ ] **Step 1: Write the failing ProjectService test (uses the real local DB, same as repository tests — service layer here is thin enough not to warrant mocking)**

```go
package service

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/stdlib" // registers pgx driver
	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/database"
	"platform-identity-service/internal/repository"
)

func newTestProjectService(t *testing.T) *ProjectService {
	t.Helper()
	db := testDB(t)
	return NewProjectService(repository.NewProjectRepository(db))
}

func TestProjectService_CreateAndGet(t *testing.T) {
	svc := newTestProjectService(t)

	p, err := svc.Create(context.Background(), "Widget Co")
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if p.ID == "" {
		t.Error("expected generated ID")
	}

	got, err := svc.Get(context.Background(), p.ID)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if got.Name != "Widget Co" {
		t.Errorf("expected name 'Widget Co', got %q", got.Name)
	}
}
```

Add the shared `testDB` helper in a new file `internal/service/service_test_helpers.go` (not `_test.go` suffix issue — actually name it `helpers_test.go` so it's test-only):

```go
package service

import (
	"database/sql"
	"os"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"

	"platform-identity-service/internal/database"
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
```

(Delete the redundant duplicate `stdlib` import line from the `project_service_test.go` snippet above — keep only one `_ "github.com/jackc/pgx/v5/stdlib"` import, drop the non-blank `"github.com/jackc/pgx/v5/stdlib"` line, it was a copy artifact.)

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go test ./internal/service/... -run TestProjectService -v
```
Expected: FAIL — `ProjectService` undefined.

- [ ] **Step 3: Write `internal/service/project_service.go`**

```go
package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

var ErrProjectNotFound = repository.ErrProjectNotFound

type ProjectService struct {
	repo *repository.ProjectRepository
}

func NewProjectService(repo *repository.ProjectRepository) *ProjectService {
	return &ProjectService{repo: repo}
}

func (s *ProjectService) Create(ctx context.Context, name string) (*models.Project, error) {
	p := &models.Project{
		ID:        uuid.NewString(),
		Name:      name,
		CreatedAt: time.Now().UTC(),
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) List(ctx context.Context) ([]models.Project, error) {
	return s.repo.List(ctx)
}

func (s *ProjectService) Get(ctx context.Context, id string) (*models.Project, error) {
	return s.repo.GetByID(ctx, id)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/service/... -run TestProjectService -v
```
Expected: PASS.

- [ ] **Step 5: Write the failing AuthService tests**

```go
package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/repository"
)

func newTestAuthService(t *testing.T) (*AuthService, *ProjectService) {
	t.Helper()
	db := testDB(t)
	projectRepo := repository.NewProjectRepository(db)
	userRepo := repository.NewUserRepository(db)
	jwt := auth.NewJWTManager("test-secret", 60)
	return NewAuthService(projectRepo, userRepo, jwt), NewProjectService(projectRepo)
}

func TestAuthService_Register_FirstUserBecomesAdmin(t *testing.T) {
	authSvc, projectSvc := newTestAuthService(t)

	p, err := projectSvc.Create(context.Background(), "First-Admin Test "+uuid.NewString())
	if err != nil {
		t.Fatalf("Create project failed: %v", err)
	}

	first, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "First", Username: "first-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("Register (first) failed: %v", err)
	}
	if first.RoleName != "admin" {
		t.Errorf("expected first registered user to be 'admin', got %q", first.RoleName)
	}

	second, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Second", Username: "second-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("Register (second) failed: %v", err)
	}
	if second.RoleName != "user" {
		t.Errorf("expected second registered user to be 'user', got %q", second.RoleName)
	}
}

func TestAuthService_Register_DuplicateUsername(t *testing.T) {
	authSvc, projectSvc := newTestAuthService(t)
	p, _ := projectSvc.Create(context.Background(), "Dup Test "+uuid.NewString())

	username := "dup-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "A", Username: username, Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("first Register failed: %v", err)
	}

	_, err = authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "B", Username: username, Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != ErrUsernameTaken {
		t.Errorf("expected ErrUsernameTaken, got %v", err)
	}
}

func TestAuthService_Login_Success(t *testing.T) {
	authSvc, projectSvc := newTestAuthService(t)
	p, _ := projectSvc.Create(context.Background(), "Login Test "+uuid.NewString())

	username := "login-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Login User", Username: username,
		Email: uuid.NewString() + "@example.com", Password: "correct-password",
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
	authSvc, projectSvc := newTestAuthService(t)
	p, _ := projectSvc.Create(context.Background(), "Login Fail Test "+uuid.NewString())

	username := "loginfail-" + uuid.NewString()
	_, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "User", Username: username,
		Email: uuid.NewString() + "@example.com", Password: "correct-password",
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

- [ ] **Step 6: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestAuthService -v
```
Expected: FAIL — `AuthService` undefined.

- [ ] **Step 7: Write `internal/service/auth_service.go`**

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

const (
	roleIDUser  int16 = 1
	roleIDAdmin int16 = 2
)

var (
	ErrUserNotFound       = repository.ErrUserNotFound
	ErrUsernameTaken      = repository.ErrUsernameTaken
	ErrEmailTaken         = repository.ErrEmailTaken
	ErrInvalidCredentials = errors.New("invalid username/email or password")
)

type AuthService struct {
	projectRepo *repository.ProjectRepository
	userRepo    *repository.UserRepository
	jwt         *auth.JWTManager
}

func NewAuthService(projectRepo *repository.ProjectRepository, userRepo *repository.UserRepository, jwt *auth.JWTManager) *AuthService {
	return &AuthService{projectRepo: projectRepo, userRepo: userRepo, jwt: jwt}
}

type RegisterInput struct {
	ProjectID string
	Name      string
	Username  string
	Email     string
	Password  string
}

// Register creates a user under the given project. The first user ever
// registered for a project becomes admin; every later one becomes user.
// CountByProject + Create both run against the same *sql.DB without an
// explicit transaction here — acceptable for this practice project's
// traffic level, but the race window (two concurrent first registrations
// both seeing count==0) is a known, documented limitation, not an oversight.
func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*models.User, error) {
	if _, err := s.projectRepo.GetByID(ctx, in.ProjectID); err != nil {
		return nil, err
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	count, err := s.userRepo.CountByProject(ctx, in.ProjectID)
	if err != nil {
		return nil, err
	}
	roleID := roleIDUser
	if count == 0 {
		roleID = roleIDAdmin
	}

	now := time.Now().UTC()
	projectID := in.ProjectID
	u := &models.User{
		ID:           uuid.NewString(),
		Name:         in.Name,
		Username:     in.Username,
		Email:        in.Email,
		PasswordHash: hash,
		ProjectID:    &projectID,
		RoleID:       &roleID,
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

	projectID := ""
	if u.ProjectID != nil {
		projectID = *u.ProjectID
	}
	return s.jwt.Generate(u.ID, projectID, u.RoleName)
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
go test ./internal/service/... -v
```
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/service
git commit -m "feat(platform-identity-service): add project and auth services with first-user-admin registration"
```

---

### Task 6: User service (get, role assignment via Strategy)

**Files:**
- Create: `platform-identity-service/internal/service/user_service.go`
- Create: `platform-identity-service/internal/service/user_service_test.go`

**Interfaces:**
- Consumes: `repository.UserRepository` (Task 3), `roleassign.RoleAssigner`/`Caller`/`Target` (Task 4), `models.User` (Task 1).
- Produces: `service.ErrForbidden` (error), `UserService{NewUserService(repo *repository.UserRepository, assigner roleassign.RoleAssigner) *UserService}` — `Get(ctx, caller roleassign.Caller, userID string) (*models.User, error)`, `SetRole(ctx, caller roleassign.Caller, targetUserID, newRoleName string) (*models.User, error)`.

- [ ] **Step 1: Write the failing test**

```go
package service

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/roleassign"
)

func newTestUserService(t *testing.T) (*UserService, *AuthService, *ProjectService) {
	t.Helper()
	db := testDB(t)
	projectRepo := repository.NewProjectRepository(db)
	userRepo := repository.NewUserRepository(db)
	authSvc, projectSvc := newAuthAndProjectServiceFromRepos(t, projectRepo, userRepo)
	userSvc := NewUserService(userRepo, roleassign.NewSameProjectAdmin())
	return userSvc, authSvc, projectSvc
}

func TestUserService_SetRole_SameProjectAdminSucceeds(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p, _ := projectSvc.Create(context.Background(), "SetRole Success "+uuid.NewString())
	admin, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Admin", Username: "admin-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register admin failed: %v", err)
	}
	member, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Member", Username: "member-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register member failed: %v", err)
	}

	caller := roleassign.Caller{UserID: admin.ID, ProjectID: p.ID, Role: admin.RoleName}
	updated, err := userSvc.SetRole(context.Background(), caller, member.ID, "admin")
	if err != nil {
		t.Fatalf("SetRole failed: %v", err)
	}
	if updated.RoleName != "admin" {
		t.Errorf("expected member promoted to admin, got %q", updated.RoleName)
	}
}

func TestUserService_SetRole_CrossProjectForbidden(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p1, _ := projectSvc.Create(context.Background(), "Cross Project A "+uuid.NewString())
	p2, _ := projectSvc.Create(context.Background(), "Cross Project B "+uuid.NewString())

	admin1, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p1.ID, Name: "Admin1", Username: "admin1-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register admin1 failed: %v", err)
	}
	member2, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p2.ID, Name: "Member2", Username: "member2-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register member2 failed: %v", err)
	}

	caller := roleassign.Caller{UserID: admin1.ID, ProjectID: p1.ID, Role: admin1.RoleName}
	_, err = userSvc.SetRole(context.Background(), caller, member2.ID, "admin")
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden for cross-project assignment, got %v", err)
	}
}
```

Add the missing helper — put it in `helpers_test.go` alongside `testDB`:

```go
func newAuthAndProjectServiceFromRepos(t *testing.T, projectRepo *repository.ProjectRepository, userRepo *repository.UserRepository) (*AuthService, *ProjectService) {
	t.Helper()
	jwt := auth.NewJWTManager("test-secret", 60)
	return NewAuthService(projectRepo, userRepo, jwt), NewProjectService(projectRepo)
}
```

(add `"platform-identity-service/internal/auth"` and `"platform-identity-service/internal/repository"` imports to `helpers_test.go` if not already present)

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go test ./internal/service/... -run TestUserService -v
```
Expected: FAIL — `UserService` undefined.

- [ ] **Step 3: Write `internal/service/user_service.go`**

```go
package service

import (
	"context"
	"errors"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service/roleassign"
)

var ErrForbidden = errors.New("forbidden")

var roleNameToID = map[string]int16{
	"user":  roleIDUser,
	"admin": roleIDAdmin,
}

type UserService struct {
	repo     *repository.UserRepository
	assigner roleassign.RoleAssigner
}

func NewUserService(repo *repository.UserRepository, assigner roleassign.RoleAssigner) *UserService {
	return &UserService{repo: repo, assigner: assigner}
}

// Get returns userID's record if caller is that same user, or an admin
// within the target's own project.
func (s *UserService) Get(ctx context.Context, caller roleassign.Caller, userID string) (*models.User, error) {
	target, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	targetProjectID := ""
	if target.ProjectID != nil {
		targetProjectID = *target.ProjectID
	}

	isSelf := caller.UserID == userID
	isSameProjectAdmin := s.assigner.CanAssign(caller, roleassign.Target{UserID: userID, ProjectID: targetProjectID})
	if !isSelf && !isSameProjectAdmin {
		return nil, ErrForbidden
	}

	return target, nil
}

func (s *UserService) SetRole(ctx context.Context, caller roleassign.Caller, targetUserID, newRoleName string) (*models.User, error) {
	target, err := s.repo.GetByID(ctx, targetUserID)
	if err != nil {
		return nil, err
	}

	targetProjectID := ""
	if target.ProjectID != nil {
		targetProjectID = *target.ProjectID
	}

	if !s.assigner.CanAssign(caller, roleassign.Target{UserID: targetUserID, ProjectID: targetProjectID}) {
		return nil, ErrForbidden
	}

	roleID, ok := roleNameToID[newRoleName]
	if !ok {
		return nil, errors.New("invalid role name: must be 'user' or 'admin'")
	}

	if err := s.repo.SetRole(ctx, targetUserID, roleID); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, targetUserID)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
go test ./internal/service/... -v
```
Expected: all PASS across the whole `service` package (ProjectService, AuthService, UserService tests together).

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/service
git commit -m "feat(platform-identity-service): add UserService using SameProjectAdmin strategy for role changes"
```

---

### Task 7: HTTP layer — middleware, handlers, response envelope

**Files:**
- Create: `platform-identity-service/internal/handlers/response.go`
- Create: `platform-identity-service/internal/handlers/project_handler.go`
- Create: `platform-identity-service/internal/handlers/auth_handler.go`
- Create: `platform-identity-service/internal/handlers/user_handler.go`
- Create: `platform-identity-service/internal/middleware/auth.go`
- Test: `platform-identity-service/internal/handlers/auth_handler_test.go` (httptest-based)

**Interfaces:**
- Consumes: `service.ProjectService/AuthService/UserService` (Tasks 5–6), `auth.JWTManager.Verify` (Task 2), `roleassign.Caller` (Task 4).
- Produces: `middleware.RequireAuth(jwt *auth.JWTManager) func(http.Handler) http.Handler`, `middleware.CallerFromContext(ctx) (roleassign.Caller, bool)`.
- Produces: `handlers.NewProjectHandler`, `handlers.NewAuthHandler`, `handlers.NewUserHandler` — each wraps its service and exposes the HTTP methods wired in `main.go` (Task 8).

- [ ] **Step 1: Write `internal/handlers/response.go`** (copy verbatim pattern from `shop-role-service`)

```go
package handlers

import (
	"encoding/json"
	"net/http"
)

type envelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
}

type errorEnvelope struct {
	Success bool      `json:"success"`
	Error   errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(envelope{Success: true, Data: data})
}

func writeError(w http.ResponseWriter, status int, message string) {
	code := "internal_error"
	switch status {
	case http.StatusBadRequest:
		code = "bad_request"
	case http.StatusUnauthorized:
		code = "unauthorized"
	case http.StatusForbidden:
		code = "forbidden"
	case http.StatusNotFound:
		code = "not_found"
	case http.StatusConflict:
		code = "conflict"
	case http.StatusServiceUnavailable:
		code = "service_unavailable"
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(errorEnvelope{Success: false, Error: errorBody{Code: code, Message: message}})
}
```

- [ ] **Step 2: Write `internal/middleware/auth.go`**

```go
package middleware

import (
	"context"
	"net/http"
	"strings"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/service/roleassign"
)

type contextKey string

const callerKey contextKey = "caller"

// RequireAuth verifies the token locally against this service's own
// JWTManager — no remote authorization-service call, since this service
// is meant to be a self-contained identity provider for new projects.
func RequireAuth(jwt *auth.JWTManager) func(http.Handler) http.Handler {
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

			caller := roleassign.Caller{UserID: claims.UserID, ProjectID: claims.ProjectID, Role: claims.Role}
			ctx := context.WithValue(r.Context(), callerKey, caller)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func CallerFromContext(ctx context.Context) (roleassign.Caller, bool) {
	caller, ok := ctx.Value(callerKey).(roleassign.Caller)
	return caller, ok
}

func writeAuthError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write([]byte(`{"success":false,"error":{"code":"` + code + `","message":"` + message + `"}}`))
}
```

- [ ] **Step 3: Write `internal/handlers/project_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"platform-identity-service/internal/service"
)

type ProjectHandler struct {
	svc *service.ProjectService
}

func NewProjectHandler(svc *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{svc: svc}
}

type createProjectRequest struct {
	Name string `json:"name"`
}

type projectResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

// Create godoc
// @Summary      Register a new project
// @Description  Açıq endpoint — sistem-səviyyəli superadmin anlayışı hələ yoxdur, yeni layihə qurmaq istəyən istənilən kəs çağıra bilər.
// @Tags         projects
// @Accept       json
// @Produce      json
// @Param        request body createProjectRequest true "Project payload"
// @Success      201 {object} projectResponse
// @Failure      400 {object} map[string]string
// @Router       /projects [post]
func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createProjectRequest
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
		writeError(w, http.StatusInternalServerError, "failed to create project")
		return
	}

	writeJSON(w, http.StatusCreated, projectResponse{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt.Format(timeFormat)})
}

// List godoc
// @Summary      List all projects
// @Tags         projects
// @Produce      json
// @Success      200 {array} projectResponse
// @Router       /projects [get]
func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	projects, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list projects")
		return
	}

	response := make([]projectResponse, len(projects))
	for i, p := range projects {
		response[i] = projectResponse{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt.Format(timeFormat)}
	}
	writeJSON(w, http.StatusOK, response)
}

// Get godoc
// @Summary      Get a project by id
// @Tags         projects
// @Produce      json
// @Param        id path string true "Project ID"
// @Success      200 {object} projectResponse
// @Failure      404 {object} map[string]string
// @Router       /projects/{id} [get]
func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.svc.Get(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, projectResponse{ID: p.ID, Name: p.Name, CreatedAt: p.CreatedAt.Format(timeFormat)})
}

const timeFormat = "2006-01-02T15:04:05Z07:00"
```

- [ ] **Step 4: Write `internal/handlers/auth_handler.go`**

```go
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type registerRequest struct {
	ProjectID string `json:"project_id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type userResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	ProjectID string `json:"project_id,omitempty"`
	Role      string `json:"role"`
}

// Register godoc
// @Summary      Register a user under a project
// @Description  Layihənin ilk qeydiyyatdan keçən useri avtomatik 'admin' olur, sonrakılar 'user'. role sahəsi qəbul edilmir — client özünü admin edə bilməz.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body registerRequest true "Register payload"
// @Success      201 {object} userResponse
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ProjectID == "" || req.Username == "" || req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "project_id, username, email and password are required")
		return
	}

	u, err := h.svc.Register(r.Context(), service.RegisterInput{
		ProjectID: req.ProjectID, Name: req.Name, Username: req.Username, Email: req.Email, Password: req.Password,
	})
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrProjectNotFound):
			writeError(w, http.StatusNotFound, "project not found")
		case errors.Is(err, service.ErrUsernameTaken):
			writeError(w, http.StatusConflict, "username already registered")
		case errors.Is(err, service.ErrEmailTaken):
			writeError(w, http.StatusConflict, "email already registered")
		default:
			writeError(w, http.StatusInternalServerError, "failed to register user")
		}
		return
	}

	projectID := ""
	if u.ProjectID != nil {
		projectID = *u.ProjectID
	}
	writeJSON(w, http.StatusCreated, userResponse{
		ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, ProjectID: projectID, Role: u.RoleName,
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

- [ ] **Step 5: Write `internal/handlers/user_handler.go`**

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

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// Get godoc
// @Summary      Get a user
// @Description  Özünü, ya da (admin rolunda olarsa) öz layihəsindəki istənilən useri görə bilər.
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

type setRoleRequest struct {
	Role string `json:"role"`
}

// SetRole godoc
// @Summary      Change a user's role
// @Description  Yalnız caller öz layihəsinin admin-idirsə icazə verilir.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "User ID"
// @Param        request body setRoleRequest true "Role payload"
// @Success      200 {object} userResponse
// @Failure      403 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /users/{id}/role [post]
func (h *UserHandler) SetRole(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req setRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Role != "user" && req.Role != "admin" {
		writeError(w, http.StatusBadRequest, "role must be 'user' or 'admin'")
		return
	}

	id := chi.URLParam(r, "id")
	u, err := h.svc.SetRole(r.Context(), caller, id, req.Role)
	writeUserOrError(w, u, err)
}

func writeUserOrError(w http.ResponseWriter, u *userLike, err error) {
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrUserNotFound):
			writeError(w, http.StatusNotFound, "user not found")
		case errors.Is(err, service.ErrForbidden):
			writeError(w, http.StatusForbidden, "admin role within the target's own project required")
		default:
			writeError(w, http.StatusInternalServerError, "failed to process request")
		}
		return
	}

	projectID := ""
	if u.ProjectID != nil {
		projectID = *u.ProjectID
	}
	writeJSON(w, http.StatusOK, userResponse{
		ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, ProjectID: projectID, Role: u.RoleName,
	})
}
```

Fix the type mismatch introduced above: `writeUserOrError`'s second parameter must be `*models.User`, not a nonexistent `*userLike` — replace that line and add the import:

```go
func writeUserOrError(w http.ResponseWriter, u *models.User, err error) {
```

(add `"platform-identity-service/internal/models"` to the import block in `user_handler.go`)

- [ ] **Step 6: Write the handler test (httptest, exercises the full register → login → protected-route flow against the real local DB and real HTTP handlers — no mocking, matches how this codebase already tests thin handler logic)**

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
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/google/uuid"

	"platform-identity-service/internal/auth"
	"platform-identity-service/internal/database"
	appmiddleware "platform-identity-service/internal/middleware"
	"platform-identity-service/internal/repository"
	"platform-identity-service/internal/service"
	"platform-identity-service/internal/service/roleassign"
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

	projectRepo := repository.NewProjectRepository(db)
	userRepo := repository.NewUserRepository(db)
	jwtManager := auth.NewJWTManager("handler-test-secret", 60)

	projectSvc := service.NewProjectService(projectRepo)
	authSvc := service.NewAuthService(projectRepo, userRepo, jwtManager)
	userSvc := service.NewUserService(userRepo, roleassign.NewSameProjectAdmin())

	projectHandler := NewProjectHandler(projectSvc)
	authHandler := NewAuthHandler(authSvc)
	userHandler := NewUserHandler(userSvc)

	r := chi.NewRouter()
	r.Post("/api/v1/projects", projectHandler.Create)
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)
	r.Group(func(r chi.Router) {
		r.Use(appmiddleware.RequireAuth(jwtManager))
		r.Get("/api/v1/users/{id}", userHandler.Get)
		r.Post("/api/v1/users/{id}/role", userHandler.SetRole)
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

	// Create a project
	rec := doJSON(t, r, http.MethodPost, "/api/v1/projects", "", map[string]string{"name": "Flow Test " + uuid.NewString()})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var projectEnv struct {
		Data struct{ ID string `json:"id"` } `json:"data"`
	}
	json.NewDecoder(rec.Body).Decode(&projectEnv)
	projectID := projectEnv.Data.ID

	// Register the first user (should become admin)
	username := "flow-" + uuid.NewString()
	rec = doJSON(t, r, http.MethodPost, "/api/v1/auth/register", "", map[string]string{
		"project_id": projectID, "name": "Flow User", "username": username,
		"email": uuid.NewString() + "@example.com", "password": "password123",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("register: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var userEnv struct {
		Data struct {
			ID   string `json:"id"`
			Role string `json:"role"`
		} `json:"data"`
	}
	json.NewDecoder(rec.Body).Decode(&userEnv)
	if userEnv.Data.Role != "admin" {
		t.Fatalf("expected first user role 'admin', got %q", userEnv.Data.Role)
	}
	userID := userEnv.Data.ID

	// Login
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

	// Get own user with the token
	rec = doJSON(t, r, http.MethodGet, "/api/v1/users/"+userID, loginEnv.Data.Token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("get user: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	// Get without a token should be unauthorized
	rec = doJSON(t, r, http.MethodGet, "/api/v1/users/"+userID, "", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("get user without token: expected 401, got %d", rec.Code)
	}
}
```

- [ ] **Step 7: Get missing deps and run the full handler test to verify it passes**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go get github.com/go-chi/chi/v5@v5.3.1
go test ./internal/handlers/... -v
```
Expected: PASS.

- [ ] **Step 8: Run the entire test suite for the service so far**

```bash
go test ./... -v
```
Expected: all PASS (config, auth, repository, service/roleassign, service, handlers).

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/internal/handlers platform-identity-service/internal/middleware platform-identity-service/go.mod platform-identity-service/go.sum
git commit -m "feat(platform-identity-service): add HTTP handlers, local JWT middleware, response envelope"
```

---

### Task 8: Wire `main.go`, logclient, Swagger docs, run locally

**Files:**
- Create: `platform-identity-service/cmd/api/main.go`
- Create: `platform-identity-service/internal/logclient/client.go` (copy verbatim from `shop-role-service/internal/logclient/client.go`)

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: the runnable binary — no further consumers within this plan.

- [ ] **Step 1: Copy `logclient` verbatim, only changing the package's internal service name string**

```bash
cp /Users/frontend/workspace/go-project-practices/shop-role-service/internal/logclient/client.go \
   /Users/frontend/workspace/go-project-practices/platform-identity-service/internal/logclient/client.go
```

Then open `platform-identity-service/internal/logclient/client.go` and confirm/adjust the module import path prefix if the file references `shop-role-service` anywhere internally (it shouldn't — `logclient` is self-contained and only takes the service name as a constructor argument at call-site in `main.go`).

- [ ] **Step 2: Write `cmd/api/main.go`**

```go
package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
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
	"platform-identity-service/internal/service/roleassign"
)

// @title           Platform Identity Service API
// @version         1.0
// @description     Gələcək layihələr üçün mərkəzi User/Admin qeydiyyat modulu. Hər layihənin ilk qeydiyyatdan keçən useri avtomatik admin olur, sonrakılar user. Öz JWT-sini özü verir/yoxlayır.
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg := appconfig.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migration error: %v", err)
	}

	projectRepo := repository.NewProjectRepository(db)
	userRepo := repository.NewUserRepository(db)
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTTTLMinutes)

	projectService := service.NewProjectService(projectRepo)
	authService := service.NewAuthService(projectRepo, userRepo, jwtManager)
	userService := service.NewUserService(userRepo, roleassign.NewSameProjectAdmin())

	projectHandler := handlers.NewProjectHandler(projectService)
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)

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
		r.Post("/projects", projectHandler.Create)
		r.Get("/projects", projectHandler.List)
		r.Get("/projects/{id}", projectHandler.Get)

		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		r.Group(func(r chi.Router) {
			r.Use(appmiddleware.RequireAuth(jwtManager))
			r.Get("/users/{id}", userHandler.Get)
			r.Post("/users/{id}/role", userHandler.SetRole)
		})
	})

	log.Printf("platform-identity-service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
```

- [ ] **Step 3: Generate Swagger docs**

```bash
cd /Users/frontend/workspace/go-project-practices/platform-identity-service
go install github.com/swaggo/swag/cmd/swag@latest
$(go env GOPATH)/bin/swag init -g cmd/api/main.go -o internal/docs
```
Expected: creates `internal/docs/docs.go`, `swagger.json`, `swagger.yaml`.

- [ ] **Step 4: Build and confirm it compiles**

```bash
go build ./...
```
Expected: builds cleanly with no errors.

- [ ] **Step 5: Run the full test suite one more time (now that everything is wired)**

```bash
go test ./... -v
```
Expected: all PASS.

- [ ] **Step 6: Run the service locally and smoke-test it end to end**

```bash
lsof -i :8095 || true   # confirm the port is free before starting
go run ./cmd/api &
sleep 2
curl -s http://localhost:8095/health; echo

# Create a project
PROJECT_ID=$(curl -s -X POST http://localhost:8095/api/v1/projects \
  -H "Content-Type: application/json" -d '{"name":"Smoke Test Project"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "project: $PROJECT_ID"

# Register the first user — should become admin
curl -s -X POST http://localhost:8095/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"name\":\"Cavad\",\"username\":\"cavad\",\"email\":\"cavad@example.com\",\"password\":\"password123\"}"
echo

# Login
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"cavad","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "token acquired: ${TOKEN:0:20}..."

# Access a protected route
curl -s http://localhost:8095/api/v1/projects -H "Authorization: Bearer $TOKEN"; echo

kill %1
```
Expected: `/health` returns `{"status":"ok"}`, project creation returns 201 with an `id`, registration returns the user with `"role":"admin"`, login returns a non-empty token, and the final `curl` (or any protected-route check) confirms the token is accepted.

- [ ] **Step 7: Add the run command to the README's service list**

Open `/Users/frontend/workspace/go-project-practices/README.md` and add this line after the `payment-service :8094` line in the "Servisləri işə salmaq" bash block:

```
cd platform-identity-service  && go run ./cmd/api   # :8095
```

Also add `8095` to the health-check loop's port list in the same file.

- [ ] **Step 8: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/cmd platform-identity-service/internal/logclient \
  platform-identity-service/internal/docs platform-identity-service/go.mod platform-identity-service/go.sum README.md
git commit -m "feat(platform-identity-service): wire main.go, generate swagger docs, verified local run on :8095"
```

---

### Task 9: Generic deploy script (written, not executed)

**Files:**
- Create: `platform-identity-service/deploy/deploy.sh`
- Create: `platform-identity-service/deploy/platform-identity-service.service`

**Interfaces:**
- Consumes: nothing from earlier tasks besides the built binary path (`cmd/api`).
- Produces: a standalone script — not invoked by any other task in this plan.

- [ ] **Step 1: Write the systemd unit template**

```bash
cat > /Users/frontend/workspace/go-project-practices/platform-identity-service/deploy/platform-identity-service.service <<'EOF'
[Unit]
Description=Platform Identity Service
After=network.target postgresql.service

[Service]
Type=simple
User=%i
WorkingDirectory=/opt/platform-identity-service
EnvironmentFile=/opt/platform-identity-service/.env
ExecStart=/opt/platform-identity-service/platform-identity-service
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

- [ ] **Step 2: Write the generic deploy script**

```bash
cat > /Users/frontend/workspace/go-project-practices/platform-identity-service/deploy/deploy.sh <<'SCRIPT'
#!/usr/bin/env bash
# Generic build + deploy script for platform-identity-service.
# Not tied to any specific server — supply SSH_HOST/SSH_USER at call time.
#
# Usage:
#   SSH_HOST=your.server.ip SSH_USER=deploy ./deploy/deploy.sh
#
# Requires: an SSH key already authorized on the target host, systemd on
# the target, and a real .env (this script does not create one — copy your
# production .env to the target manually or via a separate secrets step
# before the first run).

set -euo pipefail

: "${SSH_HOST:?SSH_HOST is required, e.g. SSH_HOST=1.2.3.4}"
: "${SSH_USER:?SSH_USER is required, e.g. SSH_USER=deploy}"
SSH_KEY="${SSH_KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/platform-identity-service}"
SERVICE_NAME="platform-identity-service"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "$SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

cd "$(dirname "$0")/.."

echo "==> Building linux/amd64 binary"
GOOS=linux GOARCH=amd64 go build -o "$SERVICE_NAME" ./cmd/api

echo "==> Ensuring remote directory exists"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "sudo mkdir -p '$REMOTE_DIR' && sudo chown ${SSH_USER} '$REMOTE_DIR'"

echo "==> Copying binary and systemd unit"
scp "${SSH_OPTS[@]}" "$SERVICE_NAME" "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/${SERVICE_NAME}"
scp "${SSH_OPTS[@]}" deploy/platform-identity-service.service "${SSH_USER}@${SSH_HOST}:/tmp/${SERVICE_NAME}.service"

echo "==> Installing systemd unit and restarting service"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" "
  sudo mv /tmp/${SERVICE_NAME}.service /etc/systemd/system/${SERVICE_NAME}.service &&
  sudo systemctl daemon-reload &&
  sudo systemctl enable ${SERVICE_NAME} &&
  sudo systemctl restart ${SERVICE_NAME} &&
  sudo systemctl status ${SERVICE_NAME} --no-pager
"

rm -f "$SERVICE_NAME"
echo "==> Deploy complete"
SCRIPT
chmod +x /Users/frontend/workspace/go-project-practices/platform-identity-service/deploy/deploy.sh
```

- [ ] **Step 3: Do NOT execute the script.** Confirm it's syntactically valid only:

```bash
bash -n /Users/frontend/workspace/go-project-practices/platform-identity-service/deploy/deploy.sh
```
Expected: no output (syntax OK). Do not run it against any real host as part of this plan — actual deployment is a separate, explicitly-approved future step.

- [ ] **Step 4: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices
git add platform-identity-service/deploy
git commit -m "feat(platform-identity-service): add generic (unexecuted) deploy script and systemd unit"
```

---

## Self-Review Notes

- **Spec coverage:** projects table/endpoints (Task 3, 5, 7), users table with role_id/project_id (Task 1, 3), roles table seeded user/admin (Task 1), first-user-becomes-admin (Task 5), same-project-only admin authorization as a named Strategy (Task 4, 6), self-contained JWT (Task 2, 7), local run verified (Task 8), deploy script written not executed (Task 9) — all covered.
- **Type consistency:** `models.User.RoleName`, `roleassign.Caller/Target`, `service.RegisterInput/LoginInput` names are used identically across Tasks 3, 5, 6, 7 — double-checked field names (`ProjectID *string`, `RoleID *int16`, `RoleName string`) match between `models.go`, `user_repository.go`'s scan, and every service/handler consumer.
- **Fixed a copy-paste artifact** in Task 5 Step 1 (duplicate `stdlib` import) and Task 7 Step 5 (`*userLike` typo, corrected to `*models.User`) inline rather than leaving them as silent traps for whoever executes this plan.
