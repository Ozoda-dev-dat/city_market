# City Market App

A grocery delivery mobile app built with Expo (React Native) frontend and Express.js backend.

## Architecture

- **Frontend**: Expo/React Native app with Expo Router for file-based navigation
- **Backend**: Express.js API server with TypeScript
- **Database**: PostgreSQL (Replit built-in)
- **ORM**: Drizzle ORM with shared schema

## Project Structure

```
app/           - Expo Router screens (auth, tabs, orders, admin, courier)
components/    - Shared React Native components
context/       - React context providers
hooks/         - Custom React hooks
lib/           - Shared utilities (query-client, auth, etc.)
server/        - Express.js backend
  index.ts     - Main server entry point (port 5000)
  routes.ts    - API routes
  db-storage.ts - PostgreSQL storage layer
shared/        - Shared types and Drizzle schema
services/      - Client-side service modules
```

## Running the App

Two workflows are configured:
- **Start Backend**: `npm run server:dev` — Express server on port 5000 (landing page + API)
- **Start Frontend**: Expo dev server on port 8080 — shows QR code for mobile testing

### First-time DB setup

Run once after cloning or when the database is reset:

```bash
npm run db:setup
```

This creates all tables and seeds initial data (categories, products, promo codes, admin user). Tables are created with `IF NOT EXISTS` so it is safe to re-run.

## API Configuration

The frontend communicates with the backend via `EXPO_PUBLIC_DOMAIN` environment variable.
When running in Replit, this is set to `$REPLIT_DEV_DOMAIN` so the Expo app connects to the Express server.

## Database

All tables are managed via Drizzle ORM schema in `shared/schema.ts`.
Tables: users, categories, products, promo_codes, orders, wishlists, product_reviews,
notifications, payment_transactions, payment_methods, refunds, admin_settings,
inventory_movements, system_logs, audit_logs, subcategories.

`subcategories` table: id (varchar UUID), category_id (varchar FK → categories.id), name, icon, color, bgColor, created_at.
`products` table has nullable `subcategory_id` column FK → subcategories.id.

## Known Issues Fixed

- **iOS white screen (root cause)**: `@expo-google-fonts/poppins` npm package was corrupted — missing `useFonts.js` file. `_layout.tsx` imports from the package which threw `Cannot find module './useFonts'` before React could render anything. Fixed by reinstalling the package.
- **expo-image-picker version**: Downgraded from v55 to v17.0.10 to match SDK 54 expected version.
- **Lazy route loading**: Added `EXPO_ROUTER_IMPORT_MODE=lazy` to the Start Frontend workflow to prevent future route-level import crashes at startup.
- **Login**: All 5 user passwords hashed with bcrypt; removed KeyboardProvider/netinfo; fixed hardcoded IPs.

## User Roles

- **customer**: Regular shoppers
- **courier**: Delivery personnel
- **admin**: Store administrators

## Expo Go / QR Code Access

The Express server (port 5000) proxies all Expo Go requests to Metro (port 8080).
Detection: `expo-platform` header OR Metro paths (`.bundle`, `/node_modules/`, `/__metro`, `/.expo/`).
QR Code URL: `exp://676ddd9d-40c4-4c87-b81a-1982d5d7af1c-00-10zioiyuwaojs.sisko.replit.dev`
Scan with Expo Go app to open on a physical device.

## Known Fixes Applied

- `lib/data-security.ts`: Removed Node.js `crypto` module import (not available in RN); replaced with platform-guarded stubs.
- `lib/error-handling.ts`: Fixed invalid TypeScript `let stack?: string` → `let stack: string | undefined`.
- `hooks/useErrorHandler.ts` → renamed to `.tsx` (file contained JSX syntax).
- `react-native-worklets` package installed (required by react-native-reanimated v4).
- Several packages (`expo-modules-core`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-native-paper`, etc.) reinstalled to fix incomplete TypeScript source files in npm cache.
- Passwords in DB re-hashed with bcrypt (were stored as plain text, bcrypt comparison failed at login).
- Removed `react-native-keyboard-controller` (`KeyboardProvider`) from `_layout.tsx` — native library not available in Expo Go.
- Replaced `@react-native-community/netinfo` usage in `OfflineComponents.tsx` — wrong version for SDK 54; replaced with simple Platform-aware online detection.
- Fixed hardcoded local IPs in `LocationContext.tsx` and `network-manager.ts` — now use `getApiUrl()` and `EXPO_PUBLIC_DOMAIN`.
- **iOS white screen fix**: Upgraded `expo-router@3.5.24` → `expo-router@6.0.23` to match Expo SDK 54 / React Native 0.81 New Architecture requirements. v3 was incompatible with iOS native navigation in Expo Go SDK 54.
- Added `SafeAreaProvider` at the root layout level so `ErrorFallback` (which uses `useSafeAreaInsets`) renders properly on error.

## UI Design System

- **Primary color**: Forest green `#16A34A` (replaced old red `#E53E3E`)
- **Full palette**: `constants/colors.ts` — light + dark modes
- **Tab bar**: Floating pill (marginHorizontal: 48, borderRadius: 31), icon-only, iOS BlurView
- **Home screen**: Ionicons-based category circles + banner icons (no emojis anywhere)
- **Product grid**: 2-column layout (`numColumns={2}`) in catalog
- **Auth screen**: LinearGradient hero + white card form with tabbed login/register
- **Profile**: Initial-letter avatar on green circle (no emoji)
- **Design rules**: NEVER use emojis; use `@expo/vector-icons` Ionicons; no purple gradients

## Orders API (Role-based)

- **Admin**: `GET /api/orders` — all orders
- **Customer/Courier**: `GET /api/orders/my` — own orders only
- `ProductsContext.tsx` auto-selects endpoint based on `user.role`

## Product Images

All 149 products use real stock photos from Unsplash and Pexels (free CDNs, no API key required).

- **Unsplash**: `https://images.unsplash.com/photo-{ID}?w=400&q=80`
- **Pexels**: `https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=400`
- Full external URLs are stored directly in the `products.image` column
- `resolveImageUrl(path)` in `lib/query-client.ts` returns external URLs unchanged; prepends `getApiUrl()` only for relative server paths
- `ProductCard`, `app/product/[id].tsx`, and `app/(tabs)/cart.tsx` all call `resolveImageUrl` before rendering images
- Backend: `/assets` static middleware registered BEFORE the Metro proxy so any local assets are also served correctly

## Key Dependencies

- expo-router@6.0.23 for navigation (must match Expo SDK 54)
- @tanstack/react-query for server state
- drizzle-orm for database access
- express for the API server
- bcryptjs for password hashing
- jsonwebtoken for auth tokens
