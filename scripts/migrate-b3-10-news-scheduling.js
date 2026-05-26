// B3-10 news scheduling schema migration
// Usage: node scripts/migrate-b3-10-news-scheduling.js
//
// Non-destructive:
// - adds nullable news.scheduled_at if missing
// - adds an index for scheduled draft news

const fs = require('fs')
const { Pool } = require('pg')
const dotenv = require('dotenv')

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const env = dotenv.parse(fs.readFileSync('.env.local'))
    return env[name]
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

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    if (!(await tableExists(client, 'news'))) {
      throw new Error('Missing news table. Run the news CMS migration before B3-10.')
    }

    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP`)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_scheduled_at
      ON news(scheduled_at ASC)
      WHERE status = 'draft'
        AND deleted_at IS NULL
        AND scheduled_at IS NOT NULL
    `)

    await client.query('COMMIT')
    console.log('B3-10 news scheduling migration complete')
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
