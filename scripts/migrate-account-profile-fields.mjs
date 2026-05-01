// Account profile fields migration — run once when approved:
//   node scripts/migrate-account-profile-fields.mjs
//
// This migration is intentionally non-destructive: it only adds nullable
// columns and does not modify existing rows.
import { readFileSync } from 'node:fs'
import pg from 'pg'

const { Pool } = pg

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  try {
    const env = readFileSync('.env.local', 'utf8')
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

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company text`)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country text`)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text`)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp text`)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language text`)

    await client.query('COMMIT')
    console.log('account profile fields are ready')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
