# FreshMart

A grocery shopping mobile app built with Expo (React Native) and an Express backend.

## Architecture

- **Frontend**: Expo / React Native (Expo Router for file-based routing)
- **Backend**: Express server (TypeScript, via `tsx`)
- **Database**: PostgreSQL with Drizzle ORM (schema in `shared/schema.ts`)
- **State Management**: React Query (@tanstack/react-query) + React Context
- **Styling**: React Native StyleSheet

## Project Structure

```
app/               # Expo Router screens (file-based routing)
  (tabs)/          # Tab screens: index, catalog, cart, profile
  admin/           # Admin screens: products, categories, orders
  product/[id].tsx # Product detail screen
assets/            # Images, icons
components/        # Shared UI components
constants/         # Colors, static data
context/           # React contexts (CartContext, ProductsContext)
lib/               # query-client.ts (React Query + API helpers)
server/            # Express backend
  index.ts         # Server entry point (port 5000)
  routes.ts        # API routes (prefix /api)
  storage.ts       # Data storage layer (MemStorage)
  templates/       # landing-page.html
shared/            # Shared TypeScript types
  schema.ts        # Drizzle/Zod schemas (users table)
scripts/           # build.js (static Expo build for production)
```

## Workflows

- **Start Backend**: `npm run server:dev` — Express server on port 5000 (serves landing page + API)
- **Start Frontend**: `npm run expo:dev` — Expo Metro bundler (port 8081, scan QR code with Expo Go)

## Development

The backend serves on port 5000 and acts as both:
1. A landing page with QR code for scanning with Expo Go
2. An API server for `/api/*` routes

In development, users scan the QR code with Expo Go to preview the app on their phone.

## Deployment

- Build: `npm run expo:static:build && npm run server:build`
- Run: `node server_dist/index.js`
- Target: autoscale

The static build compiles the Expo app and embeds it in the Express server for production serving.

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required for drizzle-kit)
- `REPLIT_DEV_DOMAIN` — Set automatically by Replit (used for CORS + QR code URL)
- `EXPO_PUBLIC_DOMAIN` — Set in expo:dev script (points Expo client to backend)
