-- Add location fields to users and orders tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude TEXT;
