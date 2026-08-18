# platform-identity-service — Design

**Date:** 2026-08-18
**Repo:** go-project-practices (new 15th microservice)
**Status:** Approved for planning

## Purpose

A standalone Go microservice that provides a central User/Admin identity and
project-registration module. Any future, independent application ("project")
registers itself here. Each project gets its own set of users; each user
belongs to exactly one project and holds one of two fixed roles within it:
`user` or `admin`.

This is deliberately **separate** from the existing `shop-role-service`
(which models `shop_id` + hierarchical `shop_role_level` for the
`taobao-v1` marketplace's own shop staff). That model stays untouched.
`platform-identity-service` is a new, independent identity provider meant to
serve future SaaS-style projects, not the existing 14 taobao-v1 services.

## Scope decisions (from brainstorming)

- **Projects are new, independent applications** — not the 14 existing
  go-project-practices microservices.
- **A user belongs to exactly one project** (no many-to-many). Simplifies the
  originally proposed `user_role_project` join table into direct columns on
  `users`.
- **Roles are global and fixed**: `user` and `admin` only. No per-project
  custom roles (YAGNI — can be added later if a real need appears).
- **Auth is fully self-contained**: this service issues and verifies its own
  JWTs. It does not depend on `registration-service` or
  `authorization-service`.
- **Project creation is an open, unauthenticated endpoint.** There is no
  system-level superadmin concept yet. `POST /projects` is meant to be used
  by whoever is standing up a new project (e.g. via a seed script or admin
  tooling), not by end users of that project.
- **A project's first registered user automatically becomes `admin`;**
  every subsequent registration under that `project_id` defaults to `user`.
  `POST /auth/register` never accepts a client-supplied role — this keeps
  the open registration endpoint safe (nobody can self-promote to admin)
  while still giving every project exactly one initial admin without a
  separate bootstrapping step.
- **No plaintext password storage.** The originally sketched schema had both
  `password` and `passwordhash`; only a bcrypt `password_hash` is kept.

## Data model

```sql
CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id   SMALLSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL   -- seeded: 'user', 'admin'
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  project_id    UUID REFERENCES projects(id),
  role_id       SMALLINT REFERENCES roles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`roles` is seeded with exactly two rows (`user`, `admin`) via migration —
not a runtime-mutable table for now.

## API (chi router, `/api/v1` prefix, same JSON envelope as other services)

| Method | Path                  | Auth                          | Purpose |
|--------|-----------------------|--------------------------------|---------|
| POST   | `/projects`           | none                            | Create a new project |
| GET    | `/projects`           | none                            | List projects |
| GET    | `/projects/{id}`      | none                            | Project details |
| POST   | `/auth/register`      | none                            | Register a user under a `project_id`; first user in that project → `admin`, all later ones → `user` |
| POST   | `/auth/login`         | none                            | Email/username + password → JWT |
| GET    | `/users/{id}`         | Bearer JWT                      | Self, or (if caller is `admin`) any user in caller's own project |
| POST   | `/users/{id}/role`    | Bearer JWT, caller must be `admin` | Promote/demote a user's role — only within the caller's own project |

JWT claims: `user_id`, `project_id`, `role`.

**First-admin assignment implementation note:** `Register` must count
existing users for `project_id` and insert the new user transactionally
(`SELECT ... FOR UPDATE` on the project row, or a single `INSERT ...
SELECT` with a `COUNT(*)` subquery) so two concurrent first registrations
for the same brand-new project can't both become `admin`.

Envelope format matches the rest of go-project-practices:
```json
{"success": true, "data": {...}}
{"success": false, "error": {"code": "forbidden", "message": "..."}}
```

## Authorization rule

An `admin` may only act on users within their own `project_id`. There is no
cross-project or system-level superadmin — mirrors the "shop's own admin(4)
manages only their shop" pattern already used in `shop-role-service`, just
generalized to "project" instead of "shop" and to a flat two-level role
instead of a 4-level hierarchy.

## Package layout

Matches existing services' skeleton exactly:

```
platform-identity-service/
  cmd/api/main.go
  internal/
    config/       — env loading, port default 8095
    database/      — postgres connection
    repository/    — projects, users, roles queries
    service/       — business logic, authorization checks
    handlers/      — HTTP handlers, request/response DTOs
    middleware/     — JWT auth middleware
    auth/          — JWT issue/verify (jwt.go)
    logclient/      — fire-and-forget calls to log-service (:8091)
    docs/          — swagger
```

Port: **8095** (next free port after existing 8081–8094).
`.env` file with DB + `PORT=8095` + `CORS_ALLOWED_ORIGINS` +
`LOG_SERVICE_URL`, following the same pattern as every other service.

## Testing

- Repository layer: integration tests against local Postgres (`localhost:5433`), matching existing services' test style if any exist — otherwise standard Go table-driven unit tests for service-layer authorization logic (same-project-only enforcement, role validation).
- Handler layer: httptest-based request/response tests for the envelope format and status codes.

## Out of scope (explicitly deferred, not silently dropped)

- Per-project custom roles beyond `user`/`admin`.
- Multi-project membership per user.
- System-level superadmin across all projects.
- Any integration with the existing 14 taobao-v1 services or
  `shop-role-service`.
