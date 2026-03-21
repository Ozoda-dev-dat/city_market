const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_9mqBLiolPX8O@ep-shy-fog-a4rjc23q-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add location fields to users table
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude TEXT');

    // Add location fields to orders table
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude TEXT');
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude TEXT');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
