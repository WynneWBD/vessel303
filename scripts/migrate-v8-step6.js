// V8.0 Step 6 — news CMS schema migration
// Usage: node scripts/migrate-v8-step6.js
//
// This script is intentionally non-destructive. If it finds the old Step 1
// placeholder `news` table, it renames it to `news_legacy_<timestamp>`, creates
// the production table, and copies rows forward with new numeric ids.

const fs = require('fs')
const { Pool } = require('pg')

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const env = fs.readFileSync('.env.local', 'utf8')
    return env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim()
  } catch {
    return undefined
  }
}

const connStr = readEnv('DATABASE_URL') || readEnv('POSTGRES_URL')

if (!connStr) {
  console.error('Missing DATABASE_URL or POSTGRES_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } })

async function tableExists(client, tableName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  )
  return Boolean(res.rows[0]?.exists)
}

async function hasColumn(client, tableName, columnName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [tableName, columnName],
  )
  return Boolean(res.rows[0]?.exists)
}

async function createNewsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS news (
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

  await client.query('CREATE INDEX IF NOT EXISTS idx_news_status ON news(status) WHERE deleted_at IS NULL')
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC)
    WHERE status='published' AND deleted_at IS NULL
  `)
  await client.query('CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug) WHERE deleted_at IS NULL')
}

async function migrateLegacyRows(client, legacyTable) {
  await client.query(`
    INSERT INTO news (
      slug, title_zh, title_en, content_zh, content_en, cover_image_url,
      author_id, status, published_at, created_at, updated_at
    )
    SELECT
      LEFT(
        regexp_replace(
          lower(COALESCE(NULLIF(slug, ''), 'legacy-' || LEFT(id::text, 8))),
          '[^a-z0-9-]+',
          '-',
          'g'
        ),
        200
      ) AS slug,
      LEFT(COALESCE(title->>'zh', title->>'cn', title->>'en', NULLIF(slug, ''), 'Untitled'), 300),
      LEFT(COALESCE(title->>'en', title->>'zh', title->>'cn', NULLIF(slug, ''), 'Untitled'), 300),
      COALESCE(content->'zh', content->'cn', content, '{}'::jsonb),
      COALESCE(content->'en', content->'zh', content, '{}'::jsonb),
      cover_image,
      author_id,
      CASE WHEN status = 'published' THEN 'published' ELSE 'draft' END,
      published_at,
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW())
    FROM ${legacyTable}
    ON CONFLICT (slug) DO NOTHING
  `)
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const exists = await tableExists(client, 'news')
    const hasProductionColumn = exists && await hasColumn(client, 'news', 'title_zh')

    if (!exists) {
      await createNewsTable(client)
      console.log('created news table')
    } else if (hasProductionColumn) {
      await createNewsTable(client)
      console.log('news table already uses production schema')
    } else {
      const legacyTable = `news_legacy_${Date.now()}`
      await client.query(`ALTER TABLE news RENAME TO ${legacyTable}`)
      await createNewsTable(client)
      await migrateLegacyRows(client, legacyTable)
      console.log(`migrated legacy news table into production schema (${legacyTable} kept)`)
    }

    await client.query('COMMIT')
    console.log('news CMS migration complete')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
