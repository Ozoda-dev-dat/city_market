# City Market

A grocery delivery mobile app for Uzbekistan serving customers, couriers, and administrators.

## Stack

- **Frontend:** Expo (React Native) with Expo Router — file-based navigation under `app/`
- **Backend:** Express.js API server in TypeScript — entry point `server/index.ts`, port 5000
- **Database:** PostgreSQL (Replit built-in) via Drizzle ORM — schema in `shared/schema.ts`
- **Auth:** JWT (bcryptjs hashing)

## Running on Replit

Two workflows run in parallel:

| Workflow | What it does |
|---|---|
| **Start Backend** | Express API on port 5000; also proxies Metro to the browser |
| **Start Frontend** | Expo Metro bundler on port 8080 |

Start **Backend** first (it proxies Metro), then start **Frontend**. The preview pane connects to port 5000.

For Expo Go on a physical device, scan the QR code printed in the **Start Frontend** logs.

## Database

Replit's built-in PostgreSQL is used. `DATABASE_URL` is injected automatically.

To reset/re-apply the schema:
```bash
npx drizzle-kit push --force
```

To seed an admin user and sample products (development only):
```bash
SEED_ADMIN_PHONE=+998901234567 SEED_ADMIN_PASSWORD=YourPassword tsx scripts/seed-admin.ts
```

Replace the phone and password with your own values. The script refuses to run in `NODE_ENV=production`.

## User Roles

- **customer** — browsing, cart, orders
- **courier** — delivery queue, status updates
- **admin** — full dashboard at `/admin`

## Key Env Vars

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Replit runtime (auto-injected) | Postgres connection string |
| `SESSION_SECRET` | Replit secret | JWT signing |
| `JWT_SECRET` | Set in shared env | Dev default present |
| `EXPO_PUBLIC_DOMAIN` | Workflow env | Set to `$REPLIT_DEV_DOMAIN` |

## User Preferences

- Keep existing project structure and stack — do not restructure or migrate
