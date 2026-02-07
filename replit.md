# GoDelivery

## Overview
GoDelivery is an Expo React Native mobile application with an Express backend server. The server serves a landing page with a QR code for users to open the app in Expo Go on their phones.

## Recent Changes
- 2026-02-07: Initial setup on Replit - installed dependencies, configured PostgreSQL database, set up server workflow

## Project Architecture
- **Frontend**: Expo/React Native app (in `app/` directory with tab-based navigation)
- **Backend**: Express server (`server/`) serving API routes, landing page, and static Expo builds
- **Database**: PostgreSQL via Drizzle ORM (`shared/schema.ts` for schema, `drizzle.config.ts` for config)
- **Storage**: Currently using in-memory storage (`server/storage.ts`) with a MemStorage class
- **Build**: Static Expo build script in `scripts/build.js`

## Key Files
- `server/index.ts` - Main Express server entry point (port 5000)
- `server/routes.ts` - API route registration
- `server/storage.ts` - Storage interface and in-memory implementation
- `shared/schema.ts` - Drizzle database schema (users table)
- `app/` - Expo app screens and navigation
- `app.json` - Expo configuration

## Scripts
- `npm run server:dev` - Start development server with tsx
- `npm run expo:dev` - Start Expo development server
- `npm run db:push` - Push Drizzle schema to database
- `npm run expo:static:build` - Build static Expo bundle for deployment
- `npm run server:build` - Build server with esbuild
- `npm run server:prod` - Run production server

## Deployment
- Server binds to `0.0.0.0:5000`
- Build: `npm run server:build` compiles server with esbuild
- Production: `npm run server:prod` runs the compiled server
- Static Expo build is needed for production mobile app serving
