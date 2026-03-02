# FreshMart Project

## Core Tech Stack
- **Frontend**: Expo (React Native) with Expo Router
- **Backend**: Express (TypeScript)
- **Database**: PostgreSQL (via Drizzle ORM)
- **State Management**: React Query + Context API

## Development Guide
- **Start Backend**: Runs the Express server on port 5000.
- **Start Frontend**: Runs the Metro bundler on port 8081.

### Features Implemented
- **User App**: Full grocery shopping experience with cart and categories.
- **Admin Panel**: CRUD for products and order management.
- **Courier Panel**: Delivery dashboard with navigation and status tracking.
- **Backend API**: Integrated endpoints for all features with persistent storage logic.

## Deployment
The project is configured for Replit Autoscale:
- **Build**: `npm run expo:static:build && npm run server:build`
- **Run**: `node server_dist/index.js`
