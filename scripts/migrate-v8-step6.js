// V8.0 Step 6.1 — rebuild news table with full CMS schema
// Drops the placeholder table from Step 1 and creates the production schema.
// Usage: node scripts/migrate-v8-step6.js

const fs = require('fs')
const { Pool } = require('pg')

const connStr = process.env.DATABASE_URL ||
  fs.readFileSync('.env.local', 'utf8').match(/DATABASE_URL=(.+)/)?.[1]?.trim()

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query('DROP TABLE IF EXISTS news CASCADE')

    await client.query(`
      CREATE TABLE news (
        id              SERIAL PRIMARY KEY,
        slug            VARCHAR(200) UNIQUE NOT NULL,
        title_zh        VARCHAR(300) NOT NULL,
        title_en        VARCHAR(300) NOT NULL,
        content_zh      JSONB NOT NULL DEFAULT '{}'::jsonb,
        content_en      JSONB NOT NULL DEFAULT '{}'::jsonb,
        excerpt_zh      VARCHAR(500),
        excerpt_en      VARCHAR(500),
        cover_image_url TEXT,
        status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published')),
        published_at    TIMESTAMP,
        author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMP
      )
    `)

    await client.query(
      'CREATE INDEX idx_news_status ON news(status) WHERE deleted_at IS NULL'
    )
    await client.query(
      `CREATE INDEX idx_news_published_at ON news(published_at DESC)
       WHERE status='published' AND deleted_at IS NULL`
    )
    await client.query(
      'CREATE INDEX idx_news_slug ON news(slug) WHERE deleted_at IS NULL'
    )

    await client.query('COMMIT')
    console.log('✅ news table created')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
