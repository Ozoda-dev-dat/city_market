---
name: Removed dead admin-services module
description: server/app.ts + admin-routes.ts + related services/* were never wired into the live server; removed. Note for future admin-panel backend work.
---

`server/app.ts`, `server/admin-routes.ts`, and `services/admin-dashboard-service.ts`,
`services/admin-user-service.ts`, `services/admin-settings-service.ts`,
`services/inventory-service.ts` formed a self-contained module tree that was never
imported by the actual running server (`server/index.ts` → `server/routes.ts`).
It was only reachable via a handful of standalone `npm run admin:*` / `inventory:*` /
`users:*` / `settings:*` CLI scripts in package.json, not via any HTTP route the
Expo app calls. It has been deleted (along with those now-dead package.json scripts).

**Why:** Any fix applied to that module tree had zero effect on the running app —
confirmed by tracing that nothing outside the tree referenced its exports, and that
`server/routes.ts` has its own independent implementations (e.g. `PATCH /api/password`,
audit logging via `server/db-storage.ts` + `server/audit-service.ts`) for the same
concerns the dead module duplicated.

**How to apply:** The real, live admin backend logic lives directly in
`server/routes.ts` (registered in `server/index.ts`) plus `server/db-storage.ts`
(which already calls `auditService` from `server/audit-service.ts` for
users/products/categories/orders/promoCodes inserts/updates/deletes/restores).
Before "fixing" any `services/*-service.ts` file for the admin panel, grep for who
actually imports it — if nothing outside its own tree does, it's not live.
