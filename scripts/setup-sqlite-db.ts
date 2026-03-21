#!/usr/bin/env node

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";

// Load environment variables from .env file
config({ path: ".env.local" });

async function setupSQLiteDatabase() {
  console.log("🔄 Setting up SQLite database for local development...");

  try {
    // Create SQLite database connection
    const sqlite = new Database("supermarket_go_dev.db");
    const db = drizzle(sqlite, { schema });

    console.log("📊 Creating database schema...");

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        phone_number TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        name TEXT
      );
    `);

    // Create categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        bg_color TEXT NOT NULL
      );
    `);

    // Create products table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER,
        unit TEXT NOT NULL,
        image TEXT NOT NULL,
        badge TEXT,
        rating TEXT DEFAULT '5.0',
        description TEXT,
        brand TEXT,
        weight TEXT,
        in_stock INTEGER DEFAULT 1 NOT NULL,
        stock_quantity INTEGER DEFAULT 0 NOT NULL,
        FOREIGN KEY (category) REFERENCES categories(id)
      );
    `);

    // Create promo_codes table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL
      );
    `);

    // Create orders table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        courier_id TEXT,
        customer_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        address TEXT NOT NULL,
        total INTEGER NOT NULL,
        discount INTEGER DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        items TEXT NOT NULL, -- JSON as TEXT for SQLite
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (courier_id) REFERENCES users(id)
      );
    `);

    // Insert default categories
    const categoriesStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO categories (id, name, icon, color, bg_color) VALUES (?, ?, ?, ?, ?)
    `);

    const categories = [
      ["fruits", "Mevalar", "🍎", "#FF6B6B", "#FFE5E5"],
      ["vegetables", "Sabzavotlar", "🥬", "#4CAF50", "#E8F5E8"],
      ["dairy", "Sut mahsulotlari", "🥛", "#2196F3", "#E3F2FD"],
      ["bakery", "Non mahsulotlari", "🍞", "#FF9800", "#FFF3E0"],
      ["meat", "Go'sht mahsulotlari", "🥩", "#F44336", "#FFEBEE"]
    ];

    categories.forEach(category => {
      categoriesStmt.run(...category);
    });

    // Insert default admin user
    const adminStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, phone_number, password, role, name) VALUES (?, ?, ?, ?, ?)
    `);
    
    adminStmt.run("admin-001", "+998901234567", "$2b$10$rQZ8kH.0vL8KQ8YQ0YQY0O", "admin", "Admin User");

    // Insert sample products
    const productsStmt = sqlite.prepare(`
      INSERT OR IGNORE INTO products (id, name, category, price, original_price, unit, image, in_stock, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      ["apple-001", "Qizil olma", "fruits", 25000, 30000, "kg", "https://example.com/apple.jpg", 1, 100],
      ["banana-001", "Banan", "fruits", 28000, 35000, "kg", "https://example.com/banana.jpg", 1, 80],
      ["tomato-001", "Pomidor", "vegetables", 15000, 20000, "kg", "https://example.com/tomato.jpg", 1, 120],
      ["milk-001", "Sut", "dairy", 8000, 10000, "L", "https://example.com/milk.jpg", 1, 50],
      ["bread-001", "Non", "bakery", 4000, 5000, "dona", "https://example.com/bread.jpg", 1, 200]
    ];

    products.forEach(product => {
      productsStmt.run(...product);
    });

    console.log("✅ SQLite database setup completed successfully!");
    console.log("🎉 Your local database is now ready at: supermarket_go_dev.db");
    console.log("📱 Default admin login: +998901234567 / admin");
    
    sqlite.close();
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupSQLiteDatabase();
}

export { setupSQLiteDatabase };
