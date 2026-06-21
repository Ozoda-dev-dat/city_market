-- Multi-store system migration
-- Creates stores table, adds store_id to products and users

-- Step 1: stores table
CREATE TABLE IF NOT EXISTS stores (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  address text,
  phone text,
  logo text,
  is_active boolean NOT NULL DEFAULT true,
  deleted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner  ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_name   ON stores(name);

-- Step 2: products.store_id FK
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS store_id varchar REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);

-- Step 3: users.store_id FK (bidirectional link for store-role users)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_id varchar REFERENCES stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
