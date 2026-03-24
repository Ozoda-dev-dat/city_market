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

## API Configuration

The frontend communicates with the backend via `EXPO_PUBLIC_DOMAIN` environment variable.
When running in Replit, this is set to `$REPLIT_DEV_DOMAIN` so the Expo app connects to the Express server.

## Database

All tables are managed via Drizzle ORM schema in `shared/schema.ts`.
Tables: users, categories, products, promo_codes, orders, wishlists, product_reviews,
notifications, payment_transactions, payment_methods, refunds, admin_settings,
inventory_movements, system_logs, audit_logs.

## User Roles

- **customer**: Regular shoppers
- **courier**: Delivery personnel
- **admin**: Store administrators

## Key Dependencies

- expo-router for navigation
- @tanstack/react-query for server state
- drizzle-orm for database access
- express for the API server
- bcryptjs for password hashing
- jsonwebtoken for auth tokens
