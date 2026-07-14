---
title: Multi-Store UX — Registration, Catalog & Management
---
# Multi-Store UX — Registration, Catalog & Management

## What & Why
The multi-store backend already exists (stores table, /api/store/* routes, app/(store)/ screens, WebSocket new-order notifications). What's missing is the user-facing UX that ties it all together: store owners can't register from the app's auth screen, customers can't browse by store, and the admin has no UI to manage stores.

## Done looks like
- Auth screen has a "Do'kon ochish" (Open a store) tab/button in the register flow; store owner fills in store name, address, phone and creates their account — they land directly on the store cabinet (app/(store)/)
- Customer catalog has a "Do'konlar" section (horizontal scroll of store cards with logo/name); tapping a store filters products to that store's items only; product cards show the store name badge
- Admin panel has a "Do'konlar" tab listing all registered stores with status (active/inactive), store name, owner name, product count, and toggle to activate/deactivate
- Store order detail screen clearly shows each item line: product name, quantity, price — with "Tayyorlashni boshlash" and "Tayyor" action buttons
- When a new order arrives the store cabinet shows an animated badge on the Orders tab and a banner notification at the top of the screen
- Store profile screen lets the owner edit store name, description, address, phone and upload a logo

## Out of scope
- Payment splitting between stores
- Multi-store cart (one store per order is fine for now)
- Store rating/reviews

## Steps
1. **Store registration in auth screen** — Add a "Do'kon ochish" option to the existing register tab; show additional fields (store name, address, phone) when store role is selected; on success navigate to app/(store)/
2. **Customer catalog — store browsing** — Add a horizontal store cards row at the top of the catalog screen; add store name badge to ProductCard; add store filter state so tapping a store card filters the product grid to that store only
3. **Admin store management tab** — Add a "Do'konlar" tab to the admin panel that lists all stores from /api/admin/stores; include activate/deactivate toggle and store details (owner, product count, revenue); use existing admin layout pattern
4. **Store order detail improvements** — In app/(store)/orders.tsx, expand the order detail view to show a clear item checklist (product name + quantity + unit price); add "Tayyorlashni boshlash" (preparing) and "Tayyor" (ready) action buttons per-order with color-coded status
5. **New order banner notification** — In the store cabinet layout, show a slide-in banner at the top when a new-order WebSocket event fires, displaying order number and total; auto-dismiss after 5 seconds with a tap-to-view action

## Relevant files
- `app/(auth)/index.tsx`
- `app/(tabs)/catalog.tsx`
- `components/ProductCard.tsx`
- `app/(store)/_layout.tsx`
- `app/(store)/orders.tsx`
- `app/(store)/profile.tsx`
- `app/admin/index.tsx`
- `server/routes.ts:72-135`
- `server/routes.ts:780-810`
- `shared/schema.ts`