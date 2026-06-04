import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { Pool } = pg
const root = process.cwd()
const moduleKeys = ['hero', 'model-strip', 'scenario-tiles']

function loadEnvFile(name) {
  const file = resolve(root, name)
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env.development.local')

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
if (!connectionString) throw new Error('Missing DATABASE_URL / POSTGRES_URL.')

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
})

try {
  const res = await pool.query(
    `SELECT
       module_key,
       jsonb_array_length(items) AS item_count,
       (
         SELECT COUNT(*)
         FROM jsonb_array_elements(items) item
         WHERE COALESCE(item->>'image_url', '') <> ''
       ) AS image_count,
       (
         SELECT COUNT(*)
         FROM jsonb_array_elements(items) item
         WHERE COALESCE(item->>'video_url', '') <> ''
       ) AS video_count,
       (
         SELECT COUNT(*)
         FROM jsonb_array_elements(items) item
         WHERE COALESCE(item->>'video_poster_url', '') <> ''
       ) AS poster_count,
       updated_at::text AS updated_at
     FROM page_modules
     WHERE page_key = 'home'
       AND module_key = ANY($1)
     ORDER BY sort_order`,
    [moduleKeys],
  )

  console.log(JSON.stringify({
    moduleKeys,
    rows: res.rows,
  }, null, 2))
} finally {
  await pool.end()
}
