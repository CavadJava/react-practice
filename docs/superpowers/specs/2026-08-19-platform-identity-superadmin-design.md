# platform-identity-service Superadmin — Design

**Date:** 2026-08-19
**Repo:** go-project-practices (platform-identity-service + platform-identity-admin)
**Status:** Approved for planning

## Purpose

Add a third, system-level role — `superadmin` — that can see and manage
users across every project, not just its own. The existing model only had
`user`/`admin`, where an admin is scoped to exactly one project via
`roleassign.SameProjectAdmin`. This adds a role that bypasses that scoping.

## Scope decisions (from brainstorming)

- **Superadmin is a genuine new system-level role**, not a UI-only
  aggregation trick. It's seeded (bootstrapped), not self-service —
  there's no endpoint to create a superadmin; that would be a much larger
  and riskier feature (who can grant it? how is the first one bootstrapped
  safely?) that this scope deliberately avoids.
- **Bootstrap is a hardcoded/seeded first superadmin**, created during
  `database.Migrate()`, matching this service's existing "seed roles via
  migration" pattern. Credentials come from `.env`
  (`SUPERADMIN_USERNAME`/`SUPERADMIN_PASSWORD`), defaulting to dev values
  if unset — consistent with how `JWT_SECRET` etc. already work, though
  unlike `JWT_SECRET` this one is allowed to have an insecure default
  since it's a bootstrap convenience, not a cryptographic key (the
  superadmin should change their own password later — out of scope here,
  no password-change endpoint exists at all yet in this service).
- **Full authority, not read-only**: superadmin can both list all users
  across all projects AND change any user's role in any project — not
  just view. This means the authorization Strategy itself changes, not
  just a new read endpoint.
- **Reuses the Strategy pattern already in place** (`roleassign.RoleAssigner`
  from the original design) — this is exactly the extension point that
  pattern was built for. A new strategy,
  `SuperadminOrSameProjectAdmin`, replaces `SameProjectAdmin` as what's
  injected into `UserService`. `SetRole` needs no code change — it already
  goes through `s.assigner.CanAssign(...)`.

## Data model changes

```sql
-- roles: add a 3rd seeded row
INSERT INTO roles (id, name) VALUES (3, 'superadmin')
ON CONFLICT (id) DO NOTHING;
```

`models.go` gets a third role constant:

```go
const RoleSuperadmin = "superadmin"
```

**Bootstrap user**: seeded in `database.Migrate()`, `project_id = NULL`,
`role_id = 3`. Idempotent (`ON CONFLICT (username) DO NOTHING` or
equivalent — must not fail or duplicate on repeated migration runs, same
as the existing `roles` seed).

## Backend changes

### New Strategy: `roleassign.SuperadminOrSameProjectAdmin`

```go
func (s *SuperadminOrSameProjectAdmin) CanAssign(caller Caller, target Target) bool {
	if caller.Role == models.RoleSuperadmin {
		return true
	}
	return caller.Role == models.RoleAdmin && caller.ProjectID != "" && caller.ProjectID == target.ProjectID
}
```

Wired into `UserService` in `main.go` in place of `NewSameProjectAdmin()`.
The old `SameProjectAdmin` struct stays in the codebase (still directly
tested, still a valid smaller building block) — the new strategy composes
it rather than duplicating its logic, or reimplements the same check
inline; either is acceptable, the plan will decide based on which reads
cleaner against the actual file.

### New endpoint: `GET /users`

- `RequireAuth`, caller must be `superadmin` (checked directly in the
  service method — this one isn't a `CanAssign` question since there's no
  single "target project," it's "give me everything").
- Returns every user across every project, each row including which
  project it belongs to (name, not just id — the admin panel needs the
  name to display, so the query joins `projects` the same way it already
  joins `roles`).
- New repository method: `UserRepository.ListAll(ctx) ([]models.User,
  error)` — but `models.User` doesn't carry a project *name* today, only
  `ProjectID`. Add a `ProjectName string` field to `models.User` (populated
  only by this new query via `LEFT JOIN projects`, empty/unused elsewhere —
  matches the existing precedent of `RoleName` being a join-only field on
  the same struct).
- New service method: `UserService.ListAll(ctx, caller roleassign.Caller)
  ([]models.User, error)` — returns `ErrForbidden` if
  `caller.Role != models.RoleSuperadmin`.
- New handler: `UserHandler.ListAll`, response type adds `project_name`
  to the existing `projectUserResponse` shape (or a new
  `allUsersResponse` type with `project_id`+`project_name`+the rest).

### Existing `POST /users/{id}/role` behavior change

No code change needed in the handler or service — swapping the injected
`RoleAssigner` in `main.go` makes cross-project `SetRole` work for a
superadmin caller automatically, since the strategy is the single point
where that decision is made.

## Frontend changes (`platform-identity-admin`)

- `UsersPage`: branch on `claims.role`.
  - `role === 'superadmin'`: no project dropdown; fetch `GET /users`
    directly; table gets an extra **Layihə** column (project name) since
    rows now span multiple projects.
  - `role === 'admin'` (existing behavior, unchanged): project dropdown,
    `GET /projects/{id}/users`, no project column (redundant — the
    dropdown already scopes it).
- `RequireAuth`: currently rejects anyone whose `claims.role !== 'admin'`.
  Must be loosened to accept `'admin' | 'superadmin'` — a superadmin
  logging into this panel should not be bounced to `/login`.
- Role-change buttons ("Admin et" / "User et") stay as they are for
  ordinary rows; a superadmin viewing another superadmin's row is not a
  case this scope handles specially (promoting/demoting *to* or *from*
  superadmin via this UI is out of scope — see below).

## Out of scope (explicitly deferred, not silently dropped)

- Any UI or endpoint to grant/revoke the `superadmin` role itself (only
  the seeded bootstrap account has it; promoting someone to superadmin
  requires direct DB access for now).
- Password change/rotation for the bootstrap superadmin account.
- Project management (create/list/get) gaining any superadmin-specific
  behavior — `POST /projects` is already open to anyone, unaffected by
  this change.
- Audit logging of superadmin actions.
