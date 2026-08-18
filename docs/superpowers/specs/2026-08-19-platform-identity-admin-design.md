# platform-identity-admin — Design

**Date:** 2026-08-19
**Repos:** go-project-practices (backend extension) + go-project-practices/platform-identity-admin (new frontend)
**Status:** Approved for planning

## Purpose

An admin panel for `platform-identity-service` (the identity/project-registration
microservice built 2026-08-18). Lets a project's admin manage their project's
projects, roles, and users from a browser instead of curl/Swagger.

## Scope decisions (from brainstorming)

- **Stack matches `taobao-v1-admin`** (an existing React admin panel for a
  sibling part of this monorepo family): Vite + React 19 + AntDesign 6 +
  TanStack Query + react-router-dom + axios. Not Bootstrap — the user's
  "bootstrap" meant "set up from scratch," not the CSS framework.
- **Classic sider + content layout**, not a master-detail single page: left
  Sider has exactly 3 nav items — Layihələr (Projects), Rollar (Roles),
  İstifadəçilər (Users) — each routing to its own page. Each page is a
  standard AntD `Table` + CRUD panel on the right, mirroring
  `taobao-v1-admin`'s `ShopsPage` pattern (`Table` + `Modal` + TanStack Query
  mutations + `invalidateQueries`).
- **CRUD depth matches what the backend actually supports** — no UI buttons
  for operations the API can't do:
  - Projects: Create + Read only (no Update/Delete backend endpoints exist).
  - Roles: Read only (fixed 2-row seed, no mutation endpoint).
  - Users: Read (scoped to one project at a time) + role change only (no
    direct create/delete-user endpoints on this page — registration happens
    via `/auth/register`, out of scope for this admin panel).
- **Users page needs a project selector**, since `GET /projects/{id}/users`
  is project-scoped and there is no "all users across all projects"
  endpoint. A small dropdown at the top of the Users page (populated from
  `GET /projects`) selects which project's users to display.
- **Login is real** (username/password against `/auth/login`), not a
  pasted-token shortcut. After login, only `role === "admin"` in the JWT
  claims is allowed past the router guard — mirrors `taobao-v1-admin`'s
  `RequireAuth`/`RequireRole` pattern.
- **New frontend project location:** `go-project-practices/platform-identity-admin`,
  next to the backend it manages — not a separate top-level repo the way
  `taobao-v1-admin` is separate from `taobao-v1`, since this is a much
  smaller, single-purpose panel.

## Backend extension (`platform-identity-service`)

Two new endpoints, following the service's existing TDD/layering convention
(repository → service → handler → route):

| Method | Path                     | Auth                                   | Purpose |
|--------|--------------------------|------------------------------------------|---------|
| GET    | `/roles`                 | none                                     | List the fixed 2 roles (`user`, `admin`) |
| GET    | `/projects/{id}/users`   | Bearer JWT, caller must be that project's admin | List all users in one project |

- `GET /roles`: trivial — reads the `roles` table (2 rows), returns
  `[{id, name}]`. No new authorization logic needed.
- `GET /projects/{id}/users`: reuses the existing `roleassign.SameProjectAdmin`
  strategy (already built for `SetRole`) — the caller's `Caller{ProjectID,
  Role}` from the JWT must satisfy `CanAssign(caller, Target{ProjectID: id})`
  the same way `POST /users/{id}/role` already checks it, except here the
  "target" is the project itself rather than an individual user (any
  `Target.UserID` works since `CanAssign` doesn't inspect it — pass an
  empty string or a placeholder).
- New repository method: `UserRepository.ListByProject(ctx, projectID
  string) ([]models.User, error)` — same `selectUserWithRole` JOIN query
  used by `GetByID`/`GetByUsernameOrEmail`, filtered by `project_id` instead
  of `id`/`username`/`email`.
- New service method on `UserService`: `ListByProject(ctx, caller
  roleassign.Caller, projectID string) ([]models.User, error)` — authorizes
  via the same `RoleAssigner` interface already injected into `UserService`,
  then delegates to the repository.

## Frontend: `platform-identity-admin`

### Layout

```
┌─────────────┬─────────────────────────────┐
│ Sider       │ Content (routed)             │
│             │                               │
│ Layihələr   │                               │
│ Rollar      │                               │
│ İstifadəçi. │                               │
└─────────────┴─────────────────────────────┘
```

Mirrors `taobao-v1-admin/src/layouts/AppLayout.tsx`'s shape (AntD `Layout`
with `Sider`/`Header`/`Content`, `Menu` driving `react-router-dom`
navigation via `useNavigate`), simplified to a flat 3-item menu (no
role-conditional groups needed — every user who reaches this panel is
already an admin).

### Pages

- **`LoginPage`** — username/password form → `POST /auth/login`. On
  success, decode the JWT, reject (with an error message, no navigation)
  if `role !== "admin"`; otherwise store the token and redirect to
  `/projects`.
- **`ProjectsPage`** (`/projects`) — `Table` fed by `GET /projects`
  (TanStack Query). "Yeni layihə" button opens a `Modal` with a `Form`
  (name field) that calls `POST /projects` on submit, then invalidates the
  query. No edit/delete actions (not supported by the backend).
- **`RolesPage`** (`/roles`) — `Table` fed by `GET /roles`. Read-only, no
  action column.
- **`UsersPage`** (`/users`) — a `Select` dropdown at the top, populated
  from `GET /projects`, defaulting to the first project. Below it, a
  `Table` fed by `GET /projects/{selectedId}/users`, re-fetching whenever
  the selection changes (TanStack Query key includes the selected project
  id). Each row has a role-change control (e.g. a small `Select` or two
  buttons "Admin et" / "User et") that calls `POST /users/{id}/role` and
  invalidates the users query on success.

### Auth

- `src/auth/AuthContext.tsx` — holds the JWT (in-memory + localStorage,
  matching `taobao-v1-admin`'s pattern), exposes `claims`, `login()`,
  `logout()`.
- `src/auth/jwt.ts` — decode-only JWT parsing (no verification client-side;
  the backend is the source of truth for validity).
- `src/auth/RequireAuth.tsx` — route guard: no token → redirect to
  `/login`; token present but `claims.role !== "admin"` → show a
  "Forbidden" page instead of the dashboard.

### API layer

`src/api/{auth,projects,users,roles}.ts` — thin axios wrappers, one file
per resource, matching `taobao-v1-admin/src/api/*.ts`'s one-file-per-
resource convention. Base URL points at `platform-identity-service`
(`http://localhost:8095/api/v1` in dev, via a Vite env var).

## Out of scope (explicitly deferred, not silently dropped)

- Project update/delete (backend doesn't support it).
- Role create/update/delete (fixed 2-role system, backend doesn't support it).
- User creation from the admin panel (use `/auth/register` directly, or a
  future "invite user" feature).
- Cross-project user search/listing (no backend endpoint for it).
- Any styling/theming beyond what AntD's defaults + `taobao-v1-admin`'s
  existing CSS patterns provide.
