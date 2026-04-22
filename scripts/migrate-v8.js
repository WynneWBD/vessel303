// V8.0 DB migration — run once: node scripts/migrate-v8.js
const { Pool } = require('pg');
const fs = require('fs');

const connStr = process.env.POSTGRES_URL ||
  fs.readFileSync('.env.local', 'utf8').match(/POSTGRES_URL=(.+)/)?.[1]?.trim();

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── users: add identity column ───────────────────────────────────────
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS identity text`);

    // Copy existing role values (buyer/agent/individual) → identity
    await client.query(`
      UPDATE users
      SET identity = role
      WHERE role IN ('buyer', 'agent', 'individual') AND identity IS NULL
    `);

    // Reset role to 'user' for all non-admin rows
    await client.query(`
      UPDATE users SET role = 'user'
      WHERE role != 'admin' OR role IS NULL
    `);

    // Change role column default from 'individual' → 'user'
    await client.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'`);

    console.log('✓ users table updated (identity column added, role semantics changed)');

    // ── leads ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email        text NOT NULL,
        name         text,
        phone        text,
        company      text,
        country      text,
        inquiry_type text,
        sku_interest text,
        message      text,
        source       text DEFAULT 'other',
        status       text DEFAULT 'new',
        assigned_to  text,
        notes        text,
        created_at   timestamp DEFAULT now(),
        updated_at   timestamp DEFAULT now()
      )
    `);
    console.log('✓ leads table ready');

    // ── news ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug         text UNIQUE,
        title        jsonb,
        content      jsonb,
        cover_image  text,
        author_id    uuid REFERENCES users(id),
        status       text DEFAULT 'draft',
        published_at timestamp,
        created_at   timestamp DEFAULT now(),
        updated_at   timestamp DEFAULT now()
      )
    `);
    console.log('✓ news table ready');

    // ── uploads ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        url         text NOT NULL,
        blob_path   text,
        filename    text,
        size        integer,
        mime        text,
        uploaded_by uuid REFERENCES users(id),
        created_at  timestamp DEFAULT now()
      )
    `);
    console.log('✓ uploads table ready');

    // ── admin_logs ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id    uuid REFERENCES users(id),
        action      text,
        target_type text,
        target_id   text,
        created_at  timestamp DEFAULT now()
      )
    `);
    console.log('✓ admin_logs table ready');

    await client.query('COMMIT');
    console.log('\n✅ V8.0 migration complete');
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
