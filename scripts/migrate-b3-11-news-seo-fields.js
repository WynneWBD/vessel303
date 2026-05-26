/* eslint-disable @typescript-eslint/no-require-imports */

// B3-11 news SEO fields schema migration
// Usage: node scripts/migrate-b3-11-news-seo-fields.js
//
// Non-destructive:
// - adds nullable news SEO title and description fields if missing

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
      throw new Error('Missing news table. Run the news CMS migration before B3-11.')
    }

    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_title_zh VARCHAR(160)`)
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_title_en VARCHAR(160)`)
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_description_zh VARCHAR(300)`)
    await client.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS seo_description_en VARCHAR(300)`)

    await client.query('COMMIT')
    console.log('B3-11 news SEO fields migration complete')
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
