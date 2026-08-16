# Bid.cars Telegram Bot — Design

**Status:** Draft, awaiting spec review
**Date:** 2026-08-16
**Related:** deployed on [157.180.73.79](../../../../me-github/my-servers/157.180.73.79.md) (shared with tesla-video-drive, live-video-player, youtube-remote-webrtc, teslahubs-nav)

## 1. Overview

A Telegram bot that watches [bid.cars](https://bid.cars) (a Cloudflare-protected salvage-auction listing site) for new car listings matching a configurable filter, and auto-posts each matching new listing to a Telegram channel. The filter (make/model, year range, max price) is managed live via bot commands sent by the owner in a private chat with the bot — no redeploy needed to change it.

Bot already created via @BotFather: `t.me/teslahubsAuctionBot`. Token is stored on the deploy server at `/opt/bid-cars-bot/.env` (chmod 600, never committed to git).

## 2. Scope

**In scope:**
- Scrape bid.cars' listing/search results for new auction lots, polling every 10 minutes
- Cloudflare "managed challenge" bypass via a real headless Chromium instance (Playwright), with a persisted browser context (cookies) to avoid re-solving the challenge every poll
- Filter management via Telegram bot commands (`/filter_add`, `/filter_remove`, `/filter_maxprice`, `/filter_show`, `/filter_clear`), restricted to one authorized admin Telegram user ID
- Dedup: each lot is posted to the channel at most once
- Auto-post new matching listings to a Telegram channel (photo + make/model/year, current bid price, damage type, location, auction date, listing link)
- Failure alerting: after 3 consecutive scrape failures, the bot DMs the admin so a broken parser/challenge doesn't fail silently
- Deployment as a systemd service on 157.180.73.79

**Out of scope (this iteration):**
- On-demand search (`/search` command with inline results) — push-to-channel only, per owner's choice
- Multi-user / multi-channel support (one owner, one channel)
- Bidding, watchlists, or any write action against bid.cars itself — read-only scraping
- Historical backfill of listings that existed before the bot started
- A web UI for managing filters (Telegram commands are the only interface)

## 3. Architecture

```
┌─────────────┐   every 10 min   ┌──────────────┐   new matching lot   ┌──────────────┐
│  Scheduler  │ ────────────────▶│   Scraper    │─────────────────────▶│  Telegram    │
│ (node-cron) │                  │ (Playwright, │                      │   Channel    │
└─────────────┘                  │  Chromium)   │                      └──────────────┘
                                  └──────┬───────┘
                                         │ parsed listings
                                         ▼
                                  ┌──────────────┐   /filter_add BMW    ┌──────────────┐
                                  │  Postgres:   │◀─────────────────────│  Telegram    │
                                  │  filters,    │   (admin-only DM)    │  Bot (grammY)│
                                  │  seen_lots   │                      └──────────────┘
                                  └──────────────┘
```

**Stack:** Node.js + TypeScript, Playwright (Chromium, already installed on the deploy server), grammY (Telegram bot framework), Postgres via `pg`, `node-cron` for scheduling.

**Folder structure:**
```
bid-cars-bot/
├── src/
│   ├── scraper/
│   │   ├── browser.ts       ← launches/reuses a persisted Playwright context
│   │   ├── search.ts        ← builds the bid.cars search URL from the active filter, navigates, waits out the Cloudflare challenge
│   │   └── parseLots.ts     ← parses rendered DOM into Lot[] (id, make, model, year, price, damage, location, auctionDate, imageUrl, url)
│   ├── db/
│   │   ├── schema.sql       ← filters, seen_lots tables
│   │   ├── filters.ts       ← CRUD for the active filter
│   │   └── seenLots.ts      ← dedup check + insert
│   ├── bot/
│   │   ├── commands.ts      ← /filter_add, /filter_remove, /filter_maxprice, /filter_show, /filter_clear (admin-gated)
│   │   └── post.ts          ← formats and sends a Lot to the channel
│   ├── scheduler.ts         ← node-cron job: scrape → filter → dedupe → post → alert-on-failure
│   └── index.ts             ← wires everything, starts the bot + scheduler
├── .env.example             ← BOT_TOKEN, CHANNEL_ID, ADMIN_USER_ID, DATABASE_URL (real .env stays server-only, gitignored)
└── package.json
```

## 4. Data flow

1. `scheduler.ts` fires every 10 minutes.
2. `search.ts` builds the bid.cars search URL from the current row in `filters`, opens it in the persisted Playwright context, waits for the Cloudflare challenge to clear and results to render.
3. `parseLots.ts` extracts all visible lots from the page.
4. For each lot: skip if its `id` is already in `seen_lots`; otherwise insert it and hand it to `post.ts`.
5. `post.ts` sends one formatted message (photo + caption) per new matching lot to `CHANNEL_ID`.
6. On any step throwing (challenge not cleared, selector not found, network error), the failure is logged and a counter increments; 3 consecutive failures triggers one DM to `ADMIN_USER_ID` ("scrape has failed 3x in a row, check the bot"), then the counter resets so it doesn't spam on every subsequent poll.

**Message format:**
```
🚗 2020 BMW 3 Series
💰 Hazırkı bid: $12,300
📍 Location: Houston, TX
🔧 Zərər: Front End
📅 Hərrac tarixi: 2026-08-20
🔗 [Elana bax](bid.cars/lot/xxxxx)
```

## 5. Error handling

- **Cloudflare challenge fails to clear:** retried once within the same poll (fresh page navigation); if still failing, counts toward the 3-strike admin alert.
- **Page structure changed (selectors return nothing):** treated the same as a scrape failure — logged with the raw HTML saved to disk for post-mortem, counts toward the 3-strike alert. This is the most likely failure mode long-term, since bid.cars' HTML and Cloudflare's bot-detection level can change without notice — that risk is accepted, not solved, by this design.
- **Telegram API errors (rate limit, channel not found):** logged; does not affect `seen_lots` state, so the same lot is retried on the next successful post attempt rather than being lost.
- **Browser crash:** the persisted context is relaunched on the next scheduled poll.

## 6. Testing

- **Parser (`parseLots.ts`):** unit-tested against saved HTML fixtures (a snapshot of a real, already-rendered bid.cars results page), since scripting a live Cloudflare challenge in CI isn't practical.
- **Filter/dedupe/scheduler logic:** unit-tested with mocked `Lot[]` input and an in-memory/test Postgres schema — no real browser or network involved.
- **End-to-end (Cloudflare bypass + real posting):** manual verification on the deploy server after each deploy; not automated.

## 7. Deployment (157.180.73.79)

1. Install Postgres (`apt install postgresql`), create a `bid_cars_bot` database + role.
2. Project lives at `/opt/bid-cars-bot`. `.env` (already has `BOT_TOKEN`; `CHANNEL_ID`, `ADMIN_USER_ID`, `DATABASE_URL` added during setup) stays server-only, never committed.
3. `npx playwright install chromium --with-deps` for the extra OS-level dependencies Chromium needs.
4. systemd unit `bid-cars-bot.service`, `Restart=always`.
5. Remaining owner-side prerequisites before the bot can post: create the Telegram channel, add `@teslahubsAuctionBot` as admin, and get the owner's numeric Telegram user ID (e.g. via `@userinfobot`) for `ADMIN_USER_ID`.

## 8. Risks (accepted, not solved by this design)

- bid.cars can change its HTML structure or raise its Cloudflare bot-detection level at any time, breaking the scraper without warning beyond the 3-strike DM alert.
- Scraping a Cloudflare-protected site may be against bid.cars' terms of service; this is for personal/private use (one owner, one private channel), not redistribution or commercial use.
- Postgres on a 3.7GB-RAM VPS already running several other services is a heavier dependency than the data volume needs (SQLite would have sufficed), but was an explicit owner choice.
