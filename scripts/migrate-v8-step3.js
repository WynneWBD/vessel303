// V8.0 step 3 migration — run once: node scripts/migrate-v8-step3.js
// Adds soft-delete column to leads.
const { Pool } = require('pg');
const fs = require('fs');

const connStr = process.env.POSTGRES_URL ||
  fs.readFileSync('.env.local', 'utf8').match(/POSTGRES_URL=(.+)/)?.[1]?.trim();

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at timestamp`);
    console.log('✓ leads.deleted_at column ready');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`);
    console.log('✓ leads indexes ready');

    await client.query('COMMIT');
    console.log('\n✅ V8.0 step 3 migration complete');
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
