---
name: Replit Postgres SSL mismatch
description: Apps migrated from Neon/other hosted Postgres often hardcode ssl:'require', which breaks against Replit's built-in Postgres.
---

Symptom: after provisioning Replit's built-in PostgreSQL, API requests fail with `Client network socket disconnected before secure TLS connection was established` / `ECONNRESET`.

**Why:** Replit's built-in Postgres connection string uses `sslmode=disable` (it's on a private local network, `PGHOST=helium`), but code originally written for Neon/other hosted Postgres often hardcodes `ssl: 'require'` in the `postgres`/`pg` client config.

**How to apply:** When migrating a project that provisions Replit Postgres, grep the codebase for `ssl: 'require'` / `ssl: true` in DB client setup and make it conditional, e.g. derive from whether the connection string contains `sslmode=disable`, rather than assuming SSL is always required.
