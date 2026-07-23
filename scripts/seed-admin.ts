/**
 * Development-only seed script — creates an admin user and sample products.
 * Run: tsx scripts/seed-admin.ts
 *
 * Required env vars:
 *   DATABASE_URL        — Postgres connection string (injected by Replit automatically)
 *   SEED_ADMIN_PHONE    — Phone number for the admin account (e.g. +998901234567)
 *   SEED_ADMIN_PASSWORD — Password for the admin account (min 8 chars)
 *
 * This script will not run in NODE_ENV=production.
 */

import { config } from "dotenv";
import postgres from "postgres";
import bcrypt from "bcryptjs";

config();

if (process.env.NODE_ENV === "production") {
  console.error("❌ Refusing to run seed script in production.");
  process.exit(1);
}

const adminPhone = process.env.SEED_ADMIN_PHONE;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminPhone || !adminPassword) {
  console.error(
    "❌ SEED_ADMIN_PHONE and SEED_ADMIN_PASSWORD must be set as environment variables.\n" +
    "   Example:\n" +
    "   SEED_ADMIN_PHONE=+998901234567 SEED_ADMIN_PASSWORD=MySecret123 tsx scripts/seed-admin.ts"
  );
  process.exit(1);
}

if (adminPassword.length < 8) {
  console.error("❌ SEED_ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

async function seed() {
  const sql = postgres(process.env.DATABASE_URL!);

  const hash = await bcrypt.hash(adminPassword!, 10);

  const result = await sql`
    INSERT INTO users (phone_number, password, role, name)
    VALUES (${adminPhone}, ${hash}, 'admin', 'Admin')
    ON CONFLICT (phone_number) DO NOTHING
    RETURNING phone_number
  `;
  if (result.length > 0) {
    console.log(`✅ Admin user created: ${adminPhone}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminPhone}`);
  }

  await sql`
    INSERT INTO products (id, name, category, price, unit, image, description, brand, weight, in_stock, stock_quantity) VALUES
    ('apple-1',  'Qizil olma', 'fruits',     15000, 'kg',   'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400', 'Shirin va mazali olma',   'Local Farm',      '1kg',  true, 100),
    ('banana-1', 'Banan',      'fruits',     20000, 'kg',   'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 'Yetilgan sariq banan', 'Tropical Fruits', '1kg',  true,  50),
    ('tomato-1', 'Pomidor',    'vegetables',  8000, 'kg',   'https://images.unsplash.com/photo-1546470427-e92b2c9c09d6?w=400', 'Yangi qizil pomidor',    'Green House',     '1kg',  true, 200),
    ('milk-1',   'Sut',        'dairy',      12000, 'l',    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', 'Toza sigir suti',        'Local Dairy',     '1l',   true,  80),
    ('bread-1',  'Non',        'bakery',      5000, 'dona', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'Yangi pishirilgan non', 'Bakery Fresh',   '400g', true, 150)
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("✅ Sample products seeded (skipped any that already exist)");

  await sql.end();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
