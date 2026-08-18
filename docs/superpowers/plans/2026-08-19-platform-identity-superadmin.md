# platform-identity-service Superadmin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a system-level `superadmin` role to `platform-identity-service` that can list and manage users across every project (not just one), and branch the `platform-identity-admin` UI to support it.

**Architecture:** A new `roleassign.SuperadminOrSameProjectAdmin` strategy replaces `SameProjectAdmin` as the `RoleAssigner` injected into `UserService` — `SetRole` needs zero code changes, since authorization already flows entirely through that interface. A new `GET /users` endpoint (superadmin-only, checked directly since there's no single target project to test `CanAssign` against) lists every user with their project's name attached. The first superadmin account is seeded during service startup, right after `database.Migrate()`, using a bcrypt hash built from `.env` credentials (seeding needs `auth.HashPassword`, which `Migrate()` itself has no access to — kept as a separate `database.SeedSuperadmin` step in `main.go`, not baked into the SQL migration).

**Tech Stack:** Go 1.26 (backend, unchanged), TypeScript/React/AntDesign (frontend, unchanged).

## Global Constraints

- Continue on the existing worktree/branch: `/Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service` (branch `worktree-platform-identity-service`). Do not create a new branch.
- `roles` table gets a 3rd seeded row: `id=3, name='superadmin'` — same `ON CONFLICT (id) DO NOTHING` pattern already used for ids 1/2.
- `models.RoleSuperadmin = "superadmin"` added alongside the existing `RoleUser`/`RoleAdmin` constants.
- Bootstrap superadmin: `project_id = NULL`, `role_id = 3`, seeded once via a new `database.SeedSuperadmin(db *sql.DB, username, passwordHash string) error` function called from `main.go` right after `Migrate()` — idempotent (must not error or duplicate on repeated startup).
- Bootstrap credentials come from `.env`: `SUPERADMIN_USERNAME` (default `superadmin`), `SUPERADMIN_PASSWORD` (default `superadmin-dev-password` — this one is allowed an insecure default per the spec, unlike `JWT_SECRET` which fails closed, because it's a bootstrap convenience the operator is expected to know to change, not a cryptographic key silently protecting everything).
- `POST /users/{id}/role` and `GET /users/{id}` behavior for a superadmin caller changes automatically once the new strategy is wired in `main.go` — no handler or service code changes to those two endpoints.
- `GET /users` is superadmin-only, checked as `caller.Role != models.RoleSuperadmin` directly in the service method (not via `CanAssign`, since there's no single project to test against — this is a "give me everything" query, a different shape of authorization question than the existing one).
- Local Postgres already running at `localhost:5433` (db `postgres`, user `postgres`, password `1`) for backend tests.
- Frontend: `RequireAuth` must accept `'admin' | 'superadmin'`, not just `'admin'`.
- No AI attribution trailer in commit messages, following this branch's convention.

---

## File Structure

### Backend

```
platform-identity-service/
  internal/
    models/models.go                         — MODIFY: add RoleSuperadmin, ProjectName field on User
    database/postgres.go                     — MODIFY: seed role id 3; add SeedSuperadmin func
    repository/user_repository.go            — MODIFY: add ListAll (joins projects for name)
    repository/repository_test.go            — MODIFY: add TestUserRepository_ListAll
    service/roleassign/strategy.go            — MODIFY: add SuperadminOrSameProjectAdmin
    service/roleassign/strategy_test.go       — MODIFY: add TestSuperadminOrSameProjectAdmin_CanAssign
    service/user_service.go                   — MODIFY: add ListAll
    service/user_service_test.go              — MODIFY: add TestUserService_ListAll_* tests
    handlers/user_handler.go                  — MODIFY: add ListAll handler
    handlers/auth_handler_test.go             — (unchanged — full-flow test stays scoped to the existing endpoints; superadmin flow gets its own coverage in user_service_test.go and a manual e2e check)
  cmd/api/main.go                             — MODIFY: seed superadmin, swap in new strategy, wire GET /users route
  .env / .env.example                          — MODIFY: add SUPERADMIN_USERNAME/SUPERADMIN_PASSWORD
```

### Frontend

```
platform-identity-admin/
  src/
    auth/RequireAuth.tsx      — MODIFY: accept 'admin' | 'superadmin'
    api/types.ts              — MODIFY: User gains project_id/project_name (optional, only present from GET /users)
    api/users.ts               — MODIFY: add listAllUsers()
    pages/UsersPage.tsx         — MODIFY: branch on claims.role, add Layihə column for superadmin view
```

---

## Backend Tasks

### Task 1: Data model — role seed, superadmin bootstrap, User.ProjectName

**Files:**
- Modify: `platform-identity-service/internal/models/models.go`
- Modify: `platform-identity-service/internal/database/postgres.go`
- Modify: `platform-identity-service/.env`
- Modify: `platform-identity-service/.env.example`

**Interfaces:**
- Produces: `models.RoleSuperadmin = "superadmin"` constant.
- Produces: `models.User.ProjectName string` field (populated only by the new `ListAll` query in Task 2 — mirrors the existing `RoleName`'s "join-only field" precedent).
- Produces: `database.SeedSuperadmin(db *sql.DB, username, passwordHash string) error`.

This task has no dedicated unit test of its own — `SeedSuperadmin`'s correctness is verified by Task 2's repository test (which calls it as setup) and this task's own manual verification step below. Adding a standalone test here would just re-test what Task 2 already exercises.

- [ ] **Step 1: Add the role constant and `ProjectName` field to `internal/models/models.go`**

Change the const block from:

```go
const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)
```

to:

```go
const (
	RoleUser       = "user"
	RoleAdmin      = "admin"
	RoleSuperadmin = "superadmin"
)
```

Add `ProjectName` to the `User` struct, after `RoleName`:

```go
type User struct {
	ID           string
	Name         string
	Username     string
	Email        string
	PasswordHash string
	ProjectID    *string
	RoleID       *int16
	RoleName     string // populated by joined queries, not persisted directly
	ProjectName  string // populated only by UserRepository.ListAll, empty elsewhere
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
```

- [ ] **Step 2: Seed role id 3 in `internal/database/postgres.go`**

Change:

```go
		INSERT INTO roles (id, name) VALUES (1, 'user'), (2, 'admin')
		ON CONFLICT (id) DO NOTHING;
```

to:

```go
		INSERT INTO roles (id, name) VALUES (1, 'user'), (2, 'admin'), (3, 'superadmin')
		ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Add `SeedSuperadmin` to `internal/database/postgres.go`**

Add this function after `Migrate`:

```go
// SeedSuperadmin ensures exactly one bootstrap superadmin account exists,
// with no project (system-level). Idempotent: safe to call on every
// startup. passwordHash must already be bcrypt-hashed by the caller —
// this function has no access to auth.HashPassword (it would create an
// import cycle with internal/auth importing back into database in a
// hypothetical future, and more simply: hashing is not this package's
// concern, it only persists what it's given).
func SeedSuperadmin(db *sql.DB, username, passwordHash string) error {
	_, err := db.Exec(`
		INSERT INTO users (id, name, username, email, password_hash, project_id, role_id, created_at, updated_at)
		VALUES (gen_random_uuid(), 'Superadmin', $1, $1 || '@platform-identity.local', $2, NULL, 3, now(), now())
		ON CONFLICT (username) DO NOTHING
	`, username, passwordHash)
	if err != nil {
		return fmt.Errorf("seed superadmin: %w", err)
	}
	return nil
}
```

Note: `gen_random_uuid()` requires the `pgcrypto` extension (or PostgreSQL 13+'s built-in `gen_random_uuid()`, available without an extension since PG 13). This matches the UUID generation style already implicit in this service's Postgres usage — if `gen_random_uuid()` is unavailable in the test Postgres instance, fall back to generating the UUID in Go with `github.com/google/uuid` and passing it as a parameter instead (check by running the migration once; the existing `projects`/`users` tables already use `UUID PRIMARY KEY` columns populated from Go-side `uuid.NewString()` in every other insert path in this codebase, so prefer matching that: generate the id in Go, not in SQL). Revised signature and body, matching that existing codebase convention:

```go
func SeedSuperadmin(db *sql.DB, id, username, passwordHash string) error {
	_, err := db.Exec(`
		INSERT INTO users (id, name, username, email, password_hash, project_id, role_id, created_at, updated_at)
		VALUES ($1, 'Superadmin', $2, $2 || '@platform-identity.local', $3, NULL, 3, now(), now())
		ON CONFLICT (username) DO NOTHING
	`, id, username, passwordHash)
	if err != nil {
		return fmt.Errorf("seed superadmin: %w", err)
	}
	return nil
}
```

Use this second (Go-generates-the-id) version — it's consistent with how every other `Create` call in this codebase already works (`uuid.NewString()` in the service layer, passed down).

- [ ] **Step 4: Update `.env` and `.env.example`**

Add to both files (after `JWT_TTL_MINUTES`):

```
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin-dev-password
```

(For `.env.example`, use a placeholder like `SUPERADMIN_PASSWORD=changeme` instead, matching that file's existing placeholder convention for other secrets.)

- [ ] **Step 5: Build to confirm no compile errors**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go build ./...
```
Expected: builds cleanly (nothing calls `SeedSuperadmin` yet, so no runtime behavior to verify at this step — that happens in Task 4 when it's wired into `main.go`).

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/models/models.go \
  platform-identity-service/internal/database/postgres.go \
  platform-identity-service/.env platform-identity-service/.env.example
git commit -m "feat(platform-identity-service): add superadmin role seed, User.ProjectName, SeedSuperadmin"
```

---

### Task 2: `UserRepository.ListAll`

**Files:**
- Modify: `platform-identity-service/internal/repository/user_repository.go`
- Modify: `platform-identity-service/internal/repository/repository_test.go`

**Interfaces:**
- Consumes: `database.SeedSuperadmin` is NOT used here (this repository method just lists — seeding a superadmin account isn't needed to test `ListAll`, any users across any projects suffice).
- Produces: `UserRepository.ListAll(ctx) ([]models.User, error)` — each result's `ProjectName` populated via `LEFT JOIN projects`, `RoleName` via the existing `LEFT JOIN roles` pattern.

- [ ] **Step 1: Write the failing test**

Add to `platform-identity-service/internal/repository/repository_test.go`:

```go
func TestUserRepository_ListAll(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	projectRepo := NewProjectRepository(db)
	userRepo := NewUserRepository(db)

	p1 := &models.Project{ID: uuid.NewString(), Name: "ListAll A " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	p2 := &models.Project{ID: uuid.NewString(), Name: "ListAll B " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := projectRepo.Create(context.Background(), p1); err != nil {
		t.Fatalf("create p1 failed: %v", err)
	}
	if err := projectRepo.Create(context.Background(), p2); err != nil {
		t.Fatalf("create p2 failed: %v", err)
	}

	adminRoleID := int16(2)
	u1 := &models.User{
		ID: uuid.NewString(), Name: "P1 User", Username: "listall-p1-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p1.ID, RoleID: &adminRoleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	u2 := &models.User{
		ID: uuid.NewString(), Name: "P2 User", Username: "listall-p2-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p2.ID, RoleID: &adminRoleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	for _, u := range []*models.User{u1, u2} {
		if err := userRepo.Create(context.Background(), u); err != nil {
			t.Fatalf("create user failed: %v", err)
		}
	}

	got, err := userRepo.ListAll(context.Background())
	if err != nil {
		t.Fatalf("ListAll failed: %v", err)
	}

	byID := map[string]models.User{}
	for _, u := range got {
		byID[u.ID] = u
	}

	found1, ok := byID[u1.ID]
	if !ok {
		t.Fatalf("expected u1 in ListAll result")
	}
	if found1.ProjectName != p1.Name {
		t.Errorf("expected u1.ProjectName %q, got %q", p1.Name, found1.ProjectName)
	}

	found2, ok := byID[u2.ID]
	if !ok {
		t.Fatalf("expected u2 in ListAll result")
	}
	if found2.ProjectName != p2.Name {
		t.Errorf("expected u2.ProjectName %q, got %q", p2.Name, found2.ProjectName)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/repository/... -run TestUserRepository_ListAll -v
```
Expected: FAIL — `ListAll` undefined.

- [ ] **Step 3: Add `ListAll` to `internal/repository/user_repository.go`**

Add this method after `ListByProject`:

```go
const selectUserWithRoleAndProject = `
	SELECT u.id, u.name, u.username, u.email, u.password_hash, u.project_id, u.role_id,
	       COALESCE(r.name, ''), COALESCE(p.name, ''), u.created_at, u.updated_at
	FROM users u
	LEFT JOIN roles r ON r.id = u.role_id
	LEFT JOIN projects p ON p.id = u.project_id
`

func (r *UserRepository) ListAll(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.QueryContext(ctx, selectUserWithRoleAndProject+" ORDER BY u.created_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Email, &u.PasswordHash,
			&u.ProjectID, &u.RoleID, &u.RoleName, &u.ProjectName, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/repository/... -run TestUserRepository_ListAll -v
```
Expected: PASS.

- [ ] **Step 5: Run the full repository suite to confirm no regressions**

```bash
go test ./internal/repository/... -v
```
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/repository/user_repository.go \
  platform-identity-service/internal/repository/repository_test.go
git commit -m "feat(platform-identity-service): add UserRepository.ListAll joining project names"
```

---

### Task 3: `SuperadminOrSameProjectAdmin` strategy + `UserService.ListAll`

**Files:**
- Modify: `platform-identity-service/internal/service/roleassign/strategy.go`
- Modify: `platform-identity-service/internal/service/roleassign/strategy_test.go`
- Modify: `platform-identity-service/internal/service/user_service.go`
- Modify: `platform-identity-service/internal/service/user_service_test.go`

**Interfaces:**
- Consumes: `UserRepository.ListAll` (Task 2), `models.RoleSuperadmin` (Task 1), existing `roleassign.Caller`/`Target`/`RoleAssigner`.
- Produces: `roleassign.SuperadminOrSameProjectAdmin{}`, `roleassign.NewSuperadminOrSameProjectAdmin() *SuperadminOrSameProjectAdmin`, implementing `RoleAssigner`.
- Produces: `UserService.ListAll(ctx, caller roleassign.Caller) ([]models.User, error)` — returns `ErrForbidden` unless `caller.Role == models.RoleSuperadmin`.

- [ ] **Step 1: Write the failing strategy test**

Add to `platform-identity-service/internal/service/roleassign/strategy_test.go`:

```go
func TestSuperadminOrSameProjectAdmin_CanAssign(t *testing.T) {
	strategy := NewSuperadminOrSameProjectAdmin()

	tests := []struct {
		name   string
		caller Caller
		target Target
		want   bool
	}{
		{
			name:   "superadmin can assign across any project",
			caller: Caller{UserID: "u1", ProjectID: "", Role: "superadmin"},
			target: Target{UserID: "u2", ProjectID: "p1"},
			want:   true,
		},
		{
			name:   "same-project admin can still assign (delegates to SameProjectAdmin rule)",
			caller: Caller{UserID: "u1", ProjectID: "p1", Role: "admin"},
			target: Target{UserID: "u2", ProjectID: "p1"},
			want:   true,
		},
		{
			name:   "cross-project admin still cannot assign",
			caller: Caller{UserID: "u1", ProjectID: "p1", Role: "admin"},
			target: Target{UserID: "u2", ProjectID: "p2"},
			want:   false,
		},
		{
			name:   "plain user cannot assign",
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
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/service/roleassign/... -run TestSuperadminOrSameProjectAdmin_CanAssign -v
```
Expected: FAIL — `NewSuperadminOrSameProjectAdmin` undefined.

- [ ] **Step 3: Add the strategy to `internal/service/roleassign/strategy.go`**

Add after the existing `SameProjectAdmin` type and its methods:

```go
// SuperadminOrSameProjectAdmin extends SameProjectAdmin's rule with a
// system-level bypass: a superadmin may act on any user in any project.
// It composes SameProjectAdmin rather than duplicating its condition, so
// the two rules can never drift apart.
type SuperadminOrSameProjectAdmin struct {
	sameProjectAdmin *SameProjectAdmin
}

func NewSuperadminOrSameProjectAdmin() *SuperadminOrSameProjectAdmin {
	return &SuperadminOrSameProjectAdmin{sameProjectAdmin: NewSameProjectAdmin()}
}

func (s *SuperadminOrSameProjectAdmin) CanAssign(caller Caller, target Target) bool {
	if caller.Role == models.RoleSuperadmin {
		return true
	}
	return s.sameProjectAdmin.CanAssign(caller, target)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/service/roleassign/... -v
```
Expected: all PASS (both `TestSameProjectAdmin_CanAssign` and the new `TestSuperadminOrSameProjectAdmin_CanAssign`).

- [ ] **Step 5: Write the failing `UserService.ListAll` tests**

Add to `platform-identity-service/internal/service/user_service_test.go`:

```go
func TestUserService_ListAll_SuperadminSucceeds(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p, _ := projectSvc.Create(context.Background(), "ListAll Success "+uuid.NewString())
	_, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Member", Username: "listall-member-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register member failed: %v", err)
	}

	superadminCaller := roleassign.Caller{UserID: "superadmin-id", ProjectID: "", Role: "superadmin"}
	users, err := userSvc.ListAll(context.Background(), superadminCaller)
	if err != nil {
		t.Fatalf("ListAll failed: %v", err)
	}
	if len(users) == 0 {
		t.Error("expected at least one user in ListAll result")
	}
}

func TestUserService_ListAll_NonSuperadminForbidden(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p, _ := projectSvc.Create(context.Background(), "ListAll Forbidden "+uuid.NewString())
	admin, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Admin", Username: "listall-admin-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register admin failed: %v", err)
	}

	adminCaller := roleassign.Caller{UserID: admin.ID, ProjectID: p.ID, Role: admin.RoleName}
	_, err = userSvc.ListAll(context.Background(), adminCaller)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden for non-superadmin caller, got %v", err)
	}
}
```

Note: this test uses `roleassign.NewSameProjectAdmin()` (via `newTestUserService`'s existing wiring) as the injected strategy, NOT `SuperadminOrSameProjectAdmin` — but `UserService.ListAll`'s own forbidden-check is `caller.Role != models.RoleSuperadmin`, done directly, not via `s.assigner.CanAssign(...)`. So this test is valid regardless of which strategy is injected — confirm this is true when writing `ListAll` in Step 7 below (the whole point of doing this check directly rather than through the assigner is that it doesn't depend on which `RoleAssigner` implementation is wired in).

- [ ] **Step 6: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestUserService_ListAll -v
```
Expected: FAIL — `ListAll` undefined on `UserService`.

- [ ] **Step 7: Add `ListAll` to `internal/service/user_service.go`**

Add this method after `ListByProject`:

```go
// ListAll returns every user across every project. Unlike the other
// UserService methods, this check does not go through the injected
// RoleAssigner — there is no single target project to test CanAssign
// against, since "give me everything" is a different shape of question
// than "can I act on this one project/user."
func (s *UserService) ListAll(ctx context.Context, caller roleassign.Caller) ([]models.User, error) {
	if caller.Role != models.RoleSuperadmin {
		return nil, ErrForbidden
	}
	return s.repo.ListAll(ctx)
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
go test ./internal/service/... -v
```
Expected: all PASS (including all pre-existing `UserService` tests, no regressions).

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/service/roleassign/strategy.go \
  platform-identity-service/internal/service/roleassign/strategy_test.go \
  platform-identity-service/internal/service/user_service.go \
  platform-identity-service/internal/service/user_service_test.go
git commit -m "feat(platform-identity-service): add SuperadminOrSameProjectAdmin strategy and UserService.ListAll"
```

---

### Task 4: `GET /users` handler, wire strategy + bootstrap seed into `main.go`, verified local run

**Files:**
- Modify: `platform-identity-service/internal/handlers/user_handler.go`
- Modify: `platform-identity-service/cmd/api/main.go`

**Interfaces:**
- Consumes: `UserService.ListAll` (Task 3), `roleassign.NewSuperadminOrSameProjectAdmin` (Task 3), `database.SeedSuperadmin` (Task 1), `auth.HashPassword` (existing), `cfg.SuperadminUsername`/`cfg.SuperadminPassword` — NOTE: `config.Config` does not yet have these fields; this task must add them (see Step 1 below — the original spec's Global Constraints named the env vars but the plan's Task 1 didn't touch `config.go`, since `SeedSuperadmin` in Task 1 takes the username/password-hash as plain function arguments, not via `*Config`; wiring `cfg.Load()` to actually read those two new env vars happens here, in the one place that needs them).
- Produces: `UserHandler.ListAll(w, r)`, registered at `GET /users`.

- [ ] **Step 1: Add `SuperadminUsername`/`SuperadminPassword` to `internal/config/config.go`**

In the `Config` struct, add two fields after `JWTTTLMinutes`:

```go
	SuperadminUsername string
	SuperadminPassword string
```

In `Load()`, add to the returned `&Config{...}` literal (after `JWTTTLMinutes: ...,`):

```go
		SuperadminUsername: getEnv("SUPERADMIN_USERNAME", "superadmin"),
		SuperadminPassword: getEnv("SUPERADMIN_PASSWORD", "superadmin-dev-password"),
```

- [ ] **Step 2: Add the `ListAll` handler to `internal/handlers/user_handler.go`**

Add this after `ListByProject` (reuse the existing `projectUserResponse` type — extend it with a `ProjectID`/`ProjectName` pair since this endpoint spans projects, unlike `ListByProject` which is already scoped to one):

```go
type allUsersResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Username    string `json:"username"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	ProjectID   string `json:"project_id,omitempty"`
	ProjectName string `json:"project_name,omitempty"`
}

// ListAll godoc
// @Summary      List every user across every project
// @Description  Yalnız superadmin çağıra bilər.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} allUsersResponse
// @Failure      403 {object} map[string]string
// @Router       /users [get]
func (h *UserHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	users, err := h.svc.ListAll(r.Context())
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			writeError(w, http.StatusForbidden, "superadmin role required")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}

	response := make([]allUsersResponse, len(users))
	for i, u := range users {
		projectID := ""
		if u.ProjectID != nil {
			projectID = *u.ProjectID
		}
		response[i] = allUsersResponse{
			ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, Role: u.RoleName,
			ProjectID: projectID, ProjectName: u.ProjectName,
		}
	}
	writeJSON(w, http.StatusOK, response)
}
```

Wait — `h.svc.ListAll(r.Context())` above is missing the `caller` argument that `UserService.ListAll(ctx, caller)` requires (Task 3, Step 7). Correct call:

```go
	users, err := h.svc.ListAll(r.Context(), caller)
```

Use this corrected line, not the one in the code block above.

- [ ] **Step 3: Wire everything into `cmd/api/main.go`**

Replace:

```go
	userService := service.NewUserService(userRepo, roleassign.NewSameProjectAdmin())
```

with:

```go
	userService := service.NewUserService(userRepo, roleassign.NewSuperadminOrSameProjectAdmin())
```

After the existing `if err := database.Migrate(db); err != nil { ... }` block, add the superadmin bootstrap:

```go
	superadminHash, err := auth.HashPassword(cfg.SuperadminPassword)
	if err != nil {
		log.Fatalf("failed to hash superadmin password: %v", err)
	}
	if err := database.SeedSuperadmin(db, uuid.NewString(), cfg.SuperadminUsername, superadminHash); err != nil {
		log.Fatalf("failed to seed superadmin: %v", err)
	}
```

This requires adding `"github.com/google/uuid"` to `main.go`'s imports.

Add the new route inside the existing `r.Group(func(r chi.Router) { r.Use(appmiddleware.RequireAuth(jwtManager)) ... })` block, after `r.Get("/projects/{id}/users", userHandler.ListByProject)`:

```go
			r.Get("/users", userHandler.ListAll)
```

- [ ] **Step 4: Build and run the full suite**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go build ./...
go test ./... -v
```
Expected: builds cleanly, all packages PASS.

- [ ] **Step 5: Live end-to-end verification**

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
sleep 1
go run ./cmd/api > /tmp/pis-superadmin.log 2>&1 &
sleep 3
cat /tmp/pis-superadmin.log
```
Expected: `platform-identity-service listening on :8095`, no errors (confirms `SeedSuperadmin` ran without failing on this and any prior run — idempotency check happens implicitly since this service has likely been started before in this worktree during earlier tasks).

```bash
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"superadmin-dev-password"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
echo "superadmin token: ${TOKEN:0:20}..."
curl -s http://localhost:8095/api/v1/users -H "Authorization: Bearer $TOKEN"; echo
```
Expected: login succeeds, and `GET /users` returns `{"success":true,"data":[...]}` listing users from potentially multiple projects (any users created during this worktree's earlier task verifications, plus the superadmin's own row), each with a non-empty `project_name` where applicable.

Also confirm a non-superadmin is rejected:
```bash
PROJECT_ID=$(curl -s -X POST http://localhost:8095/api/v1/projects -H "Content-Type: application/json" -d '{"name":"Superadmin Verify"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -s -X POST http://localhost:8095/api/v1/auth/register -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"name\":\"Regular Admin\",\"username\":\"reg-admin-sa-check\",\"email\":\"reg-admin-sa-check@example.com\",\"password\":\"password123\"}"
REGTOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"reg-admin-sa-check","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s http://localhost:8095/api/v1/users -H "Authorization: Bearer $REGTOKEN"; echo
```
Expected: `{"success":false,"error":{"code":"forbidden","message":"superadmin role required"}}`.

Also confirm superadmin can cross-project SetRole:
```bash
curl -s -X POST "http://localhost:8095/api/v1/users/$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier":"reg-admin-sa-check","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" > /dev/null; echo)"
```
(Simplify: reuse the already-known user id from the register response above instead of the inline nested curl.) Get the registered user's id from the earlier register response body, then:
```bash
curl -s -X POST http://localhost:8095/api/v1/users/<REG_ADMIN_USER_ID>/role \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"role":"user"}'
```
Expected: `{"success":true,"data":{...,"role":"user"}}` — succeeds even though `$TOKEN` (superadmin) is not in that user's project, proving the new strategy's cross-project bypass works end-to-end through the existing, unmodified `SetRole` handler.

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
```

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/config/config.go \
  platform-identity-service/internal/handlers/user_handler.go \
  platform-identity-service/cmd/api/main.go
git commit -m "feat(platform-identity-service): add GET /users endpoint, wire superadmin strategy and bootstrap seed"
```

---

## Frontend Tasks

### Task 5: `RequireAuth` accepts superadmin, `UsersPage` branches on role

**Files:**
- Modify: `platform-identity-admin/src/auth/RequireAuth.tsx`
- Modify: `platform-identity-admin/src/api/types.ts`
- Modify: `platform-identity-admin/src/api/users.ts`
- Modify: `platform-identity-admin/src/pages/UsersPage.tsx`

**Interfaces:**
- Consumes: `useAuth()` (existing), `listProjects()` (existing), `listUsersByProject()` (existing).
- Produces: `listAllUsers(): Promise<User[]>`, an updated `User` type with optional `project_id`/`project_name`, an updated `RequireAuth` that accepts either role.

- [ ] **Step 1: Update `RequireAuth.tsx`**

Change:

```typescript
  if (claims?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
```

to:

```typescript
  if (claims?.role !== 'admin' && claims?.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }
```

- [ ] **Step 2: Update `User` type in `api/types.ts`**

Change:

```typescript
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}
```

to:

```typescript
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  project_id?: string;
  project_name?: string;
}
```

- [ ] **Step 3: Add `listAllUsers` to `api/users.ts`**

Add after `listUsersByProject`:

```typescript
export async function listAllUsers(): Promise<User[]> {
  const response = await platformIdentityApi.get<User[]>('/users');
  return response.data;
}
```

- [ ] **Step 4: Update `LoginPage.tsx`'s role check**

The existing login page rejects anyone whose `claims.role !== 'admin'`. Find this block in `src/pages/LoginPage.tsx`:

```typescript
      const claims = decodeToken(token);
      if (claims.role !== 'admin') {
        message.error('Yalnız admin rolunda olan istifadəçilər giriş edə bilər');
        return;
      }
```

Change to:

```typescript
      const claims = decodeToken(token);
      if (claims.role !== 'admin' && claims.role !== 'superadmin') {
        message.error('Yalnız admin və ya superadmin rolunda olan istifadəçilər giriş edə bilər');
        return;
      }
```

- [ ] **Step 5: Rewrite `UsersPage.tsx` to branch on role**

Replace the entire file with:

```typescript
import { useState } from 'react';
import { Button, Select, Space, Table, Typography, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../api/types';
import { listProjects } from '../api/projects';
import { listAllUsers, listUsersByProject, setUserRole } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

export function UsersPage() {
  const { claims } = useAuth();
  const isSuperadmin = claims?.role === 'superadmin';
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
    enabled: !isSuperadmin,
  });

  const effectiveProjectId = selectedProjectId ?? projects?.[0]?.id ?? null;
  const effectiveProjectName = projects?.find((p) => p.id === effectiveProjectId)?.name ?? null;

  const {
    data: scopedUsers,
    isLoading: scopedUsersLoading,
    isError: scopedIsError,
    error: scopedError,
  } = useQuery({
    queryKey: ['project-users', effectiveProjectId],
    queryFn: () => listUsersByProject(effectiveProjectId!),
    enabled: !isSuperadmin && !!effectiveProjectId,
  });

  const {
    data: allUsers,
    isLoading: allUsersLoading,
    isError: allIsError,
    error: allError,
  } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => listAllUsers(),
    enabled: isSuperadmin,
  });

  useQueryErrorToast(isSuperadmin ? allIsError : scopedIsError, isSuperadmin ? allError : scopedError);

  const users = isSuperadmin ? allUsers : scopedUsers;
  const usersLoading = isSuperadmin ? allUsersLoading : scopedUsersLoading;

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => setUserRole(userId, role),
    onSuccess: () => {
      message.success('Rol dəyişdirildi');
      if (isSuperadmin) {
        queryClient.invalidateQueries({ queryKey: ['all-users'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['project-users', effectiveProjectId] });
      }
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'role' },
    ...(isSuperadmin ? [{ title: 'Layihə', dataIndex: 'project_name' }] : []),
    {
      title: 'Əməliyyat',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            size="small"
            disabled={record.role === 'admin'}
            onClick={() => setRoleMutation.mutate({ userId: record.id, role: 'admin' })}
          >
            Admin et
          </Button>
          <Button
            size="small"
            disabled={record.role === 'user'}
            onClick={() => setRoleMutation.mutate({ userId: record.id, role: 'user' })}
          >
            User et
          </Button>
        </Space>
      ),
    },
  ];

  if (isSuperadmin) {
    return <Table rowKey="id" loading={usersLoading} dataSource={users} columns={columns} />;
  }

  return (
    <>
      <Select
        style={{ width: 320, marginBottom: 16 }}
        placeholder="Layihə seç"
        loading={projectsLoading}
        value={effectiveProjectId ?? undefined}
        onChange={(value) => setSelectedProjectId(value)}
        options={projects?.map((p) => ({ label: p.name, value: p.id }))}
      />
      {effectiveProjectName && (
        <Typography.Title level={5} style={{ marginBottom: 12 }}>
          {effectiveProjectName}
        </Typography.Title>
      )}
      <Table rowKey="id" loading={usersLoading} dataSource={users} columns={columns} />
    </>
  );
}
```

- [ ] **Step 6: Build and type-check**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run build
```
Expected: builds cleanly, no TypeScript errors.

- [ ] **Step 7: Verify locally end-to-end**

Ensure the backend is running (from Task 4's verification, or start fresh):

```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
sleep 1
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go run ./cmd/api > /tmp/pis-t5.log 2>&1 &
sleep 3
```

Start the frontend:

```bash
lsof -ti :5173 2>/dev/null | xargs -r kill
sleep 1
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run dev > /tmp/pia-t5.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
```
Expected: `200`.

Verify the superadmin data path via curl (simulating exactly what the UI's `listAllUsers()` call does):

```bash
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"superadmin","password":"superadmin-dev-password"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -H "Origin: http://localhost:5173" http://localhost:8095/api/v1/users -H "Authorization: Bearer $TOKEN"
echo
```
Expected: `{"success":true,"data":[{...,"project_name":"..."}]}` — same shape `UsersPage`'s superadmin branch renders into its table, including the CORS header the real browser fetch depends on.

Manually confirm (report what you observe):
1. Log into the panel with `superadmin` / `superadmin-dev-password`.
2. Navigate to İstifadəçilər — confirm NO project dropdown appears, and the table has a **Layihə** column showing each row's project name.
3. Confirm "Admin et"/"User et" buttons still work for a superadmin acting on a user outside their own project (there is no "own project" for a superadmin).
4. Log out, log in as a regular `admin` (e.g. `reg-admin-sa-check` / `password123` from Task 4's verification, if that account still exists — or register a fresh one) — confirm the project dropdown IS present and no Layihə column shows, i.e. the existing admin experience is unchanged.

Stop both servers when done:
```bash
lsof -ti :8095 2>/dev/null | xargs -r kill
lsof -ti :5173 2>/dev/null | xargs -r kill
```

- [ ] **Step 8: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/auth/RequireAuth.tsx \
  platform-identity-admin/src/api/types.ts \
  platform-identity-admin/src/api/users.ts \
  platform-identity-admin/src/pages/UsersPage.tsx \
  platform-identity-admin/src/pages/LoginPage.tsx
git commit -m "feat(platform-identity-admin): branch UsersPage on superadmin role, accept superadmin in RequireAuth/LoginPage"
```

---

## Self-Review Notes

- **Spec coverage:** role seed + bootstrap (Task 1), `ListAll` repository query with project-name join (Task 2), Strategy composition + service-layer `ListAll` (Task 3), handler + full wiring + superadmin bypass verified end-to-end through the *unmodified* `SetRole` handler (Task 4), frontend role branching including `RequireAuth`/`LoginPage` accepting the new role (Task 5) — all spec sections covered. Out-of-scope items (granting superadmin via UI, password rotation, audit logging) correctly have no task.
- **Type consistency:** `models.User.ProjectName` (Task 1) is populated only by `ListAll`'s query (Task 2) and surfaced as `project_name` in `allUsersResponse` (Task 4) — verified the JSON field name matches what `UsersPage`'s `project_name` column (Task 5) reads. `roleassign.SuperadminOrSameProjectAdmin` (Task 3) composes rather than duplicates `SameProjectAdmin`'s condition — confirmed by reading the existing file before writing the plan, not assumed.
- **Fixed two errors found during this plan's own drafting, inline rather than leaving them as traps:** Task 1's `SeedSuperadmin` initially used SQL-side `gen_random_uuid()` before self-correcting to match this codebase's actual established convention (Go-side `uuid.NewString()`, passed as a parameter) — the plan states which version to actually use. Task 4's handler draft initially called `h.svc.ListAll(r.Context())` (missing the `caller` argument `UserService.ListAll` requires per its Task 3 signature) before being corrected with the right call — the plan states which line to actually use.
