# platform-identity-admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two endpoints to `platform-identity-service` (`GET /roles`, `GET /projects/{id}/users`) and build a new React admin panel, `platform-identity-admin`, that lets a project's admin manage Projects, Roles, and Users through a browser.

**Architecture:** Backend follows the existing `repository → service → handler → route` layering already in `platform-identity-service`, reusing the `roleassign.SameProjectAdmin` strategy for the new project-scoped user list. Frontend mirrors `taobao-v1-admin`'s structure exactly: Vite + React 19 + AntDesign 6 + TanStack Query + react-router-dom + axios, with a classic `Sider` + `Content` layout (3 flat nav items, no role-conditional grouping since every authenticated user here is already an admin), one API file per resource, and `Table`/`Modal`/`Form` CRUD pages matching `ShopsPage`'s pattern.

**Tech Stack:** Backend: Go 1.26, chi v5, existing `platform-identity-service` module. Frontend: Vite, React 19, TypeScript, AntDesign 6, `@tanstack/react-query` v5, `react-router-dom` v7, `axios`.

## Global Constraints

- Backend work happens in the existing worktree at `/Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service` (branch `worktree-platform-identity-service`) — continue on that branch, do not create a new one.
- Frontend project location: `/Users/frontend/workspace/go-project-practices/platform-identity-admin` (new directory, sibling to the other 15 services — but since the backend branch is still unmerged, create the frontend directory inside the SAME worktree, at `.../worktrees/platform-identity-service/platform-identity-admin`, so both land in one branch together).
- Response envelope for the new endpoints: `{"success": true, "data": {...}}` / `{"success": false, "error": {"code": "...", "message": "..."}}` — exact match to every other endpoint in this service.
- `GET /roles` returns `[{"id": 1, "name": "user"}, {"id": 2, "name": "admin"}]` shape (array of `models.Role`, JSON-tagged `id`/`name`).
- `GET /projects/{id}/users` requires `RequireAuth` + caller must satisfy `roleassign.SameProjectAdmin.CanAssign` for that project id — same 403 behavior/message as `POST /users/{id}/role`.
- No UI CRUD buttons for operations the backend doesn't support: no project edit/delete, no role create/edit/delete, no direct user create/delete from this panel.
- Local Postgres is already running and reachable at `localhost:5433` (db `postgres`, user `postgres`, password `1`) for backend tests.
- Frontend dev server env var for the API base URL: `VITE_PLATFORM_IDENTITY_API_URL`, defaulting to `http://localhost:8095/api/v1` in the local `.env`.
- Commit messages: no AI attribution trailer, following this branch's existing convention.

---

## File Structure

### Backend additions (existing worktree)

```
platform-identity-service/
  internal/
    repository/
      user_repository.go        — MODIFY: add ListByProject
      repository_test.go        — MODIFY: add TestUserRepository_ListByProject
      role_repository.go        — CREATE: NewRoleRepository, List
    service/
      user_service.go           — MODIFY: add ListByProject
      user_service_test.go      — MODIFY: add TestUserService_ListByProject_* tests
      role_service.go           — CREATE: NewRoleService, List
    handlers/
      user_handler.go           — MODIFY: add ListByProject handler
      role_handler.go           — CREATE: NewRoleHandler, List
      auth_handler_test.go      — MODIFY: extend the full-flow test to cover both new endpoints
  cmd/api/main.go                — MODIFY: wire RoleRepository/RoleService/RoleHandler, add both routes
```

### Frontend: new `platform-identity-admin` project

```
platform-identity-admin/
  package.json, tsconfig*.json, vite.config.ts, index.html
  .env                                    — VITE_PLATFORM_IDENTITY_API_URL=http://localhost:8095/api/v1
  src/
    main.tsx
    App.tsx
    api/
      httpClient.ts        — createApiClient + envelope unwrap (copied from taobao-v1-admin, adapted)
      httpClients.ts        — single platformIdentityApi instance
      auth.ts                — login()
      projects.ts             — listProjects(), createProject()
      users.ts                — listUsersByProject(), setUserRole()
      roles.ts                — listRoles()
      types.ts                — Project, Role, User, JwtClaims, ApiError types
    auth/
      jwt.ts                  — decodeToken, isExpired (copied from taobao-v1-admin)
      AuthContext.tsx          — token/claims state, login/logout (copied, adapted)
      RequireAuth.tsx          — redirect to /login if no token, or if claims.role !== 'admin'
    hooks/
      useQueryErrorToast.ts    — copied verbatim from taobao-v1-admin
    layouts/
      AppLayout.tsx            — Sider (3 items: Layihələr/Rollar/İstifadəçilər) + Header + Outlet
    pages/
      LoginPage.tsx
      ProjectsPage.tsx
      RolesPage.tsx
      UsersPage.tsx
```

---

## Backend Tasks

### Task 1: `GET /roles` endpoint

**Files:**
- Create: `platform-identity-service/internal/repository/role_repository.go`
- Modify: `platform-identity-service/internal/repository/repository_test.go`
- Create: `platform-identity-service/internal/service/role_service.go`
- Create: `platform-identity-service/internal/handlers/role_handler.go`
- Modify: `platform-identity-service/cmd/api/main.go`

**Interfaces:**
- Consumes: `models.Role{ID int16, Name string}` (already exists in `internal/models/models.go`).
- Produces: `repository.RoleRepository{NewRoleRepository(db *sql.DB) *RoleRepository}` with `List(ctx) ([]models.Role, error)`.
- Produces: `service.RoleService{NewRoleService(repo *repository.RoleRepository) *RoleService}` with `List(ctx) ([]models.Role, error)`.
- Produces: `handlers.RoleHandler{NewRoleHandler(svc *service.RoleService) *RoleHandler}` with `List(w http.ResponseWriter, r *http.Request)`, registered at `GET /roles` (unauthenticated, top-level under `/api/v1`, same tier as `GET /projects`).

- [ ] **Step 1: Write the failing repository test**

Add to `platform-identity-service/internal/repository/repository_test.go`:

```go
func TestRoleRepository_List(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	repo := NewRoleRepository(db)

	roles, err := repo.List(context.Background())
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(roles) != 2 {
		t.Fatalf("expected 2 seeded roles, got %d", len(roles))
	}
	byName := map[string]int16{}
	for _, r := range roles {
		byName[r.Name] = r.ID
	}
	if byName["user"] != 1 {
		t.Errorf("expected 'user' role id 1, got %d", byName["user"])
	}
	if byName["admin"] != 2 {
		t.Errorf("expected 'admin' role id 2, got %d", byName["admin"])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/repository/... -run TestRoleRepository_List -v
```
Expected: FAIL — `NewRoleRepository` undefined.

- [ ] **Step 3: Write `internal/repository/role_repository.go`**

```go
package repository

import (
	"context"
	"database/sql"

	"platform-identity-service/internal/models"
)

type RoleRepository struct {
	db *sql.DB
}

func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) List(ctx context.Context) ([]models.Role, error) {
	const q = `SELECT id, name FROM roles ORDER BY id`
	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := []models.Role{}
	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/repository/... -run TestRoleRepository_List -v
```
Expected: PASS.

- [ ] **Step 5: Write `internal/service/role_service.go`**

```go
package service

import (
	"context"

	"platform-identity-service/internal/models"
	"platform-identity-service/internal/repository"
)

type RoleService struct {
	repo *repository.RoleRepository
}

func NewRoleService(repo *repository.RoleRepository) *RoleService {
	return &RoleService{repo: repo}
}

func (s *RoleService) List(ctx context.Context) ([]models.Role, error) {
	return s.repo.List(ctx)
}
```

No test needed for this trivial pass-through — it has no branching logic (matches this codebase's existing pattern where `ProjectService.List` also has no dedicated test beyond `TestProjectService_CreateAndGet`, since the repository test already covers the query correctness).

- [ ] **Step 6: Write `internal/handlers/role_handler.go`**

```go
package handlers

import (
	"net/http"

	"platform-identity-service/internal/service"
)

type RoleHandler struct {
	svc *service.RoleService
}

func NewRoleHandler(svc *service.RoleService) *RoleHandler {
	return &RoleHandler{svc: svc}
}

type roleResponse struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

// List godoc
// @Summary      List all roles
// @Description  Sabit 2 rolu qaytarır (user, admin).
// @Tags         roles
// @Produce      json
// @Success      200 {array} roleResponse
// @Router       /roles [get]
func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list roles")
		return
	}

	response := make([]roleResponse, len(roles))
	for i, role := range roles {
		response[i] = roleResponse{ID: role.ID, Name: role.Name}
	}
	writeJSON(w, http.StatusOK, response)
}
```

- [ ] **Step 7: Wire into `cmd/api/main.go`**

In `platform-identity-service/cmd/api/main.go`, add after the `userRepo := repository.NewUserRepository(db)` line:

```go
	roleRepo := repository.NewRoleRepository(db)
```

After `userService := service.NewUserService(...)`:

```go
	roleService := service.NewRoleService(roleRepo)
```

After `userHandler := handlers.NewUserHandler(userService)`:

```go
	roleHandler := handlers.NewRoleHandler(roleService)
```

Inside `r.Route("/api/v1", func(r chi.Router) { ... })`, after the `r.Get("/projects/{id}", projectHandler.Get)` line (in the public, non-`RequireAuth` section):

```go
		r.Get("/roles", roleHandler.List)
```

- [ ] **Step 8: Build, run full test suite, manually verify**

```bash
go build ./...
go test ./... -v
```
Expected: all packages PASS, build succeeds.

```bash
go run ./cmd/api &
sleep 2
curl -s http://localhost:8095/api/v1/roles; echo
kill %1
```
Expected: `{"success":true,"data":[{"id":1,"name":"user"},{"id":2,"name":"admin"}]}`.

- [ ] **Step 9: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/repository/role_repository.go \
  platform-identity-service/internal/repository/repository_test.go \
  platform-identity-service/internal/service/role_service.go \
  platform-identity-service/internal/handlers/role_handler.go \
  platform-identity-service/cmd/api/main.go
git commit -m "feat(platform-identity-service): add GET /roles endpoint"
```

---

### Task 2: `GET /projects/{id}/users` endpoint

**Files:**
- Modify: `platform-identity-service/internal/repository/user_repository.go`
- Modify: `platform-identity-service/internal/repository/repository_test.go`
- Modify: `platform-identity-service/internal/service/user_service.go`
- Modify: `platform-identity-service/internal/service/user_service_test.go`
- Modify: `platform-identity-service/internal/handlers/user_handler.go`
- Modify: `platform-identity-service/cmd/api/main.go`

**Interfaces:**
- Consumes: `roleassign.Caller`/`Target`/`RoleAssigner` (existing), `models.User` (existing).
- Produces: `UserRepository.ListByProject(ctx, projectID string) ([]models.User, error)`.
- Produces: `UserService.ListByProject(ctx, caller roleassign.Caller, projectID string) ([]models.User, error)` — returns `ErrForbidden` if caller doesn't satisfy `assigner.CanAssign(caller, roleassign.Target{ProjectID: projectID})` (note: `Target.UserID` is irrelevant here since `CanAssign` never inspects it — pass `""`).
- Produces: `UserHandler.ListByProject(w, r)`, registered at `GET /projects/{id}/users` under the `RequireAuth` group.

- [ ] **Step 1: Write the failing repository test**

Add to `platform-identity-service/internal/repository/repository_test.go`:

```go
func TestUserRepository_ListByProject(t *testing.T) {
	db := testDB(t)
	defer db.Close()
	projectRepo := NewProjectRepository(db)
	userRepo := NewUserRepository(db)

	p1 := &models.Project{ID: uuid.NewString(), Name: "ListByProject A " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	p2 := &models.Project{ID: uuid.NewString(), Name: "ListByProject B " + uuid.NewString(), CreatedAt: time.Now().UTC()}
	if err := projectRepo.Create(context.Background(), p1); err != nil {
		t.Fatalf("create p1 failed: %v", err)
	}
	if err := projectRepo.Create(context.Background(), p2); err != nil {
		t.Fatalf("create p2 failed: %v", err)
	}

	adminRoleID := int16(2)
	userRoleID := int16(1)
	u1 := &models.User{
		ID: uuid.NewString(), Name: "P1 Admin", Username: "p1admin-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p1.ID, RoleID: &adminRoleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	u2 := &models.User{
		ID: uuid.NewString(), Name: "P1 Member", Username: "p1member-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p1.ID, RoleID: &userRoleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	u3 := &models.User{
		ID: uuid.NewString(), Name: "P2 Admin", Username: "p2admin-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", PasswordHash: "hash",
		ProjectID: &p2.ID, RoleID: &adminRoleID,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	for _, u := range []*models.User{u1, u2, u3} {
		if err := userRepo.Create(context.Background(), u); err != nil {
			t.Fatalf("create user failed: %v", err)
		}
	}

	got, err := userRepo.ListByProject(context.Background(), p1.ID)
	if err != nil {
		t.Fatalf("ListByProject failed: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 users in project p1, got %d", len(got))
	}
	ids := map[string]bool{}
	for _, u := range got {
		ids[u.ID] = true
		if u.RoleName == "" {
			t.Errorf("expected joined RoleName to be populated for user %s, got empty", u.ID)
		}
	}
	if !ids[u1.ID] || !ids[u2.ID] {
		t.Errorf("expected p1's two users in result, got ids: %v", ids)
	}
	if ids[u3.ID] {
		t.Errorf("did not expect p2's user in p1's result")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go test ./internal/repository/... -run TestUserRepository_ListByProject -v
```
Expected: FAIL — `ListByProject` undefined.

- [ ] **Step 3: Add `ListByProject` to `internal/repository/user_repository.go`**

Add this method after `CountByProject`:

```go
func (r *UserRepository) ListByProject(ctx context.Context, projectID string) ([]models.User, error) {
	rows, err := r.db.QueryContext(ctx, selectUserWithRole+" WHERE u.project_id = $1 ORDER BY u.created_at", projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Username, &u.Email, &u.PasswordHash,
			&u.ProjectID, &u.RoleID, &u.RoleName, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/repository/... -run TestUserRepository_ListByProject -v
```
Expected: PASS.

- [ ] **Step 5: Write the failing service tests**

Add to `platform-identity-service/internal/service/user_service_test.go`:

```go
func TestUserService_ListByProject_SameProjectAdminSucceeds(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p, _ := projectSvc.Create(context.Background(), "ListByProject Success "+uuid.NewString())
	admin, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Admin", Username: "admin-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register admin failed: %v", err)
	}
	_, err = authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p.ID, Name: "Member", Username: "member-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register member failed: %v", err)
	}

	caller := roleassign.Caller{UserID: admin.ID, ProjectID: p.ID, Role: admin.RoleName}
	users, err := userSvc.ListByProject(context.Background(), caller, p.ID)
	if err != nil {
		t.Fatalf("ListByProject failed: %v", err)
	}
	if len(users) != 2 {
		t.Errorf("expected 2 users (admin + member), got %d", len(users))
	}
}

func TestUserService_ListByProject_CrossProjectForbidden(t *testing.T) {
	userSvc, authSvc, projectSvc := newTestUserService(t)

	p1, _ := projectSvc.Create(context.Background(), "ListByProject Cross A "+uuid.NewString())
	p2, _ := projectSvc.Create(context.Background(), "ListByProject Cross B "+uuid.NewString())

	admin1, err := authSvc.Register(context.Background(), RegisterInput{
		ProjectID: p1.ID, Name: "Admin1", Username: "admin1-" + uuid.NewString(),
		Email: uuid.NewString() + "@example.com", Password: "password123",
	})
	if err != nil {
		t.Fatalf("register admin1 failed: %v", err)
	}

	caller := roleassign.Caller{UserID: admin1.ID, ProjectID: p1.ID, Role: admin1.RoleName}
	_, err = userSvc.ListByProject(context.Background(), caller, p2.ID)
	if err != ErrForbidden {
		t.Errorf("expected ErrForbidden for cross-project list, got %v", err)
	}
}
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
go test ./internal/service/... -run TestUserService_ListByProject -v
```
Expected: FAIL — `ListByProject` undefined on `UserService`.

- [ ] **Step 7: Add `ListByProject` to `internal/service/user_service.go`**

Add this method after `Get`:

```go
// ListByProject returns every user in projectID. Caller must be an admin
// within that same project — reuses the same RoleAssigner check as SetRole,
// with the project itself as the target (UserID is irrelevant to CanAssign).
func (s *UserService) ListByProject(ctx context.Context, caller roleassign.Caller, projectID string) ([]models.User, error) {
	if !s.assigner.CanAssign(caller, roleassign.Target{ProjectID: projectID}) {
		return nil, ErrForbidden
	}
	return s.repo.ListByProject(ctx, projectID)
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
go test ./internal/service/... -v
```
Expected: all PASS (including pre-existing `UserService` tests, no regressions).

- [ ] **Step 9: Add the handler method to `internal/handlers/user_handler.go`**

Add this method and its response type after `SetRole`:

```go
type projectUserResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// ListByProject godoc
// @Summary      List a project's users
// @Description  Caller həmin layihənin admin-i olmalıdır.
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Project ID"
// @Success      200 {array} projectUserResponse
// @Failure      403 {object} map[string]string
// @Router       /projects/{id}/users [get]
func (h *UserHandler) ListByProject(w http.ResponseWriter, r *http.Request) {
	caller, ok := middleware.CallerFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	projectID := chi.URLParam(r, "id")
	users, err := h.svc.ListByProject(r.Context(), caller, projectID)
	if err != nil {
		if errors.Is(err, service.ErrForbidden) {
			writeError(w, http.StatusForbidden, "admin role within this project required")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}

	response := make([]projectUserResponse, len(users))
	for i, u := range users {
		response[i] = projectUserResponse{ID: u.ID, Name: u.Name, Username: u.Username, Email: u.Email, Role: u.RoleName}
	}
	writeJSON(w, http.StatusOK, response)
}
```

- [ ] **Step 10: Wire the route into `cmd/api/main.go`**

Inside the `r.Group(func(r chi.Router) { r.Use(appmiddleware.RequireAuth(jwtManager)) ... })` block, after `r.Post("/users/{id}/role", userHandler.SetRole)`:

```go
			r.Get("/projects/{id}/users", userHandler.ListByProject)
```

- [ ] **Step 11: Build, run full suite, manually verify end-to-end**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go build ./...
go test ./... -v
```
Expected: all packages PASS.

```bash
go run ./cmd/api &
sleep 2
PROJECT_ID=$(curl -s -X POST http://localhost:8095/api/v1/projects -H "Content-Type: application/json" -d '{"name":"E2E Test"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
curl -s -X POST http://localhost:8095/api/v1/auth/register -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"name\":\"E2E Admin\",\"username\":\"e2e-admin\",\"email\":\"e2e-admin@example.com\",\"password\":\"password123\"}"
TOKEN=$(curl -s -X POST http://localhost:8095/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"e2e-admin","password":"password123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s "http://localhost:8095/api/v1/projects/$PROJECT_ID/users" -H "Authorization: Bearer $TOKEN"; echo
kill %1
```
Expected: the final curl returns `{"success":true,"data":[{"id":"...","name":"E2E Admin","username":"e2e-admin","email":"e2e-admin@example.com","role":"admin"}]}`.

- [ ] **Step 12: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-service/internal/repository/user_repository.go \
  platform-identity-service/internal/repository/repository_test.go \
  platform-identity-service/internal/service/user_service.go \
  platform-identity-service/internal/service/user_service_test.go \
  platform-identity-service/internal/handlers/user_handler.go \
  platform-identity-service/cmd/api/main.go
git commit -m "feat(platform-identity-service): add GET /projects/{id}/users endpoint"
```

---

## Frontend Tasks

### Task 3: Scaffold `platform-identity-admin`, API client, auth

**Files:**
- Create: `platform-identity-admin/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `.env`
- Create: `platform-identity-admin/src/main.tsx`
- Create: `platform-identity-admin/src/api/httpClient.ts`
- Create: `platform-identity-admin/src/api/httpClients.ts`
- Create: `platform-identity-admin/src/api/types.ts`
- Create: `platform-identity-admin/src/api/auth.ts`
- Create: `platform-identity-admin/src/auth/jwt.ts`
- Create: `platform-identity-admin/src/auth/AuthContext.tsx`
- Create: `platform-identity-admin/src/auth/RequireAuth.tsx`
- Create: `platform-identity-admin/src/hooks/useQueryErrorToast.ts`

**Interfaces:**
- Produces: `createApiClient(baseURL: string): AxiosInstance`, `platformIdentityApi` (configured instance), `ApiRequestError`.
- Produces: `Project`, `Role`, `User`, `JwtClaims`, `ApiError` TypeScript types.
- Produces: `login(identifier: string, password: string): Promise<{token: string}>`.
- Produces: `decodeToken(token: string): JwtClaims`, `isExpired(claims: JwtClaims): boolean`.
- Produces: `AuthProvider`, `useAuth()` returning `{token, claims, login, logout}`.
- Produces: `RequireAuth` route-guard component — redirects to `/login` if no token, or if `claims.role !== 'admin'`.
- Produces: `useQueryErrorToast(isError: boolean, error: unknown): void`.

These are consumed by every page task that follows.

- [ ] **Step 1: Scaffold the Vite project**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
npm create vite@latest platform-identity-admin -- --template react-ts
cd platform-identity-admin
npm install antd @ant-design/icons @tanstack/react-query axios react-router-dom
```

- [ ] **Step 2: Write `.env`**

```bash
cat > .env <<'EOF'
VITE_PLATFORM_IDENTITY_API_URL=http://localhost:8095/api/v1
EOF
```

- [ ] **Step 3: Write `src/api/types.ts`**

```typescript
export interface ApiError {
  code: string;
  message: string;
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
}

export interface JwtClaims {
  user_id: string;
  project_id: string;
  role: string;
  exp: number;
  iat?: number;
}
```

- [ ] **Step 4: Write `src/api/httpClient.ts`**

```typescript
import axios, { type AxiosInstance } from 'axios';
import type { ApiError } from './types';

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.status = status;
  }
}

export function unwrapEnvelope<T>(status: number, body: Envelope<T>): T {
  if (body.success) {
    return body.data as T;
  }
  throw new ApiRequestError(status, body.error ?? { code: 'error', message: 'Unknown error' });
}

export function createApiClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (response.status === 204 || !response.data) {
        return response;
      }
      response.data = unwrapEnvelope(response.status, response.data);
      return response;
    },
    (error) => {
      if (error.response) {
        if (error.response.status === 401) {
          const hadToken = !!localStorage.getItem('token');
          if (hadToken) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        if (error.response.data) {
          try {
            unwrapEnvelope(error.response.status, error.response.data);
          } catch (unwrapped) {
            return Promise.reject(unwrapped);
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
```

- [ ] **Step 5: Write `src/api/httpClients.ts`**

```typescript
import { createApiClient } from './httpClient';

export const platformIdentityApi = createApiClient(import.meta.env.VITE_PLATFORM_IDENTITY_API_URL);
```

- [ ] **Step 6: Write `src/api/auth.ts`**

```typescript
import { platformIdentityApi } from './httpClients';

export async function login(identifier: string, password: string): Promise<{ token: string }> {
  const response = await platformIdentityApi.post<{ token: string }>('/auth/login', { identifier, password });
  return response.data;
}
```

- [ ] **Step 7: Write `src/auth/jwt.ts`**

```typescript
import type { JwtClaims } from '../api/types';

export function decodeToken(token: string): JwtClaims {
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) {
    throw new Error('malformed token: missing payload segment');
  }
  const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json) as JwtClaims;
}

export function isExpired(claims: JwtClaims): boolean {
  return claims.exp * 1000 <= Date.now();
}
```

- [ ] **Step 8: Write `src/auth/AuthContext.tsx`**

```typescript
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { decodeToken, isExpired } from './jwt';
import type { JwtClaims } from '../api/types';

interface AuthState {
  token: string | null;
  claims: JwtClaims | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): AuthState {
  const token = localStorage.getItem('token');
  if (!token) {
    return { token: null, claims: null };
  }
  try {
    const claims = decodeToken(token);
    if (isExpired(claims)) {
      localStorage.removeItem('token');
      return { token: null, claims: null };
    }
    return { token, claims };
  } catch {
    localStorage.removeItem('token');
    return { token: null, claims: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStoredToken);
  const queryClient = useQueryClient();

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setState({ token, claims: decodeToken(token) });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    queryClient.clear();
    setState({ token: null, claims: null });
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ token: state.token, claims: state.claims, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
```

Note: remove the unused `QueryClient` import if your editor flags it — only `useQueryClient` is used; `QueryClient` was listed defensively but isn't referenced. Import only `useQueryClient` from `@tanstack/react-query`.

- [ ] **Step 9: Write `src/auth/RequireAuth.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth() {
  const { token, claims } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (claims?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
```

- [ ] **Step 10: Write `src/hooks/useQueryErrorToast.ts`**

```typescript
import { useEffect } from 'react';
import { message } from 'antd';

export function useQueryErrorToast(isError: boolean, error: unknown) {
  useEffect(() => {
    if (isError) {
      message.error(error instanceof Error ? error.message : 'Xəta baş verdi');
    }
  }, [isError, error]);
}
```

- [ ] **Step 11: Write `src/main.tsx`**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`App.tsx` is written in Task 6 once the pages exist — leave a placeholder `src/App.tsx` for now that just renders `<div>Loading…</div>` so `npm run build` succeeds at the end of this task, OR skip building until Task 6. This task's own build check (Step 12) only needs `tsc` to type-check the files written so far — run `npx tsc --noEmit` on the individual new files' directory scope isn't practical with project references, so defer the full `npm run build` check to Task 6 and instead confirm this task's files have no syntax errors via `npx tsc --noEmit -p tsconfig.app.json` (it will report errors about missing page imports from `App.tsx`'s placeholder, or about `App.tsx` itself if left as Vite's scaffolded default — that's expected and resolved in Task 6).

- [ ] **Step 12: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/package.json platform-identity-admin/package-lock.json \
  platform-identity-admin/vite.config.ts platform-identity-admin/tsconfig*.json \
  platform-identity-admin/index.html platform-identity-admin/.env \
  platform-identity-admin/src/main.tsx platform-identity-admin/src/api \
  platform-identity-admin/src/auth platform-identity-admin/src/hooks
git commit -m "feat(platform-identity-admin): scaffold Vite project, API client, JWT auth"
```

---

### Task 4: Layout, Login page

**Files:**
- Create: `platform-identity-admin/src/layouts/AppLayout.tsx`
- Create: `platform-identity-admin/src/pages/LoginPage.tsx`

**Interfaces:**
- Consumes: `useAuth()` (Task 3), `login()` from `api/auth.ts` (Task 3).
- Produces: `AppLayout` (rendered inside `RequireAuth` in `App.tsx`, wraps `Outlet`), `LoginPage`.

- [ ] **Step 1: Write `src/layouts/AppLayout.tsx`**

```typescript
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { AppstoreOutlined, TeamOutlined, TagsOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Sider, Header, Content } = Layout;

const items: MenuProps['items'] = [
  { key: '/projects', icon: <AppstoreOutlined />, label: 'Layihələr' },
  { key: '/roles', icon: <TagsOutlined />, label: 'Rollar' },
  { key: '/users', icon: <TeamOutlined />, label: 'İstifadəçilər' },
];

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{ padding: 16, fontWeight: 600, fontSize: 16 }}>Platform Identity Admin</div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
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

- [ ] **Step 2: Write `src/pages/LoginPage.tsx`**

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
      if (claims.role !== 'admin') {
        message.error('Yalnız admin rolunda olan istifadəçilər giriş edə bilər');
        return;
      }
      setToken(token);
      navigate('/projects');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Login uğursuz oldu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Platform Identity Admin — Giriş" style={{ width: 360 }}>
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

- [ ] **Step 3: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/layouts platform-identity-admin/src/pages/LoginPage.tsx
git commit -m "feat(platform-identity-admin): add AppLayout and LoginPage"
```

---

### Task 5: Projects and Roles pages

**Files:**
- Create: `platform-identity-admin/src/api/projects.ts`
- Create: `platform-identity-admin/src/api/roles.ts`
- Create: `platform-identity-admin/src/pages/ProjectsPage.tsx`
- Create: `platform-identity-admin/src/pages/RolesPage.tsx`

**Interfaces:**
- Consumes: `platformIdentityApi` (Task 3), `Project`/`Role` types (Task 3), `useQueryErrorToast` (Task 3).
- Produces: `listProjects()`, `createProject(name)`, `listRoles()` — consumed here and by `UsersPage` (Task 6, which needs `listProjects()` for its dropdown).

- [ ] **Step 1: Write `src/api/projects.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { Project } from './types';

export async function listProjects(): Promise<Project[]> {
  const response = await platformIdentityApi.get<Project[]>('/projects');
  return response.data;
}

export async function createProject(name: string): Promise<Project> {
  const response = await platformIdentityApi.post<Project>('/projects', { name });
  return response.data;
}
```

- [ ] **Step 2: Write `src/api/roles.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { Role } from './types';

export async function listRoles(): Promise<Role[]> {
  const response = await platformIdentityApi.get<Role[]>('/roles');
  return response.data;
}
```

- [ ] **Step 3: Write `src/pages/ProjectsPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Form, Input, Modal, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Project } from '../api/types';
import { createProject, listProjects } from '../api/projects';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';
import { message } from 'antd';

interface ProjectFormValues {
  name: string;
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<ProjectFormValues>();

  const { data: projects, isLoading, isError, error } = useQuery({ queryKey: ['projects'], queryFn: () => listProjects() });
  useQueryErrorToast(isError, error);

  const createMutation = useMutation({
    mutationFn: (values: ProjectFormValues) => createProject(values.name),
    onSuccess: () => {
      message.success('Layihə yaradıldı');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'ID', dataIndex: 'id' },
    { title: 'Yaradılma tarixi', dataIndex: 'created_at' },
  ];

  return (
    <>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        Yeni layihə
      </Button>
      <Table rowKey="id" loading={isLoading} dataSource={projects} columns={columns} />
      <Modal
        title="Yeni layihə"
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

- [ ] **Step 4: Write `src/pages/RolesPage.tsx`**

```typescript
import { Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { listRoles } from '../api/roles';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

export function RolesPage() {
  const { data: roles, isLoading, isError, error } = useQuery({ queryKey: ['roles'], queryFn: () => listRoles() });
  useQueryErrorToast(isError, error);

  const columns = [
    { title: 'ID', dataIndex: 'id' },
    { title: 'Ad', dataIndex: 'name' },
  ];

  return <Table rowKey="id" loading={isLoading} dataSource={roles} columns={columns} pagination={false} />;
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/api/projects.ts platform-identity-admin/src/api/roles.ts \
  platform-identity-admin/src/pages/ProjectsPage.tsx platform-identity-admin/src/pages/RolesPage.tsx
git commit -m "feat(platform-identity-admin): add ProjectsPage (create+list) and RolesPage (read-only)"
```

---

### Task 6: Users page, App.tsx wiring, verified local run

**Files:**
- Create: `platform-identity-admin/src/api/users.ts`
- Create: `platform-identity-admin/src/pages/UsersPage.tsx`
- Modify/Create: `platform-identity-admin/src/App.tsx`

**Interfaces:**
- Consumes: `listProjects()` (Task 5), `platformIdentityApi` (Task 3), `User` type (Task 3), `AppLayout`/`LoginPage`/`ProjectsPage`/`RolesPage` (Tasks 4-5), `AuthProvider`/`RequireAuth` (Task 3).
- Produces: the fully wired app — no further consumers within this plan.

- [ ] **Step 1: Write `src/api/users.ts`**

```typescript
import { platformIdentityApi } from './httpClients';
import type { User } from './types';

export async function listUsersByProject(projectId: string): Promise<User[]> {
  const response = await platformIdentityApi.get<User[]>(`/projects/${projectId}/users`);
  return response.data;
}

export async function setUserRole(userId: string, role: string): Promise<User> {
  const response = await platformIdentityApi.post<User>(`/users/${userId}/role`, { role });
  return response.data;
}
```

- [ ] **Step 2: Write `src/pages/UsersPage.tsx`**

```typescript
import { useState } from 'react';
import { Button, Select, Space, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../api/types';
import { listProjects } from '../api/projects';
import { listUsersByProject, setUserRole } from '../api/users';
import { useQueryErrorToast } from '../hooks/useQueryErrorToast';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
  });

  const effectiveProjectId = selectedProjectId ?? projects?.[0]?.id ?? null;

  const {
    data: users,
    isLoading: usersLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['project-users', effectiveProjectId],
    queryFn: () => listUsersByProject(effectiveProjectId!),
    enabled: !!effectiveProjectId,
  });
  useQueryErrorToast(isError, error);

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => setUserRole(userId, role),
    onSuccess: () => {
      message.success('Rol dəyişdirildi');
      queryClient.invalidateQueries({ queryKey: ['project-users', effectiveProjectId] });
    },
    onError: (err) => message.error(err instanceof Error ? err.message : 'Xəta baş verdi'),
  });

  const columns = [
    { title: 'Ad', dataIndex: 'name' },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'role' },
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
      <Table rowKey="id" loading={usersLoading} dataSource={users} columns={columns} />
    </>
  );
}
```

- [ ] **Step 3: Write `src/App.tsx`** (replaces Vite's scaffolded default)

```typescript
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RolesPage } from './pages/RolesPage';
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
                <Route index element={<Navigate to="/projects" replace />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Build and type-check**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run build
```
Expected: builds cleanly, no TypeScript errors.

- [ ] **Step 5: Verify locally end-to-end against the real backend**

Ensure `platform-identity-service` is running (from Task 2's verification, or start it fresh):

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-service
go run ./cmd/api > /tmp/pis.log 2>&1 &
sleep 2
```

Start the frontend dev server:

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service/platform-identity-admin
npm run dev &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
```
Expected: `200`.

Manually verify (report what you see, since this can't be fully automated via curl for a SPA):
1. Open `http://localhost:5173` in a browser (or use a headless check) — confirm it redirects to `/login`.
2. Register a test admin via the backend directly first (curl `/auth/register` with a fresh `project_id` from `POST /projects`, as in Task 2 Step 11), then log in through the UI with those credentials.
3. Confirm redirect to `/projects`, the sider shows Layihələr/Rollar/İstifadəçilər.
4. Click "Yeni layihə", create one, confirm it appears in the table.
5. Click Rollar, confirm the 2-row read-only table (user, admin) appears.
6. Click İstifadəçilər, confirm the project dropdown is populated and selecting a project shows its users; click "Admin et"/"User et" on a row and confirm the table updates.

Stop both background processes when done:
```bash
kill %1 %2
```

- [ ] **Step 6: Commit**

```bash
cd /Users/frontend/workspace/go-project-practices/.claude/worktrees/platform-identity-service
git add platform-identity-admin/src/api/users.ts platform-identity-admin/src/pages/UsersPage.tsx platform-identity-admin/src/App.tsx
git commit -m "feat(platform-identity-admin): add UsersPage, wire App.tsx routing, verified local run"
```

---

## Self-Review Notes

- **Spec coverage:** `GET /roles` (Task 1), `GET /projects/{id}/users` reusing `SameProjectAdmin` (Task 2), Vite+React+AntD+TanStack Query scaffold matching `taobao-v1-admin` (Task 3), Sider with exactly 3 items + Login (Task 4), Projects (Create+Read) + Roles (Read-only) pages (Task 5), Users page with project-selector dropdown + role-change buttons + full App wiring + verified local run (Task 6) — all spec sections covered.
- **Type consistency:** `User` type in `api/types.ts` matches the handler's `projectUserResponse` JSON shape (`id, name, username, email, role`) exactly — double-checked field names line up between Task 2's Go struct and Task 3's TypeScript interface. `roleassign.Target{ProjectID: projectID}` in Task 2 correctly omits `UserID` since `CanAssign` never reads it (confirmed against the existing `strategy.go` implementation).
- **No placeholders:** every step has complete code, no "add appropriate handling" language. Task 3 Step 11 explicitly explains why the full build check is deferred to Task 6 rather than leaving that gap unstated.
