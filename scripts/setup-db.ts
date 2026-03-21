#!/usr/bin/env node

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// Load environment variables from .env file
config();

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    console.log("Please set your DATABASE_URL and try again");
    process.exit(1);
  }

  console.log("🔄 Setting up database...");

  try {
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    console.log("📊 Creating database schema...");
    
    // Create tables directly (skip migrations for now)
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        name TEXT
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        bg_color TEXT NOT NULL
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL REFERENCES categories(id),
        price INTEGER NOT NULL,
        original_price INTEGER,
        unit TEXT NOT NULL,
        image TEXT NOT NULL,
        badge TEXT,
        rating TEXT DEFAULT '5.0',
        description TEXT,
        brand TEXT,
        weight TEXT,
        in_stock BOOLEAN DEFAULT true NOT NULL,
        stock_quantity INTEGER DEFAULT 0 NOT NULL
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL
      );
    `;

    await client`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR PRIMARY KEY,
        customer_id VARCHAR REFERENCES users(id),
        courier_id VARCHAR REFERENCES users(id),
        customer_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        address TEXT NOT NULL,
        total INTEGER NOT NULL,
        discount INTEGER DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    console.log("✅ Database setup completed successfully!");
    console.log("🎉 Your NeonDB is now ready to use with the Supermarket app");
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };
