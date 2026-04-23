// V8.0 step 4 migration — run once: node scripts/migrate-v8-step4.js
// Adds disabled flag + last_login_at to users.
const { Pool } = require('pg');
const fs = require('fs');

const connStr = process.env.POSTGRES_URL ||
  fs.readFileSync('.env.local', 'utf8').match(/POSTGRES_URL=(.+)/)?.[1]?.trim();

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false`);
    console.log('✓ users.disabled column ready');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL`);
    console.log('✓ users.last_login_at column ready');

    // Backfill disabled = false for any legacy NULL rows
    await client.query(`UPDATE users SET disabled = false WHERE disabled IS NULL`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_disabled ON users(disabled)`);
    console.log('✓ users indexes ready');

    await client.query('COMMIT');
    console.log('\n✅ V8.0 step 4 migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
