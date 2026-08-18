# Tesla Owner API (Unofficial) — OpenAPI spec

**⚠ As of April-May 2026, Tesla began actively rejecting this flow's auth for new client_id
registrations** (`redirect_uri not registered` — confirmed via live testing and community reports).
For working authentication today, see [`../tesla-fleet-api-openapi/`](../tesla-fleet-api-openapi/)
— Tesla's official, currently-supported Fleet API. This folder still documents the endpoint
shapes accurately; only the auth flow is broken.

**⚠ Unofficial.** Generated from [tesla-api.timdorr.com](https://tesla-api.timdorr.com) (the
community-maintained `timdorr/tesla-api` documentation project), cross-checked against that
project's canonical internal endpoint registry
([`ownerapi_endpoints.json`](https://github.com/timdorr/tesla-api/blob/master/ownerapi_endpoints.json),
551 entries). Tesla does not publish or support a public API for this surface and can change or
break any of it without notice. Using it may violate Tesla's Terms of Service — use at your own
risk, for personal/research purposes only.

## What's in here

| File | What |
|---|---|
| `openapi.yaml` / `openapi.json` | The spec — 91 paths / 92 operations across every documented page on the site (Authentication, API Basics, Vehicle State, Vehicle Commands, Energy Products). Identical content, pick whichever your tooling prefers. |
| `index.html` | Swagger UI, points at `openapi.yaml`. |
| `extras.json` | The two things that don't fit an OpenAPI `paths:` object — see below. |
| `get_login_url.py` | **Recommended.** Prints a Step 1 login URL + matching `code_verifier`, no network call. Open the URL in a real browser, log in, copy `code` from the address bar after the final (broken, expected) redirect. |
| `get_step1_fields.py` | Tries to script Step 1/2 directly. Kept for reference — live-tested 2026-08-16 and Tesla's WAF served an Akamai bot challenge instead of the real form. Use `get_login_url.py` instead. |

## Getting an authorization code (Step 1-2) in practice

Scripting `GET /oauth2/v3/authorize` with a plain HTTP client (`urllib`, `requests`, `curl`, …)
gets served an Akamai bot-management challenge, not the real login form — confirmed by an actual
run against `auth.tesla.com`. This matches how real community clients (e.g.
[TeslaPy](https://github.com/tdorssers/TeslaPy)) handle it: don't script the login form at all.

```bash
python3 get_login_url.py
# -> open the printed URL in a real browser, log in with your Tesla account
# -> it redirects to https://auth.tesla.com/void/callback?code=...&state=...
#    (the page fails to load on purpose — that host doesn't resolve to anything)
# -> copy the `code` value straight out of the browser's address bar
```

That `code`, plus the `code_verifier` the script printed, is everything Step 3
(`getOrRefreshToken`, `grant_type=authorization_code`) needs.

## Coverage

Every page listed in the site's [`llms.txt`](https://tesla-api.timdorr.com/llms.txt) index was
fetched and extracted, cross-referenced against the canonical endpoint registry for exact
method/path/auth. Endpoints not found in that registry are flagged `x-unverified-path: true` in
the spec (mostly older commands like `charge_standard`/`charge_max_range` that appear superseded
by `set_charge_limit`, and a couple of energy-site status endpoints).

A handful of Energy Products **Commands** endpoints (`operation`, `grid_import_export`,
`time_of_use_settings`, `command`, `program`, `event`, `preference`,
`off_grid_vehicle_charging_reserve`) are listed on the source site by path only — it explicitly
says their request/response bodies "are not yet documented". Those operations are in the spec
with a real path/method, but no fabricated request or response schema.

## What's *not* in `paths:` — and why

OpenAPI models request/response REST endpoints. Two things on the site aren't that:

- **Streaming Telemetry** and **Autopark/Summon** (`vehicle/streaming.md`, `vehicle/autopark.md`)
  are protocols, not single REST calls — and as of this generation (2026-08-16) their source pages
  are literally stubs ("Please help fill this out!"). The Introduction page does confirm: Streaming
  is "a streaming HTTP API that provides JSON objects at regular intervals" and Autopark/Summon "uses
  a standard WebSocket" — both on hosts other than `owner-api.teslamotors.com`. See
  `extras.json` → `webSocketEndpoints` for exactly what is/isn't documented.
- **Vehicle Option Codes** (`vehicle/optioncodes.md`) is a static reference table (hundreds of
  rows: model, region, color, wheels, Autopilot hardware, etc.), not an endpoint — it's the set of
  values that can appear in a vehicle's `option_codes` field. A sample is in `extras.json` →
  `referenceData`; see the source page for the full table.

## Running Swagger UI locally

```bash
cd docs/tesla-api-openapi
python3 -m http.server 6060
# open http://localhost:6060
```

## Regenerating

The merge/generation script (and the raw per-section JSON extracts it reads) lived in a scratch
directory for this session, not in this repo — this folder is the output. To refresh: re-fetch the
site pages, rebuild the same JSON shape, and regenerate `openapi.yaml`/`openapi.json`.
